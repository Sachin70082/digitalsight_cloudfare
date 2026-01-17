
interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  TURNSTILE_SECRET_KEY: string;
  JWT_SECRET: string;
  ZEPTOMAIL_API_KEY: string;
  EMAIL_BINDING: {
      send: (message: any) => Promise<void>;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, ''); // Normalize path by removing /api prefix if present
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/auth/login' && method === 'POST') {
        return await handleLogin(request, env, corsHeaders);
      }
      
      if (path === '/auth/verify' && method === 'GET') {
        return await handleVerifyAuth(request, env, corsHeaders);
      }

      if (path === '/auth/change-password' && method === 'POST') {
        const user = await authenticate(request, env);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return await handleChangePassword(request, env, corsHeaders, user);
      }

      if (path === '/auth/reset-password' && method === 'POST') {
        return await handleResetPassword(request, env, corsHeaders);
      }

      const user = await authenticate(request, env);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Routing
      if (path.startsWith('/users')) return await handleUsers(request, env, corsHeaders);
      if (path.startsWith('/labels')) return await handleLabels(request, env, corsHeaders);
      if (path.startsWith('/artists')) return await handleArtists(request, env, corsHeaders, user);
      if (path.startsWith('/releases')) return await handleReleases(request, env, corsHeaders, user);
      if (path.startsWith('/notices')) return await handleNotices(request, env, corsHeaders, user);
      if (path.startsWith('/revenue')) return await handleRevenue(request, env, corsHeaders);
      if (path.startsWith('/search')) return await handleSearch(request, env, corsHeaders);
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (err: any) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  },
};

// --- Auth Handlers ---

async function handleLogin(request: Request, env: Env, corsHeaders: any) {
  const { email, password, token } = await request.json() as any;

  const turnstileResult = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
  if (!turnstileResult.success && token !== '1x00000000000000000000AA') {
    return new Response(JSON.stringify({ error: 'Captcha verification failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as any;

  if (!user || user.password_hash !== password) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const mappedUser = mapUser(user);
  const jwt = await signJwt({ 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      labelId: user.label_id,
      artistId: user.artist_id
  }, env.JWT_SECRET);
  return new Response(JSON.stringify({ token: jwt, user: mappedUser }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleVerifyAuth(request: Request, env: Env, corsHeaders: any) {
    const payload = await authenticate(request, env);
    if (!payload) return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first() as any;
    if (!user) return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ valid: true, user: mapUser(user) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

import { createMimeMessage } from "mimetext";

/**
 * Handle Change Password (Authenticated)
 */
async function handleChangePassword(request: Request, env: Env, corsHeaders: any, currentUser: any) {
    try {
        const { oldPass, newPass } = await request.json() as any;
        
        // Fetch user using the ID from the JWT payload
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
            .bind(currentUser.sub)
            .first() as any;

        if (!user || user.password_hash !== oldPass) {
            return new Response(JSON.stringify({ error: 'Incorrect current password' }), { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        // Update to the new password
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .bind(newPass, currentUser.sub)
            .run();

        return new Response(JSON.stringify({ success: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to update password' }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
}

async function sendZeptoEmail(env: Env, to: string, subject: string, htmlBody: string, textBody: string) {
    const response = await fetch("https://api.zeptomail.in/v1.1/email", {
        method: "POST",
        headers: {
            "Authorization": env.ZEPTOMAIL_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: { address: "no-reply@digitalsight.in", name: "DigitalSight" },
            to: [{ email_address: { address: to } }],
            subject: subject,
            htmlbody: htmlBody,
            textbody: textBody
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ZeptoMail failed: ${error}`);
    }
    return response;
}

/**
 * Handle Reset Password (Public)
 */
async function handleResetPassword(request: Request, env: Env, corsHeaders: any) {
    try {
        const { email } = await request.json() as any;

        // 1. Locate user
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email)
            .first() as any;

        // Security: Return success even if email doesn't exist
        if (!user) {
            return new Response(JSON.stringify({ success: true }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        // 2. Generate a secure 10-character temporary password
        const array = new Uint8Array(10);
        crypto.getRandomValues(array);
        const newPassword = Array.from(array, (byte) => 
            byte.toString(36).padStart(1, '0')
        ).join('').slice(0, 10).toUpperCase(); // Uppercase for clarity

        // 3. Save to Database
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .bind(newPassword, user.id)
            .run();

        // 4. Send Email via ZeptoMail
        try {
            // Professional HTML Template
            const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; }
                    .wrapper { background-color: #f7fafc; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
                    .header { background-color: #000000; padding: 30px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: 700; }
                    .body { padding: 40px; }
                    .alert-title { font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 20px; }
                    .password-box { background-color: #edf2f7; border: 2px dashed #cbd5e0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                    .password-text { font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px; }
                    .button-container { text-align: center; margin-top: 30px; }
                    .button { background-color: #3182ce; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; }
                    .footer { padding: 25px; text-align: center; font-size: 13px; color: #718096; background-color: #f8fafc; }
                    .warning { font-size: 12px; color: #a0aec0; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h1>DIGITALSIGHT</h1>
                        </div>
                        <div class="body">
                            <div class="alert-title">Credential Recovery Protocol</div>
                            <p>Hello,</p>
                            <p>We received a request to access your DigitalSight vault. A temporary access key has been generated for your account.</p>
                            
                            <div class="password-box">
                                <div style="font-size: 12px; color: #718096; margin-bottom: 8px; text-transform: uppercase;">Temporary Key</div>
                                <div class="password-text">${newPassword}</div>
                            </div>

                            <p>Please use this key to log in. You will be required to change this password immediately after access is restored.</p>
                            
                            <div class="button-container">
                                <a href="https://app.digitalsight.in/login" class="button">Log In to Vault</a>
                            </div>

                            <div class="warning">
                                If you did not request this reset, please ignore this email or contact security support if you have concerns about your account.
                            </div>
                        </div>
                        <div class="footer">
                            &copy; 2026 DigitalSight <br>
                            Managed via Cloudflare Shielded Infrastructure
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;

            const textBody = `Hello,\n\nYour new temporary vault key is: ${newPassword}\n\nLogin here: https://digitalsight.in/login`;

            await sendZeptoEmail(env, user.email, "Credential Recovery Protocol", htmlTemplate, textBody);
            
        } catch (e: any) {
            console.error("ZeptoMail delivery failed:", e.message);
        }

        return new Response(JSON.stringify({ success: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

    } catch (error: any) {
        console.error("Reset Password Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
}
// --- CRUD Handlers ---

async function handleUsers(request: Request, env: Env, corsHeaders: any) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (request.method === 'GET') {
        if (id && id !== 'users') {
            const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first() as any;
            return new Response(JSON.stringify(mapUser(user)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { results } = await env.DB.prepare('SELECT * FROM users').all();
        return new Response(JSON.stringify(results.map(mapUser)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
        const data = await request.json() as any;
        const newId = crypto.randomUUID();
        const randomPassword = Math.random().toString(36).slice(-8);
        const passwordToSave = data.password || randomPassword;
        
        await env.DB.prepare('INSERT INTO users (id, name, email, password_hash, role, designation, label_id, artist_id, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(newId, sanitize(data.name), sanitize(data.email), sanitize(passwordToSave), sanitize(data.role), sanitize(data.designation), sanitize(data.labelId), sanitize(data.artistId), JSON.stringify(data.permissions))
            .run();
        
        // Send welcome email
        try {
            const subject = "Welcome to Digitalsight";
            const textBody = `Hello ${data.name},\n\nYour account has been created.\nYour temporary password is: ${passwordToSave}\n\nPlease log in at https://digitalsight.in/login and change your password.`;
            const htmlBody = `<h3>Welcome to Digitalsight</h3><p>Hello ${data.name},</p><p>Your account has been created.</p><p>Temporary Password: <b>${passwordToSave}</b></p><p>Please log in at <a href="https://digitalsight.in/login">https://digitalsight.in/login</a> and change your password.</p>`;

            await sendZeptoEmail(env, data.email, subject, htmlBody, textBody);
        } catch (e) {
            console.error("Welcome email failed:", e);
        }
        
        return new Response(JSON.stringify({ id: newId, ...data, password: passwordToSave }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'PUT' && id) {
        const data = await request.json() as any;
        
        // Fetch current user to preserve NOT NULL fields if not provided
        const current = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first() as any;
        if (!current) return new Response(null, { status: 404, headers: corsHeaders });

        const name = data.name !== undefined ? data.name : current.name;
        const role = data.role !== undefined ? data.role : current.role;
        const designation = data.designation !== undefined ? data.designation : current.designation;
        const permissions = data.permissions !== undefined ? JSON.stringify(data.permissions) : current.permissions;
        const isBlocked = data.isBlocked !== undefined ? (data.isBlocked ? 1 : 0) : current.is_blocked;
        const blockReason = data.blockReason !== undefined ? data.blockReason : current.block_reason;

        await env.DB.prepare('UPDATE users SET name = ?, role = ?, designation = ?, permissions = ?, is_blocked = ?, block_reason = ? WHERE id = ?')
            .bind(sanitize(name), sanitize(role), sanitize(designation), permissions, isBlocked, sanitize(blockReason), id)
            .run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE' && id) {
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(null, { status: 405, headers: corsHeaders });
}

async function handleLabels(request: Request, env: Env, corsHeaders: any) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (request.method === 'GET') {
        if (id && id !== 'labels') {
            const label = await env.DB.prepare(`
                SELECT l.*, u.email as owner_email 
                FROM labels l 
                LEFT JOIN users u ON l.owner_id = u.id 
                WHERE l.id = ?
            `).bind(id).first();
            return new Response(JSON.stringify(mapLabel(label)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { results } = await env.DB.prepare(`
            SELECT l.*, u.email as owner_email 
            FROM labels l 
            LEFT JOIN users u ON l.owner_id = u.id
        `).all();
        return new Response(JSON.stringify(results.map(mapLabel)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
        const data = await request.json() as any;
        const labelId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const randomPassword = Math.random().toString(36).slice(-8);
        const passwordToSave = data.adminPassword || randomPassword;

        // 1. Create Label
        await env.DB.prepare(`
            INSERT INTO labels (id, name, parent_label_id, owner_id, address, city, country, tax_id, website, phone, revenue_share, max_artists, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            labelId, 
            sanitize(data.name), 
            sanitize(data.parentLabelId), 
            userId, // The new admin will be the owner
            sanitize(data.address),
            sanitize(data.city),
            sanitize(data.country),
            sanitize(data.taxId),
            sanitize(data.website),
            sanitize(data.phone),
            sanitize(data.revenueShare),
            sanitize(data.maxArtists),
            'Active'
        ).run();

        // 2. Create Admin User
        await env.DB.prepare(`
            INSERT INTO users (id, name, email, password_hash, role, label_id, label_name, permissions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            sanitize(data.adminName),
            sanitize(data.adminEmail),
            passwordToSave,
            'Label Admin',
            labelId,
            sanitize(data.name),
            JSON.stringify(data.permissions || {})
        ).run();

        const label = await env.DB.prepare('SELECT * FROM labels WHERE id = ?').bind(labelId).first();
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first() as any;
        
        const mappedLabel = mapLabel(label);
        const mappedUser = mapUser(user) as any;
        if (mappedUser) mappedUser.password = passwordToSave; // Return password for display

        // Send welcome email to label admin
        try {
            const subject = "Label Registration - Digitalsight";
            const textBody = `Hello ${data.adminName},\n\nYour label "${data.name}" has been registered on Digitalsight.\nYour admin account has been created.\n\nEmail: ${data.adminEmail}\nPassword: ${passwordToSave}\n\nPlease log in at https://digitalsight.in/login and complete your profile.`;
            const htmlBody = `<h3>Label Registration - Digitalsight</h3><p>Hello ${data.adminName},</p><p>Your label "<b>${data.name}</b>" has been registered on Digitalsight.</p><p>Admin Account Created:</p><ul><li>Email: ${data.adminEmail}</li><li>Password: ${passwordToSave}</li></ul><p>Please log in at <a href="https://digitalsight.in/login">https://digitalsight.in/login</a> and complete your profile.</p>`;

            await sendZeptoEmail(env, data.adminEmail, subject, htmlBody, textBody);
        } catch (e) {
            console.error("Label admin email failed:", e);
        }

        return new Response(JSON.stringify({ label: mappedLabel, user: mappedUser }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'PUT' && id) {
        const data = await request.json() as any;
        const current = await env.DB.prepare('SELECT * FROM labels WHERE id = ?').bind(id).first() as any;
        if (!current) return new Response(null, { status: 404, headers: corsHeaders });

        const name = data.name !== undefined ? data.name : current.name;
        const parentLabelId = data.parentLabelId !== undefined ? data.parentLabelId : current.parent_label_id;
        const ownerId = data.ownerId !== undefined ? data.ownerId : current.owner_id;
        const address = data.address !== undefined ? data.address : current.address;
        const city = data.city !== undefined ? data.city : current.city;
        const country = data.country !== undefined ? data.country : current.country;
        const taxId = data.taxId !== undefined ? data.taxId : current.tax_id;
        const website = data.website !== undefined ? data.website : current.website;
        const phone = data.phone !== undefined ? data.phone : current.phone;
        const revenueShare = data.revenueShare !== undefined ? data.revenueShare : current.revenue_share;
        const maxArtists = data.maxArtists !== undefined ? data.maxArtists : current.max_artists;
        const status = data.status !== undefined ? data.status : current.status;

        await env.DB.prepare('UPDATE labels SET name = ?, parent_label_id = ?, owner_id = ?, address = ?, city = ?, country = ?, tax_id = ?, website = ?, phone = ?, revenue_share = ?, max_artists = ?, status = ? WHERE id = ?')
            .bind(
                sanitize(name), 
                sanitize(parentLabelId), 
                sanitize(ownerId),
                sanitize(address),
                sanitize(city),
                sanitize(country),
                sanitize(taxId),
                sanitize(website),
                sanitize(phone),
                sanitize(revenueShare),
                sanitize(maxArtists),
                sanitize(status), 
                id
            )
            .run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE' && id) {
        await env.DB.prepare('DELETE FROM labels WHERE id = ?').bind(id).run();
        // Also delete associated users? Usually yes for label admins
        await env.DB.prepare('DELETE FROM users WHERE label_id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(null, { status: 405, headers: corsHeaders });
}

async function handleArtists(request: Request, env: Env, corsHeaders: any, currentUser: any) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    // Helper to get user's label ID with fallback
    const getUserLabelId = async () => {
        if (currentUser.labelId) return currentUser.labelId;
        const userRecord = await env.DB.prepare('SELECT label_id FROM users WHERE id = ?').bind(currentUser.sub).first() as any;
        return userRecord?.label_id;
    };

    if (request.method === 'GET') {
        if (id && id !== 'artists') {
            const artist = await env.DB.prepare('SELECT * FROM artists WHERE id = ?').bind(id).first();
            return new Response(JSON.stringify(mapArtist(artist)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        let query = 'SELECT * FROM artists';
        let params: any[] = [];

        const isStaff = currentUser.role === 'Owner' || currentUser.role === 'Employee';
        if (!isStaff) {
            const userLabelId = await getUserLabelId();
            if (userLabelId) {
                query = `
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT * FROM artists WHERE label_id IN (SELECT id FROM sub_labels)
                `;
                params = [userLabelId];
            } else {
                return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(results.map(mapArtist)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
        const data = await request.json() as any;
        const newId = crypto.randomUUID();
        
        const name = data.name;
        const labelId = data.labelId;
        const type = data.type;
        const spotifyId = data.spotifyId || null;
        const appleMusicId = data.appleMusicId || null;
        const instagramUrl = data.instagramUrl || null;
        const email = data.email || null;

        await env.DB.prepare('INSERT INTO artists (id, name, label_id, type, spotify_id, apple_music_id, instagram_url, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(newId, name, labelId, type, spotifyId, appleMusicId, instagramUrl, email)
            .run();
        return new Response(JSON.stringify({ id: newId, ...data }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'PUT' && id) {
        const data = await request.json() as any;
        console.log('Updating artist:', id, data);
        
        // Explicitly extract fields to ensure they are not lost
        const name = data.name;
        const labelId = data.labelId;
        const type = data.type;
        const spotifyId = data.spotifyId || null;
        const appleMusicId = data.appleMusicId || null;
        const instagramUrl = data.instagramUrl || null;
        const email = data.email || null;

        await env.DB.prepare('UPDATE artists SET name = ?, label_id = ?, type = ?, spotify_id = ?, apple_music_id = ?, instagram_url = ?, email = ? WHERE id = ?')
            .bind(name, labelId, type, spotifyId, appleMusicId, instagramUrl, email, id)
            .run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE' && id) {
        // Check if artist is used in any release that is not Draft or Takedown
        const usedIn = await env.DB.prepare(`
            SELECT id FROM releases 
            WHERE (primary_artist_ids LIKE ? OR featured_artist_ids LIKE ?)
            AND status NOT IN ('Draft', 'Takedown')
        `).bind(`%${id}%`, `%${id}%`).first();

        if (usedIn) {
            return new Response(JSON.stringify({ error: 'Artist cannot be deleted as they are linked to active or pending releases.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        await env.DB.prepare('DELETE FROM artists WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(null, { status: 405, headers: corsHeaders });
}

async function handleReleases(request: Request, env: Env, corsHeaders: any, currentUser: any) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    // --- GET METHOD ---
    if (request.method === 'GET') {
        if (id && id !== 'releases') {
            const release = await env.DB.prepare('SELECT * FROM releases WHERE id = ?').bind(id).first() as any;
            if (!release) return new Response(null, { status: 404, headers: corsHeaders });
            
            // Permission check for single release
            const isStaff = currentUser.role === 'Owner' || currentUser.role === 'Employee';
            if (!isStaff) {
                const userLabelId = currentUser.labelId;
                if (!userLabelId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

                const isAuthorized = await env.DB.prepare(`
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT 1 FROM sub_labels WHERE id = ?
                `).bind(userLabelId, release.label_id).first();

                if (!isAuthorized) {
                    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }

            const { results: tracks } = await env.DB.prepare('SELECT * FROM tracks WHERE release_id = ?').bind(id).all();
            const { results: notes } = await env.DB.prepare('SELECT * FROM interaction_notes WHERE release_id = ? ORDER BY timestamp DESC').bind(id).all();
            
            const mapped = mapRelease(release) as any;
            mapped.tracks = tracks.map(mapTrack);
            mapped.notes = notes.map(mapNote);
            
            return new Response(JSON.stringify(mapped), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        let query = 'SELECT * FROM releases';
        let params: any[] = [];

        const isStaff = currentUser.role === 'Owner' || currentUser.role === 'Employee';
        if (!isStaff) {
            const userLabelId = currentUser.labelId;
            if (userLabelId) {
                query = `
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT * FROM releases WHERE label_id IN (SELECT id FROM sub_labels)
                `;
                params = [userLabelId];
            } else {
                return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(results.map(mapRelease)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- POST METHOD ---
    if (request.method === 'POST') {
        const data = await request.json() as any;
        const newId = crypto.randomUUID();
        const batch = [];

        batch.push(env.DB.prepare(`
            INSERT INTO releases (
                id, title, version_title, release_type, primary_artist_ids, featured_artist_ids, label_id, 
                upc, catalogue_number, release_date, status, artwork_url, artwork_file_name, 
                p_line, c_line, description, explicit, genre, sub_genre, mood, language, 
                publisher, film_name, film_director, film_producer, film_banner, film_cast, 
                original_release_date, youtube_content_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            newId, data.title || 'Untitled Release', data.versionTitle || null, data.releaseType || null,
            JSON.stringify(data.primaryArtistIds || []), JSON.stringify(data.featuredArtistIds || []),
            data.labelId || null, data.upc || null, data.catalogueNumber || null, data.releaseDate || null,
            data.status || 'Draft', data.artworkUrl || null, data.artworkFileName || null,
            data.pLine || null, data.cLine || null, data.description || null, data.explicit ? 1 : 0,
            data.genre || null, data.subGenre || null, data.mood || null, data.language || null,
            data.publisher || null, data.filmName || null, data.filmDirector || null, data.filmProducer || null,
            data.filmBanner || null, data.filmCast || null, data.originalReleaseDate || null, data.youtubeContentId ? 1 : 0
        ));

        if (data.tracks && Array.isArray(data.tracks)) {
            for (const track of data.tracks) {
                batch.push(env.DB.prepare(`
                    INSERT INTO tracks (
                        id, release_id, track_number, disc_number, title, version_title, 
                        primary_artist_ids, featured_artist_ids, isrc, duration, explicit, 
                        audio_file_name, audio_url, crbt_cut_name, crbt_time, dolby_isrc, 
                        composer, lyricist, language, content_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    crypto.randomUUID(), newId, track.trackNumber || 0, track.discNumber || 1,
                    track.title || 'Untitled Track', track.versionTitle || null,
                    JSON.stringify(track.primaryArtistIds || []), JSON.stringify(track.featuredArtistIds || []),
                    track.isrc || null, track.duration || 0, track.explicit ? 1 : 0,
                    track.audioFileName || null, track.audioUrl || null, track.crbtCutName || null,
                    track.crbtTime || null, track.dolbyIsrc || null, track.composer || null,
                    track.lyricist || null, track.language || null, track.contentType || 'Music'
                ));
            }
        }
        await env.DB.batch(batch);
        return new Response(JSON.stringify({ id: newId, ...data }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- PUT METHOD (Update & Purge) ---
    if (request.method === 'PUT' && id) {
        const data = await request.json() as any;
        const current = await env.DB.prepare('SELECT * FROM releases WHERE id = ?').bind(id).first() as any;
        if (!current) return new Response(null, { status: 404, headers: corsHeaders });

        const batch = [];

        // Logic to find the real R2 folder name (draft-xxxx) from existing URLs
        let r2FolderName = id; 
        const urlToParse = data.artworkUrl || current.artwork_url;
        if (urlToParse) {
            const parts = urlToParse.split('/');
            const relIdx = parts.indexOf('releases');
            if (relIdx !== -1 && parts[relIdx + 1]) r2FolderName = parts[relIdx + 1];
        }

        // Handle Audio Purge for Takedown/Rejected
        if (data.status === 'Rejected' || data.status === 'Takedown') {
            if (env.BUCKET) {
                try {
                    const audioPrefix = `releases/${r2FolderName}/audio/`;
                    const list = await env.BUCKET.list({ prefix: audioPrefix });
                    if (list.objects.length > 0) {
                        await env.BUCKET.delete(list.objects.map(o => o.key));
                        console.log(`✅ Purged audio from: ${audioPrefix}`);
                    }
                } catch (e: any) {
                    console.error("Audio purge failed:", e.message);
                }
            }
            batch.push(env.DB.prepare('UPDATE tracks SET audio_url = NULL WHERE release_id = ?').bind(id));
        }

        // Update Metadata
        batch.push(env.DB.prepare(`
            UPDATE releases SET 
                title = ?, version_title = ?, release_type = ?, primary_artist_ids = ?, featured_artist_ids = ?, 
                upc = ?, catalogue_number = ?, release_date = ?, status = ?, artwork_url = ?, artwork_file_name = ?, 
                p_line = ?, c_line = ?, description = ?, explicit = ?, genre = ?, sub_genre = ?, mood = ?, language = ?, 
                publisher = ?, film_name = ?, film_director = ?, film_producer = ?, film_banner = ?, film_cast = ?, 
                original_release_date = ?, youtube_content_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            data.title ?? current.title, data.versionTitle ?? current.version_title, data.releaseType ?? current.release_type,
            data.primaryArtistIds ? JSON.stringify(data.primaryArtistIds) : current.primary_artist_ids,
            data.featuredArtistIds ? JSON.stringify(data.featuredArtistIds) : current.featured_artist_ids,
            data.upc ?? current.upc, data.catalogueNumber ?? current.catalogue_number, data.releaseDate ?? current.release_date,
            data.status ?? current.status, data.artworkUrl ?? current.artwork_url, data.artworkFileName ?? current.artwork_file_name,
            data.pLine ?? current.p_line, data.cLine ?? current.c_line, data.description ?? current.description,
            data.explicit !== undefined ? (data.explicit ? 1 : 0) : current.explicit,
            data.genre ?? current.genre, data.subGenre ?? current.sub_genre, data.mood ?? current.mood, data.language ?? current.language,
            data.publisher ?? current.publisher, data.filmName ?? current.film_name, data.filmDirector ?? current.film_director,
            data.filmProducer ?? current.film_producer, data.filmBanner ?? current.film_banner, data.filmCast ?? current.film_cast,
            data.originalReleaseDate ?? current.original_release_date,
            data.youtubeContentId !== undefined ? (data.youtubeContentId ? 1 : 0) : current.youtube_content_id,
            id
        ));

        // Re-insert Tracks if provided
        if (data.tracks !== undefined && Array.isArray(data.tracks)) {
            batch.push(env.DB.prepare('DELETE FROM tracks WHERE release_id = ?').bind(id));
            for (const track of data.tracks) {
                batch.push(env.DB.prepare(`
                    INSERT INTO tracks (
                        id, release_id, track_number, disc_number, title, version_title, 
                        primary_artist_ids, featured_artist_ids, isrc, duration, explicit, 
                        audio_file_name, audio_url, crbt_cut_name, crbt_time, dolby_isrc, 
                        composer, lyricist, language, content_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    track.id || crypto.randomUUID(), id, track.trackNumber || 0, track.discNumber || 1,
                    track.title || 'Untitled Track', track.versionTitle || null,
                    JSON.stringify(track.primaryArtistIds || []), JSON.stringify(track.featuredArtistIds || []),
                    track.isrc || null, track.duration || 0, track.explicit ? 1 : 0,
                    track.audioFileName || null, track.audioUrl || null, track.crbtCutName || null,
                    track.crbtTime || null, track.dolbyIsrc || null, track.composer || null,
                    track.lyricist || null, track.language || null, track.contentType || 'Music'
                ));
            }
        }

        if (data.notes && data.notes.length > 0) {
            const note = data.notes[0];
            batch.push(env.DB.prepare('INSERT INTO interaction_notes (id, release_id, author_name, author_role, message) VALUES (?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), id, note.authorName || 'System', note.authorRole || 'Staff', note.message));
            
            // Send Correction Email
            if (data.status === 'Needs Info') {
                try {
                    const labelInfo = await env.DB.prepare(`
                        SELECT u.email 
                        FROM labels l 
                        JOIN users u ON l.owner_id = u.id 
                        WHERE l.id = ?
                    `).bind(current.label_id).first() as any;

                    if (labelInfo && labelInfo.email) {
                        const subject = `Action Required: Correction Request for "${current.title}"`;
                        const htmlBody = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .header { background-color: #000; padding: 20px; text-align: center; }
                                .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
                                .content { padding: 30px; }
                                .alert-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                                .alert-title { font-weight: bold; color: #d39e00; margin-bottom: 5px; display: block; font-size: 14px; text-transform: uppercase; }
                                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                .meta-table td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                                .meta-label { font-weight: bold; color: #666; width: 120px; }
                                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                                .button { display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>DIGITALSIGHT</h1>
                                </div>
                                <div class="content">
                                    <h2 style="margin-top: 0; color: #1a1a1a;">Correction Required</h2>
                                    <p>Hello,</p>
                                    <p>The following release has been flagged by our Quality Assurance team and requires your attention before it can be distributed.</p>
                                    
                                    <table class="meta-table">
                                        <tr>
                                            <td class="meta-label">Release Title</td>
                                            <td><strong>${current.title}</strong></td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">UPC</td>
                                            <td>${current.upc || 'Pending'}</td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">Submission Date</td>
                                            <td>${new Date(current.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    </table>

                                    <div class="alert-box">
                                        <span class="alert-title">Correction Directive</span>
                                        ${note.message}
                                    </div>

                                    <p>Please log in to the portal to address these issues and resubmit the release.</p>
                                    
                                    <div style="text-align: center;">
                                        <a href="https://app.digitalsight.in/releases/${id}" class="button" style="color: white; text-decoration: none;">Fix Metadata</a>
                                    </div>
                                </div>
                                <div class="footer">
                                    &copy; ${new Date().getFullYear()} DigitalSight. All rights reserved.<br>
                                    This is an automated message. Please do not reply directly to this email.
                                </div>
                            </div>
                        </body>
                        </html>
                        `;
                        const textBody = `Correction Required for "${current.title}".\n\nNote: ${note.message}\n\nPlease login to fix: https://app.digitalsight.in/releases/${id}`;
                        
                        await sendZeptoEmail(env, labelInfo.email, subject, htmlBody, textBody);
                    }
                } catch (e) {
                    console.error("Correction email failed:", e);
                }
            }
        }

        await env.DB.batch(batch);
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- DELETE METHOD ---
    if (request.method === 'DELETE' && id) {
        // Fetch release details along with parent_label_id of the owning label
        const release = await env.DB.prepare(`
            SELECT r.status, r.label_id, r.artwork_url, l.parent_label_id 
            FROM releases r
            LEFT JOIN labels l ON r.label_id = l.id
            WHERE r.id = ?
        `).bind(id).first() as any;

        if (!release) return new Response(null, { status: 404, headers: corsHeaders });

        const isStaff = currentUser.role === 'Owner' || currentUser.role === 'Employee';
        const isDeletableStatus = release.status === 'Draft' || release.status === 'Needs Info';
        
        let userLabelId = currentUser.labelId;
        if (!userLabelId && !isStaff) {
            const userRecord = await env.DB.prepare('SELECT label_id FROM users WHERE id = ?').bind(currentUser.sub).first() as any;
            userLabelId = userRecord?.label_id;
        }

        // Allow deletion if:
        // 1. User is Staff (Owner/Employee)
        // 2. Status is deletable AND (User owns the label OR User owns the parent label)
        const isOwnerLabel = release.label_id === userLabelId;
        const isParentLabel = release.parent_label_id === userLabelId;

        if (isStaff || (isDeletableStatus && (isOwnerLabel || isParentLabel))) {
            if (env.BUCKET) {
                try {
                    // Extract the "draft-xxxx" folder name from the URL
                    let folderName = id; 
                    if (release.artwork_url) {
                        const parts = release.artwork_url.split('/');
                        const relIdx = parts.indexOf('releases');
                        if (relIdx !== -1 && parts[relIdx + 1]) folderName = parts[relIdx + 1];
                    }

                    const prefix = `releases/${folderName}/`;
                    const list = await env.BUCKET.list({ prefix });
                    if (list.objects.length > 0) {
                        await env.BUCKET.delete(list.objects.map(o => o.key));
                        console.log(`✅ Deleted R2 folder: ${prefix}`);
                    }
                } catch (e: any) {
                    console.error("R2 deletion failed:", e.message);
                }
            }
            await env.DB.prepare('DELETE FROM releases WHERE id = ?').bind(id).run();
            return new Response(null, { status: 204, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ error: 'Unauthorized or invalid status' }), { status: 403, headers: corsHeaders });
    }

    return new Response(null, { status: 405, headers: corsHeaders });
}

async function handleNotices(request: Request, env: Env, corsHeaders: any, currentUser: any) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM notices ORDER BY timestamp DESC').all();
        return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
        const data = await request.json() as any;
        const newId = crypto.randomUUID();
        await env.DB.prepare('INSERT INTO notices (id, title, message, type, author_id, author_name, author_designation, target_audience) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(newId, sanitize(data.title), sanitize(data.message), sanitize(data.type), currentUser.sub, sanitize(currentUser.name || 'Admin'), sanitize(currentUser.designation || 'Staff'), sanitize(data.targetAudience))
            .run();
        return new Response(JSON.stringify({ id: newId, ...data }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'PUT' && id) {
        const data = await request.json() as any;
        await env.DB.prepare('UPDATE notices SET title = ?, message = ?, type = ?, target_audience = ? WHERE id = ?')
            .bind(sanitize(data.title), sanitize(data.message), sanitize(data.type), sanitize(data.targetAudience), id)
            .run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE' && id) {
        await env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(null, { status: 405, headers: corsHeaders });
}

async function handleRevenue(request: Request, env: Env, corsHeaders: any) {
    if (request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM revenue_entries').all();
        return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(null, { status: 405, headers: corsHeaders });
}

async function handleSearch(request: Request, env: Env, corsHeaders: any) {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    const { results: users } = await env.DB.prepare('SELECT * FROM users WHERE name LIKE ? OR email LIKE ?').bind(`%${query}%`, `%${query}%`).all();
    const { results: releases } = await env.DB.prepare('SELECT * FROM releases WHERE title LIKE ?').bind(`%${query}%`).all();
    const { results: artists } = await env.DB.prepare('SELECT * FROM artists WHERE name LIKE ?').bind(`%${query}%`).all();
    const { results: labels } = await env.DB.prepare('SELECT * FROM labels WHERE name LIKE ?').bind(`%${query}%`).all();

    return new Response(JSON.stringify({
        users,
        releases,
        artists,
        labels
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// --- Helpers ---

function sanitize(val: any) {
  return val === undefined ? null : val;
}

function mapUser(u: any) {
    if (!u) return null;
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        designation: u.designation,
        labelId: u.label_id,
        labelName: u.label_name,
        artistId: u.artist_id,
        artistName: u.artist_name,
        permissions: JSON.parse(u.permissions || '{}'),
        isBlocked: !!u.is_blocked,
        blockReason: u.block_reason,
        password_hash: u.password_hash // Keep for internal check
    };
}

function mapLabel(l: any) {
    if (!l) return null;
    return {
        id: l.id,
        name: l.name,
        parentLabelId: l.parent_label_id,
        ownerId: l.owner_id,
        address: l.address,
        city: l.city,
        country: l.country,
        taxId: l.tax_id,
        website: l.website,
        phone: l.phone,
        revenueShare: l.revenue_share,
        maxArtists: l.max_artists,
        status: l.status,
        createdAt: l.created_at,
        ownerEmail: l.owner_email
    };
}

function mapArtist(a: any) {
    if (!a) return null;
    return {
        id: a.id,
        name: a.name,
        labelId: a.label_id,
        type: a.type,
        spotifyId: a.spotify_id,
        appleMusicId: a.apple_music_id,
        instagramUrl: a.instagram_url,
        email: a.email,
        createdAt: a.created_at
    };
}

function mapNote(n: any) {
    if (!n) return null;
    return {
        id: n.id,
        releaseId: n.release_id,
        authorName: n.author_name,
        authorRole: n.author_role,
        message: n.message,
        timestamp: n.timestamp
    };
}

function mapTrack(t: any) {
    if (!t) return null;
    return {
        id: t.id,
        releaseId: t.release_id,
        trackNumber: t.track_number,
        discNumber: t.disc_number,
        title: t.title,
        versionTitle: t.version_title,
        primaryArtistIds: JSON.parse(t.primary_artist_ids || '[]'),
        featuredArtistIds: JSON.parse(t.featured_artist_ids || '[]'),
        isrc: t.isrc,
        duration: t.duration,
        explicit: !!t.explicit,
        audioFileName: t.audio_file_name,
        audioUrl: t.audio_url,
        crbtCutName: t.crbt_cut_name,
        crbtTime: t.crbt_time,
        dolbyIsrc: t.dolby_isrc,
        composer: t.composer,
        lyricist: t.lyricist,
        language: t.language,
        contentType: t.content_type,
        createdAt: t.created_at
    };
}

function mapRelease(r: any) {
    if (!r) return null;
    return {
        id: r.id,
        title: r.title,
        versionTitle: r.version_title,
        releaseType: r.release_type,
        primaryArtistIds: JSON.parse(r.primary_artist_ids || '[]'),
        featuredArtistIds: JSON.parse(r.featured_artist_ids || '[]'),
        labelId: r.label_id,
        upc: r.upc,
        catalogueNumber: r.catalogue_number,
        releaseDate: r.release_date,
        status: r.status,
        artworkUrl: r.artwork_url,
        artworkFileName: r.artwork_file_name,
        pLine: r.p_line,
        cLine: r.c_line,
        description: r.description,
        explicit: !!r.explicit,
        genre: r.genre,
        subGenre: r.sub_genre,
        mood: r.mood,
        language: r.language,
        publisher: r.publisher,
        filmName: r.film_name,
        filmDirector: r.film_director,
        filmProducer: r.film_producer,
        filmBanner: r.film_banner,
        filmCast: r.film_cast,
        originalReleaseDate: r.original_release_date,
        youtubeContentId: !!r.youtube_content_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}

async function verifyTurnstile(token: string, secret: string) {
  if (!token) return { success: false };
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    body: formData,
    method: 'POST',
  });

  return await result.json() as any;
}

async function authenticate(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return await verifyJwt(token, env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

async function signJwt(payload: any, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyJwt(token: string, secret: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  if (!isValid) throw new Error('Invalid signature');
  
  return JSON.parse(atob(encodedPayload));
}

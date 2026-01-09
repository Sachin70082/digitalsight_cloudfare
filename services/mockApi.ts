
import { ref, set, get, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';
import { ref as sRef, deleteObject, listAll } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { db, storage, auth, secondaryAuth } from './firebase';
import { User, UserRole, Label, Artist, Release, ReleaseStatus, UserPermissions, InteractionNote, Notice, RevenueEntry } from '../types';

// Helper to handle Firebase "null" results for arrays
const ensureArray = <T>(val: any): T[] => (val ? (Array.isArray(val) ? val : Object.values(val)) : []);

const defaultPermissions: UserPermissions = {
  canManageArtists: false,
  canManageReleases: false,
  canCreateSubLabels: false,
  canSubmitAlbums: true,
  canManageEmployees: false,
  canManageNetwork: false,
  canViewFinancials: false,
  canOnboardLabels: false,
  canDeleteReleases: false
};

const ownerPermissions: UserPermissions = {
  canManageArtists: true,
  canManageReleases: true,
  canCreateSubLabels: true,
  canSubmitAlbums: true,
  canManageEmployees: true,
  canManageNetwork: true,
  canViewFinancials: true,
  canOnboardLabels: true,
  canDeleteReleases: true
};

export const api = {
  // Enhanced Login: Returns Profile, or a flag if Master Auth is OK but Profile is missing
  login: async (email: string, password?: string): Promise<User | { needsProfile: true, firebaseUser: FirebaseUser } | undefined> => {
    if (!password) throw new Error('Password required.');
    
    const cleanEmail = email.trim().toLowerCase();
    const isMasterEmail = cleanEmail === 'digitalsight.owner@gmail.com';
    
    let authResult;
    try {
        // Attempt standard sign-in
        authResult = await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (error: any) {
        // If it's the master owner and login fails because user doesn't exist, bootstrap the account
        if (isMasterEmail && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
            try {
                authResult = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            } catch (regError: any) {
                throw error;
            }
        } else {
            throw error;
        }
    }

    const firebaseUser = authResult.user;
    const profileSnap = await get(ref(db, `users/${firebaseUser.uid}`));

    if (!profileSnap.exists()) {
        if (isMasterEmail) {
            return { needsProfile: true, firebaseUser };
        }
        
        const usersSnap = await get(ref(db, 'users'));
        const users = usersSnap.val() || {};
        let profileByEmail = Object.values(users).find((u: any) => u.email.toLowerCase() === cleanEmail) as User;
        
        if (!profileByEmail) {
            throw new Error('Identity verified, but platform profile not found in database.');
        }

        if (isMasterEmail) {
            profileByEmail.role = UserRole.OWNER;
            profileByEmail.permissions = { ...ownerPermissions };
        }

        return { ...profileByEmail, permissions: profileByEmail.role === UserRole.OWNER ? { ...ownerPermissions } : (profileByEmail.permissions || { ...defaultPermissions }) };
    }

    const profile = profileSnap.val() as User;
    profile.id = firebaseUser.uid;

    if (isMasterEmail) {
        profile.role = UserRole.OWNER;
        profile.permissions = { ...ownerPermissions };
    } else {
        profile.permissions = profile.role === UserRole.OWNER ? { ...ownerPermissions } : (profile.permissions || { ...defaultPermissions });
    }

    if (profile.labelId) {
        const actualLabelSnap = await get(ref(db, `labels/${profile.labelId}`));
        if (actualLabelSnap.exists()) profile.labelName = actualLabelSnap.val().name;
    }
    
    return profile;
  },

  createMasterProfile: async (uid: string, data: { name: string, designation: string }): Promise<User> => {
    const masterUser: User = {
        id: uid,
        name: data.name,
        email: 'digitalsight.owner@gmail.com',
        role: UserRole.OWNER,
        designation: data.designation,
        permissions: { ...ownerPermissions }
    };

    await set(ref(db, `users/${uid}`), masterUser);
    return masterUser;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error('No active security session found.');

    try {
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        await update(ref(db, `users/${currentUser.uid}`), { password: newPassword });
    } catch (error: any) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') throw new Error('The current password you entered is incorrect.');
        if (error.code === 'auth/weak-password') throw new Error('The new password is too weak.');
        throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  getLabels: async (): Promise<Label[]> => {
    const snapshot = await get(ref(db, 'labels'));
    return ensureArray<Label>(snapshot.val());
  },

  getSubLabels: async (parentLabelId: string): Promise<Label[]> => {
    const snapshot = await get(ref(db, 'labels'));
    const all = ensureArray<Label>(snapshot.val());
    return all.filter(l => l.parentLabelId === parentLabelId);
  },

  updateLabel: async (id: string, data: Partial<Label>, requester: User): Promise<Label> => {
    await update(ref(db, `labels/${id}`), data);
    if (data.name) {
      const usersSnap = await get(ref(db, 'users'));
      const users = usersSnap.val() || {};
      Object.keys(users).forEach(uid => {
          if (users[uid].labelId === id) {
              update(ref(db, `users/${uid}`), { labelName: data.name });
          }
      });
    }
    const labelSnap = await get(ref(db, `labels/${id}`));
    return labelSnap.val();
  },

  cleanupReleaseAssets: async (releaseId: string) => {
    try {
        const audioPath = `releases/${releaseId}/audio`;
        const audioRef = sRef(storage, audioPath);
        
        const deleteRecursive = async (folderRef: any) => {
            const list = await listAll(folderRef);
            for (const item of list.items) { 
                await deleteObject(item); 
            }
            for (const prefix of list.prefixes) { 
                await deleteRecursive(prefix); 
            }
        };
        
        await deleteRecursive(audioRef);
        console.log(`Vault Status: Purged WAV masters for sequence ${releaseId}`);
    } catch (e) {
        console.warn('Cleanup protocol finished (Vault was empty or inaccessible):', e);
    }
  },

  deleteLabel: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `labels/${id}`));
  },

  getLabelAdmin: async (labelId: string): Promise<User | undefined> => {
    const snapshot = await get(ref(db, 'users'));
    const users = ensureArray<User>(snapshot.val());
    return users.find(u => u.labelId === labelId && (u.role === UserRole.LABEL_ADMIN || u.role === UserRole.SUB_LABEL_ADMIN));
  },

  getEmployees: async (requester: User): Promise<User[]> => {
    const snapshot = await get(ref(db, 'users'));
    const users = ensureArray<User>(snapshot.val());
    return users.filter(u => u.role === UserRole.EMPLOYEE);
  },

  addEmployee: async (data: any, requester: User): Promise<User> => {
    const password = data.password || Math.random().toString(36).slice(-8);
    const authResult = await createUserWithEmailAndPassword(secondaryAuth, data.email, password);
    const uid = authResult.user.uid;
    const newEmp = { ...data, id: uid, role: UserRole.EMPLOYEE, password, permissions: data.permissions || { ...defaultPermissions } };
    await set(ref(db, `users/${uid}`), newEmp);
    return newEmp;
  },

  updateEmployee: async (id: string, data: any, requester: User): Promise<User> => {
    await update(ref(db, `users/${id}`), data);
    const snap = await get(ref(db, `users/${id}`));
    return snap.val();
  },

  deleteEmployee: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `users/${id}`));
  },

  updateUserPermissions: async (userId: string, permissions: UserPermissions, requester: User): Promise<User> => {
    await update(ref(db, `users/${userId}`), { permissions });
    const snap = await get(ref(db, `users/${userId}`));
    return snap.val();
  },

  getNotices: async (requester: User): Promise<Notice[]> => {
    const snap = await get(ref(db, 'notices'));
    const all = ensureArray<Notice>(snap.val());
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addNotice: async (data: any, requester: User): Promise<Notice> => {
    const id = `notice-${Date.now()}`;
    const notice = { ...data, id, authorId: requester.id, authorName: requester.name, 
                     authorDesignation: requester.designation || requester.role, timestamp: new Date().toISOString() };
    await set(ref(db, `notices/${id}`), notice);
    return notice;
  },

  deleteNotice: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `notices/${id}`));
  },

  updateNotice: async (id: string, data: any, requester: User): Promise<Notice> => {
    await update(ref(db, `notices/${id}`), data);
    const snap = await get(ref(db, `notices/${id}`));
    return snap.val();
  },

  getArtistsByLabel: async (labelId: string): Promise<Artist[]> => {
    const snap = await get(ref(db, 'artists'));
    return ensureArray<Artist>(snap.val()).filter(a => a.labelId === labelId);
  },

  addArtist: async (artistData: Omit<Artist, 'id'>): Promise<{artist: Artist, user?: User}> => {
    const aid = `artist-${Date.now()}`;
    const artist = { ...artistData, id: aid };
    await set(ref(db, `artists/${aid}`), artist);

    let user: User | undefined;
    if (artistData.email?.trim()) {
        const password = Math.random().toString(36).slice(-8);
        const authResult = await createUserWithEmailAndPassword(secondaryAuth, artist.email, password);
        const uid = authResult.user.uid;
        user = { 
            id: uid, 
            name: artist.name, 
            email: artist.email, 
            role: UserRole.ARTIST, 
            labelId: artist.labelId, 
            artistId: aid, 
            artistName: artist.name, 
            password, 
            permissions: { ...defaultPermissions } 
        };
        await set(ref(db, `users/${uid}`), user);
    }
    return { artist, user };
  },

  updateArtist: async (id: string, data: Partial<Artist>, requester: User): Promise<Artist> => {
    await update(ref(db, `artists/${id}`), data);
    const snap = await get(ref(db, `artists/${id}`));
    return snap.val();
  },

  deleteArtist: async (id: string, requester: User): Promise<void> => {
    await remove(ref(db, `artists/${id}`));
  },

  getAllReleases: async (): Promise<Release[]> => {
    const snap = await get(ref(db, 'releases'));
    return ensureArray<Release>(snap.val());
  },

  getReleasesByLabel: async (labelId: string): Promise<Release[]> => {
    const [releasesSnap, allLabelsSnap] = await Promise.all([
        get(ref(db, 'releases')),
        get(ref(db, 'labels'))
    ]);
    
    const releases = ensureArray<Release>(releasesSnap.val());
    const allLabels = ensureArray<Label>(allLabelsSnap.val());

    const getChildIds = (pid: string): string[] => {
        const children = allLabels.filter(l => l.parentLabelId === pid);
        let ids = children.map(l => l.id);
        for (const child of children) {
            ids = [...ids, ...getChildIds(child.id)];
        }
        return ids;
    };

    const targetLabelIds = [labelId, ...getChildIds(labelId)];
    return releases.filter(r => targetLabelIds.includes(r.labelId));
  },

  getRelease: async (id: string): Promise<Release | undefined> => {
    const snap = await get(ref(db, `releases/${id}`));
    return snap.val() || undefined;
  },

  deleteRelease: async (id: string): Promise<void> => {
    // 1. Initial existence verification
    const releaseSnap = await get(ref(db, `releases/${id}`));
    if (!releaseSnap.exists()) return;

    // 2. Comprehensive Storage Purge (Recursively targeting the release root folder)
    try {
        const rootRef = sRef(storage, `releases/${id}`);
        const purgeRecursive = async (refNode: any) => {
            const list = await listAll(refNode);
            
            // Delete file objects in parallel
            await Promise.all(list.items.map(item => deleteObject(item)));
            
            // Recurse into sub-prefixes (folders)
            for (const prefix of list.prefixes) {
                await purgeRecursive(prefix);
            }
        };
        await purgeRecursive(rootRef);
        console.log(`Vault Transmission: Storage purge successful for sequence ${id}`);
    } catch (e) {
        console.warn('Storage cleanup protocol finished with warnings (possibly empty or partial node):', e);
    }
    
    // 3. Metadata Eradication
    await remove(ref(db, `releases/${id}`));
    console.log(`Vault Transmission: Database record eradicated for sequence ${id}`);
  },

  updateReleaseStatus: async (id: string, status: ReleaseStatus, note?: InteractionNote) => {
    const snap = await get(ref(db, `releases/${id}`));
    const release = snap.val() as Release;
    if (release) {
        const updates: any = { status, updatedAt: new Date().toISOString() };
        if (note) updates.notes = [note, ...(ensureArray(release.notes))];
        await update(ref(db, `releases/${id}`), updates);
        
        if (status === ReleaseStatus.REJECTED || status === ReleaseStatus.TAKEDOWN) {
            await api.cleanupReleaseAssets(id);
        }
    }
    const final = await get(ref(db, `releases/${id}`));
    return final.val();
  },

  addRelease: async (data: any) => {
    const id = data.id || `rel-${Date.now()}`;
    const now = new Date().toISOString();
    const release = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };
    await set(ref(db, `releases/${id}`), release);
    return release;
  },

  getLabel: async (id: string): Promise<Label | undefined> => {
    const snap = await get(ref(db, `labels/${id}`));
    return snap.val() || undefined;
  },

  getArtist: async (id: string): Promise<Artist | undefined> => {
    const snap = await get(ref(db, `artists/${id}`));
    return snap.val() || undefined;
  },

  getAllArtists: async (): Promise<Artist[]> => {
    const snap = await get(ref(db, 'artists'));
    return ensureArray<Artist>(snap.val());
  },

  globalSearch: async (queryStr: string, user: User) => {
    const q = queryStr.toLowerCase();
    const [l, a, r] = await Promise.all([api.getLabels(), api.getAllArtists(), api.getReleasesByLabel(user.labelId || '')]);
    return {
      labels: l.filter(i => i.name.toLowerCase().includes(q)),
      artists: a.filter(i => i.name.toLowerCase().includes(q)),
      releases: r.filter(i => i.title.toLowerCase().includes(q) || (i.upc && i.upc.includes(q)))
    };
  },

  createLabel: async (data: any): Promise<{ label: Label, user: User }> => {
    const lid = data.id || `label-${Date.now()}`;
    const password = data.adminPassword || Math.random().toString(36).slice(-8);
    const authResult = await createUserWithEmailAndPassword(secondaryAuth, data.adminEmail, password);
    const uid = authResult.user.uid;
    const label = { ...data, id: lid, ownerId: uid, createdAt: new Date().toISOString(), status: 'Active' };
    const user = { 
        id: uid, name: data.adminName || data.name, email: data.adminEmail, password,
        role: data.parentLabelId ? UserRole.SUB_LABEL_ADMIN : UserRole.LABEL_ADMIN, 
        labelId: lid, labelName: data.name, permissions: data.permissions || { ...defaultPermissions }
    };
    await set(ref(db, `labels/${lid}`), label);
    await set(ref(db, `users/${uid}`), user);
    return { label, user };
  },

  getAllRevenue: async (): Promise<RevenueEntry[]> => {
    const snap = await get(ref(db, 'revenue'));
    return ensureArray<RevenueEntry>(snap.val());
  },

  getRevenueForLabelHierarchy: async (labelId: string): Promise<RevenueEntry[]> => {
    const all = await api.getAllRevenue();
    return all.filter(r => r.labelId === labelId);
  }
};

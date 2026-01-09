
import { User, UserRole, Label, Artist, Release, ReleaseStatus, UserPermissions, InteractionNote, Notice, RevenueEntry } from '../types';

// Persistence Keys
const STORAGE_KEYS = {
    RERELEASES: 'distro_pro_releases',
    ARTISTS: 'distro_pro_artists',
    LABELS: 'distro_pro_labels',
    NOTICES: 'distro_pro_notices',
    REVENUE: 'distro_pro_revenue',
    USERS: 'distro_pro_users'
};

// Initial state loading helper
const load = <T,>(key: string, fallback: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
};

// Initial internal state
const defaultUsers: User[] = [
  { id: 'user-owner', name: 'Platform Owner', email: 'owner@distro.pro', role: UserRole.OWNER, designation: 'Founder / CEO', permissions: { canManageArtists: true, canManageReleases: true, canCreateSubLabels: true, canManageEmployees: true, canManageNetwork: true, canViewFinancials: true } },
  { id: 'user-label1', name: 'Future Sound', email: 'admin@futuresound.com', role: UserRole.LABEL_ADMIN, labelId: 'label-1', permissions: { canManageArtists: true, canManageReleases: true, canCreateSubLabels: true, canViewFinancials: true } },
];

let users: User[] = load(STORAGE_KEYS.USERS, defaultUsers);
let notices: Notice[] = load(STORAGE_KEYS.NOTICES, []);
let labels: Label[] = load(STORAGE_KEYS.LABELS, [{ id: 'label-1', name: 'Future Sound Records', ownerId: 'user-label1', revenueShare: 70, status: 'Active', country: 'US' }]);
let artists: Artist[] = load(STORAGE_KEYS.ARTISTS, []);
let releases: Release[] = load(STORAGE_KEYS.RERELEASES, []);
let revenue: RevenueEntry[] = load(STORAGE_KEYS.REVENUE, []);

// Seed some revenue data if empty for demo purposes
if (revenue.length === 0) {
    const stores = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Deezer', 'Tidal', 'JioSaavn', 'Wynk'];
    const territories = ['US', 'UK', 'IN', 'CA', 'DE', 'FR', 'BR', 'AU', 'JP'];
    const months = ['2024-10', '2024-11', '2024-12', '2025-01'];
    
    for (let i = 0; i < 60; i++) {
        revenue.push({
            id: `rev-${Math.random().toString(36).slice(2, 11)}`,
            labelId: i % 4 === 0 ? 'label-2' : 'label-1',
            reportMonth: months[i % months.length],
            store: stores[i % stores.length],
            territory: territories[i % territories.length],
            amount: parseFloat((Math.random() * 450 + 50).toFixed(2)),
            paymentStatus: Math.random() > 0.3 ? 'Paid' : 'Pending',
            date: new Date(Date.now() - Math.random() * 8000000000).toISOString()
        });
    }
}

// Save Helper
const persist = () => {
    localStorage.setItem(STORAGE_KEYS.RERELEASES, JSON.stringify(releases));
    localStorage.setItem(STORAGE_KEYS.ARTISTS, JSON.stringify(artists));
    localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    localStorage.setItem(STORAGE_KEYS.REVENUE, JSON.stringify(revenue));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

/**
 * Integrity Helper: Checks if artist is linked to an album that blocks modification.
 */
const getArtistLockReason = (artistId: string): { isLocked: boolean, releaseTitle?: string, status?: ReleaseStatus } => {
    const lockingStatuses = [
        ReleaseStatus.PUBLISHED, 
        ReleaseStatus.PENDING, 
        ReleaseStatus.APPROVED, 
        ReleaseStatus.PROCESSED, 
        ReleaseStatus.NEEDS_INFO
    ];

    const lockingRelease = releases.find(release => {
        if (!lockingStatuses.includes(release.status)) return false;
        
        const inAlbumMain = release.primaryArtistIds.includes(artistId);
        const inAlbumFeat = release.featuredArtistIds.includes(artistId);
        const inTracks = release.tracks.some(track => 
            track.primaryArtistIds.includes(artistId) || 
            track.featuredArtistIds.includes(artistId)
        );

        return inAlbumMain || inAlbumFeat || inTracks;
    });

    return {
        isLocked: !!lockingRelease,
        releaseTitle: lockingRelease?.title,
        status: lockingRelease?.status
    };
};

export const api = {
  login: async (email: string): Promise<User | undefined> => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return undefined;

    // Attach Label/Artist name for UI display
    if (user.labelId) {
        const label = labels.find(l => l.id === user.labelId);
        if (label) user.labelName = label.name;
    }
    if (user.artistId) {
        const artist = artists.find(a => a.id === user.artistId);
        if (artist) user.artistName = artist.name;
    }

    return user;
  },

  getLabels: async (): Promise<Label[]> => [...labels],

  getSubLabels: async (parentLabelId: string): Promise<Label[]> => {
    return labels.filter(l => l.parentLabelId === parentLabelId);
  },

  updateLabel: async (id: string, name: string, requester: User): Promise<Label> => {
    const label = labels.find(l => l.id === id);
    if (!label) throw new Error('Label not found');
    label.name = name;
    
    // Also update cached labelName in users
    users.forEach(u => {
        if (u.labelId === id) u.labelName = name;
    });
    
    persist();
    return label;
  },

  deleteLabel: async (id: string, requester: User): Promise<void> => {
    const labelArtists = artists.filter(a => a.labelId === id);
    for (const artist of labelArtists) {
        const lock = getArtistLockReason(artist.id);
        if (lock.isLocked) {
            throw new Error(`Label cannot be deleted because Artist "${artist.name}" is linked to the ${lock.status} album "${lock.releaseTitle}". Take down or remove the album first.`);
        }
    }

    labels = labels.filter(l => l.id !== id);
    users = users.filter(u => u.labelId !== id);
    artists = artists.filter(a => a.labelId !== id);
    releases = releases.filter(r => r.labelId !== id);
    revenue = revenue.filter(rev => rev.labelId !== id);
    persist();
  },

  getLabelAdmin: async (labelId: string): Promise<User | undefined> => {
    return users.find(u => u.labelId === labelId && (u.role === UserRole.LABEL_ADMIN || u.role === UserRole.SUB_LABEL_ADMIN));
  },

  getEmployees: async (requester: User): Promise<User[]> => {
      if (requester.role !== UserRole.OWNER && !requester.permissions.canManageEmployees) throw new Error('Access Denied');
      return users.filter(u => u.role === UserRole.EMPLOYEE);
  },

  addEmployee: async (data: any, requester: User): Promise<User> => {
    const userId = `user-emp-${Date.now()}`;
    const password = Math.random().toString(36).slice(-8);
    const newEmp: User = {
      id: userId,
      name: data.name,
      email: data.email,
      password: password,
      role: UserRole.EMPLOYEE,
      designation: data.designation,
      permissions: data.permissions
    };
    users.push(newEmp);
    persist();
    return newEmp;
  },

  updateEmployee: async (id: string, data: any, requester: User): Promise<User> => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Employee not found');
    users[index] = { ...users[index], ...data };
    persist();
    return users[index];
  },

  deleteEmployee: async (id: string, requester: User): Promise<void> => {
    users = users.filter(u => u.id !== id);
    persist();
  },

  updateUserPermissions: async (userId: string, permissions: UserPermissions, requester: User): Promise<User> => {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.permissions = permissions;
    persist();
    return user;
  },

  getNotices: async (requester: User): Promise<Notice[]> => {
      return notices.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addNotice: async (data: any, requester: User): Promise<Notice> => {
      const newNotice: Notice = {
          ...data,
          id: `notice-${Date.now()}`,
          authorId: requester.id,
          authorName: requester.name,
          authorDesignation: (requester.designation as string) || requester.role,
          timestamp: new Date().toISOString()
      };
      notices.push(newNotice);
      persist();
      return newNotice;
  },

  updateNotice: async (id: string, data: any, requester: User): Promise<Notice> => {
    const index = notices.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Notice not found');
    notices[index] = { ...notices[index], ...data, timestamp: new Date().toISOString() };
    persist();
    return notices[index];
  },

  deleteNotice: async (id: string, requester: User): Promise<void> => {
    notices = notices.filter(n => n.id !== id);
    persist();
  },

  getArtistsByLabel: async (labelId: string): Promise<Artist[]> => {
      // Return artists for this label and all descendant labels
      const getChildren = (pid: string): string[] => {
          const direct = labels.filter(l => l.parentLabelId === pid).map(l => l.id);
          let all: string[] = [...direct];
          for (const d of direct) { all = [...all, ...getChildren(d)]; }
          return all;
      };
      const allowedLabelIds = [labelId, ...getChildren(labelId)];
      return artists.filter(a => allowedLabelIds.includes(a.labelId));
  },

  addArtist: async (artistData: Omit<Artist, 'id'>): Promise<{artist: Artist, user?: User}> => {
    const id = `artist-${Date.now()}`;
    const newArtist = { ...artistData, id };
    artists.push(newArtist);

    let newUser: User | undefined = undefined;
    if (artistData.email && artistData.email.trim() !== '') {
      const userId = `user-artist-${Date.now()}`;
      const password = Math.random().toString(36).slice(-8);
      newUser = { 
          id: userId, name: artistData.name, email: artistData.email, password, role: UserRole.ARTIST, labelId: artistData.labelId, artistId: id, artistName: artistData.name, permissions: { canManageArtists: false, canManageReleases: false, canCreateSubLabels: false }
      };
      users.push(newUser);
    }
    persist();
    return { artist: newArtist, user: newUser };
  },

  updateArtist: async (id: string, data: Partial<Artist>, requester: User): Promise<Artist> => {
    const index = artists.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Artist not found');
    
    const lock = getArtistLockReason(id);
    if (lock.isLocked) {
        throw new Error(`Profile for "${artists[index].name}" cannot be modified. They are linked to the ${lock.status} album "${lock.releaseTitle}". You must take down or cancel that album first.`);
    }

    artists[index] = { ...artists[index], ...data } as Artist;
    const user = users.find(u => u.artistId === id);
    if (user) {
      if (data.name) {
          user.name = data.name;
          user.artistName = data.name;
      }
      if (data.email) user.email = data.email;
    } else if (data.email && data.email.trim() !== '') {
        const userId = `user-artist-${Date.now()}`;
        const password = Math.random().toString(36).slice(-8);
        const newUser: User = { 
            id: userId, name: artists[index].name, email: data.email, password, role: UserRole.ARTIST, labelId: artists[index].labelId, artistId: id, artistName: artists[index].name, permissions: { canManageArtists: false, canManageReleases: false, canCreateSubLabels: false }
        };
        users.push(newUser);
    }
    persist();
    return artists[index];
  },

  deleteArtist: async (id: string, requester: User): Promise<void> => {
    const artistIndex = artists.findIndex(a => a.id === id);
    if (artistIndex === -1) throw new Error('Artist not found');
    const artistName = artists[artistIndex].name;

    const lock = getArtistLockReason(id);
    if (lock.isLocked) {
        throw new Error(`Cannot delete Artist "${artistName}" because they are contained in the ${lock.status} album "${lock.releaseTitle}". Take down or delete the album first.`);
    }

    artists = artists.filter(a => a.id !== id);
    users = users.filter(u => u.artistId !== id);
    persist();
  },
  
  getAllReleases: async (): Promise<Release[]> => [...releases],
  getReleasesByLabel: async (labelId: string): Promise<Release[]> => releases.filter(r => r.labelId === labelId),
  getRelease: async (id: string): Promise<Release | undefined> => {
      return releases.find(r => r.id === id);
  },
  deleteRelease: async (id: string): Promise<void> => {
      releases = releases.filter(r => r.id !== id);
      persist();
  },

  updateReleaseStatus: async (id: string, status: ReleaseStatus, note?: InteractionNote) => {
    const r = releases.find(rel => rel.id === id);
    if (r) {
        r.status = status;
        if (note) r.notes = [note, ...(r.notes || [])];
        r.updatedAt = new Date().toISOString();
        persist();
    }
    return r as Release;
  },

  addRelease: async (data: any) => {
      const existingIndex = releases.findIndex(r => r.id === data.id);
      const now = new Date().toISOString();
      if (existingIndex > -1) {
          releases[existingIndex] = { ...releases[existingIndex], ...data, updatedAt: now };
      } else {
          const nr = { 
            ...data, 
            id: data.id || `rel-${Date.now()}`, 
            createdAt: now, 
            updatedAt: now, 
            status: data.status || ReleaseStatus.DRAFT, 
            tracks: data.tracks || [], 
            notes: data.notes || [] 
          };
          releases.push(nr);
      }
      persist();
      return releases.find(r => r.id === data.id) || data;
  },

  getLabel: async (id: string): Promise<Label | undefined> => labels.find(l => l.id === id),
  getArtist: async (id: string): Promise<Artist | undefined> => artists.find(a => a.id === id),
  getAllArtists: async (): Promise<Artist[]> => [...artists],
  
  globalSearch: async (query: string, user: User) => {
    const q = query.toLowerCase();
    let filteredLabels = labels;
    let filteredArtists = artists;
    let filteredReleases = releases;

    if (user.role !== UserRole.OWNER && user.labelId) {
        const getChildren = (pid: string): string[] => {
          const direct = labels.filter(l => l.parentLabelId === pid).map(l => l.id);
          let all: string[] = [...direct];
          for (const d of direct) { all = [...all, ...getChildren(d)]; }
          return all;
        };
        const allowedLabelIds = [user.labelId, ...getChildren(user.labelId)];
        filteredLabels = labels.filter(l => allowedLabelIds.includes(l.id));
        filteredArtists = artists.filter(a => allowedLabelIds.includes(a.labelId));
        filteredReleases = releases.filter(r => allowedLabelIds.includes(r.labelId));
    }

    return {
      labels: filteredLabels.filter(l => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)),
      artists: filteredArtists.filter(a => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.email && a.email.toLowerCase().includes(q))),
      releases: filteredReleases.filter(r => r.title.toLowerCase().includes(q) || r.upc.includes(q) || r.catalogueNumber.toLowerCase().includes(q))
    };
  },

  createSubLabel: async (data: any): Promise<{ label: Label, user: User }> => {
    return api.createLabel(data);
  },

  createLabel: async (data: any): Promise<{ label: Label, user: User }> => {
    const labelId = data.id || `label-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    const password = data.adminPassword || Math.random().toString(36).slice(-8);
    
    const newLabel: Label = { 
        id: labelId, 
        name: data.name, 
        parentLabelId: data.parentLabelId || undefined, 
        ownerId: userId,
        address: data.address,
        city: data.city,
        country: data.country,
        taxId: data.taxId,
        website: data.website,
        phone: data.phone,
        revenueShare: data.revenueShare || 70,
        status: data.status || 'Active',
        createdAt: new Date().toISOString()
    };

    const newUser: User = { 
        id: userId, 
        name: data.adminName || `${data.name} Admin`, 
        email: data.adminEmail, 
        password, 
        role: data.parentLabelId ? UserRole.SUB_LABEL_ADMIN : UserRole.LABEL_ADMIN, 
        labelId, 
        labelName: data.name,
        permissions: data.permissions || { canManageArtists: true, canManageReleases: true, canCreateSubLabels: true } 
    };

    labels.push(newLabel);
    users.push(newUser);
    persist();
    return { label: newLabel, user: newUser };
  },

  getAllRevenue: async (): Promise<RevenueEntry[]> => [...revenue],
  getRevenueForLabelHierarchy: async (labelId: string): Promise<RevenueEntry[]> => {
      const getChildren = (pid: string): string[] => {
          const direct = labels.filter(l => l.parentLabelId === pid).map(l => l.id);
          let all: string[] = [...direct];
          for (const d of direct) { all = [...all, ...getChildren(d)]; }
          return all;
      };
      const allowedIds = [labelId, ...getChildren(labelId)];
      return revenue.filter(r => allowedIds.includes(r.labelId));
  }
};

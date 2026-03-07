
export enum UserRole {
  OWNER = 'Owner',
  LABEL_ADMIN = 'Label Admin',
  SUB_LABEL_ADMIN = 'Sub-Label Admin',
  ARTIST = 'Artist',
  EMPLOYEE = 'Employee',
}

export const EMPLOYEE_DESIGNATIONS = [
  "Founder / CEO",
  "Co-Founder / Operations Head",
  "Distribution Manager",
  "Catalog & Metadata Executive",
  "Content Ingestion Executive",
  "Artist Relations Manager",
  "Artist Support Executive",
  "Royalty & Accounting Executive",
  "Copyright / Content ID Executive",
  "Digital Marketing Executive",
  "Web / Platform Developer",
  "Music Operations Intern",
  "Marketing Intern"
] as const;

export type EmployeeDesignation = typeof EMPLOYEE_DESIGNATIONS[number];

export enum NoticeType {
    URGENT = 'Urgent',
    UPDATE = 'System Update',
    POLICY = 'Policy Change',
    GENERAL = 'General Announcement',
    EVENT = 'Company Event'
}

export type NoticeAudience = 
    | EmployeeDesignation 
    | 'ALL_STAFF' 
    | 'ALL_LABELS' 
    | 'ALL_ARTISTS' 
    | 'EVERYONE';

export interface Notice {
    id: string;
    title: string;
    message: string;
    type: NoticeType;
    authorId: string;
    authorName: string;
    authorDesignation: string;
    targetAudience: NoticeAudience;
    timestamp: string;
}

export interface UserPermissions {
  canManageArtists: boolean;
  canManageReleases: boolean;
  canCreateSubLabels: boolean;
  canSubmitAlbums?: boolean; // New: Controls final submission to distribution
  // Platform Staff specific
  canManageEmployees?: boolean;
  canManageNetwork?: boolean;
  canViewFinancials?: boolean;
  canOnboardLabels?: boolean;
  canDeleteReleases?: boolean; // Authority to purge releases from vault
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Demo purposes
  role: UserRole;
  designation?: EmployeeDesignation | string; // For employees and owner
  labelId?: string; // Only for Label users
  labelName?: string; // Cache for display
  artistId?: string; // Only for Artist users
  artistName?: string; // Cache for display
  permissions: UserPermissions;
  isBlocked?: boolean;
  blockReason?: string;
}

export interface InteractionNote {
  id: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  timestamp: string;
}

export interface Label {
  id: string;
  name: string;
  parentLabelId?: string; 
  ownerId: string;
  
  // Metadata fields
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  website?: string;
  phone?: string;
  revenueShare?: number; // e.g., 70 for 70% to label
  maxArtists?: number; // Maximum artists allowed for this label
  status?: 'Active' | 'Suspended';
  createdAt?: string;
  ownerEmail?: string; // Added for admin view
}

export enum ArtistType {
  SINGER = 'Singer',
  COMPOSER = 'Composer',
  LYRICIST = 'Lyricist',
  PRODUCER = 'Producer',
  REMIXER = 'Remixer',
  DJ = 'DJ',
  BAND = 'Band',
  ORCHESTRA = 'Orchestra',
}

export interface Artist {
  id: string;
  name: string;
  labelId: string;
  type: ArtistType;
  spotifyId?: string;
  appleMusicId?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  email?: string; // Added for login capability
}

export enum ReleaseStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  NEEDS_INFO = 'Needs Info',
  REJECTED = 'Rejected',
  APPROVED = 'Approved',
  PROCESSED = 'Processed',
  PUBLISHED = 'Published',
  TAKEDOWN = 'Takedown',
  CANCELLED = 'Cancelled',
}

export enum ReleaseType {
    ALBUM = 'Album',
    SINGLE = 'Film',
}

export enum ContentType {
    ALBUM = 'Album',
    SINGLE = 'Single',
    COMPILATION = 'Compilation',
    REMIX = 'Remix',
}

export interface Track {
  id: string;
  trackNumber: number;
  discNumber: number;
  title: string;
  versionTitle?: string;
  primaryArtistIds: string[];
  featuredArtistIds: string[];
  isrc: string;
  duration: number; // in seconds
  explicit: boolean;
  audioFileName: string;
  audioUrl: string;
  
  // Excel Meta
  dolbyIsrc?: string;
  composer?: string;
  lyricist?: string;
  language?: string;
  contentType?: string; // Music, Video
  crbtTitle?: string;
  crbtDuration?: string;
  
  // New Metadata Fields
  remixerName?: string;
  composerIpi?: string;
  lyricistIpi?: string;
  composerIprs?: string;
  lyricistIprs?: string;
  isInstrumental?: string;
  appleRemixerId?: string;
  appleComposerId?: string;
  appleLyricistId?: string;
}

export interface Release {
  id: string;
  title: string;
  versionTitle?: string;
  releaseType: ReleaseType;
  contentType?: ContentType;
  primaryArtistIds: string[];
  featuredArtistIds: string[];
  labelId: string;
  upc: string;
  catalogueNumber: string;
  releaseDate: string;
  status: ReleaseStatus;
  artworkUrl: string;
  artworkFileName: string;
  pLine: string;
  cLine: string;
  explicit: boolean;
  tracks: Track[];
  artists?: Artist[];
  createdAt: string;
  updatedAt: string;
  notes: InteractionNote[]; // Array of interaction history

  // Extended Metadata for Excel
  genre?: string;
  subGenre?: string;
  mood?: string;
  language?: string;
  publisher?: string;
  filmName?: string;
  filmDirector?: string;
  filmProducer?: string;
  filmBanner?: string;
  filmCast?: string;
  originalReleaseDate?: string;
  youtubeContentId?: boolean;

  // New Metadata Fields
  labelIpi?: string;
  labelIprs?: string;
  description?: string;
  timeOfMusicRelease?: string;
  dateOfExpiry?: string;
  appleProducerId?: string;
  appleDirectorId?: string;
  appleStarcastId?: string;
}

// Added RevenueEntry for accounting features
export interface RevenueEntry {
  id: string;
  labelId: string;
  reportMonth: string; // YYYY-MM
  store: string;
  territory: string;
  amount: number;
  paymentStatus: 'Paid' | 'Pending';
  date: string;
}

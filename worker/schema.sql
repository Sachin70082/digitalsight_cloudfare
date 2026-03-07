-- DigitalSight Database Schema

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT,
  designation TEXT,
  label_id TEXT,
  label_name TEXT,
  artist_id TEXT,
  artist_name TEXT,
  permissions TEXT,
  is_blocked INTEGER DEFAULT 0,
  block_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS labels;
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  name TEXT,
  parent_label_id TEXT,
  owner_id TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  website TEXT,
  phone TEXT,
  revenue_share REAL,
  max_artists INTEGER,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS artists;
CREATE TABLE artists (
  id TEXT PRIMARY KEY,
  name TEXT,
  label_id TEXT,
  type TEXT,
  spotify_id TEXT,
  apple_music_id TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS releases;
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  title TEXT,
  version_title TEXT,
  release_type TEXT,
  primary_artist_ids TEXT,
  featured_artist_ids TEXT,
  label_id TEXT,
  upc TEXT,
  catalogue_number TEXT,
  release_date TEXT,
  status TEXT,
  artwork_url TEXT,
  artwork_file_name TEXT,
  p_line TEXT,
  c_line TEXT,
  explicit INTEGER,
  genre TEXT,
  sub_genre TEXT,
  mood TEXT,
  language TEXT,
  publisher TEXT,
  film_name TEXT,
  film_director TEXT,
  film_producer TEXT,
  film_banner TEXT,
  film_cast TEXT,
  original_release_date TEXT,
  youtube_content_id INTEGER,
  release_type TEXT,
  content_type TEXT,
  label_ipi TEXT,
  label_iprs TEXT,
  description TEXT,
  time_of_music_release TEXT,
  date_of_expiry TEXT,
  apple_producer_id TEXT,
  apple_director_id TEXT,
  apple_starcast_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS tracks;
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  release_id TEXT,
  track_number INTEGER,
  disc_number INTEGER,
  title TEXT,
  version_title TEXT,
  primary_artist_ids TEXT,
  featured_artist_ids TEXT,
  isrc TEXT,
  duration INTEGER,
  explicit INTEGER,
  audio_file_name TEXT,
  audio_url TEXT,
  dolby_isrc TEXT,
  composer TEXT,
  lyricist TEXT,
  language TEXT,
  content_type TEXT,
  crbt_title TEXT,
  crbt_duration TEXT,
  remixer_name TEXT,
  composer_ipi TEXT,
  lyricist_ipi TEXT,
  composer_iprs TEXT,
  lyricist_iprs TEXT,
  is_instrumental TEXT,
  apple_remixer_id TEXT,
  apple_composer_id TEXT,
  apple_lyricist_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS notices;
CREATE TABLE notices (
  id TEXT PRIMARY KEY,
  title TEXT,
  message TEXT,
  type TEXT,
  author_id TEXT,
  author_name TEXT,
  author_designation TEXT,
  target_audience TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS revenue_entries;
CREATE TABLE revenue_entries (
  id TEXT PRIMARY KEY,
  label_id TEXT,
  report_month TEXT,
  store TEXT,
  territory TEXT,
  amount REAL,
  payment_status TEXT,
  date TEXT
);

DROP TABLE IF EXISTS interaction_notes;
CREATE TABLE interaction_notes (
  id TEXT PRIMARY KEY,
  release_id TEXT,
  author_name TEXT,
  author_role TEXT,
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

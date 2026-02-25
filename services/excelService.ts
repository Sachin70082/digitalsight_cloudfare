
import { Release, Artist, Label, RevenueEntry } from '../types';

declare global {
  interface Window {
    XLSX: any;
    loadXLSX: () => Promise<void>;
  }
}

const EXCEL_HEADERS = [
  'CRBT CUT NAME', 'SONG NAME', 'FILM/ALBUM NAME', 'LANGUAGE', 'Album Type', 'Content Type', 
  'Genre', 'Sub-Genre', 'Mood', 'Description', 'UPC ID', 'ISRC', 'LABEL', 
  'IPRS Ownership (Yes/No) (Label)', 'IPI (Label)', 'Publisher', 'Album Level Main Artist/singer', 
  'Track Level main artist/singer', 'Track Level Featuring artist/singer', 'Track Level Remixer Name', 
  'COMPOSER', 'IPRS member  (Yes/No) (COMPOSER)', 'IPI (COMPOSER)', 
  'LYRICIST', 'IPI (LYRICIST)', 'IPRS member  (Yes/No) (LYRICIST)', 
  'Dolby ISRC', 'Track No.', 'Track Duration', 'Time for CRBT Cut', 
  'Original release date of Movie', 'Original release date of Music', 'Go Live Date', 
  'Time of Music Release', 'DATE OF EXPIRY', 'C-Line', 'P-Line', 'Film Banner', 
  'Film Director', 'Film Producer', 'Film Star Cast / Actors', 'Parental Advisory (Explicit etc)', 
  'IS INSTRUMENTAL', 'Spotify Artist Profile / ID for the track Main Artist', 
  'Spotify Artist Profile / ID for the track Featured Artist', 'Apple Artist ID for Track Main Artist', 
  'Apple Artist ID for Featured Artist',
  'Apple Artist ID for Remixer', 'Apple Artist ID for Composer', 'Apple Artist ID for Lyricist', 
  'Apple Artist ID for Film Producer', 'Apple Artist ID for Film Director', 'Apple Artist ID for Starcast', 
  'Facebook page link for Track Main Artist', 'Instagram Artist handle for Track Main Artist',
  'Instagram Artist handle for Featured Artist'
];

const mapReleaseToRows = (release: Release, artists: Map<string, Artist>, labels: Map<string, Label>) => {
  if (!release) return [];
  
  const label = labels.get(release.labelId);
  const releasePrimaryIds = release.primaryArtistIds || [];
  const albumArtist = artists.get(releasePrimaryIds[0]);

  return (release.tracks || []).map(track => {
    if (!track) return [];
    
    const trackPrimaryIds = track.primaryArtistIds || [];
    const trackFeaturedIds = track.featuredArtistIds || [];
    
    const primaryArtists = trackPrimaryIds.map(id => artists.get(id)).filter(Boolean);
    const featuredArtists = trackFeaturedIds.map(id => artists.get(id)).filter(Boolean);
    
    const trackMainArtists = primaryArtists.map(a => a?.name).join(', ');
    const trackFeaturedArtists = featuredArtists.map(a => a?.name).join(', ');
    
    const spotifyMain = primaryArtists.map(a => a?.spotifyId || '').filter(id => id.trim() !== '').map(id => id.startsWith('http') ? id : `https://open.spotify.com/artist/${id}`).join(', ');
    const spotifyFeatured = featuredArtists.map(a => a?.spotifyId || '').filter(id => id.trim() !== '').map(id => id.startsWith('http') ? id : `https://open.spotify.com/artist/${id}`).join(', ');
    
    const appleMain = primaryArtists.map(a => a?.appleMusicId || '').filter(id => id.trim() !== '').map(id => id.startsWith('http') ? id : `https://music.apple.com/artist/${id}`).join(', ');
    const appleFeatured = featuredArtists.map(a => a?.appleMusicId || '').filter(id => id.trim() !== '').map(id => id.startsWith('http') ? id : `https://music.apple.com/artist/${id}`).join(', ');
    
    const instaMain = primaryArtists.map(a => a?.instagramUrl || '').filter(id => id.trim() !== '').map(url => url.startsWith('http') ? url : `https://instagram.com/${url}`).join(', ');
    const instaFeatured = featuredArtists.map(a => a?.instagramUrl || '').filter(id => id.trim() !== '').map(url => url.startsWith('http') ? url : `https://instagram.com/${url}`).join(', ');
    
    const mins = Math.floor((track.duration || 0) / 60);
    const secs = (track.duration || 0) % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    return [
      track.crbtCutName || '',
      track.title || 'Untitled',
      release.title || 'Untitled',
      release.language || '',
      release.releaseType || 'Single',
      track.contentType || 'Music',
      release.genre || '',
      release.subGenre || '',
      release.mood || '',
      '',
      release.upc || '',
      track.isrc || '',
      label?.name || 'Unknown Label',
      'Yes',
      '',
      release.publisher || '',
      albumArtist?.name || '',
      trackMainArtists || '',
      trackFeaturedArtists || '',
      '',
      track.composer || '',
      '',
      '',
      track.lyricist || '',
      '',
      '',
      track.dolbyIsrc || '',
      track.trackNumber || 1,
      durationStr,
      track.crbtTime || '00:30',
      release.originalReleaseDate || '',
      release.releaseDate || '',
      release.releaseDate || '',
      '00:00:00',
      '',
      release.cLine || '',
      release.pLine || '',
      release.filmBanner || '',
      release.filmDirector || '',
      release.filmProducer || '',
      release.filmCast || '',
      track.explicit ? 'Explicit' : 'Clean',
      'No',
      spotifyMain,
      spotifyFeatured,
      appleMain,
      appleFeatured,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      instaMain,
      instaFeatured
    ];
  });
};

export const getReleaseExcelBuffer = async (release: Release, artists: Map<string, Artist>, labels: Map<string, Label>): Promise<ArrayBuffer> => {
  if (!window.XLSX) {
      if (window.loadXLSX) await window.loadXLSX();
      else throw new Error('Excel library not loaded');
  }
  if (!artists) artists = new Map();
  if (!labels) labels = new Map();

  const rows = mapReleaseToRows(release, artists, labels);
  const ws = window.XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...rows]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Metadata");
  
  return window.XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
};

export const exportReleasesToExcel = async (releases: Release[], artists: Map<string, Artist>, labels: Map<string, Label>) => {
  if (!window.XLSX) {
      if (window.loadXLSX) await window.loadXLSX();
      else {
          alert('Excel library not loaded. Please refresh or check connection.');
          return;
      }
  }
  
  const safeArtists = artists || new Map();
  const safeLabels = labels || new Map();

  const allRows = (releases || []).flatMap(rel => mapReleaseToRows(rel, safeArtists, safeLabels));

  const ws = window.XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...allRows]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Report");
  const dateStr = new Date().toISOString().slice(0,10);
  window.XLSX.writeFile(wb, `Digitalsight_Report_${dateStr}.xlsx`);
};

export const exportReleasesToCSV = async (releases: Release[], artists: Map<string, Artist>, labels: Map<string, Label>) => {
  const safeArtists = artists || new Map();
  const safeLabels = labels || new Map();

  const allRows = (releases || []).flatMap(rel => mapReleaseToRows(rel, safeArtists, safeLabels));
  
  const csvContent = [
      EXCEL_HEADERS.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...allRows.map(row => row.map(cell => {
          const str = String(cell ?? '');
          // Escape quotes and wrap in quotes
          return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0,10);
  link.setAttribute("href", url);
  link.setAttribute("download", `Digitalsight_Report_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFinancialsToExcel = async (revenue: RevenueEntry[], labels: Map<string, Label>, releases: Map<string, Release>, artists: Map<string, Artist>) => {
  if (!window.XLSX) {
      if (window.loadXLSX) await window.loadXLSX();
      else {
          alert('Excel library not loaded. Please refresh or check connection.');
          return;
      }
  }

  const financialHeaders = [
    'TRANSACTION ID', 'REPORT MONTH', 'LABEL NAME', 'STORE CHANNEL', 'TERRITORY', 
    'GROSS AMOUNT ($)', 'PAYMENT STATUS', 'PROCESSING DATE'
  ];

  const rows = (revenue || []).map(entry => {
    const label = labels.get(entry.labelId);
    return [
      entry.id,
      entry.reportMonth,
      label?.name || entry.labelId,
      entry.store,
      entry.territory,
      entry.amount,
      entry.paymentStatus,
      new Date(entry.date).toLocaleDateString()
    ];
  });

  const ws = window.XLSX.utils.aoa_to_sheet([financialHeaders, ...rows]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Financial_Report");
  const dateStr = new Date().toISOString().slice(0,10);
  window.XLSX.writeFile(wb, `Digitalsight_Financials_${dateStr}.xlsx`);
};

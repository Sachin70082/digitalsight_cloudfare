
import { Release, Artist, Label, RevenueEntry } from '../types';

declare global {
  interface Window {
    XLSX: any;
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
  'Apple Artist ID for Remixer', 'Apple Artist ID for Composer', 'Apple Artist ID for Lyricist', 
  'Apple Artist ID for Film Producer', 'Apple Artist ID for Film Director', 'Apple Artist ID for Starcast', 
  'Facebook page link for Track Main Artist', 'Instagram Artist handle for Track Main Artist'
];

export const exportReleasesToExcel = (releases: Release[], artists: Map<string, Artist>, labels: Map<string, Label>) => {
  if (!window.XLSX) {
    alert('Excel library not loaded. Please refresh or check connection.');
    return;
  }

  const rows = releases.flatMap(release => {
    const label = labels.get(release.labelId);
    const albumArtist = artists.get(release.primaryArtistIds[0]);

    return release.tracks.map(track => {
      const trackMainArtists = track.primaryArtistIds.map(id => artists.get(id)?.name).filter(Boolean).join(', ');
      const trackFeaturedArtists = track.featuredArtistIds.map(id => artists.get(id)?.name).filter(Boolean).join(', ');
      
      const mainArtistObj = artists.get(track.primaryArtistIds[0]);
      
      const mins = Math.floor(track.duration / 60);
      const secs = track.duration % 60;
      const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      return [
        track.crbtCutName || '',
        track.title,
        release.title,
        release.language || '',
        release.releaseType,
        track.contentType || 'Music',
        release.genre || '',
        release.subGenre || '',
        release.mood || '',
        release.description || '',
        release.upc,
        track.isrc,
        label?.name || '',
        'Yes',
        '',
        release.publisher || '',
        albumArtist?.name || '',
        trackMainArtists,
        trackFeaturedArtists,
        '',
        track.composer || '',
        '',
        '',
        track.lyricist || '',
        '',
        '',
        track.dolbyIsrc || '',
        track.trackNumber,
        durationStr,
        track.crbtTime || '00:30',
        release.originalReleaseDate || '',
        release.releaseDate,
        release.releaseDate,
        '00:00:00',
        '',
        release.cLine,
        release.pLine,
        release.filmBanner || '',
        release.filmDirector || '',
        release.filmProducer || '',
        release.filmCast || '',
        track.explicit ? 'Explicit' : 'Clean',
        'No',
        mainArtistObj?.spotifyId || '',
        '',
        mainArtistObj?.appleMusicId || '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        mainArtistObj?.instagramUrl || ' '
      ];
    });
  });

  const ws = window.XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...rows]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Report");
  const dateStr = new Date().toISOString().slice(0,10);
  window.XLSX.writeFile(wb, `MusicDistro_Report_${dateStr}.xlsx`);
};

// Added missing function for financial exports
export const exportFinancialsToExcel = (revenue: RevenueEntry[], labels: Map<string, Label>, releases: Map<string, Release>, artists: Map<string, Artist>) => {
  if (!window.XLSX) {
    alert('Excel library not loaded. Please refresh or check connection.');
    return;
  }

  const financialHeaders = [
    'TRANSACTION ID', 'REPORT MONTH', 'LABEL NAME', 'STORE CHANNEL', 'TERRITORY', 
    'GROSS AMOUNT ($)', 'PAYMENT STATUS', 'PROCESSING DATE'
  ];

  const rows = revenue.map(entry => {
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
  window.XLSX.writeFile(wb, `MusicDistro_Financials_${dateStr}.xlsx`);
};

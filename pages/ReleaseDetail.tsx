import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Release, Track, Artist, Label, InteractionNote, UserRole } from '../types';
import { AppContext } from '../App';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '../components/ui';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaStatusBadge, PmaInfoBar, PmaAudioPlayer } from '../components/PmaStyle';
import {
    ArrowLeftIcon, MusicIcon, SpotifyIcon, AppleMusicIcon, YouTubeMusicIcon,
    AmazonMusicIcon, JioSaavnIcon, ShazamIcon, TidalIcon, TikTokIcon,
    FacebookIcon, InstagramIcon, SoundCloudIcon
} from '../components/Icons';

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// phpMyAdmin style Release Detail for admin users
const PmaReleaseDetailView: React.FC<{
    release: Release;
    artist: Artist | null;
    label: Label | null;
    allArtists: Map<string, Artist>;
    isStaff: boolean;
    onBack: () => void;
    onPlayTrack: (src: string, title: string) => void;
    playingTrack: { src: string, title: string } | null;
    setPlayingTrack: (t: { src: string, title: string } | null) => void;
}> = ({ release, artist, label, allArtists, isStaff, onBack, onPlayTrack, playingTrack, setPlayingTrack }) => {
    return (
        <div className="space-y-4 pb-20">
            <PmaInfoBar>
                <strong>Table:</strong> releases &nbsp;|&nbsp; 
                <strong>Row:</strong> {release.id} &nbsp;|&nbsp;
                <strong>Status:</strong> <PmaStatusBadge status={release.status} />
            </PmaInfoBar>

            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="text-[#0066cc] hover:underline text-sm flex items-center gap-1">
                    ← Back to list
                </button>
            </div>

            {/* Main Info */}
            <PmaFieldset legend={`Release: ${release.title}`}>
                <div className="p-4">
                    <div className="flex gap-6 mb-6">
                        {/* Cover Art */}
                        <div className="w-48 h-48 border-2 border-[#ccc] flex-shrink-0">
                            <img src={release.artworkUrl} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Basic Info */}
                        <div className="flex-1">
                            <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                                <PmaTR>
                                    <PmaTD isLabel>Title</PmaTD>
                                    <PmaTD className="text-black">{release.title}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Primary Artists</PmaTD>
                                    <PmaTD className="text-black">
                                        <div className="space-y-1">
                                            {(release.primaryArtistIds || []).map(id => {
                                                const a = allArtists.get(id);
                                                if (!a) return null;
                                                return (
                                                    <div key={a.id} className="flex items-center gap-2">
                                                        <span className="font-bold">{a.name}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            {a.spotifyId && (
                                                                <a href={`https://open.spotify.com/artist/${a.spotifyId}`} target="_blank" rel="noopener noreferrer" className="text-[#1DB954] hover:underline text-[9px] flex items-center gap-0.5">
                                                                    <SpotifyIcon className="w-3 h-3" /> {a.spotifyId}
                                                                </a>
                                                            )}
                                                            {a.appleMusicId && (
                                                                <a href={`https://music.apple.com/artist/${a.appleMusicId}`} target="_blank" rel="noopener noreferrer" className="text-[#FA243C] hover:underline text-[9px] flex items-center gap-0.5">
                                                                    <AppleMusicIcon className="w-3 h-3" /> {a.appleMusicId}
                                                                </a>
                                                            )}
                                                            {a.instagramUrl && (
                                                                <a href={a.instagramUrl.startsWith('http') ? a.instagramUrl : `https://instagram.com/${a.instagramUrl}`} target="_blank" rel="noopener noreferrer" className="text-[#E4405F] hover:underline text-[9px] flex items-center gap-0.5">
                                                                    <InstagramIcon className="w-3 h-3" /> {a.instagramUrl}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Status</PmaTD>
                                    <PmaTD><PmaStatusBadge status={release.status} /></PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>UPC</PmaTD>
                                    <PmaTD className="font-mono text-black">{release.upc || 'Pending'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Catalogue Number</PmaTD>
                                    <PmaTD className="text-black">{release.catalogueNumber || '-'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Release Date</PmaTD>
                                    <PmaTD className="text-black">{release.releaseDate || '-'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Release Type</PmaTD>
                                    <PmaTD className="text-black">{release.releaseType || '-'}</PmaTD>
                                </PmaTR>
                            </PmaTable>
                        </div>
                    </div>
                </div>
            </PmaFieldset>

            {/* Label Info (Staff only) */}
            {isStaff && label && (
                <PmaFieldset legend="Label Information">
                    <div className="p-4">
                        <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                            <PmaTR>
                                <PmaTD isLabel>Label ID</PmaTD>
                                <PmaTD className="font-mono">{label.id}</PmaTD>
                            </PmaTR>
                            <PmaTR>
                                <PmaTD isLabel>Label Name</PmaTD>
                                <PmaTD>{label.name}</PmaTD>
                            </PmaTR>
                            <PmaTR>
                                <PmaTD isLabel>Owner Email</PmaTD>
                                <PmaTD>{label.ownerEmail}</PmaTD>
                            </PmaTR>
                        </PmaTable>
                    </div>
                </PmaFieldset>
            )}

            {/* Metadata */}
            <PmaFieldset legend="Metadata">
                <div className="p-4">
                    <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                        <PmaTR>
                            <PmaTD isLabel>Genre</PmaTD>
                            <PmaTD className="text-black">{release.genre || '-'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>Mood</PmaTD>
                            <PmaTD className="text-black">{release.mood || '-'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>Language</PmaTD>
                            <PmaTD className="text-black">{release.language || '-'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>P-Line</PmaTD>
                            <PmaTD className="text-black">{release.pLine || '-'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>C-Line</PmaTD>
                            <PmaTD className="text-black">{release.cLine || '-'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>Explicit</PmaTD>
                            <PmaTD className="text-black">{release.explicit ? 'Yes' : 'No'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>Publisher</PmaTD>
                            <PmaTD className="text-black">{release.publisher || '-'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>YouTube Content ID</PmaTD>
                            <PmaTD className="text-black">{release.youtubeContentId ? 'Enabled' : 'Disabled'}</PmaTD>
                        </PmaTR>
                        <PmaTR>
                            <PmaTD isLabel>Created At</PmaTD>
                            <PmaTD className="text-black">{new Date(release.createdAt).toLocaleString()}</PmaTD>
                        </PmaTR>
                    </PmaTable>
                </div>
            </PmaFieldset>

            {/* Film Info */}
            {(release.filmName || release.filmDirector) && (
                <PmaFieldset legend="Production / Film Sync Data">
                    <div className="p-4">
                        <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                            {release.filmName && (
                                <PmaTR>
                                    <PmaTD isLabel>Production Name</PmaTD>
                                    <PmaTD>{release.filmName}</PmaTD>
                                </PmaTR>
                            )}
                            {release.filmDirector && (
                                <PmaTR>
                                    <PmaTD isLabel>Director</PmaTD>
                                    <PmaTD>{release.filmDirector}</PmaTD>
                                </PmaTR>
                            )}
                            {release.filmProducer && (
                                <PmaTR>
                                    <PmaTD isLabel>Producer</PmaTD>
                                    <PmaTD>{release.filmProducer}</PmaTD>
                                </PmaTR>
                            )}
                            {release.filmBanner && (
                                <PmaTR>
                                    <PmaTD isLabel>Banner</PmaTD>
                                    <PmaTD>{release.filmBanner}</PmaTD>
                                </PmaTR>
                            )}
                            {release.filmCast && (
                                <PmaTR>
                                    <PmaTD isLabel>Lead Cast</PmaTD>
                                    <PmaTD>{release.filmCast}</PmaTD>
                                </PmaTR>
                            )}
                            {release.originalReleaseDate && (
                                <PmaTR>
                                    <PmaTD isLabel>Original Year</PmaTD>
                                    <PmaTD>{release.originalReleaseDate}</PmaTD>
                                </PmaTR>
                            )}
                        </PmaTable>
                    </div>
                </PmaFieldset>
            )}

            {/* Tracklist */}
            <PmaFieldset legend={`Tracklist (${(release.tracks || []).length} tracks)`}>
                <div className="p-4">
                    <PmaTable
                        headers={[
                            { label: '#', className: 'w-12' },
                            { label: 'Title' },
                            { label: 'Artists' },
                            { label: 'Duration', className: 'text-right' },
                            { label: 'ISRC' },
                            { label: 'Composer / Lyricist' },
                            { label: 'Explicit', className: 'text-center' },
                            { label: 'Audio', className: 'text-center' }
                        ]}
                    >
                        {(release.tracks || []).map((track: Track) => {
                            const primaryArtists = (track.primaryArtistIds || []).map(id => allArtists.get(id)?.name).filter(Boolean).join(', ');
                            const featuredArtists = (track.featuredArtistIds || []).map(id => allArtists.get(id)?.name).filter(Boolean).join(', ');
                            const artists = primaryArtists + (featuredArtists ? ` (feat. ${featuredArtists})` : '');

                            return (
                                <PmaTR key={track.id}>
                                    <PmaTD className="text-center text-black">{track.trackNumber}</PmaTD>
                                    <PmaTD isLabel className="text-black">
                                        <div>{track.title}</div>
                                        <div className="text-[9px] text-[#666]">{track.versionTitle || '-'}</div>
                                    </PmaTD>
                                    <PmaTD className="text-xs text-black">{artists || '-'}</PmaTD>
                                    <PmaTD className="text-right font-mono text-black text-xs">{formatDuration(track.duration)}</PmaTD>
                                    <PmaTD className="font-mono text-xs text-black">{track.isrc || '-'}</PmaTD>
                                    <PmaTD className="text-black">
                                        <div className="text-[10px]">{track.composer || '-'}</div>
                                        <div className="text-[9px] text-[#666]">{track.lyricist || '-'}</div>
                                    </PmaTD>
                                    <PmaTD className="text-center text-black">
                                        {track.explicit ? <span className="text-[#cc0000] font-bold">Yes</span> : 'No'}
                                    </PmaTD>
                                    <PmaTD className="text-center">
                                        <PmaButton 
                                            variant={playingTrack?.src === track.audioUrl ? 'primary' : 'secondary'}
                                            onClick={() => onPlayTrack(track.audioUrl, track.title)}
                                            className="px-2 py-0.5 text-[10px]"
                                        >
                                            {playingTrack?.src === track.audioUrl ? 'Playing...' : 'Play'}
                                        </PmaButton>
                                    </PmaTD>
                                </PmaTR>
                            );
                        })}
                    </PmaTable>
                </div>
            </PmaFieldset>

            {/* Distribution Platforms */}
            <PmaFieldset legend="Distribution Platforms">
                <div className="p-4">
                    <div className="flex flex-wrap gap-3">
                        {[
                            { name: 'Spotify', icon: SpotifyIcon },
                            { name: 'Apple Music', icon: AppleMusicIcon },
                            { name: 'YouTube Music', icon: YouTubeMusicIcon },
                            { name: 'Amazon Music', icon: AmazonMusicIcon },
                            { name: 'JioSaavn', icon: JioSaavnIcon },
                            { name: 'Shazam', icon: ShazamIcon },
                            { name: 'Tidal', icon: TidalIcon },
                            { name: 'TikTok', icon: TikTokIcon },
                            { name: 'Facebook', icon: FacebookIcon },
                            { name: 'Instagram', icon: InstagramIcon },
                            { name: 'SoundCloud', icon: SoundCloudIcon },
                        ].map((platform) => (
                            <div key={platform.name} className="flex items-center gap-2 border border-[#aaa] px-3 py-1 bg-[#f0f0f0] text-black">
                                <platform.icon className="w-4 h-4" />
                                <span className="text-[11px] font-bold">{platform.name}</span>
                                <span className="text-[10px] text-[#009900]">✓</span>
                            </div>
                        ))}
                    </div>
                </div>
            </PmaFieldset>

            {/* Audit History */}
            <PmaFieldset legend="Audit History & Notes">
                <div className="p-4">
                    {(!release.notes || release.notes.length === 0) ? (
                        <p className="text-[#999] text-center py-4">No audit history recorded.</p>
                    ) : (
                        <PmaTable headers={[{ label: 'Timestamp' }, { label: 'Author' }, { label: 'Role' }, { label: 'Message' }]}>
                            {[...release.notes].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).map((note) => (
                                <PmaTR key={note.id}>
                                    <PmaTD className="text-xs font-mono text-black">{new Date(note.timestamp).toLocaleString()}</PmaTD>
                                    <PmaTD className="text-black">{note.authorName || 'Staff'}</PmaTD>
                                    <PmaTD>
                                        <span className={`text-xs px-2 py-0.5 ${
                                            note.authorRole === UserRole.OWNER || note.authorRole === UserRole.EMPLOYEE
                                                ? 'bg-[#fff3cd] text-[#856404] border border-[#856404]'
                                                : 'bg-[#cce5ff] text-[#004085] border border-[#004085]'
                                        }`}>
                                            {note.authorRole}
                                        </span>
                                    </PmaTD>
                                    <PmaTD className="text-xs text-black">{note.message}</PmaTD>
                                </PmaTR>
                            ))}
                        </PmaTable>
                    )}
                </div>
            </PmaFieldset>

            {playingTrack && (
                <PmaAudioPlayer 
                    src={playingTrack.src} 
                    title={playingTrack.title} 
                    onClose={() => setPlayingTrack(null)} 
                />
            )}
        </div>
    );
};

// Original dark theme MetaItem for partner view
const MetaItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="group/meta">
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 group-hover/meta:text-primary transition-colors">{label}</p>
        <p className="font-bold text-white break-words">{value || <span className="text-gray-700 font-bold text-xs uppercase tracking-tighter">Not Specified</span>}</p>
    </div>
);

// Original dark theme InteractionLog for partner view
const InteractionLog: React.FC<{ notes: InteractionNote[] }> = ({ notes }) => {
    const sortedNotes = [...(notes || [])].sort((a, b) => 
        (b.timestamp || '').localeCompare(a.timestamp || '')
    );

    return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {(!sortedNotes || sortedNotes.length === 0) ? (
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest py-4 text-center">No audit history recorded.</p>
            ) : sortedNotes.map((note) => (
                <div key={note.id} className={`p-4 rounded-xl border ${
                    note.authorRole === UserRole.OWNER || note.authorRole === UserRole.EMPLOYEE
                        ? 'bg-yellow-900/10 border-yellow-500/20' 
                        : 'bg-primary/5 border-primary/20'
                }`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                note.authorRole === UserRole.OWNER || note.authorRole === UserRole.EMPLOYEE 
                                ? 'bg-yellow-500 text-yellow-900' 
                                : 'bg-primary text-white'
                            }`}>
                                {note.authorRole}
                            </span>
                            <span className="text-xs text-white font-bold uppercase tracking-tight">{note.authorName || 'Staff'}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(note.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{note.message}</p>
                </div>
            ))}
        </div>
    );
};

// Partner view (original dark theme)
const PartnerReleaseDetailView: React.FC<{
    release: Release;
    artist: Artist | null;
    label: Label | null;
    allArtists: Map<string, Artist>;
    isStaff: boolean;
    onBack: () => void;
}> = ({ release, artist, label, allArtists, isStaff, onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in w-full pb-20 max-w-none">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-800 pb-8 px-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack} 
                        className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/50 transition-all group"
                    >
                        <ArrowLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{release.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">
                                Primary Artists: <span className="text-primary font-black">{(release.primaryArtistIds || []).map(id => allArtists.get(id)?.name).filter(Boolean).join(', ') || 'Unknown'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge status={release.status} />
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">ID: {release.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
                <div className="lg:col-span-3 space-y-8">
                    <Card className="p-0 overflow-hidden">
                        <div className="relative group">
                            <img src={release.artworkUrl} alt="Cover Art" className="w-full h-auto object-cover aspect-square" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Master Source</p>
                                <p className="text-xs text-white font-bold truncate uppercase">{release.artworkFileName || 'Original_Cover_Art.jpg'}</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-gray-800/50">
                            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Audit History & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <InteractionLog notes={release.notes || []} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-9 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest font-black">Session Metadata Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
                                {isStaff && (
                                    <>
                                        <MetaItem label="Label ID" value={<span className="font-mono text-[10px]">{label?.id}</span>} />
                                        <MetaItem label="Label Email" value={label?.ownerEmail} />
                                    </>
                                )}
                                <MetaItem label="Label Branch" value={label?.name} />
                                <MetaItem label="Universal Product Code" value={release.upc || 'Pending Allocation'} />
                                <MetaItem label="Catalogue Number" value={release.catalogueNumber} />
                                <MetaItem label="Global Go-Live" value={release.releaseDate} />
                                <MetaItem label="Release Configuration" value={release.releaseType} />
                                <MetaItem label="Genre / Vibe" value={`${release.genre || '-'} • ${release.mood || '-'}`} />
                                <MetaItem label="Original Language" value={release.language} />
                                <MetaItem label="P-Line (Phonographic)" value={release.pLine} />
                                <MetaItem label="C-Line (Copyright)" value={release.cLine} />
                                <MetaItem label="Explicit Content" value={release.explicit ? 'Yes (Advisory)' : 'Clean / Safe'} />
                                <MetaItem label="Publisher" value={release.publisher} />
                                <MetaItem label="YouTube Content ID" value={release.youtubeContentId ? 'Enabled' : 'Disabled'} />
                                <MetaItem label="Creation Timestamp" value={new Date(release.createdAt).toLocaleDateString()} />
                            </div>
                        </CardContent>
                    </Card>

                    {(release.filmName || release.filmDirector) && (
                        <Card className="bg-primary/5 border-primary/10">
                            <CardHeader className="border-primary/10">
                                <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Production / Film Sync Data</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
                                <MetaItem label="Production Name" value={release.filmName} />
                                <MetaItem label="Director" value={release.filmDirector} />
                                <MetaItem label="Producer" value={release.filmProducer} />
                                <MetaItem label="Banner" value={release.filmBanner} />
                                <MetaItem label="Lead Cast" value={release.filmCast} />
                                <MetaItem label="Original Year" value={release.originalReleaseDate} />
                            </CardContent>
                        </Card>
                    )}
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest font-black">Master Tracklist ({ (release.tracks || []).length })</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="space-y-6">
                                {(release.tracks || []).map((track: Track) => {
                                    const primaryArtists = (track.primaryArtistIds || []).map(id => allArtists.get(id)?.name).filter(Boolean).join(', ');
                                    const featuredArtists = (track.featuredArtistIds || []).map(id => allArtists.get(id)?.name).filter(Boolean).join(', ');

                                    return (
                                        <div key={track.id} className="p-8 bg-black/40 rounded-[2rem] border border-gray-800/60 hover:border-primary/30 transition-all group/track">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover/track:bg-primary group-hover/track:text-black transition-all">
                                                        #{track.trackNumber}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-white text-2xl tracking-tighter uppercase group-hover/track:text-primary transition-colors">
                                                            {track.title}
                                                            {track.explicit && <span className="text-[10px] bg-red-600/20 text-red-500 border border-red-600/30 px-2 py-0.5 rounded font-black ml-3 align-middle tracking-widest uppercase">Explicit</span>}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                                                                {primaryArtists} {featuredArtists ? `(feat. ${featuredArtists})` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-white font-mono tracking-tighter">{formatDuration(track.duration)}</p>
                                                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Master Duration</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-gray-800/40">
                                                <MetaItem label="ISRC Code" value={<span className="font-mono text-sm tracking-widest">{track.isrc}</span>} />
                                                <MetaItem label="Composer" value={track.composer} />
                                                <MetaItem label="Lyricist" value={track.lyricist} />
                                                <MetaItem label="Disc Number" value={track.discNumber} />
                                                <MetaItem label="Audio Language" value={track.language || release.language} />
                                                <MetaItem label="Audio Filename" value={<span className="text-[10px] font-mono text-gray-500 truncate block uppercase">{track.audioFileName}</span>} />
                                            </div>

                                            <div className="mt-8">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <MusicIcon className="w-4 h-4 text-primary" />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Master Reference Preview</span>
                                                </div>
                                                <audio controls preload="none" src={track.audioUrl} className="h-10 w-full opacity-60 hover:opacity-100 transition-opacity"></audio>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-gray-800/50 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm uppercase tracking-widest font-black">Live Distribution Status</CardTitle>
                                <span className="text-xs font-mono text-gray-500">11/11 PLATFORMS ACTIVE</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { name: 'Spotify', icon: SpotifyIcon, color: 'text-[#1DB954]' },
                                    { name: 'Apple Music', icon: AppleMusicIcon, color: 'text-[#FA243C]' },
                                    { name: 'YouTube Music', icon: YouTubeMusicIcon, color: 'text-[#FF0000]' },
                                    { name: 'Amazon Music', icon: AmazonMusicIcon, color: 'text-[#00A8E1]' },
                                    { name: 'JioSaavn', icon: JioSaavnIcon, color: 'text-[#2BC5B4]' },
                                    { name: 'Shazam', icon: ShazamIcon, color: 'text-[#0088FF]' },
                                    { name: 'Tidal', icon: TidalIcon, color: 'text-black' },
                                    { name: 'TikTok', icon: TikTokIcon, color: 'text-[#000000]' },
                                    { name: 'Facebook', icon: FacebookIcon, color: 'text-[#1877F2]' },
                                    { name: 'Instagram', icon: InstagramIcon, color: 'text-[#E4405F]' },
                                    { name: 'SoundCloud', icon: SoundCloudIcon, color: 'text-[#FF5500]' },
                                ].map((platform) => (
                                    <div key={platform.name} className="group relative">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                            <platform.icon className={`w-6 h-6 ${platform.color}`} />
                                        </div>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold uppercase px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                                            {platform.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ReleaseDetail: React.FC = () => {
    const { releaseId } = useParams<{ releaseId: string }>();
    const navigate = useNavigate();
    
    const { user } = useContext(AppContext);
    const isStaff = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
    
    const [release, setRelease] = useState<Release | null>(null);
    const [artist, setArtist] = useState<Artist | null>(null);
    const [label, setLabel] = useState<Label | null>(null);
    const [allArtists, setAllArtists] = useState<Map<string, Artist>>(new Map());
    
    const [isLoading, setIsLoading] = useState(true);
    const [playingTrack, setPlayingTrack] = useState<{ src: string, title: string } | null>(null);

    useEffect(() => {
        if (!releaseId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const releaseData = await api.getRelease(releaseId);

                if (!releaseData) {
                    setRelease(null);
                    setIsLoading(false);
                    return;
                }
                
                setRelease(releaseData);
                setIsLoading(false);

                const artistMap = new Map<string, Artist>();
                if (releaseData.artists) {
                    releaseData.artists.forEach(a => artistMap.set(a.id, a));
                } else {
                    // Fallback
                    const fetchedArtists = await api.getAllArtists();
                    fetchedArtists.forEach(a => artistMap.set(a.id, a));
                }
                setAllArtists(artistMap);

                const [labelData] = await Promise.all([
                    releaseData.labelId ? api.getLabel(releaseData.labelId) : Promise.resolve(null)
                ]);

                const primaryIds = releaseData.primaryArtistIds || [];
                if (primaryIds.length > 0) {
                    setArtist(artistMap.get(primaryIds[0]) || null);
                }

                setLabel(labelData || null);
            } catch (error) {
                console.error("Failed to fetch release details", error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [releaseId]);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-fade-in w-full pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-800 pb-8 px-4">
                    <div className="flex items-center gap-6">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div>
                            <Skeleton className="h-10 w-64 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
                    <div className="lg:col-span-3 space-y-8">
                        <Card className="p-0 overflow-hidden border-none bg-transparent shadow-none">
                             <Skeleton className="w-full aspect-square rounded-[2rem]" />
                        </Card>
                    </div>
                    <div className="lg:col-span-9 space-y-8">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-5 w-48" />
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    if (!release) return <div className="text-center p-20 text-red-500 font-black uppercase tracking-widest animate-fade-in">Session not found in distribution archive.</div>;

    const commonProps = {
        release, artist, label, allArtists, isStaff, onBack: () => navigate('/releases'),
        onPlayTrack: (src, title) => setPlayingTrack({ src, title }),
        playingTrack,
        setPlayingTrack
    };

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return <PmaReleaseDetailView {...commonProps} />;
    }

    // Use dark theme for partner users
    return <PartnerReleaseDetailView {...commonProps} />;
};

export default ReleaseDetail;

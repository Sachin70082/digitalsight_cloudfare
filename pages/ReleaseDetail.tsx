
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Release, Track, Artist, Label, InteractionNote, UserRole } from '../types';
import { AppContext } from '../App';
import { Badge, Card, CardContent, CardHeader, CardTitle, PageLoader } from '../components/ui';
import { ArrowLeftIcon, MusicIcon } from '../components/Icons';

const MetaItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div className="group/meta">
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1 group-hover/meta:text-primary transition-colors">{label}</p>
        <p className="font-bold text-white break-words">{value || <span className="text-gray-700 font-bold text-xs uppercase tracking-tighter">Not Specified</span>}</p>
    </div>
);

const InteractionLog: React.FC<{ notes: InteractionNote[] }> = ({ notes }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {(!notes || notes.length === 0) ? (
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest py-4 text-center">No audit history recorded.</p>
        ) : notes.map((note) => (
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

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ReleaseDetail: React.FC = () => {
    const { releaseId } = useParams<{ releaseId: string }>();
    const navigate = useNavigate();
    
    const [release, setRelease] = useState<Release | null>(null);
    const [artist, setArtist] = useState<Artist | null>(null);
    const [label, setLabel] = useState<Label | null>(null);
    const [allArtists, setAllArtists] = useState<Map<string, Artist>>(new Map());
    
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!releaseId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [releaseData, fetchedArtists] = await Promise.all([
                    api.getRelease(releaseId),
                    api.getAllArtists()
                ]);

                if (!releaseData) {
                    setRelease(null);
                    setIsLoading(false);
                    return;
                }
                setRelease(releaseData);

                const artistMap = new Map<string, Artist>();
                fetchedArtists.forEach(a => artistMap.set(a.id, a));
                setAllArtists(artistMap);

                const primaryIds = releaseData.primaryArtistIds || [];
                if (primaryIds.length > 0) {
                    setArtist(artistMap.get(primaryIds[0]) || null);
                }

                if (releaseData.labelId) {
                     const labelData = await api.getLabel(releaseData.labelId);
                     setLabel(labelData || null);
                }
            } catch (error) {
                console.error("Failed to fetch release details", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [releaseId]);

    if (isLoading) return <PageLoader />;
    if (!release) return <div className="text-center p-20 text-red-500 font-black uppercase tracking-widest animate-fade-in">Session not found in distribution archive.</div>;

    return (
        <div className="space-y-8 animate-fade-in w-full pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-800 pb-8 px-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/releases')} 
                        className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/50 transition-all group"
                    >
                        <ArrowLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{release.title}</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">
                            Primary Artist: <span className="text-primary font-black">{artist?.name || 'Unknown'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge status={release.status} />
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">ID: {release.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
                <div className="lg:col-span-3 space-y-8">
                    <Card className="overflow-hidden border-gray-800 bg-black/40 shadow-2xl rounded-[2rem]">
                        <div className="relative group">
                            <img src={release.artworkUrl} alt="Cover Art" className="w-full h-auto object-cover aspect-square" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Master Source</p>
                                <p className="text-xs text-white font-bold truncate uppercase">{release.artworkFileName || 'Original_Cover_Art.jpg'}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-800 bg-gray-900/50 rounded-[2rem]">
                        <CardHeader className="border-b border-gray-800/50">
                            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Audit History & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <InteractionLog notes={release.notes || []} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-9 space-y-8">
                    <Card className="border-gray-800 shadow-xl bg-gray-900/30 rounded-[2rem]">
                        <CardHeader className="border-b border-gray-800/50">
                            <CardTitle className="text-sm uppercase tracking-widest font-black">Session Metadata Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
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
                                <MetaItem label="Creation Timestamp" value={new Date(release.createdAt).toLocaleDateString()} />
                            </div>
                        </CardContent>
                    </Card>

                    {(release.filmName || release.filmDirector) && (
                        <Card className="border-primary/10 bg-primary/5 shadow-xl rounded-[2rem]">
                            <CardHeader className="border-b border-primary/10">
                                <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Production / Film Sync Data</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
                                <MetaItem label="Production Name" value={release.filmName} />
                                <MetaItem label="Director" value={release.filmDirector} />
                                <MetaItem label="Producer" value={release.filmProducer} />
                                <MetaItem label="Banner" value={release.filmBanner} />
                                <MetaItem label="Lead Cast" value={release.filmCast} />
                                <MetaItem label="Original Year" value={release.originalReleaseDate} />
                            </CardContent>
                        </Card>
                    )}
                    
                    <Card className="border-gray-800 bg-gray-900/40 rounded-[2rem]">
                        <CardHeader className="border-b border-gray-800/50">
                            <CardTitle className="text-sm uppercase tracking-widest font-black">Master Tracklist ({ (release.tracks || []).length })</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
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
                                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                                                            {primaryArtists} {featuredArtists ? `(feat. ${featuredArtists})` : ''}
                                                        </p>
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
                                                <audio controls src={track.audioUrl} className="h-10 w-full opacity-60 hover:opacity-100 transition-opacity"></audio>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800 bg-gray-900/30 rounded-[2rem]">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest font-black">Marketing Copy / Liner Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 bg-black/40 rounded-[2rem] border border-gray-800/40 leading-relaxed text-gray-300 whitespace-pre-wrap font-medium text-lg">
                                {release.description || 'No marketing description provided for this session.'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReleaseDetail;

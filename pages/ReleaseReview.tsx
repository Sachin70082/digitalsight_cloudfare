
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { getReleaseExcelBuffer } from '../services/excelService';
import { Release, ReleaseStatus, Track, UserRole, Artist, Label, InteractionNote } from '../types';
import { AppContext } from '../App';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageLoader, Textarea, Modal, Spinner, Input } from '../components/ui';
import { DownloadIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, MusicIcon, SpotifyIcon, AppleMusicIcon, InstagramIcon, SparklesIcon } from '../components/Icons';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaStatusBadge, PmaInfoBar, PmaSectionTitle, PmaActionLink, PmaAudioPlayer } from '../components/PmaStyle';
import { AcrCloudRecognition } from '../components/AcrCloudRecognition';

const MetaItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="font-bold text-white">{value || '-'}</p>
    </div>
);

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
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                note.authorRole === UserRole.OWNER || note.authorRole === UserRole.EMPLOYEE ? 'bg-yellow-500 text-yellow-900' : 'bg-primary text-white'
                            }`}>
                                {note.authorRole}
                            </span>
                            <span className="text-xs text-white font-bold">{note.authorName}</span>
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

const PackageCircularProgress: React.FC<{ percentage: number, status: string }> = ({ percentage, status }) => {
    const { user } = useContext(AppContext);
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    if (isPlatformSide) {
        return (
            <div className="fixed inset-0 z-[2000] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                <div className="w-full max-w-md space-y-8">
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 relative z-10">
                            <circle cx="96" cy="96" r="80" stroke="#eee" strokeWidth="10" fill="transparent" />
                            <circle
                                cx="96"
                                cy="96"
                                r="80"
                                stroke="#0066cc"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 80}
                                style={{ strokeDashoffset: (2 * Math.PI * 80) - (percentage / 100) * (2 * Math.PI * 80), transition: 'stroke-dashoffset 0.5s' }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <span className="text-4xl font-bold text-[#333]">{Math.round(percentage)}%</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-[#333]">Vault Transmission</h3>
                        <p className="text-sm text-[#666] font-mono bg-[#f5f5f5] border border-[#ccc] px-4 py-2 rounded">{status}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-fade-in">
            <div className="w-full max-w-md space-y-12">
                <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse-slow"></div>
                    <svg className="w-full h-full transform -rotate-90 relative z-10">
                        <circle cx="128" cy="128" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-800" />
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            style={{ strokeDashoffset, transition: 'stroke-dashoffset-0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            strokeLinecap="round"
                            className="text-primary shadow-[0_0_30px_rgba(29,185,84,0.6)]"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <span className="text-5xl font-black text-white tracking-tighter leading-none">{Math.round(percentage)}%</span>
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-3">Syncing Assets</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Vault Transmission</h3>
                    <div className="bg-white/5 py-3 px-6 rounded-2xl border border-white/10 inline-block max-w-full">
                        <p className="text-xs text-primary font-mono tracking-widest uppercase truncate px-4">{status}</p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-6 opacity-60">
                        <Spinner className="w-4 h-4 border-primary" />
                        <span className="text-[11px] text-gray-400 font-black uppercase tracking-[0.15em]">Streaming album components...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// phpMyAdmin style Release Review for admin users
const PmaReleaseReviewView: React.FC<{
    release: Release;
    artistsMap: Map<string, Artist>;
    label: Label | null;
    isPublished: boolean;
    isProcessing: boolean;
    handleDownloadPackage: () => void;
    setAcrModalOpen: (o: boolean) => void;
    setReturnModalOpen: (o: boolean) => void;
    setApproveConfirmOpen: (o: boolean) => void;
    setTakedownConfirmOpen: (o: boolean) => void;
    setRejectModalOpen: (o: boolean) => void;
    setFeedbackNote: (n: string) => void;
    setCurrentStep: (s: number) => void;
    onBack: () => void;
    onPlayTrack: (src: string, title: string) => void;
    playingTrack: { src: string, title: string } | null;
    setPlayingTrack: (t: { src: string, title: string } | null) => void;
}> = ({ 
    release, artistsMap, label, isPublished, isProcessing, 
    handleDownloadPackage, setAcrModalOpen, setReturnModalOpen, setApproveConfirmOpen, 
    setTakedownConfirmOpen, setRejectModalOpen, setFeedbackNote, 
    setCurrentStep, onBack, onPlayTrack, playingTrack, setPlayingTrack
}) => {
    return (
        <div className="space-y-4 pb-20">
            <PmaInfoBar>
                <strong>Table:</strong> releases &nbsp;|&nbsp; 
                <strong>Row:</strong> {release.id} &nbsp;|&nbsp;
                <strong>Status:</strong> <PmaStatusBadge status={release.status} />
            </PmaInfoBar>

            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="text-[#0066cc] hover:underline text-sm flex items-center gap-1">
                    ← Back to list
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    <PmaFieldset legend="Cover Art">
                        <div className="p-2">
                            <img src={release.artworkUrl} alt="Artwork" className="w-full h-auto border border-[#ccc]" />
                        </div>
                    </PmaFieldset>

                    <PmaFieldset legend="Audit History">
                        <div className="p-2 max-h-64 overflow-y-auto text-xs">
                            {(!release.notes || release.notes.length === 0) ? (
                                <p className="text-[#999] text-center py-4">No history.</p>
                            ) : (
                                <div className="space-y-2">
                                    {[...release.notes].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).map((note) => (
                                        <div key={note.id} className="border-b border-[#eee] pb-2">
                                            <div className="flex justify-between font-bold text-black mb-1">
                                                <span>{note.authorName}</span>
                                                <span className="font-mono">{new Date(note.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-black">{note.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PmaFieldset>

                    <PmaFieldset legend="Operations">
                        <div className="p-4 space-y-3">
                            <PmaButton variant="primary" className="w-full" onClick={handleDownloadPackage} disabled={isProcessing}>
                                Download Metadata (XLSX)
                            </PmaButton>
                            
                            <PmaButton variant="secondary" className="w-full" onClick={() => setAcrModalOpen(true)} disabled={isProcessing}>
                                ACR Cloud Recognition
                            </PmaButton>
                            
                            {!isPublished ? (
                                <>
                                    <PmaButton variant="primary" className="w-full bg-gradient-to-b from-[#009900] to-[#006600] border-[#006600]" onClick={() => { setCurrentStep(1); setApproveConfirmOpen(true); }} disabled={isProcessing}>
                                        Finalize & Publish
                                    </PmaButton>
                                    <PmaButton variant="secondary" className="w-full" onClick={() => setReturnModalOpen(true)} disabled={isProcessing}>
                                        Return for Corrections
                                    </PmaButton>
                                    <PmaButton variant="danger" className="w-full" onClick={() => { setFeedbackNote(''); setRejectModalOpen(true); }} disabled={isProcessing}>
                                        Reject Content
                                    </PmaButton>
                                </>
                            ) : (
                                <PmaButton variant="danger" className="w-full" onClick={() => setTakedownConfirmOpen(true)} disabled={isProcessing}>
                                    Execute Takedown
                                </PmaButton>
                            )}
                        </div>
                    </PmaFieldset>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-4">
                    <PmaFieldset legend="Release Metadata">
                        <div className="p-4">
                            <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                                <PmaTR>
                                    <PmaTD isLabel>Title</PmaTD>
                                    <PmaTD className="text-black">{release.title}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Artists</PmaTD>
                                    <PmaTD className="text-black">
                                        <div className="space-y-1">
                                            {(release.primaryArtistIds || []).map(id => {
                                                const a = artistsMap.get(id);
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
                                    <PmaTD isLabel>Label</PmaTD>
                                    <PmaTD className="text-black">{label?.name || 'Unknown'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>UPC</PmaTD>
                                    <PmaTD className="font-mono text-black">{release.upc || 'Pending'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Catalogue #</PmaTD>
                                    <PmaTD className="text-black">{release.catalogueNumber}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Genre / Mood</PmaTD>
                                    <PmaTD className="text-black">{release.genre} / {release.mood}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Release Date</PmaTD>
                                    <PmaTD className="text-black">{release.releaseDate}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>P-Line / C-Line</PmaTD>
                                    <PmaTD className="text-black">{release.pLine} / {release.cLine}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Language</PmaTD>
                                    <PmaTD className="text-black">{release.language || '-'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Publisher</PmaTD>
                                    <PmaTD className="text-black">{release.publisher || '-'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>Explicit</PmaTD>
                                    <PmaTD className="text-black">{release.explicit ? 'Yes' : 'No'}</PmaTD>
                                </PmaTR>
                                <PmaTR>
                                    <PmaTD isLabel>YouTube Content ID</PmaTD>
                                    <PmaTD className="text-black">{release.youtubeContentId ? 'Enabled' : 'Disabled'}</PmaTD>
                                </PmaTR>
                            </PmaTable>
                        </div>
                    </PmaFieldset>

                    {(release.filmName || release.filmDirector) && (
                        <PmaFieldset legend="Film Sync Data">
                            <div className="p-4">
                                <PmaTable headers={[{ label: 'Field' }, { label: 'Value' }]}>
                                    <PmaTR>
                                        <PmaTD isLabel>Film Name</PmaTD>
                                        <PmaTD className="text-black">{release.filmName}</PmaTD>
                                    </PmaTR>
                                    <PmaTR>
                                        <PmaTD isLabel>Director</PmaTD>
                                        <PmaTD className="text-black">{release.filmDirector}</PmaTD>
                                    </PmaTR>
                                    <PmaTR>
                                        <PmaTD isLabel>Producer</PmaTD>
                                        <PmaTD className="text-black">{release.filmProducer}</PmaTD>
                                    </PmaTR>
                                    <PmaTR>
                                        <PmaTD isLabel>Banner</PmaTD>
                                        <PmaTD className="text-black">{release.filmBanner}</PmaTD>
                                    </PmaTR>
                                    <PmaTR>
                                        <PmaTD isLabel>Cast</PmaTD>
                                        <PmaTD className="text-black">{release.filmCast}</PmaTD>
                                    </PmaTR>
                                </PmaTable>
                            </div>
                        </PmaFieldset>
                    )}

                    <PmaFieldset legend="Tracklist">
                        <div className="p-4">
                            <PmaTable headers={[
                                { label: '#' },
                                { label: 'Title / Version' },
                                { label: 'ISRC' },
                                { label: 'Duration' },
                                { label: 'Composer / Lyricist' },
                                { label: 'Explicit', className: 'text-center' },
                                { label: 'Audio', className: 'text-center' }
                            ]}>
                                {(release.tracks || []).map(track => (
                                    <PmaTR key={track.id}>
                                        <PmaTD className="text-center text-black">{track.trackNumber}</PmaTD>
                                        <PmaTD isLabel className="text-black">
                                            <div>{track.title}</div>
                                            <div className="text-[9px] text-[#666]">{track.versionTitle || '-'}</div>
                                        </PmaTD>
                                        <PmaTD className="font-mono text-xs text-black">{track.isrc}</PmaTD>
                                        <PmaTD className="text-right font-mono text-xs text-black">
                                            {Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}
                                        </PmaTD>
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
                                ))}
                            </PmaTable>
                        </div>
                    </PmaFieldset>
                </div>
            </div>

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

const ReleaseReview: React.FC = () => {
    const { releaseId } = useParams<{ releaseId: string }>();
    const navigate = useNavigate();
    const { user, showToast } = useContext(AppContext);
    
    const [release, setRelease] = useState<Release | null>(null);
    const [artistsMap, setArtistsMap] = useState<Map<string, Artist>>(new Map());
    const [label, setLabel] = useState<Label | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Interaction Modals
    const [isAcrModalOpen, setAcrModalOpen] = useState(false);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isApproveConfirmOpen, setApproveConfirmOpen] = useState(false);
    const [isTakedownConfirmOpen, setTakedownConfirmOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [feedbackNote, setFeedbackNote] = useState('');

    // Package Download State
    const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);
    const [packageStatus, setPackageStatus] = useState('');
    const [packagePercentage, setPackagePercentage] = useState(0);

    // Finalize Modal State
    const [upcInput, setUpcInput] = useState('');
    const [tracksInput, setTracksInput] = useState<Track[]>([]);
    const [currentStep, setCurrentStep] = useState(1);

    const [playingTrack, setPlayingTrack] = useState<{ src: string, title: string } | null>(null);

    useEffect(() => {
        const isStaff = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
        if (!isStaff) {
            navigate('/');
            return;
        }
        if (releaseId) {
             const fetchData = async () => {
                setIsLoading(true);
                try {
                    const releaseData = await api.getRelease(releaseId);
                    if (!releaseData) {
                        setRelease(null);
                        return;
                    }
                    setRelease(releaseData);
                    setUpcInput(releaseData.upc || '');
                    setTracksInput(releaseData.tracks || []);

                    const resolvedArtists = new Map<string, Artist>();
                    if (releaseData.artists) {
                        releaseData.artists.forEach(a => resolvedArtists.set(a.id, a));
                    } else {
                        // Fallback if backend doesn't return artists (e.g. old version)
                        const artistIds = new Set([
                            ...(releaseData.primaryArtistIds || []),
                            ...(releaseData.featuredArtistIds || []),
                            ...(releaseData.tracks?.flatMap(t => [...(t.primaryArtistIds || []), ...(t.featuredArtistIds || [])]) || [])
                        ]);

                        for (const id of Array.from(artistIds)) {
                            const artistData = await api.getArtist(id);
                            if (artistData) resolvedArtists.set(id, artistData);
                        }
                    }
                    setArtistsMap(resolvedArtists);

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
        }
    }, [releaseId, user, navigate]);

    const handleDownloadPackage = async () => {
        if (!release) return;

        setIsDownloadingPackage(true);
        setPackagePercentage(0);
        setPackageStatus('Initializing secure vault synchronization...');

        const safeTitle = (release.title || 'untitled').replace(/[^a-z0-9]/gi, '_');

        try {
            setPackagePercentage(30);
            setPackageStatus('Synthesizing Metadata Registry...');
            
            const finalLabelsMap = new Map<string, Label>();
            if (label) {
                finalLabelsMap.set(label.id, label);
            } else if (release.labelId) {
                finalLabelsMap.set(release.labelId, { id: release.labelId, name: 'Unknown Label', ownerId: 'sys' } as Label);
            }

            const excelBuffer = await getReleaseExcelBuffer(release, artistsMap, finalLabelsMap);
            const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const excelUrl = window.URL.createObjectURL(excelBlob);
            
            const link = document.createElement('a');
            link.href = excelUrl;
            link.download = `${safeTitle}_Metadata.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(excelUrl);

            setPackagePercentage(60);
            setPackageStatus('Metadata Transmitted.');

            if (release.artworkUrl && release.artworkUrl !== 'staged') {
                setPackageStatus('Opening Artwork Master URL...');
                window.open(release.artworkUrl, '_blank');
            }

            setPackagePercentage(100);
            setPackageStatus('Synchronization successful.');
            
            setTimeout(() => {
                setIsDownloadingPackage(false);
            }, 1000);

            showToast('Album metadata and artwork access initiated.', 'success');
        } catch (error: any) {
            console.error("Transmission pipeline failure", error);
            showToast(`Transmission Failure: ${error.message}`, 'error');
            setIsDownloadingPackage(false);
        }
    };

    const handleTrackIsrcChange = (trackId: string, newIsrc: string) => {
        setTracksInput(prev => prev.map(t => 
            t.id === trackId ? { ...t, isrc: newIsrc } : t
        ));
    };

    const handleFinalizePublish = async () => {
        if (!release || !user) return;
        
        if (!upcInput.trim()) {
            showToast('UPC Code is required.', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const note: InteractionNote = {
                id: `note-${Date.now()}`,
                authorName: user.name,
                authorRole: user.role,
                message: "Album finalized and published. UPC and ISRCs updated.",
                timestamp: new Date().toISOString()
            };

            // Construct the full update payload
            // We use updateRelease directly to send tracks and UPC along with status
            // Note: The mockApi.updateReleaseStatus just calls updateRelease with status and notes
            // So we are doing a superset of that here.
            const updateData: Partial<Release> = {
                status: ReleaseStatus.PUBLISHED,
                upc: upcInput,
                tracks: tracksInput,
                notes: [note] as any // Type assertion to match the API expectation if needed, though InteractionNote[] is correct
            };

            await api.updateRelease(release.id, updateData);
            
            showToast(`Release finalized and published successfully.`, 'success');
            navigate('/releases');
        } catch (error) {
            console.error("Finalize failed", error);
            showToast('Failed to finalize release. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
            setApproveConfirmOpen(false);
        }
    };
    
    const handleStatusChange = async (newStatus: ReleaseStatus, message?: string) => {
        if (!release || !user) return;
        
        setIsProcessing(true);
        try {
            let note: InteractionNote | undefined;
            if (message) {
                note = {
                    id: `note-${Date.now()}`,
                    authorName: user.name,
                    authorRole: user.role,
                    message: message,
                    timestamp: new Date().toISOString()
                };
            }

            await api.updateReleaseStatus(release.id, newStatus, note);
            
            if (newStatus === ReleaseStatus.REJECTED || newStatus === ReleaseStatus.TAKEDOWN) {
                showToast('Asset Purge Complete: Audio masters purged. Metadata preserved.', 'success');
            } else {
                showToast(`Node status updated to ${newStatus}.`, 'success');
            }
            
            navigate('/releases');
        } catch (error) {
            showToast('Authorization or network failure. Please retry.', 'error');
        } finally {
            setIsProcessing(false);
            setReturnModalOpen(false);
            setApproveConfirmOpen(false);
            setTakedownConfirmOpen(false);
            setRejectModalOpen(false);
            setFeedbackNote('');
        }
    };
    
    if (isLoading) return <PageLoader />;
    if (!release) return <div className="text-center p-10 text-red-500">Node identity not found.</div>;

    const isPublished = release.status === ReleaseStatus.PUBLISHED;
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    if (isPlatformSide) {
        return (
            <>
                {isDownloadingPackage && (
                    <PackageCircularProgress percentage={packagePercentage} status={packageStatus} />
                )}
                <PmaReleaseReviewView
                    release={release}
                    artistsMap={artistsMap}
                    label={label}
                    isPublished={isPublished}
                    isProcessing={isProcessing}
                    handleDownloadPackage={handleDownloadPackage}
                    setAcrModalOpen={setAcrModalOpen}
                    setReturnModalOpen={setReturnModalOpen}
                    setApproveConfirmOpen={setApproveConfirmOpen}
                    setTakedownConfirmOpen={setTakedownConfirmOpen}
                    setRejectModalOpen={setRejectModalOpen}
                    setFeedbackNote={setFeedbackNote}
                    setCurrentStep={setCurrentStep}
                    onBack={() => navigate('/releases')}
                    onPlayTrack={(src, title) => setPlayingTrack({ src, title })}
                    playingTrack={playingTrack}
                    setPlayingTrack={setPlayingTrack}
                />

                <Modal isOpen={isAcrModalOpen} onClose={() => setAcrModalOpen(false)} title="ACR Cloud Audio Recognition" size="3xl">
                    <AcrCloudRecognition tracks={release.tracks || []} />
                </Modal>

                <Modal isOpen={isReturnModalOpen} onClose={() => setReturnModalOpen(false)} title="Correction Directive" size="lg">
                    <div className="space-y-4 p-4">
                        <div className="p-4 bg-[#ffffcc] border border-[#cc9] rounded text-sm text-[#666]">
                            Specify exactly which metadata fields or binary assets require correction.
                        </div>
                        <textarea 
                            className="w-full border-2 border-[#ccc] p-3 text-sm min-h-[120px] focus:border-[#0066cc] outline-none text-black"
                            placeholder="e.g. Artwork is not 3000x3000px. Track 2 ISRC is invalid."
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <PmaButton variant="secondary" onClick={() => setReturnModalOpen(false)}>Cancel</PmaButton>
                            <PmaButton variant="primary" onClick={() => handleStatusChange(ReleaseStatus.NEEDS_INFO, feedbackNote)} disabled={!feedbackNote.trim() || isProcessing}>
                                Dispatch Fix Request
                            </PmaButton>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={isApproveConfirmOpen} onClose={() => setApproveConfirmOpen(false)} title={currentStep === 1 ? "Finalize: UPC Assignment" : "Finalize: ISRC Verification"} size="lg">
                    <div className="p-4 space-y-4">
                        {currentStep === 1 ? (
                            <>
                                <div className="p-4 bg-[#e8f4e8] border border-[#009900] text-sm text-[#006600]">
                                    Step 1/2: Assign or verify the Universal Product Code (UPC).
                                </div>
                                <PmaInput label="UPC Code" value={upcInput} onChange={setUpcInput} placeholder="Enter 12 or 13 digit UPC" />
                                <div className="flex justify-end gap-2">
                                    <PmaButton variant="secondary" onClick={() => setApproveConfirmOpen(false)}>Cancel</PmaButton>
                                    <PmaButton variant="primary" onClick={() => setCurrentStep(2)} disabled={!upcInput.trim()}>Next Step</PmaButton>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-[#e8f4e8] border border-[#009900] text-sm text-[#006600]">
                                    Step 2/2: Verify ISRC codes for all tracks.
                                </div>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {tracksInput.map((track) => (
                                        <div key={track.id} className="flex items-center gap-3 p-2 border border-[#ccc]">
                                            <span className="w-6 text-xs font-bold">{track.trackNumber}</span>
                                            <span className="flex-1 text-xs truncate">{track.title}</span>
                                            <input 
                                                className="w-40 border border-[#ccc] px-2 py-1 text-xs font-mono"
                                                value={track.isrc || ''}
                                                onChange={(e) => handleTrackIsrcChange(track.id, e.target.value)}
                                                placeholder="ISRC"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between gap-2">
                                    <PmaButton variant="secondary" onClick={() => setCurrentStep(1)}>Back</PmaButton>
                                    <PmaButton variant="primary" onClick={handleFinalizePublish} disabled={isProcessing}>Finalize & Publish</PmaButton>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>

                <Modal isOpen={isRejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Rejection Protocol" size="lg">
                    <div className="p-4 space-y-4">
                        <div className="p-4 bg-[#ffcccc] border border-[#cc0000] text-sm text-[#cc0000]">
                            <strong>Warning:</strong> Rejection will purge audio masters. Metadata remains for audit.
                        </div>
                        <textarea 
                            className="w-full border-2 border-[#ccc] p-3 text-sm min-h-[100px] focus:border-[#cc0000] outline-none"
                            placeholder="Specify compliance failure..."
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <PmaButton variant="secondary" onClick={() => setRejectModalOpen(false)}>Cancel</PmaButton>
                            <PmaButton variant="danger" onClick={() => handleStatusChange(ReleaseStatus.REJECTED, `Rejection: ${feedbackNote}`)} disabled={!feedbackNote.trim() || isProcessing}>
                                Confirm Rejection
                            </PmaButton>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={isTakedownConfirmOpen} onClose={() => setTakedownConfirmOpen(false)} title="Execute Takedown" size="lg">
                    <div className="p-4 space-y-4">
                        <div className="p-4 bg-[#ffe6cc] border border-[#cc6600] text-sm text-[#cc6600]">
                            <strong>Irreversible:</strong> Takedown protocol will remove content from all endpoints.
                        </div>
                        <textarea 
                            className="w-full border-2 border-[#ccc] p-3 text-sm min-h-[100px] focus:border-[#cc6600] outline-none"
                            placeholder="State reason for takedown..."
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <PmaButton variant="secondary" onClick={() => setTakedownConfirmOpen(false)}>Abort</PmaButton>
                            <PmaButton variant="danger" className="bg-[#cc6600] border-[#cc6600]" onClick={() => handleStatusChange(ReleaseStatus.TAKEDOWN, `Takedown: ${feedbackNote}`)} disabled={!feedbackNote.trim() || isProcessing}>
                                Confirm Takedown
                            </PmaButton>
                        </div>
                    </div>
                </Modal>
            </>
        );
    }

    const primaryArtist = release.primaryArtistIds?.[0] ? (artistsMap.get(release.primaryArtistIds[0])?.name || 'Unknown Artist') : 'Unknown Artist';

    return (
        <div className="space-y-8 animate-fade-in pb-20 w-full max-w-none">
            {isDownloadingPackage && (
                <PackageCircularProgress percentage={packagePercentage} status={packageStatus} />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-800 pb-8">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary/50 transition-all group">
                        <ArrowLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{release.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">
                                by <span className="text-primary font-black">{(release.primaryArtistIds || []).map(id => artistsMap.get(id)?.name).filter(Boolean).join(', ') || 'Unknown'}</span> • {label?.name || 'Unknown Label'}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 border-l border-gray-800 pl-4">
                                {[...(release.primaryArtistIds || []), ...(release.featuredArtistIds || [])].map(id => {
                                    const a = artistsMap.get(id);
                                    if (!a || (!a.spotifyId && !a.appleMusicId && !a.instagramUrl)) return null;
                                    return (
                                        <div key={a.id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                            <span className="text-[9px] font-black text-gray-400 uppercase truncate max-w-[80px]">{a.name}</span>
                                            <div className="flex items-center gap-1.5">
                                                {a.spotifyId && (
                                                    <a href={`https://open.spotify.com/artist/${a.spotifyId}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1DB954] transition-colors" title={`${a.name} Spotify`}>
                                                        <SpotifyIcon className="w-3 h-3" /> 
                                                    </a>
                                                )}
                                                {a.appleMusicId && (
                                                    <a href={`https://music.apple.com/artist/${a.appleMusicId}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#FA243C] transition-colors" title={`${a.name} Apple Music`}>
                                                        <AppleMusicIcon className="w-3 h-3" />
                                                    </a>
                                                )}
                                                {a.instagramUrl && (
                                                    <a href={a.instagramUrl.startsWith('http') ? a.instagramUrl : `https://instagram.com/${a.instagramUrl}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#E4405F] transition-colors" title={`${a.name} Instagram`}>
                                                        <InstagramIcon className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge status={release.status} />
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">REF: {release.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-0 overflow-hidden">
                        <img src={release.artworkUrl} alt="Artwork" className="w-full h-auto object-cover aspect-square" />
                    </Card>

                    <Card className="border-primary/30 bg-primary/[0.02]">
                        <CardHeader className="border-none p-0 mb-6 text-center">
                            <CardTitle className="text-[11px] font-black uppercase text-primary tracking-[0.25em]">Distribution Engine</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-0">
                             <Button 
                                onClick={handleDownloadPackage}
                                disabled={isDownloadingPackage || isProcessing}
                                variant="primary"
                                className="w-full flex items-center justify-center gap-4 py-5 shadow-[0_20px_40px_-10px_rgba(29,185,84,0.3)] rounded-[1.25rem]"
                             >
                                <DownloadIcon className="w-6 h-6" />
                                <span className="text-xs uppercase font-black tracking-[0.15em]">Download Metadata</span>
                             </Button>

                              <Button 
                                 onClick={() => setAcrModalOpen(true)}
                                 disabled={isProcessing}
                                 variant="secondary"
                                 className="w-full flex items-center justify-center gap-4 py-5 rounded-[1.25rem]"
                              >
                                <SparklesIcon className="w-6 h-6" />
                                <span className="text-xs uppercase font-black tracking-[0.15em]">ACR Recognition</span>
                             </Button>

                             <p className="text-[10px] text-gray-600 text-center uppercase font-bold tracking-widest leading-relaxed">
                                Triggers instant download of Metadata (XLSX) and <br/>opens the artwork master link in a new tab.
                             </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Audit Journal</CardTitle>
                            <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono text-gray-600">v{ (release.notes?.length || 0) + 1 }.0</span>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <InteractionLog notes={release.notes || []} />
                        </CardContent>
                    </Card>

                    <Card className="border-red-500/20 bg-red-500/[0.02]">
                        <CardHeader className="border-none p-0 mb-6"><CardTitle className="text-sm font-black uppercase tracking-widest text-red-500">Security Gate</CardTitle></CardHeader>
                        <CardContent className="space-y-4 p-0">
                             <div className="grid grid-cols-1 gap-3">
                                {!isPublished && (
                                    <Button 
                                        onClick={() => { setCurrentStep(1); setApproveConfirmOpen(true); }} 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-3 py-5 shadow-xl shadow-primary/20 rounded-2xl"
                                    >
                                        {isProcessing ? <Spinner className="w-5 h-5" /> : (
                                            <>
                                                <CheckCircleIcon className="w-6 h-6" /> 
                                                <span className="text-xs tracking-widest">Finalize & Publish</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                                
                                {!isPublished && (
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => setReturnModalOpen(true)} 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-3 py-4 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 rounded-2xl transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 a9 9 0 11-18 0z" /></svg>
                                        <span className="text-[10px] tracking-widest">Return for Corrections</span>
                                    </Button>
                                )}

                                <Button 
                                    onClick={() => { setFeedbackNote(''); setRejectModalOpen(true); }} 
                                    variant="danger" 
                                    disabled={isProcessing || isPublished}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl shadow-xl shadow-red-500/10"
                                >
                                    {isProcessing ? <Spinner className="w-5 h-5" /> : (
                                        <>
                                            <XCircleIcon className="w-6 h-6" /> 
                                            <span className="text-[10px] tracking-widest">Reject Content</span>
                                        </>
                                    )}
                                </Button>

                                {isPublished && (
                                    <Button 
                                        onClick={() => setTakedownConfirmOpen(true)} 
                                        variant="secondary" 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-3 py-4 border-orange-500/20 text-orange-500 hover:bg-orange-500/10 rounded-2xl"
                                    >
                                        {isProcessing ? <Spinner className="w-5 h-5" /> : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span className="text-[10px] tracking-widest">Takedown</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <Card className="p-0 overflow-hidden">
                        <CardHeader className="flex flex-row justify-between items-center bg-black/20 px-10 py-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Vault Meta Registry</CardTitle>
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-1 rounded-full font-black uppercase">UPC: {release.upc}</span>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 p-10">
                            <MetaItem label="Genre / Mood" value={`${release.genre || '-'} • ${release.mood || '-'}`} />
                            <MetaItem label="Catalogue #" value={release.catalogueNumber} />
                            <MetaItem label="Original Language" value={release.language} />
                            <MetaItem label="Transmission Type" value={release.releaseType} />
                            <MetaItem label="Go Live Window" value={release.releaseDate} />
                            <MetaItem label="Legal Publisher" value={release.publisher} />
                            <MetaItem label="Phonographic (P)" value={release.pLine} />
                            <MetaItem label="Copyright (C)" value={release.cLine} />
                            <MetaItem label="Advisory Status" value={release.explicit ? 'E - Explicit Content' : 'Clean / Safe'} />
                            <MetaItem label="YouTube Content ID" value={release.youtubeContentId ? 'Enabled' : 'Disabled'} />
                        </CardContent>
                    </Card>
                    
                    <Card className="p-0 overflow-hidden">
                        <CardHeader className="bg-black/20 px-10 py-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Binary Asset Integrity (QC)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {(release.tracks || []).map((track: Track) => (
                                    <div key={track.id} className="p-10 hover:bg-white/[0.02] transition-colors group/track">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                                            <div className="flex items-center gap-6">
                                                <span className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-sm font-black border border-primary/20 shadow-inner">{track.trackNumber}</span>
                                                <div>
                                                    <p className="font-black text-white text-2xl tracking-tighter uppercase group-hover/track:text-primary transition-colors">
                                                        {track.title} 
                                                        {track.explicit && <span className="text-[10px] bg-red-600/20 text-red-500 border border-red-600/30 px-3 py-1 rounded-full font-black ml-4 align-middle tracking-[0.2em] uppercase">Explicit</span>}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                        <p className="text-[11px] text-gray-500 font-mono tracking-tighter">ISRC: <span className="text-gray-300 font-bold tracking-widest">{track.isrc}</span> • PCM WAV 44.1kHz • {Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}</p>
                                                        <div className="flex flex-wrap items-center gap-2 border-l border-gray-800 pl-3">
                                                            {[...(track.primaryArtistIds || []), ...(track.featuredArtistIds || [])].map(id => {
                                                                const a = artistsMap.get(id);
                                                                if (!a || (!a.spotifyId && !a.appleMusicId && !a.instagramUrl)) return null;
                                                                return (
                                                                    <div key={a.id} className="flex items-center gap-1.5 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                                        <span className="text-[8px] font-black text-gray-500 uppercase truncate max-w-[60px]">{a.name}</span>
                                                                        <div className="flex items-center gap-1">
                                                                            {a.spotifyId && (
                                                                                <a href={`https://open.spotify.com/artist/${a.spotifyId}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#1DB954] transition-colors" title={`${a.name} Spotify`}>
                                                                                    <SpotifyIcon className="w-2.5 h-2.5" />
                                                                                </a>
                                                                            )}
                                                                            {a.appleMusicId && (
                                                                                <a href={`https://music.apple.com/artist/${a.appleMusicId}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#FA243C] transition-colors" title={`${a.name} Apple Music`}>
                                                                                    <AppleMusicIcon className="w-2.5 h-2.5" />
                                                                                </a>
                                                                            )}
                                                                            {a.instagramUrl && (
                                                                                <a href={a.instagramUrl.startsWith('http') ? a.instagramUrl : `https://instagram.com/${a.instagramUrl}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#E4405F] transition-colors" title={`${a.name} Instagram`}>
                                                                                    <InstagramIcon className="w-2.5 h-2.5" />
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 flex-grow md:max-w-md">
                                                <audio controls preload="none" src={track.audioUrl} className="h-8 w-full opacity-60 hover:opacity-100 transition-opacity"></audio>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-8 border-t border-white/5">
                                            <MetaItem label="Lead Composer" value={track.composer} />
                                            <MetaItem label="Lyricist" value={track.lyricist} />
                                            <MetaItem label="Vault Filename" value={<span className="text-[10px] font-mono text-gray-500 truncate block uppercase">{track.audioFileName}</span>} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isAcrModalOpen} onClose={() => setAcrModalOpen(false)} title="ACR Cloud Audio Recognition" size="3xl">
                <AcrCloudRecognition tracks={release.tracks || []} />
            </Modal>

            <Modal isOpen={isReturnModalOpen} onClose={() => setReturnModalOpen(false)} title="Correction Directive" size="lg">
                <div className="space-y-6">
                    <div className="p-6 bg-yellow-900/10 border border-yellow-500/20 rounded-[1.5rem]">
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            <strong>Note:</strong> Specify exactly which metadata fields or binary assets require correction by the Label administrator.
                        </p>
                    </div>
                    <div className=" space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Directive Details</label>
                        <Textarea 
                            className="text-black"
                            placeholder="e.g. Artwork is not 3000x3000px. Track 2 ISRC is invalid. Please update and resubmit."
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={6}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 rounded-xl uppercase text-[10px]" onClick={() => setReturnModalOpen(false)}>Cancel Review</Button>
                        <Button 
                            className="flex-1 rounded-xl uppercase text-[10px] shadow-lg shadow-primary/20" 
                            disabled={!feedbackNote.trim() || isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.NEEDS_INFO, feedbackNote)}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Dispatch Fix Request'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isApproveConfirmOpen} onClose={() => setApproveConfirmOpen(false)} title={currentStep === 1 ? "Finalize: UPC Assignment" : "Finalize: ISRC Verification"} size="lg">
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-[1.5rem]">
                            <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                <strong>Step 1/2:</strong> Please assign or verify the Universal Product Code (UPC) for this release. This is required for distribution.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <Input 
                                label="Universal Product Code (UPC)" 
                                placeholder="Enter 12 or 13 digit UPC"
                                value={upcInput}
                                onChange={(e) => setUpcInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button variant="secondary" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setApproveConfirmOpen(false)}>Cancel</Button>
                            <Button 
                                className="flex-1 rounded-xl text-[10px] font-black uppercase shadow-xl shadow-primary/30" 
                                disabled={!upcInput.trim()}
                                onClick={() => setCurrentStep(2)}
                            >
                                Next Step &rarr;
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-[1.5rem]">
                            <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                <strong>Step 2/2:</strong> Verify ISRC codes for all tracks. If codes were provided during ingestion, they are pre-filled below.
                            </p>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {tracksInput.map((track) => (
                                <div key={track.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                                        {track.trackNumber}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{track.title}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{track.audioFileName}</p>
                                    </div>
                                    <div className="w-48">
                                        <Input 
                                            placeholder="ISRC Code"
                                            value={track.isrc || ''}
                                            onChange={(e) => handleTrackIsrcChange(track.id, e.target.value)}
                                            className="py-2 text-xs font-mono tracking-wider"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="secondary" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setCurrentStep(1)}>&larr; Back</Button>
                            <Button 
                                className="flex-1 rounded-xl text-[10px] font-black uppercase shadow-xl shadow-primary/30" 
                                disabled={isProcessing}
                                onClick={handleFinalizePublish}
                            >
                                {isProcessing ? <Spinner className="w-5 h-5" /> : 'Finalize & Publish'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isRejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Rejection Protocol" size="lg">
                <div className="space-y-6">
                    <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-[1.5rem]">
                        <p className="text-sm text-red-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             Content Rejection
                        </p>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            Rejection will purge audio masters from the vault. Metadata will be preserved for audit. The label will be notified.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Reason for Rejection</label>
                        <Textarea 
                            placeholder="Specify compliance failure (e.g. Low audio quality, Incorrect metadata, Copyright violation)"
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={4}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
                        <Button 
                            className="flex-1 bg-red-600 hover:bg-red-500 border-none rounded-xl text-[10px] font-black uppercase shadow-xl shadow-red-600/20" 
                            disabled={!feedbackNote.trim() || isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.REJECTED, `Rejection: ${feedbackNote}`)}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Confirm Rejection'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isTakedownConfirmOpen} onClose={() => setTakedownConfirmOpen(false)} title="Execute Takedown" size="lg">
                <div className="space-y-6">
                    <div className="p-6 bg-orange-900/20 border border-orange-500/30 rounded-[1.5rem]">
                        <p className="text-sm text-orange-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             Irreversible Operation
                        </p>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            Takedown protocol will remove content from all active endpoints. Binary masters will be purged from the archive. Metadata remains for audit.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Official Takedown Basis</label>
                        <Textarea 
                            placeholder="State reason (Legal claim, termination, error, etc)"
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={4}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setTakedownConfirmOpen(false)}>Abort</Button>
                        <Button 
                            className="flex-1 bg-orange-600 hover:bg-orange-500 border-none rounded-xl text-[10px] font-black uppercase shadow-xl shadow-orange-600/20" 
                            disabled={!feedbackNote.trim() || isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.TAKEDOWN, `Takedown protocol executed: ${feedbackNote}`)}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Confirm Takedown'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReleaseReview;

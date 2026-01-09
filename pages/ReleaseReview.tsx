
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { getReleaseExcelBuffer } from '../services/excelService';
import { Release, ReleaseStatus, Track, UserRole, Artist, Label, InteractionNote } from '../types';
import { AppContext } from '../App';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageLoader, Textarea, Modal, Spinner } from '../components/ui';
import { DownloadIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, MusicIcon } from '../components/Icons';

const MetaItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="font-bold text-white">{value || '-'}</p>
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

const PackageCircularProgress: React.FC<{ percentage: number, status: string }> = ({ percentage, status }) => {
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isApproveConfirmOpen, setApproveConfirmOpen] = useState(false);
    const [isTakedownConfirmOpen, setTakedownConfirmOpen] = useState(false);
    const [feedbackNote, setFeedbackNote] = useState('');

    // Package Download State
    const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);
    const [packageStatus, setPackageStatus] = useState('');
    const [packagePercentage, setPackagePercentage] = useState(0);

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

                    const artistIds = new Set([
                        ...(releaseData.primaryArtistIds || []),
                        ...(releaseData.featuredArtistIds || []),
                        ...(releaseData.tracks?.flatMap(t => [...(t.primaryArtistIds || []), ...(t.featuredArtistIds || [])]) || [])
                    ]);

                    const resolvedArtists = new Map<string, Artist>();
                    for (const id of Array.from(artistIds)) {
                        const artistData = await api.getArtist(id);
                        if (artistData) resolvedArtists.set(id, artistData);
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

            const excelBuffer = getReleaseExcelBuffer(release, artistsMap, finalLabelsMap);
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
                showToast('Asset Purge Complete: Node removed from active distribution.', 'success');
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
            setFeedbackNote('');
        }
    };
    
    if (isLoading) return <PageLoader />;
    if (!release) return <div className="text-center p-10 text-red-500">Node identity not found.</div>;

    const isPublished = release.status === ReleaseStatus.PUBLISHED;
    const primaryArtist = release.primaryArtistIds?.[0] ? (artistsMap.get(release.primaryArtistIds[0])?.name || 'Unknown Artist') : 'Unknown Artist';

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
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
                        <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">
                            by <span className="text-primary font-black">{primaryArtist}</span> • {label?.name || 'Unknown Label'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge status={release.status} />
                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">REF: {release.id}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-gray-800 bg-black/40 shadow-2xl rounded-[2.5rem] p-0">
                        <img src={release.artworkUrl} alt="Artwork" className="w-full h-auto object-cover aspect-square" />
                    </Card>

                    <Card className="border border-primary/30 bg-primary/[0.02] rounded-[2rem] p-8">
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
                             <p className="text-[10px] text-gray-600 text-center uppercase font-bold tracking-widest leading-relaxed">
                                Triggers instant download of Metadata (XLSX) and <br/>opens the artwork master link in a new tab.
                             </p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-gray-800 bg-gray-900/30">
                        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Audit Journal</CardTitle>
                            <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono text-gray-600">v{ (release.notes?.length || 0) + 1 }.0</span>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <InteractionLog notes={release.notes || []} />
                        </CardContent>
                    </Card>

                    <Card className="border-red-500/20 bg-red-500/[0.02] rounded-[2rem] p-8">
                        <CardHeader className="border-none p-0 mb-6"><CardTitle className="text-sm font-black uppercase tracking-widest text-red-500">Security Gate</CardTitle></CardHeader>
                        <CardContent className="space-y-4 p-0">
                             <div className="grid grid-cols-1 gap-3">
                                {!isPublished && (
                                    <Button 
                                        onClick={() => setApproveConfirmOpen(true)} 
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
                                    onClick={() => handleStatusChange(ReleaseStatus.REJECTED, "Protocol Rejection: Content fails compliance. Assets purged from vault.")} 
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
                    <Card className="rounded-[2.5rem] border-gray-800 bg-gray-900/40 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row justify-between items-center bg-black/20 border-b border-white/5 px-10 py-6">
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
                        </CardContent>
                    </Card>
                    
                    <Card className="rounded-[2.5rem] border-gray-800 bg-gray-900/40 shadow-xl overflow-hidden">
                        <CardHeader className="bg-black/20 border-b border-white/5 px-10 py-6">
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
                                                    <p className="text-[11px] text-gray-500 font-mono tracking-tighter mt-1">ISRC: <span className="text-gray-300 font-bold tracking-widest">{track.isrc}</span> • PCM WAV 44.1kHz • {Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}</p>
                                                </div>
                                            </div>
                                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 flex-grow md:max-w-md">
                                                <audio controls src={track.audioUrl} className="h-8 w-full opacity-60 hover:opacity-100 transition-opacity"></audio>
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
                            placeholder="e.g. Artwork is not 3000x3000px. Track 2 ISRC is invalid. Please update and resubmit."
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={6}
                            className="w-full block bg-black/40 border-gray-700 rounded-[1.25rem]"
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

            <Modal isOpen={isApproveConfirmOpen} onClose={() => setApproveConfirmOpen(false)} title="Authorization Gateway" size="md">
                <div className="space-y-8 text-center py-4">
                    <div className="w-20 h-20 bg-primary/20 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-2 border border-primary/20 shadow-xl shadow-primary/10">
                        <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Authorize Distribution?</h3>
                        <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                            Finalizing this node will synchronize it with the <span className="text-primary font-bold">Published</span> archive. Assets will be prepared for immediate DSP delivery.
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 rounded-xl text-[10px] font-black uppercase" onClick={() => setApproveConfirmOpen(false)} disabled={isProcessing}>
                            Continue Audit
                        </Button>
                        <Button 
                            className="flex-1 rounded-xl text-[10px] font-black uppercase shadow-xl shadow-primary/30" 
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.PUBLISHED, "Distribution protocol authorized: Node published.")}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Authorize Ingest'}
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
                            Takedown protocol will remove content from all active endpoints. Binary masters will be purged from the archive.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Official Takedown Basis</label>
                        <Textarea 
                            placeholder="State reason (Legal claim, termination, error, etc)"
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={4}
                            className="bg-black/40 border-gray-700 rounded-[1.25rem]"
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

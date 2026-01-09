
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Release, ReleaseStatus, Track, UserRole, Artist, Label, InteractionNote } from '../types';
import { AppContext } from '../App';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageLoader, Textarea, Modal, Spinner } from '../components/ui';
import { DownloadIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '../components/Icons';

const MetaItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="font-semibold text-white">{value || '-'}</p>
    </div>
);

const InteractionLog: React.FC<{ notes: InteractionNote[] }> = ({ notes }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {notes.length === 0 ? (
            <p className="text-gray-500 italic text-sm py-4">No activity history recorded yet.</p>
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
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.message}</p>
            </div>
        ))}
    </div>
);

const ReleaseReview: React.FC = () => {
    const { releaseId } = useParams<{ releaseId: string }>();
    const navigate = useNavigate();
    const { user } = useContext(AppContext);
    
    const [release, setRelease] = useState<Release | null>(null);
    const [artist, setArtist] = useState<Artist | null>(null);
    const [label, setLabel] = useState<Label | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Interaction Modals
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isApproveConfirmOpen, setApproveConfirmOpen] = useState(false);
    const [isTakedownConfirmOpen, setTakedownConfirmOpen] = useState(false);
    const [feedbackNote, setFeedbackNote] = useState('');

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

                    if (releaseData.primaryArtistIds.length > 0) {
                        const artistData = await api.getArtist(releaseData.primaryArtistIds[0]);
                        setArtist(artistData || null);
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
        }
    }, [releaseId, user, navigate]);
    
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
            
            // Redirect back to release queue
            navigate('/releases');
        } catch (error) {
            alert('Operation failed. Please try again.');
        } finally {
            setIsProcessing(false);
            setReturnModalOpen(false);
            setApproveConfirmOpen(false);
            setTakedownConfirmOpen(false);
            setFeedbackNote('');
        }
    };
    
    if (isLoading) return <PageLoader />;
    if (!release) return <div className="text-center p-10 text-red-500">Release not found.</div>;

    const isPublished = release.status === ReleaseStatus.PUBLISHED;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeftIcon />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{release.title}</h1>
                        <p className="text-gray-400">by <span className="text-primary font-bold">{artist?.name || 'Unknown Artist'}</span> • {label?.name || 'Unknown Label'}</p>
                    </div>
                </div>
                <Badge status={release.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-gray-700">
                        <CardContent className="p-0">
                            <img src={release.artworkUrl} alt="Artwork" className="w-full h-auto object-cover" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Verification Journal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InteractionLog notes={release.notes || []} />
                        </CardContent>
                    </Card>

                    <Card className="border border-primary/20">
                        <CardHeader><CardTitle className="text-sm">Administrative Gate</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 gap-3">
                                {!isPublished && (
                                    <Button 
                                        onClick={() => setApproveConfirmOpen(true)} 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-2 py-4 shadow-lg shadow-primary/20"
                                    >
                                        {isProcessing ? <Spinner className="w-5 h-5" /> : (
                                            <>
                                                <CheckCircleIcon className="w-5 h-5" /> 
                                                Finalize & Publish
                                            </>
                                        )}
                                    </Button>
                                )}
                                
                                {!isPublished && (
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => setReturnModalOpen(true)} 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-2 py-3 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                                        Return for Correction
                                    </Button>
                                )}

                                <Button 
                                    onClick={() => handleStatusChange(ReleaseStatus.REJECTED, "Hard rejection: Content fails distribution standards.")} 
                                    variant="danger" 
                                    disabled={isProcessing || isPublished}
                                    className="w-full flex items-center justify-center gap-2 py-3"
                                >
                                    {isProcessing ? <Spinner className="w-5 h-5" /> : (
                                        <>
                                            <XCircleIcon className="w-5 h-5" /> 
                                            Reject & Terminate
                                        </>
                                    )}
                                </Button>

                                {isPublished && (
                                    <Button 
                                        onClick={() => setTakedownConfirmOpen(true)} 
                                        variant="secondary" 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-2 py-3 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                                    >
                                        {isProcessing ? <Spinner className="w-5 h-5" /> : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Initiate Takedown
                                            </>
                                        )}
                                    </Button>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle>Catalog Metadata Review</CardTitle>
                            <span className="text-[10px] bg-gray-900 text-gray-500 px-3 py-1 rounded-full font-black border border-gray-800">GLOBAL UPC: {release.upc}</span>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <MetaItem label="Genre / Mood" value={`${release.genre || '-'} / ${release.mood || '-'}`} />
                            <MetaItem label="Internal Cat #" value={release.catalogueNumber} />
                            <MetaItem label="Original language" value={release.language} />
                            <MetaItem label="Product Type" value={release.releaseType} />
                            <MetaItem label="Release Window" value={release.releaseDate} />
                            <MetaItem label="Publishing" value={release.publisher} />
                            <MetaItem label="Legal P Line" value={release.pLine} />
                            <MetaItem label="Copyright C Line" value={release.cLine} />
                            <MetaItem label="Parental Advisory" value={release.explicit ? 'E - Explicit Content' : 'None'} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Audio Assets Quality Control</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-6">
                                {release.tracks.map((track: Track) => (
                                    <li key={track.id} className="p-6 bg-gray-900/40 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <span className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-sm font-black border border-primary/20">{track.trackNumber}</span>
                                                <div>
                                                    <p className="font-bold text-white text-xl flex items-center gap-2">
                                                        {track.title} 
                                                        {track.explicit && <span className="text-[10px] bg-red-600/20 text-red-500 border border-red-600/30 px-2 py-0.5 rounded font-black">ADVISORY</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter mt-1">ISRC: {track.isrc} • PCM WAV 44.1kHz • {Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                                            <audio controls src={track.audioUrl} className="h-8 w-full opacity-70 hover:opacity-100 transition-opacity"></audio>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 mt-6">
                                            <MetaItem label="Composer(s)" value={track.composer} />
                                            <MetaItem label="Lyricist(s)" value={track.lyricist} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isReturnModalOpen} onClose={() => setReturnModalOpen(false)} title="Mandatory Correction Feedback" size="lg">
                <div className="space-y-6">
                    <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                        <p className="text-sm text-gray-300">
                            <strong>Policy:</strong> Correction requests must include clear instructions for the Label regarding what needs to be changed.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Correction Instructions</label>
                        <Textarea 
                            placeholder="e.g. Track 2 has a corrupted audio tail. Please re-upload the WAV. Also, the UPC is missing a digit."
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={5}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setReturnModalOpen(false)}>Cancel Review</Button>
                        <Button 
                            className="flex-1" 
                            disabled={!feedbackNote.trim() || isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.NEEDS_INFO, feedbackNote)}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Return to Label'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isApproveConfirmOpen} onClose={() => setApproveConfirmOpen(false)} title="Final Distribution Confirmation" size="md">
                <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-xl text-white font-bold">Approve & Publish?</h3>
                        <p className="text-sm text-gray-400 mt-2">
                            This will move the release directly to <span className="text-primary font-bold">Published</span> status and initiate distribution to DSPs.
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setApproveConfirmOpen(false)} disabled={isProcessing}>
                            No, Keep Reviewing
                        </Button>
                        <Button 
                            className="flex-1" 
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.PUBLISHED, "Release metadata and assets approved and published.")}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Yes, Publish Now'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isTakedownConfirmOpen} onClose={() => setTakedownConfirmOpen(false)} title="Initiate Content Takedown" size="lg">
                <div className="space-y-6">
                    <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
                        <p className="text-sm text-orange-400 font-bold uppercase mb-1">Takedown Request</p>
                        <p className="text-sm text-gray-300">
                            You are requesting the removal of this release from all distribution channels. This process can take 2-5 business days to propagate across stores.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Takedown Reason / Instructions</label>
                        <Textarea 
                            placeholder="Reason for removal (e.g. Copyright infringement claim, Label request, etc.)"
                            value={feedbackNote}
                            onChange={(e) => setFeedbackNote(e.target.value)}
                            rows={4}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setTakedownConfirmOpen(false)}>Cancel</Button>
                        <Button 
                            className="flex-1 bg-orange-600 hover:bg-orange-500 border-none" 
                            disabled={!feedbackNote.trim() || isProcessing}
                            onClick={() => handleStatusChange(ReleaseStatus.TAKEDOWN, `Takedown initiated: ${feedbackNote}`)}
                        >
                            {isProcessing ? <Spinner className="w-5 h-5" /> : 'Process Takedown'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReleaseReview;

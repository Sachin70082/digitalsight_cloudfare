
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Release, Track, ReleaseType, Artist, ReleaseStatus } from '../types';
import { Button, Input, Textarea, Spinner } from './ui';
import { SparklesIcon, UploadIcon, XCircleIcon, MusicIcon, CheckCircleIcon } from './Icons';
import { generateReleaseDescription } from '../services/geminiService';
import { api } from '../services/mockApi';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ArtistSelector from './ArtistSelector';

interface ReleaseFormProps {
    onClose: () => void;
    onSave: (release: Release) => void;
    initialReleaseId?: string;
}

type FormData = Omit<Release, 'createdAt' | 'updatedAt' | 'labelId'>;

const sanitizeFilename = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

const emptyTrack = (num: number): Track => ({
    id: `tr-${Date.now()}-${num}`,
    trackNumber: num,
    discNumber: 1,
    title: '',
    versionTitle: '',
    primaryArtistIds: [],
    featuredArtistIds: [],
    isrc: '',
    duration: 0,
    explicit: false,
    audioFileName: '',
    audioUrl: '',
    composer: '',
    lyricist: ''
});

const GENRES = ["Pop", "Hip-Hop", "Rock", "Electronic", "Classical", "Jazz", "World", "Folk", "Bollywood", "Devotional", "Regional"];
const MOODS = ["Happy", "Sad", "Energetic", "Relaxed", "Dark", "Romantic", "Epic", "Chill"];
const LANGUAGES = ["English", "Hindi", "Punjabi", "Spanish", "French", "German", "Japanese", "Tamil", "Telugu", "Marathi"];

const ReleaseForm: React.FC<ReleaseFormProps> = ({ onClose, onSave, initialReleaseId }) => {
    const { user } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(!!initialReleaseId);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

    const [submissionNote, setSubmissionNote] = useState('');
    const [labelArtists, setLabelArtists] = useState<Artist[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const [stagedArtwork, setStagedArtwork] = useState<File | null>(null);
    const [stagedAudio, setStagedAudio] = useState<Record<number, File>>({});

    const [formData, setFormData] = useState<FormData>({
        id: initialReleaseId || `draft-${Date.now()}`,
        title: '',
        versionTitle: '',
        releaseType: ReleaseType.SINGLE,
        primaryArtistIds: [],
        featuredArtistIds: [],
        upc: '',
        catalogueNumber: '',
        releaseDate: new Date().toISOString().split('T')[0],
        artworkUrl: '', 
        artworkFileName: '',
        pLine: '',
        cLine: '',
        description: '',
        explicit: false,
        status: ReleaseStatus.DRAFT,
        genre: GENRES[0],
        subGenre: '',
        mood: MOODS[0],
        language: LANGUAGES[0],
        publisher: '',
        filmName: '',
        filmDirector: '',
        filmProducer: '',
        filmBanner: '',
        filmCast: '',
        originalReleaseDate: '',
        tracks: [],
        notes: []
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (user?.labelId) {
                const artists = await api.getArtistsByLabel(user.labelId);
                setLabelArtists(artists);
            }
            if (initialReleaseId) {
                const existing = await api.getRelease(initialReleaseId);
                if (existing) {
                    setFormData({ 
                        ...existing,
                        tracks: existing.tracks || [emptyTrack(1)],
                        notes: existing.notes || [],
                        primaryArtistIds: existing.primaryArtistIds || [],
                        featuredArtistIds: existing.featuredArtistIds || []
                    });
                }
                setIsLoading(false);
            } else {
                setFormData(prev => ({ ...prev, tracks: [emptyTrack(1)] }));
            }
        };
        loadInitialData();
    }, [initialReleaseId, user]);

    const handleChange = <T extends keyof FormData,>(field: T, value: FormData[T]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTrackChange = (index: number, field: keyof Track, value: any) => {
        const newTracks = [...(formData.tracks || [])];
        if (newTracks[index]) {
            (newTracks[index] as any)[field] = value;
            handleChange('tracks', newTracks);
        }
    };

    const addTrack = () => {
        const currentTracks = formData.tracks || [];
        const newTrackNumber = currentTracks.length + 1;
        handleChange('tracks', [...currentTracks, emptyTrack(newTrackNumber)]);
    };

    const removeTrack = (index: number) => {
        const currentTracks = formData.tracks || [];
        const newTracks = currentTracks.filter((_, i) => i !== index);
        newTracks.forEach((t, i) => t.trackNumber = i + 1);
        handleChange('tracks', newTracks);
    };

    const handleAudioSelect = async (file: File, index: number) => {
        if (!file.name.toLowerCase().endsWith('.wav')) {
            alert('High-fidelity WAV masters only.');
            return;
        }

        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const duration = Math.round(audioBuffer.duration);

            setStagedAudio(prev => ({ ...prev, [index]: file }));
            
            handleTrackChange(index, 'audioFileName', file.name);
            handleTrackChange(index, 'duration', duration);
            handleTrackChange(index, 'audioUrl', 'staged'); 
            
            if (formData.tracks?.[index] && !formData.tracks[index].title) {
                handleTrackChange(index, 'title', file.name.replace('.wav', ''));
            }
        } catch (err: any) {
            alert(`Error processing audio: ${err.message}`);
        }
    };

    const handleArtworkSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('JPEG or PNG cover art required.');
            return;
        }
        setStagedArtwork(file);
        setFormData(prev => ({
            ...prev,
            artworkUrl: 'staged',
            artworkFileName: file.name
        }));
    };

    const performUploads = async (): Promise<Partial<FormData>> => {
        setIsSubmitting(true);
        const releaseId = formData.id;
        let finalArtworkUrl = formData.artworkUrl;
        const updatedTracks = [...(formData.tracks || [])];
        const safeReleaseTitle = sanitizeFilename(formData.title || 'untitled_release');

        if (stagedArtwork) {
            setProgressStatus(`Renaming & Uploading Artwork...`);
            const ext = stagedArtwork.name.split('.').pop() || 'jpg';
            const newArtName = `${safeReleaseTitle}_cover.${ext}`;
            const artRef = ref(storage, `releases/${releaseId}/artwork/${newArtName}`);
            
            const uploadTask = uploadBytesResumable(artRef, stagedArtwork);
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed', 
                    (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 20)),
                    reject, 
                    async () => {
                        finalArtworkUrl = await getDownloadURL(artRef);
                        resolve(null);
                    }
                );
            });
        }

        for (let i = 0; i < updatedTracks.length; i++) {
            const file = stagedAudio[i];
            if (file) {
                const track = updatedTracks[i];
                const safeTrackTitle = sanitizeFilename(track.title || `track_${track.trackNumber}`);
                const newAudioName = `${safeTrackTitle}.wav`;
                
                setProgressStatus(`Uploading Track ${track.trackNumber}...`);
                
                const audioRef = ref(storage, `releases/${releaseId}/audio/${track.id}/${newAudioName}`);
                const uploadTask = uploadBytesResumable(audioRef, file);
                
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed', 
                        (snap) => {
                            const totalAudioSteps = 80;
                            const trackWeight = totalAudioSteps / updatedTracks.length;
                            const currentTrackBase = 20 + (i * trackWeight);
                            const trackProgress = (snap.bytesTransferred / snap.totalBytes) * trackWeight;
                            setUploadProgress(Math.round(currentTrackBase + trackProgress));
                        },
                        reject,
                        async () => {
                            updatedTracks[i].audioUrl = await getDownloadURL(audioRef);
                            updatedTracks[i].audioFileName = newAudioName;
                            resolve(null);
                        }
                    );
                });
            }
        }

        setProgressStatus('Finalizing Entry...');
        setUploadProgress(100);
        return { artworkUrl: finalArtworkUrl, tracks: updatedTracks };
    };

    const handleAction = async (isSubmission: boolean) => {
        if (!user || !user.labelId) return;
        if (!formData.title) { alert('Title is mandatory.'); setStep(1); return; }
        
        // Artwork and Tracks only mandatory for final submission
        if (isSubmission) {
            if (!formData.artworkUrl) { alert('Cover art is mandatory for submission.'); setStep(6); return; }
            if ((formData.tracks || []).some(t => !t.audioUrl)) { alert('All tracks must have masters for submission.'); setStep(5); return; }
        }
        
        try {
            const { artworkUrl, tracks } = await performUploads();
            const newNotes = [...(formData.notes || [])];
            
            if (submissionNote.trim()) {
                newNotes.unshift({
                    id: `note-${Date.now()}`,
                    authorName: user.name,
                    authorRole: user.role,
                    message: submissionNote,
                    timestamp: new Date().toISOString()
                });
            }
            
            const finalData = { 
                ...formData, 
                artworkUrl: artworkUrl || formData.artworkUrl,
                tracks: tracks || formData.tracks,
                status: isSubmission ? ReleaseStatus.PENDING : ReleaseStatus.DRAFT,
                notes: newNotes,
                artworkFileName: sanitizeFilename(formData.title) + '_cover'
            };

            const result = await api.addRelease({ ...finalData, labelId: user.labelId });
            onSave(result);
            onClose();
        } catch (error: any) {
            alert("Transmission Error: " + error.message);
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="py-20 flex justify-center"><Spinner /></div>;

    const canSubmit = user?.permissions?.canSubmitAlbums || user?.role === 'Owner' || user?.role === 'Employee';
    
    return (
        <div className="space-y-6 relative min-h-[600px]">
            {isSubmitting && (
                <div className="absolute inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-fade-in rounded-3xl">
                    <div className="w-full max-w-sm space-y-8">
                        <div className="relative">
                            <Spinner className="w-16 h-16 border-primary border-t-transparent mx-auto" />
                            <MusicIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Vault Transmission</h3>
                            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase truncate">{progressStatus}</p>
                        </div>
                        <div className="relative h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(29,185,84,0.6)]" 
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center px-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
                {['General', 'Commercial', 'Genre', 'Film', 'Tracks', 'Artwork', 'Review'].map((name, index) => (
                    <React.Fragment key={name}>
                        <div className="flex flex-col items-center gap-2 cursor-pointer min-w-[70px]" onClick={() => !isSubmitting && setStep(index + 1)}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
                                step > index + 1 ? 'bg-primary text-black' : 
                                (step === index + 1 ? 'bg-primary text-black scale-110' : 'bg-gray-800 text-gray-600')
                            }`}>
                                {step > index + 1 ? '✓' : index + 1}
                            </div>
                            <span className={`text-[8px] uppercase font-black tracking-widest ${step >= index + 1 ? 'text-white' : 'text-gray-600'}`}>{name}</span>
                        </div>
                        {index < 6 && <div className={`flex-1 h-[1px] min-w-[20px] mx-2 ${step > index + 1 ? 'bg-primary/50' : 'bg-gray-800'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto px-1 custom-scrollbar pr-4 pb-10">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-4">Identity Meta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Session Title" placeholder="e.g. Neon Nights" value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
                             <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Release Type</label>
                                <select 
                                    value={formData.releaseType} 
                                    onChange={e => handleChange('releaseType', e.target.value as ReleaseType)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white outline-none"
                                >
                                    {Object.values(ReleaseType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ArtistSelector label="Primary Node(s)" allArtists={labelArtists} selectedArtistIds={formData.primaryArtistIds || []} onChange={(ids) => handleChange('primaryArtistIds', ids)} />
                            <ArtistSelector label="Featured Node(s)" allArtists={labelArtists} selectedArtistIds={formData.featuredArtistIds || []} onChange={(ids) => handleChange('featuredArtistIds', ids)} />
                        </div>
                         <div className="relative">
                            <Textarea label="Production Description" rows={4} placeholder="Describe this session..." value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                            <Button type="button" onClick={async () => {
                                const primaryIds = formData.primaryArtistIds || [];
                                const artist = labelArtists.find(a => a.id === primaryIds[0]);
                                if (!formData.title || !artist) return alert('Enter Title and Primary Artist');
                                setIsGenerating(true);
                                const desc = await generateReleaseDescription(artist.name, formData.title);
                                handleChange('description', desc);
                                setIsGenerating(false);
                            }} disabled={isGenerating} className="absolute bottom-3 right-3 text-[9px] py-1.5 px-3">
                                {isGenerating ? <Spinner className="h-3 w-3"/> : 'AI Synthesis'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-bold text-white">Track Architecture</h3>
                             <Button onClick={addTrack} variant="secondary" className="text-[10px] py-2">Add Segment</Button>
                        </div>
                        {(formData.tracks || []).map((track, index) => (
                             <div key={track.id} className="group bg-gray-800/30 p-6 rounded-2xl border border-gray-800/60 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center text-xs font-black text-primary border border-primary/10">#{track.trackNumber}</div>
                                    {formData.tracks && formData.tracks.length > 1 && (
                                        <button onClick={() => removeTrack(index)} className="text-gray-600 hover:text-red-500 transition-colors"><XCircleIcon className="w-5 h-5"/></button>
                                    )}
                                </div>
                                
                                <div className={`border-2 border-dashed rounded-xl p-6 relative transition-colors ${track.audioUrl ? 'bg-primary/5 border-primary/20' : 'bg-black/20 border-gray-700'}`}>
                                    {track.audioUrl && track.audioUrl !== 'staged' ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <MusicIcon className="text-primary w-6 h-6" />
                                                <div className="min-w-0">
                                                    <span className="text-xs text-white font-bold truncate block">{track.audioFileName}</span>
                                                    <span className="text-[9px] text-gray-500 uppercase font-black">Active Stream Master</span>
                                                </div>
                                            </div>
                                            <Button variant="secondary" className="text-[9px] py-1" onClick={() => handleTrackChange(index, 'audioUrl', '')}>Replace</Button>
                                        </div>
                                    ) : track.audioUrl === 'staged' ? (
                                        <div className="flex items-center gap-4 text-primary">
                                            <UploadIcon className="w-5 h-5" />
                                            <span className="text-xs font-black uppercase">Asset Ready for Sync</span>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2">
                                            <UploadIcon className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Select WAV Source</p>
                                            <input type="file" accept=".wav" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleAudioSelect(f, index); }} />
                                        </div>
                                    )}
                                </div>
                             </div>
                        ))}
                    </div>
                )}

                {step === 6 && (
                    <div className="flex flex-col items-center justify-center animate-fade-in py-10">
                        <h3 className="text-xl font-bold text-white mb-6">Artwork Ingestion</h3>
                        <div className="relative w-72 h-72 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden bg-black/40 group hover:border-primary/40 transition-all">
                            {formData.artworkUrl ? (
                                <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : formData.artworkUrl} className="w-full h-full object-cover" alt="Cover Art" />
                            ) : (
                                <div className="text-center">
                                    <UploadIcon className="h-8 w-8 mx-auto mb-4 text-gray-600" />
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Standard HQ Source</p>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleArtworkSelect(f); }} />
                        </div>
                    </div>
                )}

                {step === 7 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-black">
                                <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : (formData.artworkUrl || '')} className="w-full h-full object-cover" loading="lazy" alt="" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{formData.title}</h3>
                                <p className="text-sm text-primary font-bold uppercase tracking-widest">{formData.releaseType} • Authority Audit Required</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Journal Memo for Auditors</label>
                             <Textarea placeholder="Context for the quality control team..." value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} rows={3} />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-800 bg-gray-900/50 -mx-6 px-6 pb-2 sticky bottom-0 backdrop-blur-md rounded-b-3xl">
                <Button variant="secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting} className="px-8 font-black uppercase text-[10px] tracking-widest">Previous</Button>
                {step < 7 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={isSubmitting} className="px-10 font-black uppercase text-[10px] tracking-widest">Continue</Button>
                ) : (
                    <div className="flex gap-4">
                        <Button onClick={() => handleAction(false)} variant="secondary" disabled={isSubmitting} className="px-8 py-4 font-black uppercase text-[10px] tracking-widest">Save to Archive</Button>
                        {canSubmit ? (
                            <Button onClick={() => handleAction(true)} disabled={isSubmitting} className="px-12 py-4 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30">
                                Synchronize Ingest
                            </Button>
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-yellow-500 font-black uppercase tracking-[0.2em] mb-1">Restricted Action</span>
                                <Button disabled className="px-12 py-4 font-black uppercase text-xs opacity-50 cursor-not-allowed">Submission Locked</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReleaseForm;

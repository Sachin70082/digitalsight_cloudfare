
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Release, Track, ReleaseType, Artist, ReleaseStatus } from '../types';
import { Button, Input, Textarea, Spinner } from './ui';
import { SparklesIcon, UploadIcon, XCircleIcon, MusicIcon, CheckCircleIcon } from './Icons';
import { generateReleaseDescription } from '../services/geminiService';
import { api } from '../services/mockApi';
import ArtistSelector from './ArtistSelector';

interface ReleaseFormProps {
    onClose: () => void;
    onSave: (release: Release) => void;
    initialReleaseId?: string;
}

type FormData = Omit<Release, 'createdAt' | 'updatedAt' | 'labelId'>;

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

const ReleaseForm: React.FC<ReleaseFormProps> = ({ onClose, onSave, initialReleaseId }) => {
    const { user } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(!!initialReleaseId);
    
    // Submission Progress State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

    const [submissionNote, setSubmissionNote] = useState('');
    const [labelArtists, setLabelArtists] = useState<Artist[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        id: initialReleaseId || `draft-${Date.now()}`,
        title: '',
        versionTitle: '',
        releaseType: ReleaseType.SINGLE,
        primaryArtistIds: [],
        featuredArtistIds: [],
        upc: '',
        catalogueNumber: '',
        releaseDate: '',
        artworkUrl: '', 
        artworkFileName: '',
        pLine: '',
        cLine: '',
        description: '',
        explicit: false,
        status: ReleaseStatus.DRAFT,
        genre: '',
        subGenre: '',
        mood: '',
        language: '',
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

    const isCorrectionFlow = formData.status === ReleaseStatus.NEEDS_INFO;

    useEffect(() => {
        const loadInitialData = async () => {
            if (user?.labelId) {
                const artists = await api.getArtistsByLabel(user.labelId);
                setLabelArtists(artists);
            }
            if (initialReleaseId) {
                const existing = await api.getRelease(initialReleaseId);
                if (existing) setFormData({ ...existing });
                setIsLoading(false);
            } else {
                setFormData(prev => ({ ...prev, tracks: [emptyTrack(1)] }));
            }
        };
        loadInitialData();
    }, [initialReleaseId, user]);

    // Track unsaved progress as a draft locally (only if not in correction flow)
    useEffect(() => {
        const saveDraft = async () => {
            if (user?.labelId && formData.title && !isSubmitting && !isCorrectionFlow) {
                await api.addRelease({ ...formData, labelId: user.labelId, status: ReleaseStatus.DRAFT });
            }
        };
        const timeout = setTimeout(saveDraft, 2000);
        return () => clearTimeout(timeout);
    }, [formData, user, isSubmitting, isCorrectionFlow]);

    const handleChange = <T extends keyof FormData,>(field: T, value: FormData[T]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTrackChange = (index: number, field: keyof Track, value: any) => {
        const newTracks = [...formData.tracks];
        (newTracks[index] as any)[field] = value;
        handleChange('tracks', newTracks);
    };

    const addTrack = () => {
        const newTrackNumber = formData.tracks.length + 1;
        handleChange('tracks', [...formData.tracks, emptyTrack(newTrackNumber)]);
    };

    const removeTrack = (index: number) => {
        const newTracks = formData.tracks.filter((_, i) => i !== index);
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

            const localUrl = URL.createObjectURL(file);

            handleTrackChange(index, 'audioUrl', localUrl);
            handleTrackChange(index, 'audioFileName', file.name);
            handleTrackChange(index, 'duration', duration);
            if (!formData.tracks[index].title) {
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
        const localUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            artworkUrl: localUrl,
            artworkFileName: file.name
        }));
    };

    const simulateUpload = async () => {
        setIsSubmitting(true);
        const steps = [
            { p: 15, s: 'Verifying Catalog Integrity...' },
            { p: 35, s: 'Packaging Audio Masters...' },
            { p: 55, s: 'Optimizing Artwork for DSPs...' },
            { p: 80, s: 'Transmitting JSON Payload to API...' },
            { p: 95, s: 'Final Quality Check...' },
            { p: 100, s: 'Successfully Uploaded' }
        ];

        for (const stepInfo of steps) {
            setProgressStatus(stepInfo.s);
            const delay = 600 + Math.random() * 800;
            await new Promise(r => setTimeout(r, delay));
            setUploadProgress(stepInfo.p);
        }
        
        await new Promise(r => setTimeout(r, 600));
    };

    const handleSubmit = async () => {
        if (!user || !user.labelId) return;
        if (!formData.artworkUrl) { alert('Cover art is mandatory.'); setStep(4); return; }
        if (formData.tracks.some(t => !t.audioUrl)) { alert('Audio masters missing.'); setStep(3); return; }
        
        try {
            await simulateUpload();

            const newNotes = [...(formData.notes || [])];
            if (submissionNote.trim()) {
                newNotes.unshift({
                    id: `note-${Date.now()}`,
                    authorName: user.name,
                    authorRole: user.role,
                    message: submissionNote,
                    timestamp: new Date().toISOString()
                });
            } else if (isCorrectionFlow) {
                newNotes.unshift({
                    id: `note-${Date.now()}`,
                    authorName: user.name,
                    authorRole: user.role,
                    message: "[Label System Auto-Note]: Metadata and/or assets modified and resubmitted for re-audit.",
                    timestamp: new Date().toISOString()
                });
            }
            
            const submittedData = { 
                ...formData, 
                status: ReleaseStatus.PENDING, // Always return to Pending for re-audit
                notes: newNotes
            };

            const result = await api.addRelease({ ...submittedData, labelId: user.labelId });
            onSave(result);
            onClose();
        } catch (error) {
            alert("Submission error.");
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="py-20 flex justify-center"><Spinner /></div>;
    
    return (
        <div className="space-y-6 relative min-h-[500px]">
            {isCorrectionFlow && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                    </div>
                    <div>
                        <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Correction Mode Active</p>
                        <p className="text-[10px] text-gray-400">Fix the flagged items in the metadata below and resubmit to the QC team.</p>
                    </div>
                </div>
            )}

            {/* Cinematic Progress Overlay */}
            {isSubmitting && (
                <div className="absolute inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                    <div className="w-full max-w-sm space-y-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow"></div>
                            <div className="relative flex justify-center">
                                {uploadProgress < 100 ? (
                                    <div className="relative">
                                        <Spinner className="w-16 h-16 border-primary border-t-transparent" />
                                        <MusicIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                                    </div>
                                ) : (
                                    <CheckCircleIcon className="w-16 h-16 text-primary animate-scale-in" />
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                                {uploadProgress < 100 ? 'Deploying Catalog' : 'Sync Complete'}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase h-4">{progressStatus}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="relative h-1.5 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(29,185,84,0.6)]" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                <span>{uploadProgress}% Packed</span>
                                <span>DSP Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stepper Header */}
            <div className="flex justify-between items-center px-4 mb-8">
                {['General', 'Metadata', 'Tracks', 'Artwork', 'Review'].map((name, index) => (
                    <React.Fragment key={name}>
                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => !isSubmitting && setStep(index + 1)}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 ${
                                step > index + 1 ? 'bg-primary text-black shadow-[0_0_15px_rgba(29,185,84,0.3)]' : 
                                (step === index + 1 ? 'bg-primary text-black scale-110 shadow-lg' : 'bg-gray-800 text-gray-600')
                            }`}>
                                {step > index + 1 ? <CheckCircleIcon className="w-5 h-5" /> : index + 1}
                            </div>
                            <span className={`text-[9px] uppercase font-black tracking-widest transition-colors ${step >= index + 1 ? 'text-white' : 'text-gray-600'}`}>{name}</span>
                        </div>
                        {index < 4 && <div className={`flex-1 h-[2px] mx-4 rounded-full transition-colors duration-500 ${step > index + 1 ? 'bg-primary/50' : 'bg-gray-800'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto px-1 custom-scrollbar pr-4">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Album Title" placeholder="e.g. Midnight City" value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
                             <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Configuration</label>
                                <select 
                                    value={formData.releaseType} 
                                    onChange={e => handleChange('releaseType', e.target.value as ReleaseType)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                >
                                    {Object.values(ReleaseType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ArtistSelector label="Primary Artist(s)" allArtists={labelArtists} selectedArtistIds={formData.primaryArtistIds} onChange={(ids) => handleChange('primaryArtistIds', ids)} />
                            <ArtistSelector label="Featured Artist(s)" allArtists={labelArtists} selectedArtistIds={formData.featuredArtistIds} onChange={(ids) => handleChange('featuredArtistIds', ids)} />
                        </div>
                         <div className="relative">
                            <Textarea label="Liner Notes / Description" rows={4} placeholder="Tell the story behind this release..." value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                            <Button type="button" onClick={async () => {
                                const artist = labelArtists.find(a => a.id === formData.primaryArtistIds[0]);
                                if (!formData.title || !artist) return alert('Enter Title and Artist');
                                setIsGenerating(true);
                                const desc = await generateReleaseDescription(artist.name, formData.title);
                                handleChange('description', desc);
                                setIsGenerating(false);
                            }} disabled={isGenerating} className="absolute bottom-3 right-3 text-[10px] py-2 px-4 shadow-xl">
                                {isGenerating ? <Spinner className="h-3 w-3"/> : <><SparklesIcon className="w-3 h-3 mr-2 inline"/> AI Studio</>}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Global Launch Date" type="date" value={formData.releaseDate} onChange={e => handleChange('releaseDate', e.target.value)} />
                            <Input label="Universal Product Code (UPC)" value={formData.upc} onChange={e => handleChange('upc', e.target.value)} placeholder="Will auto-generate if blank" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input label="Primary Genre" value={formData.genre} onChange={e => handleChange('genre', e.target.value)} placeholder="Electronic" />
                            <Input label="Sub-Genre" value={formData.subGenre} onChange={e => handleChange('subGenre', e.target.value)} placeholder="Synthwave" />
                            <Input label="Mood / Vibe" value={formData.mood} onChange={e => handleChange('mood', e.target.value)} placeholder="Energetic" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input label="Original Language" value={formData.language} onChange={e => handleChange('language', e.target.value)} placeholder="English" />
                            <Input label="Catalogue Number" value={formData.catalogueNumber} onChange={e => handleChange('catalogueNumber', e.target.value)} placeholder="FS-001" />
                            <Input label="Publisher" value={formData.publisher} onChange={e => handleChange('publisher', e.target.value)} placeholder="Universal Music" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="℗ Phonographic Line" value={formData.pLine} onChange={e => handleChange('pLine', e.target.value)} placeholder="2024 Future Sound Records" />
                            <Input label="© Copyright Line" value={formData.cLine} onChange={e => handleChange('cLine', e.target.value)} placeholder="2024 Future Sound Records" />
                        </div>

                        <div className="p-6 bg-gray-800/40 rounded-2xl border border-gray-700/50 space-y-4">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Soundtrack / Film Meta</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Input label="Production Name" value={formData.filmName} onChange={e => handleChange('filmName', e.target.value)} />
                                <Input label="Director" value={formData.filmDirector} onChange={e => handleChange('filmDirector', e.target.value)} />
                                <Input label="Producer" value={formData.filmProducer} onChange={e => handleChange('filmProducer', e.target.value)} />
                                <Input label="Production Banner" value={formData.filmBanner} onChange={e => handleChange('filmBanner', e.target.value)} />
                                <Input label="Lead Cast" value={formData.filmCast} onChange={e => handleChange('filmCast', e.target.value)} />
                                <Input label="Original Movie Year" type="date" value={formData.originalReleaseDate} onChange={e => handleChange('originalReleaseDate', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-fade-in">
                        {formData.tracks.map((track, index) => (
                             <div key={track.id} className="group bg-gray-800/20 p-8 rounded-3xl border border-gray-800/60 shadow-inner space-y-8 transition-all hover:bg-gray-800/40">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-[12px] font-black text-primary border border-primary/20 shadow-lg">#{track.trackNumber}</div>
                                        <div>
                                            <h4 className="font-black text-white text-lg tracking-tight uppercase italic">Track Module</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Metadata Group {index + 1}</p>
                                        </div>
                                    </div>
                                    {formData.tracks.length > 1 && (
                                        <button 
                                            onClick={() => removeTrack(index)} 
                                            className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                        >
                                            <XCircleIcon className="w-6 h-6"/>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Pro Master Audio Strip */}
                                <div className={`border-2 border-dashed rounded-2xl px-8 py-6 relative transition-all duration-500 ${track.audioUrl ? 'bg-primary/5 border-primary/30' : 'bg-black/40 border-gray-700/40 hover:border-gray-500'}`}>
                                    {track.audioUrl ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-6 min-w-0">
                                                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-scale-in border border-primary/20 shadow-[0_0_20px_rgba(29,185,84,0.2)]">
                                                    <MusicIcon className="text-primary w-7 h-7" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white truncate font-black tracking-tight">{track.audioFileName}</p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase rounded shadow-sm">Master Quality</span>
                                                        <span className="text-gray-700">•</span>
                                                        <span className="text-[10px] text-gray-400 font-mono tracking-widest">{Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="secondary" className="text-[10px] px-5 py-3 uppercase font-black tracking-widest rounded-xl" onClick={() => handleTrackChange(index, 'audioUrl', '')}>Replace Master</Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 py-4 group/drop cursor-pointer">
                                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center transition-all group-hover/drop:scale-110 group-hover/drop:bg-primary/20">
                                                <UploadIcon className="w-6 h-6 text-gray-500 group-hover/drop:text-primary transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] text-gray-400 uppercase font-black tracking-[0.2em] group-hover/drop:text-white transition-colors">Stage High-Res WAV Master</p>
                                                <p className="text-[9px] text-gray-600 uppercase font-bold mt-1">Lossless • 44.1kHz • 16-bit Minimum</p>
                                            </div>
                                            <input type="file" accept=".wav" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleAudioSelect(f, index); }} />
                                        </div>
                                    )}
                                </div>

                                {/* Track Artist Multi-Select Group */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-6 rounded-2xl border border-gray-800">
                                    <ArtistSelector 
                                        label="Track Primary Artist(s)" 
                                        allArtists={labelArtists} 
                                        selectedArtistIds={track.primaryArtistIds} 
                                        onChange={(ids) => handleTrackChange(index, 'primaryArtistIds', ids)} 
                                    />
                                    <ArtistSelector 
                                        label="Track Featured Artist(s)" 
                                        allArtists={labelArtists} 
                                        selectedArtistIds={track.featuredArtistIds} 
                                        onChange={(ids) => handleTrackChange(index, 'featuredArtistIds', ids)} 
                                    />
                                </div>

                                {/* Refined Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-10 text-gray-500 group-focus-within/input:text-primary transition-colors">
                                            <MusicIcon className="w-4 h-4" />
                                        </div>
                                        <Input 
                                            label="Track Distribution Title" 
                                            value={track.title} 
                                            onChange={e => handleTrackChange(index, 'title', e.target.value)} 
                                            className="text-sm pl-11 h-12 rounded-xl bg-gray-900/50 border-gray-800 focus:bg-gray-900" 
                                            placeholder="e.g. Midnight City (Original Mix)"
                                        />
                                    </div>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-10 text-gray-500 group-focus-within/input:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                        </div>
                                        <Input 
                                            label="International Standard Recording Code (ISRC)" 
                                            value={track.isrc} 
                                            onChange={e => handleTrackChange(index, 'isrc', e.target.value)} 
                                            placeholder="US-XXX-XX-XXXXX" 
                                            className="text-sm font-mono pl-11 h-12 rounded-xl bg-gray-900/50 border-gray-800 focus:bg-gray-900" 
                                        />
                                    </div>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-10 text-gray-500 group-focus-within/input:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </div>
                                        <Input 
                                            label="Primary Music Composer" 
                                            value={track.composer} 
                                            onChange={e => handleTrackChange(index, 'composer', e.target.value)} 
                                            className="text-sm pl-11 h-12 rounded-xl bg-gray-900/50 border-gray-800 focus:bg-gray-900" 
                                            placeholder="Full Legal Name"
                                        />
                                    </div>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-10 text-gray-500 group-focus-within/input:text-primary transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </div>
                                        <Input 
                                            label="Lead Lyricist / Author" 
                                            value={track.lyricist} 
                                            onChange={e => handleTrackChange(index, 'lyricist', e.target.value)} 
                                            className="text-sm pl-11 h-12 rounded-xl bg-gray-900/50 border-gray-800 focus:bg-gray-900" 
                                            placeholder="Full Legal Name"
                                        />
                                    </div>
                                </div>
                             </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={addTrack}
                            className="w-full flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-gray-800 rounded-3xl hover:border-primary/40 hover:bg-primary/5 transition-all text-gray-600 hover:text-primary group/add"
                        >
                            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center group-hover/add:bg-primary group-hover/add:text-black transition-all shadow-lg">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Add More Track</span>
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-full animate-fade-in py-12">
                        {/* High Fidelity Artwork Canvas */}
                        <div className="relative w-80 h-80 border-2 border-dashed border-gray-700/50 rounded-3xl flex items-center justify-center overflow-hidden bg-black/40 shadow-2xl group transition-all hover:border-primary/40">
                            {formData.artworkUrl ? (
                                <img src={formData.artworkUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Album Cover" />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-600 group-hover:text-primary transition-colors">
                                        <UploadIcon className="h-8 w-8" />
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase font-black leading-relaxed tracking-widest">Select High-Res Cover Art</p>
                                    <p className="text-[9px] text-gray-600 uppercase font-bold mt-2">3000 x 3000px Recommended</p>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleArtworkSelect(f); }} />
                            
                            {formData.artworkUrl && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                                    <div className="text-center">
                                        <UploadIcon className="w-8 h-8 text-white mx-auto mb-2" />
                                        <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Replace Artwork</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {formData.artworkUrl && (
                            <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700/50">
                                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(29,185,84,0.8)]"></span>
                                <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">STAGED: {formData.artworkFileName}</span>
                            </div>
                        )}
                    </div>
                )}

                {step === 5 && (
                    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-8">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 rotate-3 transition-transform hover:rotate-0">
                                <SparklesIcon className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Pre-Flight Check</h3>
                                <p className="text-sm text-gray-500 mt-2">Audit all distribution parameters. Finalizing will generate the REST API payload for processing.</p>
                            </div>
                        </div>

                        {/* Audit Summary Card */}
                        <div className="bg-gray-800/40 p-6 rounded-3xl border border-gray-700/50 space-y-6">
                             <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                                <img src={formData.artworkUrl} className="w-16 h-16 rounded-xl object-cover shadow-lg border border-gray-600" alt="" />
                                <div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Target Release</p>
                                    <p className="text-lg font-black text-white">{formData.title}</p>
                                    <p className="text-[9px] text-primary font-mono">{formData.releaseType} • {formData.tracks.length} Master(s)</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-y-4 text-xs">
                                <div>
                                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">UPC / EAN</p>
                                    <p className="text-white font-mono">{formData.upc || 'AUTO-GENERATE'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Launch Date</p>
                                    <p className="text-white font-mono">{formData.releaseDate || 'ASAP'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Catalog ID</p>
                                    <p className="text-white font-mono">{formData.catalogueNumber || 'NONE'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Explicit</p>
                                    <p className="text-white font-bold">{formData.explicit ? 'YES' : 'CLEAN'}</p>
                                </div>
                             </div>

                             <div className="bg-black/20 p-4 rounded-xl space-y-2">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">Master WAV Verification</p>
                                {formData.tracks.map(t => (
                                    <div key={t.id} className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 truncate pr-4">#{t.trackNumber} {t.audioFileName}</span>
                                        <span className="text-primary font-bold">{Math.floor(t.duration/60)}:{String(t.duration%60).padStart(2,'0')}</span>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <Textarea 
                            label={isCorrectionFlow ? "Resubmission Explanation (for QC Team)" : "Instructions for QC Manager"} 
                            value={submissionNote} 
                            onChange={e => setSubmissionNote(e.target.value)} 
                            placeholder={isCorrectionFlow ? "Explain what was corrected..." : "Any specific store requests or notes?"} 
                            required={isCorrectionFlow}
                        />
                    </div>
                )}
            </div>

            {/* Sticky Footer Actions */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-800 bg-gray-900/50 -mx-6 px-6 pb-2 sticky bottom-0 backdrop-blur-md">
                <Button variant="secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting} className="px-8 font-black uppercase text-[10px] tracking-widest">
                    Previous
                </Button>
                {step < 5 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={isSubmitting} className="px-10 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                        Continue
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isSubmitting} className={`px-12 py-4 font-black uppercase text-xs tracking-widest shadow-xl ${isCorrectionFlow ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30' : 'shadow-primary/30'}`}>
                        {isCorrectionFlow ? 'Confirm Corrections & Resubmit' : 'Transmit to API'}
                    </Button>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3e3e3e; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #535353; }
                .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ReleaseForm;

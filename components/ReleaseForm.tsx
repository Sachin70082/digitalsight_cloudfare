
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Release, Track, ReleaseType, Artist, ReleaseStatus, Label } from '../types';
import { Button, Input, Textarea, Spinner } from './ui';
import { SparklesIcon, UploadIcon, XCircleIcon, MusicIcon, CheckCircleIcon } from './Icons';
import { api } from '../services/mockApi';
import { r2Service } from '../services/r2Service';
import ArtistSelector from './ArtistSelector';

interface ReleaseFormProps {
    onClose: () => void;
    onSave: (release: Release) => void;
    initialReleaseId?: string;
}

type FormData = Omit<Release, 'createdAt' | 'updatedAt'>;

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

const GENRES = ["Pop", "Hip-Hop", "Rock", "Electronic", "Classical", "Jazz", "World", "Folk", "Bollywood", "Devotional", "Regional", "Lo-Fi", "R&B"];
const MOODS = ["Happy", "Sad", "Energetic", "Relaxed", "Dark", "Romantic", "Epic", "Chill", "Aggressive"];
const LANGUAGES = ["English", "Hindi", "Punjabi", "Spanish", "French", "German", "Japanese", "Tamil", "Telugu", "Marathi", "Bengali"];

const ReleaseForm: React.FC<ReleaseFormProps> = ({ onClose, onSave, initialReleaseId }) => {
    const { user } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(!!initialReleaseId);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');

    const [submissionNote, setSubmissionNote] = useState('');
    const [labelArtists, setLabelArtists] = useState<Artist[]>([]);
    const [hierarchyLabels, setHierarchyLabels] = useState<Label[]>([]);
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
        labelId: user?.labelId || '',
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
                // Fetch hierarchical data: all artists and sub-labels in the branch
                const [artists, subLabels] = await Promise.all([
                    api.getArtistsByLabel(user.labelId),
                    api.getSubLabels(user.labelId)
                ]);
                
                setLabelArtists(artists);
                
                // Get self label for selection list
                const selfLabel = await api.getLabel(user.labelId);
                const combinedLabels = selfLabel ? [selfLabel, ...subLabels] : subLabels;
                setHierarchyLabels(combinedLabels);
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
                setFormData(prev => ({ ...prev, tracks: [emptyTrack(1)], labelId: user?.labelId || '' }));
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
            
            finalArtworkUrl = await r2Service.uploadFile(
                stagedArtwork,
                `releases/${releaseId}/artwork`,
                newArtName,
                (p) => setUploadProgress(Math.round(p * 0.2))
            );
        }

        for (let i = 0; i < updatedTracks.length; i++) {
            const file = stagedAudio[i];
            if (file) {
                const track = updatedTracks[i];
                const safeTrackTitle = sanitizeFilename(track.title || `track_${track.trackNumber}`);
                const newAudioName = `${safeTrackTitle}.wav`;
                
                setProgressStatus(`Uploading Track ${track.trackNumber}...`);
                
                const totalAudioSteps = 80;
                const trackWeight = totalAudioSteps / updatedTracks.length;
                const currentTrackBase = 20 + (i * trackWeight);

                const audioUrl = await r2Service.uploadFile(
                    file,
                    `releases/${releaseId}/audio/${track.id}`,
                    newAudioName,
                    (p) => {
                        const trackProgress = (p / 100) * trackWeight;
                        setUploadProgress(Math.round(currentTrackBase + trackProgress));
                    }
                );

                updatedTracks[i].audioUrl = audioUrl;
                updatedTracks[i].audioFileName = newAudioName;
            }
        }

        setProgressStatus('Finalizing Entry...');
        setUploadProgress(100);
        return { artworkUrl: finalArtworkUrl, tracks: updatedTracks };
    };

    const handleAction = async (isSubmission: boolean) => {
        if (!user || !user.labelId) return;
        if (!formData.title) { alert('Title is mandatory.'); setStep(1); return; }
        if (!formData.labelId) { alert('Target Label is mandatory.'); setStep(1); return; }
        
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

            const result = await api.addRelease(finalData);
            onSave(result);
            onClose();
        } catch (error: any) {
            alert("Transmission Error: " + error.message);
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="py-20 flex justify-center"><Spinner /></div>;

    const canSubmit = user?.permissions?.canSubmitAlbums || user?.role === 'Owner' || user?.role === 'Employee';
    const showLabelSelector = hierarchyLabels.length > 1;
    
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
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Identity Meta</h3>
                        
                        {showLabelSelector && (
                            <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                <label className="block text-[11px] font-black text-primary uppercase tracking-widest mb-2">Publishing Entity (Branch Hierarchy)</label>
                                <select 
                                    value={formData.labelId} 
                                    onChange={e => handleChange('labelId', e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                                >
                                    {hierarchyLabels.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.id === user?.labelId ? `[MASTER] ${l.name}` : `↳ [CHILD] ${l.name}`}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Select which label branch this metadata and revenue should be synchronized with.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Session Title" placeholder="e.g. Neon Nights" value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
                             <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Release Configuration</label>
                                <select 
                                    value={formData.releaseType} 
                                    onChange={e => handleChange('releaseType', e.target.value as ReleaseType)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary transition-all"
                                >
                                    {Object.values(ReleaseType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ArtistSelector label="Primary Node(s) - Entire Branch" allArtists={labelArtists} selectedArtistIds={formData.primaryArtistIds || []} onChange={(ids) => handleChange('primaryArtistIds', ids)} />
                            <ArtistSelector label="Featured Node(s) - Entire Branch" allArtists={labelArtists} selectedArtistIds={formData.featuredArtistIds || []} onChange={(ids) => handleChange('featuredArtistIds', ids)} />
                        </div>
                         <div className="relative">
                            <Textarea label="Production Description" rows={4} placeholder="Describe this session..." value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Commercial Meta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Universal Product Code (UPC)" placeholder="Leave blank for auto-generation" value={formData.upc} onChange={e => handleChange('upc', e.target.value)} />
                            <Input label="Internal Catalogue #" placeholder="e.g. LAB-001" value={formData.catalogueNumber} onChange={e => handleChange('catalogueNumber', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input label="Release Window" type="date" value={formData.releaseDate} onChange={e => handleChange('releaseDate', e.target.value)} />
                            <Input label="P-Line (Phonographic)" placeholder="e.g. 2024 DigitalSight Records" value={formData.pLine} onChange={e => handleChange('pLine', e.target.value)} />
                            <Input label="C-Line (Copyright)" placeholder="e.g. 2024 DigitalSight Records" value={formData.cLine} onChange={e => handleChange('cLine', e.target.value)} />
                        </div>
                        <Input label="Music Publisher" placeholder="Company Name" value={formData.publisher} onChange={e => handleChange('publisher', e.target.value)} />
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Categorization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Primary Genre</label>
                                <select value={formData.genre} onChange={e => handleChange('genre', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white outline-none">
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <Input label="Sub-Genre" placeholder="e.g. Trap, Melodic" value={formData.subGenre} onChange={e => handleChange('subGenre', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Core Mood</label>
                                <select value={formData.mood} onChange={e => handleChange('mood', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white outline-none">
                                    {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Original Language</label>
                                <select value={formData.language} onChange={e => handleChange('language', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white outline-none">
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-gray-700">
                            <input type="checkbox" id="explicit_all" checked={formData.explicit} onChange={e => handleChange('explicit', e.target.checked)} className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-primary focus:ring-primary" />
                            <label htmlFor="explicit_all" className="text-xs font-black uppercase text-gray-400 tracking-widest cursor-pointer">Mark entire session as Explicit (Parental Advisory)</label>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Production / Film Sync</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Production Title" placeholder="Film or Series Name" value={formData.filmName} onChange={e => handleChange('filmName', e.target.value)} />
                            <Input label="Production Director" value={formData.filmDirector} onChange={e => handleChange('filmDirector', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Lead Producer" value={formData.filmProducer} onChange={e => handleChange('filmProducer', e.target.value)} />
                            <Input label="Studio / Banner" value={formData.filmBanner} onChange={e => handleChange('filmBanner', e.target.value)} />
                        </div>
                        <Input label="Star Cast" placeholder="Separate with commas" value={formData.filmCast} onChange={e => handleChange('filmCast', e.target.value)} />
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-bold text-white uppercase tracking-tight">Track Architecture</h3>
                             <Button onClick={addTrack} variant="secondary" className="text-[10px] py-2 font-black uppercase tracking-widest px-6">Add Segment</Button>
                        </div>
                        {(formData.tracks || []).map((track, index) => (
                             <div key={track.id} className="group bg-gray-800/30 p-8 rounded-[2rem] border border-gray-800 hover:border-gray-700 transition-all space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary border border-primary/20">#{track.trackNumber}</div>
                                    {formData.tracks && formData.tracks.length > 1 && (
                                        <button onClick={() => removeTrack(index)} className="text-gray-600 hover:text-red-500 transition-colors p-2"><XCircleIcon className="w-6 h-6"/></button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Track Title" required value={track.title} onChange={e => handleTrackChange(index, 'title', e.target.value)} />
                                    <Input label="Version / Remix Title" placeholder="e.g. Radio Edit" value={track.versionTitle} onChange={e => handleTrackChange(index, 'versionTitle', e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input label="ISRC Code" placeholder="Leave blank to generate" value={track.isrc} onChange={e => handleTrackChange(index, 'isrc', e.target.value)} />
                                    <Input label="Composer" placeholder="Full Legal Name" value={track.composer} onChange={e => handleTrackChange(index, 'composer', e.target.value)} />
                                    <Input label="Lyricist" placeholder="Full Legal Name" value={track.lyricist} onChange={e => handleTrackChange(index, 'lyricist', e.target.value)} />
                                </div>

                                <div className={`border-2 border-dashed rounded-[1.5rem] p-8 relative transition-all ${track.audioUrl ? 'bg-primary/5 border-primary/20' : 'bg-black/20 border-gray-700 hover:border-primary/30'}`}>
                                    {track.audioUrl && track.audioUrl !== 'staged' ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg">
                                                    <MusicIcon className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-sm text-white font-bold truncate block">{track.audioFileName}</span>
                                                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')} • Master Recorded</span>
                                                </div>
                                            </div>
                                            <Button variant="secondary" className="text-[9px] py-2 uppercase font-black" onClick={() => handleTrackChange(index, 'audioUrl', '')}>Replace</Button>
                                        </div>
                                    ) : track.audioUrl === 'staged' ? (
                                        <div className="flex flex-col items-center gap-2 text-primary py-4">
                                            <UploadIcon className="w-8 h-8 animate-bounce" />
                                            <span className="text-xs font-black uppercase tracking-widest">Binary Locked & Ready for Sync</span>
                                            <p className="text-[9px] text-gray-500 font-mono">{track.audioFileName}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <UploadIcon className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                                            <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.2em]">Select 44.1kHz WAV Master</p>
                                            <p className="text-[9px] text-gray-700 mt-2 font-medium">Click or drag source file here</p>
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
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Artwork Ingestion</h3>
                        <p className="text-gray-500 mb-10 text-sm font-medium">Minimum 3000 x 3000px • RGB Color Space • JPEG/PNG</p>
                        
                        <div className="relative w-80 h-80 border-4 border-dashed border-gray-800 rounded-[3rem] flex items-center justify-center overflow-hidden bg-black/40 group hover:border-primary/40 transition-all shadow-2xl">
                            {formData.artworkUrl ? (
                                <div className="relative w-full h-full">
                                    <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : formData.artworkUrl} className="w-full h-full object-cover" alt="Cover Art" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">Click to Replace</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <UploadIcon className="h-8 w-8 text-gray-500" />
                                    </div>
                                    <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest">Select Original Art</p>
                                    <p className="text-[9px] text-gray-700 mt-2">Max 10MB</p>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleArtworkSelect(f); }} />
                        </div>
                    </div>
                )}

                {step === 7 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-primary/10 p-8 rounded-[2.5rem] border border-primary/20 flex flex-col md:flex-row items-center gap-8 shadow-xl">
                            <div className="w-40 h-40 rounded-[2rem] overflow-hidden shadow-2xl flex-shrink-0 bg-black border border-white/5">
                                <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : (formData.artworkUrl || '')} className="w-full h-full object-cover" loading="lazy" alt="" />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{formData.title || 'Untitled Session'}</h3>
                                <p className="text-sm text-primary font-black uppercase tracking-[0.2em]">{formData.releaseType} • {(formData.tracks || []).length} Segments</p>
                                <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 bg-black/40 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest border border-white/5">Genre: {formData.genre}</span>
                                    <span className="px-3 py-1 bg-black/40 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest border border-white/5">Go Live: {formData.releaseDate}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                             <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Journal Memo for Ingest Auditors</label>
                             <Textarea placeholder="Provide technical context or special requests for the quality control team..." value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} rows={4} className="rounded-[1.5rem] bg-black/40 border-gray-800" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-800 bg-gray-900/50 -mx-6 px-8 pb-4 sticky bottom-0 backdrop-blur-md rounded-b-3xl z-[50]">
                <Button variant="secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting} className="px-10 font-black uppercase text-[10px] tracking-[0.2em]">Previous</Button>
                {step < 7 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={isSubmitting} className="px-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20">Next Section</Button>
                ) : (
                    <div className="flex gap-4">
                        <Button onClick={() => handleAction(false)} variant="secondary" disabled={isSubmitting} className="px-10 py-4 font-black uppercase text-[10px] tracking-[0.2em]">Lock as Draft</Button>
                        {canSubmit ? (
                            <Button onClick={() => handleAction(true)} disabled={isSubmitting} className="px-14 py-4 font-black uppercase text-xs tracking-[0.25em] shadow-[0_0_40px_-10px_rgba(29,185,84,0.6)]">
                                Execute Ingest
                            </Button>
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-yellow-500 font-black uppercase tracking-[0.2em] mb-1">Authorization Required</span>
                                <Button disabled className="px-14 py-4 font-black uppercase text-xs opacity-50 cursor-not-allowed">Ingest Locked</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReleaseForm;

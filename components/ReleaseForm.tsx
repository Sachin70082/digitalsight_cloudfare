
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Release, Track, ReleaseType, Artist, ReleaseStatus, Label, UserRole } from '../types';
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
const LANGUAGES = [
  "English",
  "Hindi",
  "Punjabi",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Tamil",
  "Telugu",
  "Marathi",
  "Bengali",
  "Odia (Oriya)",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Assamese",
  "Urdu",
  "Sanskrit",
  "Konkani",
  "Manipuri (Meitei)",
  "Nepali",
  "Bodo",
  "Santhali",
  "Maithili",
  "Kashmiri",
  "Dogri",
  "Sindhi",
  "Rajasthani",
  "Chhattisgarhi",
  "Bhojpuri",
  "Haryanvi",
  "Magahi",
  "Tulu",
  "Kodava (Coorgi)"
];


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
        notes: [],
        youtubeContentId: false
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (user?.labelId) {
                const [artists, subLabels] = await Promise.all([
                    api.getArtistsByLabel(user.labelId),
                    api.getSubLabels(user.labelId)
                ]);
                setLabelArtists(artists);
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
            finalArtworkUrl = await r2Service.uploadFile(stagedArtwork, `releases/${releaseId}/artwork`, newArtName, (p) => setUploadProgress(Math.round(p * 0.2)));
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
                const audioUrl = await r2Service.uploadFile(file, `releases/${releaseId}/audio/${track.id}`, newAudioName, (p) => {
                    const trackProgress = (p / 100) * trackWeight;
                    setUploadProgress(Math.round(currentTrackBase + trackProgress));
                });
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
                newNotes.unshift({ id: `note-${Date.now()}`, authorName: user.name, authorRole: user.role, message: submissionNote, timestamp: new Date().toISOString() });
            } else if (isSubmission && formData.status === ReleaseStatus.NEEDS_INFO) {
                // Automatically add a note if resubmitting from a correction request without a custom note
                newNotes.unshift({ 
                    id: `note-${Date.now()}`, 
                    authorName: user.name, 
                    authorRole: user.role, 
                    message: "Resubmitted for review after corrections.", 
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
            const result = initialReleaseId 
                ? await api.updateRelease(initialReleaseId, finalData)
                : await api.addRelease(finalData);
            onSave(result);
            onClose();
        } catch (error: any) {
            alert("Transmission Error: " + error.message);
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="py-10 flex justify-center"><Spinner /></div>;

    const canSubmit = user?.permissions?.canSubmitAlbums || user?.role === 'Owner' || user?.role === 'Employee';
    const showLabelSelector = hierarchyLabels.length > 1;
    
    const latestAdminNote = formData.notes
        ? [...formData.notes]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .find(n => n.authorRole === UserRole.OWNER || n.authorRole === UserRole.EMPLOYEE)
        : null;

    return (
        <div className="space-y-8 relative">
            {isSubmitting && (
                <div className="absolute inset-0 z-[100] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-fade-in rounded-2xl">
                    <div className="w-full max-w-xs space-y-6">
                        <div className="relative">
                            <Spinner className="w-12 h-12 border-primary border-t-transparent mx-auto" />
                            <MusicIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vault Sync</h3>
                            <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase truncate">{progressStatus}</p>
                        </div>
                        <div className="relative h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center px-2 mb-6 overflow-x-auto pb-4 custom-scrollbar">
                {['General', 'Commercial', 'Genre', 'Film', 'Tracks', 'Artwork', 'Review'].map((name, index) => (
                    <React.Fragment key={name}>
                        <div className="flex flex-col items-center gap-2 cursor-pointer min-w-[60px]" onClick={() => !isSubmitting && setStep(index + 1)}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all duration-300 ${
                                step > index + 1 ? 'bg-primary text-black' : 
                                (step === index + 1 ? 'bg-primary text-black scale-105' : 'bg-white/5 text-gray-600 border border-white/5')
                            }`}>
                                {step > index + 1 ? '✓' : index + 1}
                            </div>
                            <span className={`text-[7px] uppercase font-black tracking-widest ${step >= index + 1 ? 'text-white' : 'text-gray-600'}`}>{name}</span>
                        </div>
                        {index < 6 && <div className={`flex-1 h-[1px] min-w-[15px] mx-2 ${step > index + 1 ? 'bg-primary/50' : 'bg-white/5'}`}></div>}
                    </React.Fragment>
                ))}
            </div>

            {formData.status === ReleaseStatus.NEEDS_INFO && latestAdminNote && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Correction Directive</h4>
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed italic">
                        "{latestAdminNote.message}"
                    </p>
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-3">
                        Issued by {latestAdminNote.authorName} ({latestAdminNote.authorRole}) • {new Date(latestAdminNote.timestamp).toLocaleString()}
                    </p>
                </div>
            )}
            
            <div className="space-y-8 pb-6">
                {step === 1 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Album Meta</h3>
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Core session identification.</p>
                        </div>
                        
                        {showLabelSelector && (
                            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                                <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">Publishing Entity</label>
                                <select 
                                    value={formData.labelId} 
                                    onChange={e => handleChange('labelId', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {hierarchyLabels.map(l => (
                                        <option key={l.id} value={l.id} className="bg-gray-900">
                                            {l.id === user?.labelId ? `[MASTER] ${l.name}` : `↳ [CHILD] ${l.name}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Album Title" placeholder="e.g. Neon Nights" value={formData.title} onChange={e => handleChange('title', e.target.value)} required className="h-12" />
                             <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Album Type</label>
                                <select 
                                    value={formData.releaseType} 
                                    onChange={e => handleChange('releaseType', e.target.value as ReleaseType)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer h-12"
                                >
                                    {Object.values(ReleaseType).map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ArtistSelector label="Primary Artist(s)" allArtists={labelArtists} selectedArtistIds={formData.primaryArtistIds || []} onChange={(ids) => handleChange('primaryArtistIds', ids)} />
                            <ArtistSelector label="Featured Artist(s)" allArtists={labelArtists} selectedArtistIds={formData.featuredArtistIds || []} onChange={(ids) => handleChange('featuredArtistIds', ids)} />
                        </div>
                         <div className="relative">
                            <Textarea label="Description" rows={4} placeholder="Describe this session..." value={formData.description} onChange={e => handleChange('description', e.target.value)} className="text-sm" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Commercial Meta</h3>
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Legal and distribution identifiers.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="UPC Code" placeholder="Auto-generate if blank" value={formData.upc} onChange={e => handleChange('upc', e.target.value)} className="h-12" />
                            <Input label="Catalogue #" placeholder="e.g. LAB-001" value={formData.catalogueNumber} onChange={e => handleChange('catalogueNumber', e.target.value)} className="h-12" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input label="Release Date" type="date" value={formData.releaseDate} onChange={e => handleChange('releaseDate', e.target.value)} className="h-12" />
                            <Input label="P-Line" placeholder="e.g. 2024 DigitalSight" value={formData.pLine} onChange={e => handleChange('pLine', e.target.value)} className="h-12" />
                            <Input label="C-Line" placeholder="e.g. 2024 DigitalSight" value={formData.cLine} onChange={e => handleChange('cLine', e.target.value)} className="h-12" />
                        </div>
                        <Input label="Publisher" placeholder="Company Name" value={formData.publisher} onChange={e => handleChange('publisher', e.target.value)} className="h-12" />
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Categorization</h3>
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Genre and mood classification.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Primary Genre</label>
                                <select value={formData.genre} onChange={e => handleChange('genre', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer h-12">
                                    {GENRES.map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
                                </select>
                            </div>
                            <Input label="Sub-Genre" placeholder="e.g. Trap, Melodic" value={formData.subGenre} onChange={e => handleChange('subGenre', e.target.value)} className="h-12" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Core Mood</label>
                                <select value={formData.mood} onChange={e => handleChange('mood', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer h-12">
                                    {MOODS.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                                </select>
                            </div>
                             <div className="space-y-1.5">
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Language</label>
                                <select value={formData.language} onChange={e => handleChange('language', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer h-12">
                                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6 bg-black/40 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" id="explicit_all" checked={formData.explicit} onChange={e => handleChange('explicit', e.target.checked)} className="peer appearance-none w-6 h-6 rounded-lg bg-black/40 border-2 border-white/10 checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                                <svg className="absolute w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <label htmlFor="explicit_all" className="text-xs font-black uppercase text-gray-400 tracking-widest cursor-pointer group-hover:text-white transition-colors">Mark as Explicit</label>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Film Sync</h3>
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Cinematic metadata.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Production Title" placeholder="Film or Series" value={formData.filmName} onChange={e => handleChange('filmName', e.target.value)} className="h-12" />
                            <Input label="Director" value={formData.filmDirector} onChange={e => handleChange('filmDirector', e.target.value)} className="h-12" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Producer" value={formData.filmProducer} onChange={e => handleChange('filmProducer', e.target.value)} className="h-12" />
                            <Input label="Studio" value={formData.filmBanner} onChange={e => handleChange('filmBanner', e.target.value)} className="h-12" />
                        </div>
                        <Input label="Star Cast" placeholder="Separate with commas" value={formData.filmCast} onChange={e => handleChange('filmCast', e.target.value)} className="h-12" />
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-end border-l-4 border-primary pl-4">
                             <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Tracklist</h3>
                                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">Binary asset mapping.</p>
                             </div>
                             <Button onClick={addTrack} variant="secondary" className="text-[8px] py-2 font-black uppercase tracking-widest px-6 rounded-lg border-white/10">Add Track</Button>
                        </div>
                        <div className="space-y-6">
                            {(formData.tracks || []).map((track, index) => (
                                <div key={track.id} className="group bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all duration-300 space-y-6 relative overflow-hidden">
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/20">#{track.trackNumber}</div>
                                        {formData.tracks && formData.tracks.length > 1 && (
                                            <button onClick={() => removeTrack(index)} className="text-gray-600 hover:text-red-500 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"><XCircleIcon className="w-5 h-5"/></button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                        <Input label="Track Title" required value={track.title} onChange={e => handleTrackChange(index, 'title', e.target.value)} className="h-12" />
                                        <Input label="Version" placeholder="e.g. Radio Edit" value={track.versionTitle} onChange={e => handleTrackChange(index, 'versionTitle', e.target.value)} className="h-12" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                        <Input label="ISRC" placeholder="Auto-generate" value={track.isrc} onChange={e => handleTrackChange(index, 'isrc', e.target.value)} className="h-12" />
                                        <Input label="Composer" placeholder="Legal Name" value={track.composer} onChange={e => handleTrackChange(index, 'composer', e.target.value)} className="h-12" />
                                        <Input label="Lyricist" placeholder="Legal Name" value={track.lyricist} onChange={e => handleTrackChange(index, 'lyricist', e.target.value)} className="h-12" />
                                    </div>

                                    <div className={`border-2 border-dashed rounded-xl p-6 relative transition-all duration-300 z-10 ${track.audioUrl ? 'bg-primary/5 border-primary/30' : 'bg-black/40 border-white/10 hover:border-primary/40'}`}>
                                        {track.audioUrl && track.audioUrl !== 'staged' ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg">
                                                        <MusicIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm text-white font-bold truncate block uppercase tracking-tight">{track.audioFileName}</span>
                                                        <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] mt-0.5 block">{Math.floor(track.duration/60)}:{String(track.duration%60).padStart(2,'0')} • WAV MASTER</span>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" className="text-[8px] py-2 px-4 uppercase font-black rounded-lg border-white/10" onClick={() => handleTrackChange(index, 'audioUrl', '')}>Replace</Button>
                                            </div>
                                        ) : track.audioUrl === 'staged' ? (
                                            <div className="flex flex-col items-center gap-2 text-primary py-2">
                                                <UploadIcon className="w-6 h-6 animate-bounce" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ready for Sync</span>
                                                <p className="text-[8px] text-gray-500 font-mono uppercase">{track.audioFileName}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 group/upload cursor-pointer">
                                                <UploadIcon className="h-6 w-6 text-gray-500 mx-auto mb-2 group-hover/upload:text-primary transition-colors" />
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] group-hover:text-white transition-colors">Select WAV Master</p>
                                                <input type="file" accept=".wav" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleAudioSelect(f, index); }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="flex flex-col items-center justify-center animate-fade-in py-6">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Artwork</h3>
                            <p className="text-gray-500 mt-1 text-[9px] font-bold uppercase tracking-widest">3000 x 3000px • JPEG/PNG</p>
                        </div>
                        
                        <div className="relative w-64 h-64 border-4 border-dashed border-white/10 rounded-2xl flex items-center justify-center overflow-hidden bg-black/40 group hover:border-primary/40 transition-all duration-300 shadow-xl">
                            {formData.artworkUrl ? (
                                <div className="relative w-full h-full">
                                    <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : formData.artworkUrl} className="w-full h-full object-cover" alt="Cover Art" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] bg-primary text-black px-4 py-2 rounded-full">Replace</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-6">
                                    <UploadIcon className="h-8 w-8 text-gray-500 group-hover:text-primary transition-colors mx-auto mb-4" />
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Select Art</p>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleArtworkSelect(f); }} />
                        </div>

                        <div className="mt-10 w-full max-w-md">
                            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-primary/30 transition-all group shadow-xl">
                                <label className="flex items-center gap-4 cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" checked={formData.youtubeContentId} onChange={(e) => handleChange('youtubeContentId', e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-white/10 rounded-lg bg-black/40 checked:bg-primary checked:border-primary transition-all" />
                                        <svg className="absolute w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">YouTube Content ID</span>
                                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Enable digital fingerprinting protection</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 7 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                            <div className="w-32 h-32 rounded-xl overflow-hidden shadow-xl flex-shrink-0 bg-black border border-white/10 relative z-10">
                                <img src={stagedArtwork ? URL.createObjectURL(stagedArtwork) : (formData.artworkUrl || '')} className="w-full h-full object-cover" loading="lazy" alt="" />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{formData.title || 'Untitled Session'}</h3>
                                <p className="text-sm text-primary font-black uppercase tracking-[0.2em]">{formData.releaseType} • {(formData.tracks || []).length} Segments</p>
                                <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 bg-black/40 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest border border-white/5">{formData.genre}</span>
                                    <span className="px-3 py-1 bg-black/40 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest border border-white/5">{formData.releaseDate}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Journal Memo</label>
                             <Textarea placeholder="Technical context for auditors..." value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} rows={4} className="rounded-xl bg-black/40 border-white/10 p-4 text-sm" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/5 bg-gray-900 -mx-8 px-8 pb-2">
                <Button variant="secondary" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting} className="px-8 py-3 font-black uppercase text-[9px] tracking-[0.2em] rounded-lg">Previous</Button>
                {step < 7 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={isSubmitting} className="px-10 py-3 font-black uppercase text-[9px] tracking-[0.2em] shadow-lg shadow-primary/20 rounded-lg">Next Section</Button>
                ) : (
                    <div className="flex gap-4">
                        <Button onClick={() => handleAction(false)} variant="secondary" disabled={isSubmitting} className="px-8 py-4 font-black uppercase text-[9px] tracking-[0.2em] rounded-lg border-white/10">Draft</Button>
                        {canSubmit ? (
                            <Button onClick={() => handleAction(true)} disabled={isSubmitting} className="px-12 py-4 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/30 rounded-lg">
                                Execute Ingest
                            </Button>
                        ) : (
                            <Button disabled className="px-12 py-4 font-black uppercase text-[10px] opacity-40 cursor-not-allowed rounded-lg">Ingest Locked</Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReleaseForm;

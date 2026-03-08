import React, { useState, useEffect } from 'react';
import { Track, UserRole } from '../types';
import { Spinner, Button } from './ui';
import { CheckCircleIcon, XCircleIcon, SparklesIcon, SpotifyIcon } from './Icons';
import { AppContext } from '../App';
import { acrCloudService } from '../services/acrCloudService';

interface AcrResult {
    status: 'pending' | 'loading' | 'success' | 'error';
    data?: any;
    error?: string;
    startTime?: number;
    endTime?: number;
    segmentResults?: any[];
}

interface AcrCloudRecognitionProps {
    tracks: Track[];
}

export const AcrCloudRecognition: React.FC<AcrCloudRecognitionProps> = ({ tracks }) => {
    const { user } = React.useContext(AppContext);
    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
    
    const [results, setResults] = useState<Record<string, AcrResult>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const scanTrack = async (track: Track) => {
        setResults(prev => ({
            ...prev,
            [track.id]: { ...prev[track.id], status: 'loading', startTime: Date.now() }
        }));

        try {
            // Scan Segment 1: 0-15s
            let res1: any = { status: { code: -1, msg: 'Failed' } };
            try {
                res1 = await acrCloudService.identifyTrack(track.audioUrl, 0, 15);
            } catch (e) {
                console.error(`Segment 1 failed for ${track.title}`, e);
            }
            
            // Scan Segment 2: 30-55s
            let res2: any = { status: { code: -1, msg: 'Failed' } };
            try {
                res2 = await acrCloudService.identifyTrack(track.audioUrl, 30, 25);
            } catch (e) {
                console.error(`Segment 2 failed for ${track.title}`, e);
            }

            const bestResult = res1.status.code === 0 ? res1 : (res2.status.code === 0 ? res2 : res1);

            setResults(prev => ({
                ...prev,
                [track.id]: { 
                    status: 'success', 
                    data: bestResult, 
                    segmentResults: [res1, res2],
                    endTime: Date.now() 
                }
            }));
        } catch (err) {
            setResults(prev => ({
                ...prev,
                [track.id]: { 
                    status: 'error', 
                    error: 'Recognition failed', 
                    endTime: Date.now() 
                }
            }));
        }
    };

    const startScan = async () => {
        setIsScanning(true);
        for (const track of tracks) {
            await scanTrack(track);
        }
        setIsScanning(false);
    };

    useEffect(() => {
        const initialResults: Record<string, AcrResult> = {};
        tracks.forEach(t => {
            initialResults[t.id] = { status: 'pending' };
        });
        setResults(initialResults);
    }, [tracks]);

    if (!isConfirmed) {
        return (
            <div className={isPlatformSide ? "p-8 text-center space-y-6 bg-white border border-[#aaa] rounded" : "p-12 text-center space-y-8 bg-black/20 rounded-[2rem] border border-white/5"}>
                <div className={isPlatformSide ? "w-16 h-16 bg-[#ffffcc] border border-[#cc9] rounded-full flex items-center justify-center mx-auto" : "w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto"}>
                    <SparklesIcon className={isPlatformSide ? "w-8 h-8 text-[#856404]" : "w-12 h-12 text-yellow-500"} />
                </div>
                <div className="space-y-3">
                    <h3 className={isPlatformSide ? "text-sm font-black uppercase text-[#333]" : "text-3xl font-black text-white uppercase tracking-tighter"}>Billing Confirmation</h3>
                    <p className={isPlatformSide ? "text-[11px] text-[#666] font-bold" : "text-gray-400 text-sm font-medium"}>
                        per 1 track scan billing taking approx 2 INR , so r u sure to scan ?
                    </p>
                </div>
                <div className="flex gap-4 justify-center pt-6">
                    <Button 
                        onClick={() => setIsConfirmed(true)} 
                        className={isPlatformSide 
                            ? "px-8 py-2 text-xs bg-[#0066cc] text-white border-none shadow-md hover:shadow-lg transition-all rounded font-bold uppercase" 
                            : "px-12 py-4 bg-primary text-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all font-black uppercase tracking-widest text-xs"
                        }
                    >
                        Yes, I'm sure
                    </Button>
                </div>
            </div>
        );
    }

    const containerClass = isPlatformSide ? "space-y-4 font-sans text-black" : "space-y-6";
    const itemClass = isPlatformSide 
        ? "bg-white border border-[#aaa] rounded shadow-sm overflow-hidden" 
        : "bg-white/5 rounded-2xl border border-white/5 overflow-hidden";
    const headerClass = isPlatformSide 
        ? "p-2 bg-[#f5f5f5] border-b border-[#aaa] flex items-center justify-between gap-4" 
        : "p-4 flex items-center justify-between gap-4";
    const detailClass = isPlatformSide 
        ? "p-2 bg-white border-t border-[#eee]" 
        : "px-4 pb-4 pt-0 border-t border-white/5 bg-black/20";

    return (
        <div className={containerClass}>
            <div className={`flex flex-col md:flex-row justify-between items-center gap-6 mb-8 p-6 ${isPlatformSide ? 'bg-[#f9f9f9] border border-[#ddd] rounded' : 'bg-white/5 rounded-[2rem] border border-white/10'}`}>
                <div className="text-center md:text-left">
                    <h3 className={isPlatformSide ? "text-sm font-black uppercase text-[#333]" : "text-2xl font-black text-white uppercase tracking-tighter"}>
                        ACR Cloud Audio Recognition
                    </h3>
                    <p className={isPlatformSide ? "text-[10px] text-[#666] mt-1" : "text-xs text-gray-500 uppercase font-bold tracking-[0.2em] mt-2"}>
                        Scanning {tracks.length} tracks for fingerprint matches
                    </p>
                </div>
                {!isScanning && (
                    <Button 
                        onClick={startScan} 
                        className={isPlatformSide 
                            ? "px-6 py-2 text-xs bg-gradient-to-r from-[#0066cc] to-[#004499] text-white border-none shadow-md hover:shadow-lg transition-all rounded" 
                            : "flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all group"
                        }
                    >
                        <SparklesIcon className={isPlatformSide ? "w-4 h-4" : "w-6 h-6 group-hover:rotate-12 transition-transform"} />
                        <span className={isPlatformSide ? "font-bold uppercase tracking-wider" : "text-sm font-black uppercase tracking-[0.1em]"}>
                            {(Object.values(results) as AcrResult[]).some(r => r.status !== 'pending') ? 'Restart Album Scan' : 'Start Full Album Scan'}
                        </span>
                    </Button>
                )}
                {isScanning && (
                    <div className="flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                        <Spinner className="w-6 h-6 border-primary" />
                        <span className="text-sm font-black text-primary uppercase tracking-widest animate-pulse">Scan in Progress...</span>
                    </div>
                )}
            </div>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                {tracks.map((track) => {
                    const result = results[track.id];
                    const duration = result?.endTime && result?.startTime ? ((result.endTime - result.startTime) / 1000).toFixed(1) : null;

                    return (
                        <div key={track.id} className={itemClass}>
                            <div className={headerClass}>
                                <div className="flex items-center gap-3">
                                    <div className={isPlatformSide 
                                        ? "w-6 h-6 bg-[#eee] border border-[#ccc] flex items-center justify-center text-[10px] font-bold" 
                                        : "w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-xs font-bold text-gray-500 border border-white/5"
                                    }>
                                        {track.trackNumber}
                                    </div>
                                    <div>
                                        <p className={isPlatformSide ? "text-[11px] font-bold" : "text-sm font-bold text-white truncate max-w-[200px]"}>
                                            {track.title}
                                        </p>
                                        <p className={isPlatformSide ? "text-[9px] font-mono" : "text-[10px] text-gray-500 font-mono uppercase tracking-tighter"}>
                                            {track.isrc}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {result?.status === 'loading' && (
                                        <div className="flex items-center gap-2">
                                            <Spinner className="w-3 h-3 border-primary" />
                                            <span className={isPlatformSide ? "text-[10px] font-bold text-[#0066cc]" : "text-[10px] text-primary font-black uppercase tracking-widest animate-pulse"}>
                                                Scanning Segments...
                                            </span>
                                        </div>
                                    )}
                                    {result?.status === 'success' && result.segmentResults && (
                                        <div className="flex gap-4">
                                            {result.segmentResults.map((seg: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1">
                                                    {seg.status.code === 0 ? (
                                                        <CheckCircleIcon className={`w-4 h-4 ${isPlatformSide ? 'text-[#006600]' : 'text-green-500'}`} />
                                                    ) : (
                                                        <XCircleIcon className={`w-4 h-4 ${isPlatformSide ? 'text-[#666]' : 'text-gray-500'}`} />
                                                    )}
                                                    <span className={`text-[9px] font-bold uppercase ${isPlatformSide ? 'text-[#333]' : 'text-gray-400'}`}>
                                                        {idx === 0 ? '0-15s' : '30-55s'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {result?.status === 'error' && (
                                        <div className={`flex items-center gap-1 ${isPlatformSide ? 'text-[#cc0000]' : 'text-red-500'}`}>
                                            <XCircleIcon className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Failed</span>
                                        </div>
                                    )}
                                    {result?.status === 'pending' && (
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Waiting</span>
                                    )}
                                </div>
                            </div>

                            {result?.status === 'success' && result.data?.status?.code === 0 && result.data.metadata?.music?.[0] && (
                                <div className={detailClass}>
                                    <div className={`grid grid-cols-2 gap-x-4 gap-y-2 ${isPlatformSide ? 'mt-2' : 'mt-4'}`}>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Matched Title</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].title}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Matched Artist</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].artists?.map((a: any) => a.name).join(', ') || '-'}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Matched Album</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].album?.name || '-'}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Matched ISRC</p>
                                            <p className={isPlatformSide ? "text-[10px] font-mono" : "text-xs text-white font-mono"}>
                                                {result.data.metadata.music[0].external_ids?.isrc ? (
                                                    <a href={`https://isrcsearch.ifpi.org/#!/search?isrcCode=${result.data.metadata.music[0].external_ids.isrc}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        {result.data.metadata.music[0].external_ids.isrc}
                                                    </a>
                                                ) : '-'}
                                            </p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Confidence Score</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].score}%</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Label</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].label || '-'}</p>
                                        </div>
                                        {result.data.metadata.music[0].external_metadata?.spotify?.track?.id && (
                                            <div className="space-y-0.5">
                                                <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Spotify</p>
                                                <a 
                                                    href={`https://open.spotify.com/track/${result.data.metadata.music[0].external_metadata.spotify.track.id}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[#1DB954] hover:underline text-[10px] font-bold"
                                                >
                                                    <SpotifyIcon className="w-3 h-3" />
                                                    View on Spotify
                                                </a>
                                            </div>
                                        )}
                                        {result.data.metadata.music[0].external_metadata?.youtube?.vid && (
                                            <div className="space-y-0.5">
                                                <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>YouTube</p>
                                                <a 
                                                    href={`https://www.youtube.com/watch?v=${result.data.metadata.music[0].external_metadata.youtube.vid}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[#FF0000] hover:underline text-[10px] font-bold"
                                                >
                                                    View on YouTube
                                                </a>
                                            </div>
                                        )}
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Release Date</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].release_date || '-'}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={isPlatformSide ? "text-[9px] font-bold text-[#666]" : "text-[9px] text-gray-500 uppercase font-black tracking-widest"}>Genres</p>
                                            <p className={isPlatformSide ? "text-[10px]" : "text-xs text-white font-bold"}>{result.data.metadata.music[0].genres?.map((g: any) => g.name).join(', ') || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result?.status === 'success' && result.data?.status?.code !== 0 && (
                                <div className={detailClass}>
                                    <p className={`text-center py-2 ${isPlatformSide ? 'text-[10px] text-[#cc0000]' : 'text-xs text-red-400'}`}>
                                        {result.data?.status?.msg || 'No match found in ACR Cloud database.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

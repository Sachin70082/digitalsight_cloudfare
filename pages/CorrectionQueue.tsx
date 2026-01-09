
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Release, ReleaseStatus, Artist, Label } from '../types';
import { Badge, Card, PageLoader, Input } from '../components/ui';

const CorrectionQueue: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Get all releases but we will filter for NEEDS_INFO
            const [fetchedReleases, allArtists, allLabels] = await Promise.all([
                api.getAllReleases(),
                api.getAllArtists(),
                api.getLabels()
            ]);
            
            setReleases(fetchedReleases.filter(r => r.status === ReleaseStatus.NEEDS_INFO));
            
            const artistMap = new Map<string, Artist>();
            allArtists.forEach(a => artistMap.set(a.id, a));
            setArtists(artistMap);
            
            const labelMap = new Map<string, Label>();
            allLabels.forEach(l => labelMap.set(l.id, l));
            setLabels(labelMap);
        } catch (e) {
            console.error("Queue load failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const filteredReleases = useMemo(() => {
        return releases.filter(release => {
            const artistName = artists.get(release.primaryArtistIds[0])?.name || '';
            const labelName = labels.get(release.labelId)?.name || '';
            const matchesText = filter === '' ||
                release.title.toLowerCase().includes(filter.toLowerCase()) ||
                release.upc.includes(filter) ||
                artistName.toLowerCase().includes(filter.toLowerCase()) ||
                labelName.toLowerCase().includes(filter.toLowerCase());
            return matchesText;
        }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [releases, filter, artists, labels]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Correction Audit Queue</h1>
                    <p className="text-gray-400 mt-1">Manage releases that were returned to labels for metadata or asset corrections.</p>
                </div>
                <div className="w-full md:w-80">
                    <Input 
                        placeholder="Search returned catalog..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)} 
                        className="bg-gray-800 border-gray-700"
                    />
                </div>
            </div>

            <Card className="border-yellow-500/20 bg-yellow-500/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-gray-500 uppercase bg-gray-700/30 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Session Target</th>
                                <th className="px-6 py-4">Label Source</th>
                                <th className="px-6 py-4">Last Modified</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredReleases.map(release => {
                                const artistName = artists.get(release.primaryArtistIds[0])?.name || '(Unknown Artist)';
                                const labelName = labels.get(release.labelId)?.name || 'Unknown Label';
                                return (
                                    <tr key={release.id} className="hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <img src={release.artworkUrl} className="w-12 h-12 rounded shadow-lg object-cover bg-black" alt="" />
                                                <div>
                                                    <p className="text-sm font-black text-white group-hover:text-yellow-500 transition-colors">{release.title}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black">{artistName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-300 font-bold">{labelName}</p>
                                            <p className="text-[10px] text-gray-600 font-mono">UPC: {release.upc}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-400 font-mono">{new Date(release.updatedAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-gray-600 font-mono">{new Date(release.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </td>
                                        <td className="px-6 py-4"><Badge status={release.status} /></td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/release/${release.id}`} className="inline-block bg-yellow-500 text-yellow-900 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10">
                                                Re-Audit Meta
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredReleases.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center text-gray-600 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p>No releases currently requiring information re-audit.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CorrectionQueue;

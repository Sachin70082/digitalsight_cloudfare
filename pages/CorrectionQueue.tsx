
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Release, ReleaseStatus, Artist, Label } from '../types';
import { Badge, Card, PageLoader, Input, Pagination } from '../components/ui';

const CorrectionQueue: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
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

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

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

    const paginatedReleases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReleases.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReleases, currentPage]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Correction Command</h1>
                    <p className="text-gray-500 mt-1 font-medium">Releases flagged for mandatory metadata or asset optimization.</p>
                </div>
                <div className="w-full md:w-80 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <Input 
                        placeholder="Search audit queue..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)} 
                        className="pl-11 h-12 bg-black/20 border-gray-700"
                    />
                </div>
            </div>

            <Card className="p-0 overflow-hidden border-yellow-500/20 bg-yellow-500/[0.02]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-gray-500 uppercase bg-yellow-500/[0.05] font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Session Target</th>
                                <th className="px-8 py-5">Node Source</th>
                                <th className="px-8 py-5">Audit Timestamp</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Gate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedReleases.map(release => {
                                const artistName = artists.get(release.primaryArtistIds[0])?.name || 'Untitled';
                                const labelName = labels.get(release.labelId)?.name || 'Unknown Node';
                                return (
                                    <tr key={release.id} className="hover:bg-yellow-500/[0.03] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-105 transition-transform">
                                                    <img 
                                                        src={release.artworkUrl} 
                                                        className="w-full h-full object-cover" 
                                                        alt="" 
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black text-white group-hover:text-yellow-500 transition-colors tracking-tight uppercase">{release.title}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{artistName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] text-gray-300 font-black uppercase tracking-tight">{labelName}</p>
                                            <p className="text-[9px] text-gray-600 font-mono mt-1">UPC: {release.upc || 'PENDING'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-[11px] text-gray-400 font-mono font-bold">{new Date(release.updatedAt).toLocaleDateString()}</p>
                                            <p className="text-[9px] text-gray-600 font-mono uppercase mt-1">{new Date(release.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </td>
                                        <td className="px-8 py-6"><Badge status={release.status} /></td>
                                        <td className="px-8 py-6 text-right">
                                            <Link to={`/release/${release.id}`} className="inline-block bg-yellow-500 text-black font-black text-[9px] uppercase tracking-[0.2em] px-6 py-2.5 rounded-full hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10">
                                                Audit Meta
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedReleases.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-40 text-center text-gray-700 uppercase font-black tracking-widest text-xs opacity-40">
                                        The correction queue is currently sterilized.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    totalItems={filteredReleases.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </Card>
        </div>
    );
};

export default CorrectionQueue;

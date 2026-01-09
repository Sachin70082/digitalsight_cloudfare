
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { exportReleasesToExcel } from '../services/excelService';
import { Release, ReleaseStatus, UserRole, Artist, Label } from '../types';
import { Badge, Button, Input, Modal, Card, PageLoader } from '../components/ui';
import ReleaseForm from '../components/ReleaseForm';
import { ArrowDownIcon, DownloadIcon, ArrowUpIcon, XCircleIcon } from '../components/Icons';

const ReleaseList: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReleaseStatus | 'ALL'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [resumeId, setResumeId] = useState<string | undefined>(undefined);
    const [expandedReleaseId, setExpandedReleaseId] = useState<string | null>(null);

    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const releasePromise = isPlatformSide ? api.getAllReleases() : api.getReleasesByLabel(user.labelId!);
            
            let artistsPromise;
            if (isPlatformSide) {
                artistsPromise = api.getAllArtists();
            } else {
                artistsPromise = api.getArtistsByLabel(user.labelId!);
            }

            const [fetchedReleases, allArtists, allLabels] = await Promise.all([
                releasePromise,
                artistsPromise,
                isPlatformSide ? api.getLabels() : Promise.resolve([])
            ]);
            
            setReleases(fetchedReleases);
            const artistMap = new Map<string, Artist>();
            allArtists.forEach(a => artistMap.set(a.id, a));
            setArtists(artistMap);
            const labelMap = new Map<string, Label>();
            allLabels.forEach(l => labelMap.set(l.id, l));
            setLabels(labelMap);
        } catch (e) {
            console.error("Load failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isPlatformSide) {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate(today);
        }
    }, [isPlatformSide]);

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleReleaseSaved = (newRelease: Release) => {
        fetchData();
        setCreateModalOpen(false);
        setResumeId(undefined);
    };

    const handleDeleteDraft = async (id: string) => {
        if (window.confirm("Are you sure you want to discard this draft? This will remove all associated meta and assets.")) {
            setIsLoading(true);
            try {
                await api.deleteRelease(id);
                await fetchData();
            } catch (e) {
                alert("Discard failed");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleExport = () => {
        exportReleasesToExcel(filteredReleases, artists, labels);
    };

    const filteredReleases = useMemo(() => {
        return releases.filter(release => {
            if (isPlatformSide && release.status === ReleaseStatus.NEEDS_INFO) return false;

            const artistName = artists.get(release.primaryArtistIds[0])?.name || '';
            const labelName = labels.get(release.labelId)?.name || '';
            const matchesStatus = statusFilter === 'ALL' || release.status === statusFilter;
            const matchesText = filter === '' ||
                release.title.toLowerCase().includes(filter.toLowerCase()) ||
                release.upc.includes(filter) ||
                artistName.toLowerCase().includes(filter.toLowerCase()) ||
                labelName.toLowerCase().includes(filter.toLowerCase());
            let matchesDate = true;
            if (isPlatformSide && startDate && endDate) {
                const releaseDate = new Date(release.createdAt).setHours(0,0,0,0);
                const start = new Date(startDate).setHours(0,0,0,0);
                const end = new Date(endDate).setHours(0,0,0,0);
                matchesDate = releaseDate >= start && releaseDate <= end;
            }
            return matchesStatus && matchesText && matchesDate;
        }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [releases, filter, statusFilter, startDate, endDate, artists, labels, isPlatformSide]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="animate-fade-in">
            <Card>
                <div className="p-4 flex flex-col gap-4 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">
                            {isPlatformSide ? 'Distribution Queue (Incoming)' : 'Your Releases'}
                        </h2>
                        <div className="flex gap-2">
                            {!isPlatformSide && user?.role !== UserRole.ARTIST && (
                                <Button onClick={() => { setResumeId(undefined); setCreateModalOpen(true); }}>Create New Release</Button>
                            )}
                            {isPlatformSide && (
                                <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
                                    <DownloadIcon className="w-4 h-4" /> Export Report
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-64">
                            <Input placeholder="Search catalog..." value={filter} onChange={e => setFilter(e.target.value)} />
                        </div>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as ReleaseStatus | 'ALL')}
                            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white h-[42px] text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="ALL">All Statuses</option>
                            {Object.values(ReleaseStatus).map(s => (
                                <option key={s} value={s} disabled={isPlatformSide && s === ReleaseStatus.NEEDS_INFO}>{s}</option>
                            ))}
                        </select>
                        {isPlatformSide && (
                            <div className="flex gap-2 items-end">
                                <Input type="date" label="From" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36 text-xs" />
                                <Input type="date" label="To" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36 text-xs" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-gray-500 uppercase bg-gray-700/50 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4 w-10 text-center"></th>
                                <th className="px-6 py-4">Release Information</th>
                                <th className="px-6 py-4">Identifiers</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredReleases.map(release => {
                                const artistName = artists.get(release.primaryArtistIds[0])?.name || '(Untitled Artist)';
                                const isExpanded = expandedReleaseId === release.id;
                                const isDraft = release.status === ReleaseStatus.DRAFT;
                                const needsCorrection = release.status === ReleaseStatus.NEEDS_INFO;
                                return (
                                    <React.Fragment key={release.id}>
                                        <tr className={`hover:bg-gray-800/40 transition-colors ${isExpanded ? 'bg-gray-800' : ''} group`}>
                                            <td className="px-2 py-4 text-center">
                                                {!isDraft && (
                                                    <button onClick={() => setExpandedReleaseId(isExpanded ? null : release.id)} className="text-gray-400 hover:text-white p-2">
                                                        {isExpanded ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 flex-shrink-0">
                                                        <img 
                                                            src={release.artworkUrl || 'https://via.placeholder.com/60'} 
                                                            alt={release.title} 
                                                            className="w-full h-full rounded-lg shadow-xl object-cover bg-gray-800 border border-gray-700 group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        {(isDraft || needsCorrection) && (
                                                            <div className={`absolute -top-1 -left-1 w-3 h-3 ${needsCorrection ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full border-2 border-gray-900 shadow-lg`} title={needsCorrection ? 'Action Required' : 'Draft Session'}></div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-white truncate group-hover:text-primary transition-colors tracking-tight">
                                                            {release.title || <span className="text-gray-600 italic font-normal">Untitled Release</span>}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.1em] mt-0.5 truncate">
                                                            {artistName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                                                <div className="bg-gray-900/50 px-2 py-1 rounded inline-block border border-gray-800">
                                                    UPC: {release.upc || 'PENDING'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><Badge status={release.status} /></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-3 items-center">
                                                    {isDraft && !isPlatformSide ? (
                                                        <>
                                                            <Button onClick={() => { setResumeId(release.id); setCreateModalOpen(true); }} className="text-[10px] py-1.5 px-4 uppercase font-black tracking-widest shadow-lg shadow-primary/10">Resume</Button>
                                                            <button 
                                                                onClick={() => handleDeleteDraft(release.id)} 
                                                                className="text-gray-500 hover:text-red-500 transition-colors p-2"
                                                                title="Discard Draft"
                                                            >
                                                                <XCircleIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : needsCorrection && !isPlatformSide ? (
                                                        <Button 
                                                            onClick={() => { setResumeId(release.id); setCreateModalOpen(true); }} 
                                                            className="text-[10px] py-1.5 px-4 uppercase font-black tracking-widest bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                                                        >
                                                            Fix & Resubmit
                                                        </Button>
                                                    ) : (
                                                        <Link to={isPlatformSide ? `/release/${release.id}` : `/releases/${release.id}`} className="text-primary font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20">
                                                            {isPlatformSide ? 'Audit Queue' : 'Meta Explorer'}
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                            {filteredReleases.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-600 italic">No releases found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Modal isOpen={isCreateModalOpen} onClose={() => { setCreateModalOpen(false); setResumeId(undefined); fetchData(); }} title="Release Engine" size="5xl">
                    <ReleaseForm initialReleaseId={resumeId} onClose={() => setCreateModalOpen(false)} onSave={handleReleaseSaved} />
                </Modal>
            </Card>
        </div>
    );
};

export default ReleaseList;

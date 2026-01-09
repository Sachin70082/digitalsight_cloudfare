
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { exportReleasesToExcel } from '../services/excelService';
import { Release, ReleaseStatus, UserRole, Artist, Label } from '../types';
import { Badge, Button, Input, Modal, Card, PageLoader, Pagination, Spinner } from '../components/ui';
import ReleaseForm from '../components/ReleaseForm';
import { ArrowDownIcon, DownloadIcon, ArrowUpIcon, XCircleIcon, TrashIcon } from '../components/Icons';

const ReleaseList: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    
    // Deletion State
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [targetRelease, setTargetRelease] = useState<{id: string, title: string} | null>(null);
    
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReleaseStatus | 'ALL'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [resumeId, setResumeId] = useState<string | undefined>(undefined);
    const [expandedReleaseId, setExpandedReleaseId] = useState<string | null>(null);

    const isPlatformSide = user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE;
    const isOwner = user?.role === UserRole.OWNER;
    const canDelete = isOwner || user?.permissions?.canDeleteReleases;

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

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, statusFilter, startDate, endDate]);

    const handleReleaseSaved = (newRelease: Release) => {
        fetchData();
        setCreateModalOpen(false);
        setResumeId(undefined);
    };

    const triggerDeleteConfirmation = (id: string, title: string) => {
        setTargetRelease({ id, title });
        setIsDeleteModalOpen(true);
    };

    const handleHardDelete = async () => {
        if (!targetRelease) return;
        
        setIsDeleting(true);
        try {
            await api.deleteRelease(targetRelease.id);
            showToast(`Vault Purge Successful: "${targetRelease.title}" removed from hierarchy.`, 'success');
            setIsDeleteModalOpen(false);
            setTargetRelease(null);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Vault purge protocol failed.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = () => {
        exportReleasesToExcel(filteredReleases, artists, labels);
    };

    const filteredReleases = useMemo(() => {
        return releases.filter(release => {
            if (isPlatformSide && release.status === ReleaseStatus.NEEDS_INFO) return false;

            const primaryIds = release.primaryArtistIds || [];
            const artistName = primaryIds.length > 0 ? (artists.get(primaryIds[0])?.name || '') : '';
            const labelName = labels.get(release.labelId)?.name || '';
            const matchesStatus = statusFilter === 'ALL' || release.status === statusFilter;
            const matchesText = filter === '' ||
                release.title.toLowerCase().includes(filter.toLowerCase()) ||
                (release.upc && release.upc.includes(filter)) ||
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

    const paginatedReleases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReleases.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReleases, currentPage]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="animate-fade-in">
            <Card className="p-0 overflow-hidden">
                <div className="p-8 flex flex-col gap-4 border-b border-white/5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            {isPlatformSide ? 'Distribution Queue' : 'Label Catalog'}
                        </h2>
                        <div className="flex gap-3">
                            {!isPlatformSide && user?.role !== UserRole.ARTIST && (
                                <Button onClick={() => { setResumeId(undefined); setCreateModalOpen(true); }} className="text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20">Create Release</Button>
                            )}
                            {isPlatformSide && (
                                <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-black/20">
                                    <DownloadIcon className="w-4 h-4" /> Export Queue
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end mt-4">
                        <div className="w-full md:w-80 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <Input placeholder="Search catalog metadata..." value={filter} onChange={e => setFilter(e.target.value)} className="pl-11 h-12 bg-black/20 border-gray-700" />
                        </div>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as ReleaseStatus | 'ALL')}
                            className="bg-black/20 border border-gray-700 rounded-xl px-4 py-2 text-white h-12 text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            <option value="ALL">All Lifecycle Statuses</option>
                            {Object.values(ReleaseStatus).map(s => (
                                <option key={s} value={s} disabled={isPlatformSide && s === ReleaseStatus.NEEDS_INFO}>{s}</option>
                            ))}
                        </select>
                        {isPlatformSide && (
                            <div className="flex gap-2 items-end">
                                <Input type="date" label="Ingest Start" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40 text-[10px] h-12 bg-black/20 border-gray-700" />
                                <Input type="date" label="Ingest End" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40 text-[10px] h-12 bg-black/20 border-gray-700" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-gray-500 uppercase bg-black/10 font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5 w-12 text-center"></th>
                                <th className="px-8 py-5">Intel / Target</th>
                                <th className="px-8 py-5">Identifiers</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Gate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedReleases.map(release => {
                                const primaryIds = release.primaryArtistIds || [];
                                const artistName = primaryIds.length > 0 ? (artists.get(primaryIds[0])?.name || 'Untitled') : 'Untitled';
                                const isExpanded = expandedReleaseId === release.id;
                                const isDraft = release.status === ReleaseStatus.DRAFT;
                                const needsCorrection = release.status === ReleaseStatus.NEEDS_INFO;
                                return (
                                    <React.Fragment key={release.id}>
                                        <tr className={`hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''} group`}>
                                            <td className="px-4 py-5 text-center">
                                                {!isDraft && (
                                                    <button onClick={() => setExpandedReleaseId(isExpanded ? null : release.id)} className="text-gray-600 hover:text-primary p-2 transition-all">
                                                        {isExpanded ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative w-14 h-14 flex-shrink-0 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/5">
                                                        <img 
                                                            src={release.artworkUrl || 'https://via.placeholder.com/60'} 
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            alt=""
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                        {(isDraft || needsCorrection) && (
                                                            <div className={`absolute -top-1.5 -left-1.5 w-4 h-4 ${needsCorrection ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full border-[3px] border-gray-900 shadow-xl`} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-black text-white truncate group-hover:text-primary transition-colors tracking-tight uppercase">
                                                            {release.title || 'Untitled Session'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1 truncate uppercase">
                                                            {artistName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-[10px] text-gray-500">
                                                <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 inline-flex flex-col gap-0.5">
                                                    <span className="text-[8px] text-gray-600 font-black uppercase">Distro Code</span>
                                                    <span className="text-white tracking-widest">{release.upc || 'UNASSIGNED'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5"><Badge status={release.status} /></td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-3 items-center">
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => triggerDeleteConfirmation(release.id, release.title)}
                                                            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                            title="Hard Purge Authority"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {isDraft && !isPlatformSide ? (
                                                        <Button onClick={() => { setResumeId(release.id); setCreateModalOpen(true); }} className="text-[9px] py-2 px-5 font-black uppercase tracking-widest shadow-lg shadow-primary/20">Resume Engine</Button>
                                                    ) : needsCorrection && !isPlatformSide ? (
                                                        <Button 
                                                            onClick={() => { setResumeId(release.id); setCreateModalOpen(true); }} 
                                                            className="text-[9px] py-2 px-5 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 border-none"
                                                        >
                                                            Fix Meta
                                                        </Button>
                                                    ) : (
                                                        <Link to={isPlatformSide ? `/release/${release.id}` : `/releases/${release.id}`} className="text-primary font-black text-[9px] uppercase tracking-[0.2em] transition-all bg-primary/5 px-6 py-2 rounded-full border border-primary/20 hover:bg-primary/20 hover:text-white">
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
                                    <td colSpan={5} className="py-32 text-center text-gray-600 font-bold uppercase tracking-widest text-xs opacity-50">No catalog items identified in the current filter.</td>
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
                
                {/* Deletion Confirmation Modal */}
                <Modal 
                    isOpen={isDeleteModalOpen} 
                    onClose={() => !isDeleting && setIsDeleteModalOpen(false)} 
                    title="Vault Purge Protocol" 
                    size="md"
                >
                    <div className="space-y-6 text-center py-4">
                        <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-pulse">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Confirm Hard Deletion</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                You are about to PERMANENTLY erase <span className="text-white font-bold">"{targetRelease?.title}"</span> from the global distribution archive.
                            </p>
                        </div>

                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-left space-y-4">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Recursive Purge Summary:</p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    Full Database Metadata Removal
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    High-Fidelity WAV Master Archives
                                </li>
                                <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    Original Artwork Resource Files
                                </li>
                            </ul>
                        </div>

                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Warning: This action is irreversible.</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="secondary" className="flex-1 font-black uppercase text-[10px]" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Abort Protocol</Button>
                            <Button variant="danger" className="flex-1 font-black uppercase text-[10px] shadow-xl shadow-red-500/20" disabled={isDeleting} onClick={handleHardDelete}>
                                {isDeleting ? <Spinner className="w-4 h-4" /> : 'Execute Purge'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={isCreateModalOpen} onClose={() => { setCreateModalOpen(false); setResumeId(undefined); fetchData(); }} title="Asset Transmission Protocol" size="5xl">
                    <ReleaseForm initialReleaseId={resumeId} onClose={() => setCreateModalOpen(false)} onSave={handleReleaseSaved} />
                </Modal>
            </Card>
        </div>
    );
};

export default ReleaseList;


import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, User, UserPermissions } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader, Pagination } from '../components/ui';

const SubLabels: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const [subLabels, setSubLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newLabelInfo, setNewLabelInfo] = useState<{label: Label, user: User} | null>(null);
    const [maxArtists, setMaxArtists] = useState(10);
    const [revenueShare, setRevenueShare] = useState(70);
    const [permissions, setPermissions] = useState<UserPermissions>({
        canManageArtists: true,
        canManageReleases: true,
        canCreateSubLabels: false,
        canSubmitAlbums: true
    });

    // Blocking State
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [labelToBlock, setLabelToBlock] = useState<Label | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [isBlocking, setIsBlocking] = useState(false);
    const [blockedStatus, setBlockedStatus] = useState<Record<string, boolean>>({});

    const fetchSubLabels = async () => {
        if (user?.labelId) {
            setIsLoading(true);
            try {
                const labels = await api.getSubLabels(user.labelId);
                setSubLabels(labels);
            } catch (e) {
                console.error("Sub-label fetch failure", e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchSubLabels();
    }, [user]);

    useEffect(() => {
        const fetchBlockedStatuses = async () => {
            const statuses: Record<string, boolean> = {};
            for (const label of subLabels) {
                const admin = await api.getLabelAdmin(label.id);
                if (admin && admin.isBlocked) {
                    statuses[label.id] = true;
                }
            }
            setBlockedStatus(statuses);
        };
        if (subLabels.length > 0) {
            fetchBlockedStatuses();
        }
    }, [subLabels]);

    const handleOpenBlock = async (label: Label) => {
        setLabelToBlock(label);
        setBlockReason('');
        const admin = await api.getLabelAdmin(label.id);
        if (admin && admin.isBlocked) {
             setBlockReason(admin.blockReason || '');
        }
        setIsBlockModalOpen(true);
    };

    const confirmBlock = async () => {
        if (!user || !labelToBlock) return;
        setIsBlocking(true);
        try {
            const admin = await api.getLabelAdmin(labelToBlock.id);
            if (admin) {
                if (blockedStatus[labelToBlock.id]) {
                    await api.unblockUser(admin.id);
                    showToast(`Access restored for "${labelToBlock.name}".`, 'success');
                    setBlockedStatus(prev => ({ ...prev, [labelToBlock.id]: false }));
                } else {
                    await api.blockUser(admin.id, blockReason);
                    showToast(`Access suspended for "${labelToBlock.name}".`, 'success');
                    setBlockedStatus(prev => ({ ...prev, [labelToBlock.id]: true }));
                }
            } else {
                showToast('No admin found for this label.', 'error');
            }
            setIsBlockModalOpen(false);
            setLabelToBlock(null);
        } catch (err: any) {
            showToast(err.message || 'Action failed.', 'error');
        } finally {
            setIsBlocking(false);
        }
    };

    const handleOpenEdit = async (label: Label) => {
        setEditingLabelId(label.id);
        setNewName(label.name);
        setAdminName(''); // Will be set from admin profile
        setMaxArtists(label.maxArtists || 10);
        setRevenueShare(label.revenueShare || 70);
        setNewLabelInfo(null);
        
        const admin = await api.getLabelAdmin(label.id);
        if (admin) {
            setPermissions({
                ...admin.permissions,
                canSubmitAlbums: admin.permissions.canSubmitAlbums ?? true
            });
            setNewEmail(admin.email);
            setAdminName(admin.name);
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (label: Label) => {
        if (window.confirm(`Are you sure you want to terminate "${label.name}"? Vault access will be revoked.`)) {
            setIsLoading(true);
            await api.deleteLabel(label.id, user as User);
            await fetchSubLabels();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.labelId) return;
        setIsLoading(true);
        try {
            if (editingLabelId) {
                await api.updateLabel(editingLabelId, { name: newName, maxArtists, revenueShare });
                const admin = await api.getLabelAdmin(editingLabelId);
                if (admin) {
                    await api.updateUserPermissions(admin.id, permissions, user as User);
                    if (adminName !== admin.name) {
                        await api.updateUser(admin.id, { name: adminName });
                    }
                }
                setSubLabels(prev => prev.map(l => l.id === editingLabelId ? { ...l, name: newName, maxArtists, revenueShare } : l));
                setIsModalOpen(false);
            } else {
                const result = await api.createLabel({
                    name: newName,
                    adminName: adminName,
                    adminEmail: newEmail,
                    permissions,
                    maxArtists,
                    revenueShare,
                    parentLabelId: user.labelId
                } as any);
                setNewLabelInfo(result as any);
                setSubLabels(prev => [...prev, (result as any).label]);
            }
        } catch (error) {
            showToast('Protocol error during synchronization.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!editingLabelId) return;
        setIsLoading(true);
        try {
            const admin = await api.getLabelAdmin(editingLabelId);
            if (admin && admin.email) {
                await api.sendPasswordResetEmail(admin.email);
                showToast(`Security reset link dispatched to ${admin.email}.`, 'success');
            }
        } catch (error) {
            showToast('Security protocol failure.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const paginatedLabels = useMemo(() => {
        const sorted = [...subLabels].sort((a, b) => a.name.localeCompare(b.name));
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sorted.slice(startIndex, startIndex + itemsPerPage);
    }, [subLabels, currentPage]);

    if (isLoading && subLabels.length === 0) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Child Nodes</h1>
                    <p className="text-gray-500 mt-1 font-medium">Administration of partner labels and authority protocols.</p>
                </div>
                <Button onClick={() => { setEditingLabelId(null); setNewLabelInfo(null); setNewName(''); setAdminName(''); setNewEmail(''); setMaxArtists(10); setIsModalOpen(true); }} className="px-10 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Onboard Child Label</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedLabels.map(label => (
                    <Card key={label.id} className="p-0 overflow-hidden group">
                        <div className="p-8">
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div className="min-w-0">
                                    <CardTitle className="group-hover:text-primary transition-colors truncate text-xl font-black uppercase tracking-tight">{label.name}</CardTitle>
                                    <p className="text-[9px] font-mono text-gray-600 mt-2 uppercase tracking-tighter">NODE ID: {label.id?.toUpperCase() || 'UNKNOWN'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenBlock(label)}
                                        className={`p-2 rounded-xl transition-all ${blockedStatus[label.id] ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                                        title={blockedStatus[label.id] ? "Unblock Node" : "Block Node"}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(label)} className="text-gray-600 hover:text-red-500 transition-colors p-2 bg-white/5 rounded-xl">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] ml-1">Authority Status</span>
                                        <span className={`text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-wider ${blockedStatus[label.id] ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                            {blockedStatus[label.id] ? 'Suspended' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="secondary" className="flex-1 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl border-white/5" onClick={() => handleOpenEdit(label)}>Edit Rights</Button>
                                        <Button variant="secondary" className="flex-1 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl border-white/5">Catalog View</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                ))}
            </div>

            <Pagination totalItems={subLabels.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />

            {/* Block Confirmation Modal */}
            <Modal
                isOpen={isBlockModalOpen}
                onClose={() => !isBlocking && setIsBlockModalOpen(false)}
                title={blockedStatus[labelToBlock?.id || ''] ? "Restore Access Protocol" : "Suspend Access Protocol"}
                size="md"
            >
                <div className="space-y-6 text-center py-4">
                    <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border animate-pulse ${blockedStatus[labelToBlock?.id || ''] ? 'bg-green-900/20 text-green-500 border-green-500/20' : 'bg-red-900/20 text-red-500 border-red-500/20'}`}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">{blockedStatus[labelToBlock?.id || ''] ? "Confirm Restoration" : "Confirm Suspension"}</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            {blockedStatus[labelToBlock?.id || '']
                                ? <span>You are about to restore access for <span className="text-white font-bold">"{labelToBlock?.name}"</span>.</span>
                                : <span>You are about to suspend access for <span className="text-white font-bold">"{labelToBlock?.name}"</span>.</span>
                            }
                        </p>
                    </div>

                    {!blockedStatus[labelToBlock?.id || ''] && (
                        <div className="text-left">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Suspension Reason</label>
                            <textarea
                                value={blockReason}
                                onChange={e => setBlockReason(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-xl p-4 text-sm text-white focus:border-red-500 transition-colors"
                                rows={3}
                                placeholder="Enter reason for suspension..."
                            />
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 font-black uppercase text-[10px]" onClick={() => setIsBlockModalOpen(false)} disabled={isBlocking}>Cancel</Button>
                        <Button
                            variant={blockedStatus[labelToBlock?.id || ''] ? "primary" : "danger"}
                            className={`flex-1 font-black uppercase text-[10px] ${blockedStatus[labelToBlock?.id || ''] ? 'shadow-xl shadow-primary/20' : 'shadow-xl shadow-red-500/20'}`}
                            disabled={isBlocking}
                            onClick={confirmBlock}
                        >
                            {isBlocking ? <Spinner className="w-4 h-4" /> : (blockedStatus[labelToBlock?.id || ''] ? 'Restore Access' : 'Suspend Access')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLabelId ? "Configure Authority" : "Setup Child Node"} size="2xl">
                {!newLabelInfo ? (
                    <form onSubmit={handleSave} className="space-y-10">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5 pb-3">Node Registry</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Sub-Label Commercial Name" value={newName} onChange={e => setNewName(e.target.value)} required className="h-14 bg-black/40" />
                                <Input label="Lead Admin Name" value={adminName} onChange={e => setAdminName(e.target.value)} required className="h-14 bg-black/40" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Admin Auth Endpoint" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required disabled={!!editingLabelId} className="h-14 bg-black/40" />
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Revenue Net Share (%)</label>
                                    <input type="number" value={revenueShare} onChange={e => setRevenueShare(parseInt(e.target.value))} className="w-full bg-black/40 border border-gray-600 rounded-xl px-4 py-4 text-sm font-black text-white h-14" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Artist Limit</label>
                                <select
                                    value={maxArtists}
                                    onChange={e => setMaxArtists(parseInt(e.target.value))}
                                    className="w-full bg-black/40 border border-gray-600 rounded-xl px-4 py-4 text-sm font-black text-white h-14 appearance-none"
                                >
                                    <option value={1}>1 Artist</option>
                                    <option value={2}>2 Artists</option>
                                    <option value={5}>5 Artists</option>
                                    <option value={10}>10 Artists</option>
                                    <option value={20}>20 Artists</option>
                                    <option value={50}>50 Artists</option>
                                    <option value={100}>100 Artists</option>
                                    <option value={0}>Unlimited</option>
                                </select>
                            </div>
                        </div>

                        {editingLabelId && (
                            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-white font-black uppercase">Security Protocol</p>
                                        <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">Dispatch a secure password reset link to the lead admin.</p>
                                    </div>
                                    <Button type="button" variant="secondary" onClick={handleSendResetEmail} disabled={isLoading} className="px-6 py-2 text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/10">Send Reset Link</Button>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5 pb-3">Authority Delegation</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(permissions).map(key => (
                                    <label key={key} className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-gray-800 hover:border-primary/40 cursor-pointer transition-all group">
                                        <div className="pr-4">
                                            <span className="text-xs text-white font-black uppercase group-hover:text-primary">
                                                {key === 'canSubmitAlbums' ? 'Album Submission' : key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">
                                                {key === 'canSubmitAlbums' ? 'Synchronize directly to distribution queue' : 'Managed functional access'}
                                            </p>
                                        </div>
                                        <input type="checkbox" checked={(permissions as any)[key]} onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))} className="w-6 h-6 rounded-lg border-gray-700 bg-black text-primary" />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-10 border-t border-white/5">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="px-10 font-black uppercase text-[10px]">Abort</Button>
                            <Button type="submit" disabled={isLoading} className="h-14 px-10 font-black uppercase text-[10px] shadow-xl shadow-primary/20">
                                {isLoading ? <Spinner className="w-5 h-5" /> : (editingLabelId ? 'Push Changes' : 'Initialize Node')}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-10 py-6 animate-fade-in">
                        <div className="p-10 bg-primary/10 border border-primary/20 rounded-[2.5rem] text-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Access Link Established</h3>
                            <p className="text-gray-500 mt-2 font-medium">Transmit these credentials to the sub-label administrator.</p>
                        </div>
                        <div className="bg-black/60 p-10 rounded-[2.5rem] font-mono text-sm space-y-8 border border-white/5">
                            <div className="space-y-2 border-b border-white/5 pb-6">
                                <span className="text-gray-700 uppercase text-[9px] font-black tracking-widest">Auth Endpoint</span>
                                <p className="text-white font-bold">{newLabelInfo.user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-gray-700 uppercase text-[9px] font-black tracking-widest">Master Key</span>
                                <p className="text-primary font-black text-2xl tracking-[0.2em] bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 inline-block">{newLabelInfo.user.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => { setIsModalOpen(false); setNewLabelInfo(null); }} className="w-full h-16 text-[11px] font-black uppercase tracking-widest">Close Gateway</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SubLabels;


import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, User, UserRole, UserPermissions } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader, Pagination } from '../components/ui';
import { TrashIcon } from '../components/Icons';

const Labels: React.FC = () => {
    const { user: currentUser, showToast } = useContext(AppContext);
    const [labels, setLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [filter, setFilter] = useState('');
    
    // Deletion State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Editing State
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const [createdResult, setCreatedResult] = useState<{label: Label, user: User} | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        address: '',
        city: '',
        country: '',
        taxId: '',
        website: '',
        phone: '',
        revenueShare: 70,
        parentLabelId: ''
    });

    const [permissions, setPermissions] = useState<UserPermissions>({
        canManageArtists: true,
        canManageReleases: true,
        canCreateSubLabels: true,
        canSubmitAlbums: true
    });

    const fetchLabels = async () => {
        setIsLoading(true);
        try {
            const data = await api.getLabels();
            setLabels(data);
        } catch (e) {
            showToast('Failed to load partners.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === UserRole.OWNER || currentUser?.permissions?.canOnboardLabels) {
            fetchLabels();
        }
    }, [currentUser]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    // This handles the final API synchronization
    const executeSync = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (editingLabelId) {
                // Update Path
                await api.updateLabel(editingLabelId, {
                    name: formData.name,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    taxId: formData.taxId,
                    website: formData.website,
                    phone: formData.phone,
                    revenueShare: formData.revenueShare
                }, currentUser);
                
                // Update permissions for label admin
                const admin = await api.getLabelAdmin(editingLabelId);
                if (admin) {
                    await api.updateUserPermissions(admin.id, permissions, currentUser);
                }
                
                showToast(`Node "${formData.name}" configuration synchronized.`, 'success');
                setIsModalOpen(false);
                await fetchLabels();
            } else {
                // Create Path
                const result = await api.createLabel({
                    ...formData,
                    permissions
                });
                setCreatedResult(result);
                setLabels(prev => [...prev, result.label]);
                showToast('Branch established within network.', 'success');
            }
        } catch (err: any) {
            showToast(err.message || 'Transmission failure.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDelete = (label: Label) => {
        setLabelToDelete(label);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentUser || !labelToDelete) return;
        setIsDeleting(true);
        try {
            await api.deleteLabel(labelToDelete.id, currentUser);
            showToast(`Node "${labelToDelete.name}" successfully terminated.`, 'success');
            setIsDeleteModalOpen(false);
            setLabelToDelete(null);
            await fetchLabels();
        } catch (err: any) {
            showToast(err.message || 'Node termination failed.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            name: '', adminName: '', adminEmail: '', adminPassword: '',
            address: '', city: '', country: '', taxId: '', website: '', phone: '',
            revenueShare: 70, parentLabelId: ''
        });
        setPermissions({
            canManageArtists: true,
            canManageReleases: true,
            canCreateSubLabels: true,
            canSubmitAlbums: true
        });
        setCreatedResult(null);
        setEditingLabelId(null);
        setStep(1);
        setIsModalOpen(true);
    };

    const handleOpenEdit = async (label: Label) => {
        setIsLoading(true);
        setEditingLabelId(label.id);
        setCreatedResult(null);
        setStep(1);
        
        try {
            const admin = await api.getLabelAdmin(label.id);
            setFormData({
                name: label.name || '',
                adminName: admin?.name || '',
                adminEmail: admin?.email || '',
                adminPassword: '', 
                address: label.address || '',
                city: label.city || '',
                country: label.country || '',
                taxId: label.taxId || '',
                website: label.website || '',
                phone: label.phone || '',
                revenueShare: label.revenueShare || 70,
                parentLabelId: label.parentLabelId || ''
            });
            
            setPermissions({
                canManageArtists: admin?.permissions.canManageArtists ?? true,
                canManageReleases: admin?.permissions.canManageReleases ?? true,
                canCreateSubLabels: admin?.permissions.canCreateSubLabels ?? true,
                canSubmitAlbums: admin?.permissions.canSubmitAlbums ?? true
            });
            
            setIsModalOpen(true);
        } catch (e) {
            showToast('Failed to load node authority data.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLabels = useMemo(() => {
        return labels.filter(l => 
            l.name.toLowerCase().includes(filter.toLowerCase()) || 
            (l.id && l.id.toLowerCase().includes(filter.toLowerCase())) ||
            (l.country && l.country.toLowerCase().includes(filter.toLowerCase()))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [labels, filter]);

    const paginatedLabels = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLabels.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLabels, currentPage]);

    if (isLoading && labels.length === 0) return <PageLoader />;

    const canManage = currentUser?.role === UserRole.OWNER || currentUser?.designation === "Co-Founder / Operations Head";

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Partner Nodes</h1>
                    <p className="text-gray-500 mt-1 font-medium">Administration of global distribution branches and revenue share policies.</p>
                </div>
                <Button onClick={handleOpenCreate} className="px-10 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Establish Label</Button>
            </div>

            <div className="relative group max-w-xl">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <Input 
                    placeholder="Search name, ID or region..." 
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="pl-11 h-14 bg-black/20"
                />
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {paginatedLabels.map(label => (
                        <Card key={label.id} className="hover:border-primary/50 border border-white/5 bg-white/[0.02] transition-all group relative overflow-hidden p-0 rounded-[2rem] shadow-2xl">
                            <div className="p-8">
                                <CardHeader className="border-white/5 pb-6 mb-6 flex flex-row justify-between items-start">
                                    <div className="min-w-0">
                                        <CardTitle className="group-hover:text-primary transition-colors truncate text-xl font-black uppercase tracking-tight">{label.name}</CardTitle>
                                        <p className="text-[9px] font-mono text-gray-600 mt-2 uppercase tracking-tighter">NODE ID: {label.id?.toUpperCase() || 'UNKNOWN'}</p>
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(label)}
                                                className="p-2.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                title="Revise Node"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleOpenDelete(label)}
                                                className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Terminate Node"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-0 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Region</p>
                                            <p className="text-xs text-white font-bold uppercase">{label.country || 'Global'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Net Share</p>
                                            <p className="text-base text-primary font-black">{label.revenueShare || 70}%</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
                <Pagination totalItems={filteredLabels.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={createdResult ? "Node Activated" : (editingLabelId ? "Protocol: Revise Node" : "Protocol: New Node Setup")} size="3xl">
                {!createdResult ? (
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
                        <div className="flex justify-between items-center px-10">
                            {['Auth', 'Business', 'Rights'].map((n, i) => (
                                <React.Fragment key={n}>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step > i + 1 ? 'bg-primary text-black' : (step === i + 1 ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-gray-800 text-gray-600')}`}>
                                            {step > i + 1 ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step === i + 1 ? 'text-white' : 'text-gray-700'}`}>{n}</span>
                                    </div>
                                    {i < 2 && <div className={`flex-1 h-px mx-6 ${step > i + 1 ? 'bg-primary/50' : 'bg-gray-800'}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Registry Title" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-14 bg-black/40" />
                                    <Input label="Lead Admin Name" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} required className="h-14 bg-black/40" disabled={!!editingLabelId} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Lead Admin Email" type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required className="h-14 bg-black/40" disabled={!!editingLabelId} />
                                    {!editingLabelId && (
                                        <Input label="Initial Vault Key" type="text" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} placeholder="Auto-generated if blank" className="h-14 bg-black/40" />
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input label="Tax Identifier" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} className="h-14 bg-black/40" />
                                    <Input label="Corporate Contact" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-14 bg-black/40" />
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Revenue Net Share (%)</label>
                                        <input type="number" value={formData.revenueShare} onChange={e => setFormData({...formData, revenueShare: parseInt(e.target.value)})} className="w-full bg-black/40 border border-gray-600 rounded-xl px-4 py-4 text-sm font-black text-white h-14" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Corporate Jurisdiction" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="h-14 bg-black/40" />
                                    <Input label="Corporate Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="h-14 bg-black/40" />
                                </div>
                                <Input label="Registered Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-14 bg-black/40" />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5 pb-4">Authority Protocol Matrix</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.keys(permissions).map(key => (
                                        <label key={key} className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-gray-800 hover:border-primary/40 cursor-pointer transition-all group select-none">
                                            <div className="pr-4">
                                                <span className="text-xs text-white font-black uppercase group-hover:text-primary transition-colors">
                                                    {key === 'canSubmitAlbums' ? 'Album Submission Authority' : key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={(permissions as any)[key]} 
                                                onChange={e => {
                                                    e.stopPropagation();
                                                    setPermissions(prev => ({ ...prev, [key]: e.target.checked }));
                                                }} 
                                                className="w-6 h-6 rounded-lg border-gray-700 bg-black text-primary focus:ring-primary pointer-events-auto" 
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-10 border-t border-white/5">
                            <Button type="button" variant="secondary" onClick={() => step === 1 ? setIsModalOpen(false) : setStep(s => s - 1)} className="px-10 text-[10px] font-black uppercase">
                                {step === 1 ? 'Abort' : 'Back'}
                            </Button>
                            {step < 3 ? (
                                <Button type="button" onClick={() => setStep(s => s + 1)} className="px-10 text-[10px] font-black uppercase">Proceed</Button>
                            ) : (
                                <Button type="button" disabled={isLoading} onClick={executeSync} className="px-12 h-14 text-[10px] font-black uppercase shadow-xl shadow-primary/20">
                                    {isLoading ? <Spinner className="w-5 h-5" /> : (editingLabelId ? 'Push Configuration' : 'Execute Onboarding')}
                                </Button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="space-y-10 py-6">
                        <div className="p-10 bg-primary/10 border border-primary/20 rounded-[2.5rem] text-center">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Authority Established</h3>
                            <p className="text-gray-500 mt-2 font-medium">Node credentials activated and synchronized.</p>
                        </div>
                        <div className="bg-black/60 p-10 rounded-[2.5rem] border border-white/5 space-y-8">
                            <div className="space-y-2 pb-6 border-b border-white/5">
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Auth Endpoint</span>
                                <p className="text-white font-bold">{createdResult.user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Master Key</span>
                                <p className="text-3xl text-primary font-black select-all tracking-[0.2em] bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 inline-block">{createdResult.user.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => setIsModalOpen(false)} className="w-full h-16 text-[11px] font-black uppercase">Close Protocol</Button>
                    </div>
                )}
            </Modal>

            {/* Deletion Confirmation Modal */}
            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)} 
                title="Node Termination Protocol" 
                size="md"
            >
                <div className="space-y-6 text-center py-4">
                    <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-pulse">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Confirm Hard Deletion</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            You are about to PERMANENTLY terminate distribution node <span className="text-white font-bold">"{labelToDelete?.name}"</span>. 
                        </p>
                    </div>

                    <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-left space-y-4">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Recursive Impact Summary:</p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                Total Revocation of Admin Portal Access
                            </li>
                            <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                Disruption of Associated Sub-Label Hierarchy
                            </li>
                            <li className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                Metadata & Revenue History Archive Detachment
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Warning: This action is irreversible.</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1 font-black uppercase text-[10px]" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Abort Protocol</Button>
                        <Button variant="danger" className="flex-1 font-black uppercase text-[10px] shadow-xl shadow-red-500/20" disabled={isDeleting} onClick={confirmDelete}>
                            {isDeleting ? <Spinner className="w-4 h-4" /> : 'Execute Purge'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Labels;

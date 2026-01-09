
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, User, UserRole, UserPermissions } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader, Pagination } from '../components/ui';

const Labels: React.FC = () => {
    const { user: currentUser, showToast } = useContext(AppContext);
    const [labels, setLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [filter, setFilter] = useState('');
    
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await api.createLabel({
                ...formData,
                permissions
            });
            setCreatedResult(result);
            setLabels(prev => [...prev, result.label]);
            showToast('Branch established within network.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Onboarding failure.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            name: '', adminName: '', adminEmail: '', adminPassword: '',
            address: '', city: '', country: '', taxId: '', website: '', phone: '',
            revenueShare: 70, parentLabelId: ''
        });
        setCreatedResult(null);
        setStep(1);
        setIsModalOpen(true);
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

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Partner Nodes</h1>
                    <p className="text-gray-500 mt-1 font-medium">Administration of global distribution branches and revenue share policies.</p>
                </div>
                <Button onClick={handleOpenCreate} className="px-10 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Establish Node</Button>
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
                                <CardHeader className="border-white/5 pb-6 mb-6">
                                    <CardTitle className="group-hover:text-primary transition-colors truncate pr-16 text-xl font-black uppercase tracking-tight">{label.name}</CardTitle>
                                    <p className="text-[9px] font-mono text-gray-600 mt-2 uppercase tracking-tighter">NODE ID: {label.id?.toUpperCase() || 'UNKNOWN'}</p>
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={createdResult ? "Node Activated" : "Protocol: New Node Setup"} size="3xl">
                {!createdResult ? (
                    <form onSubmit={handleSave} className="space-y-10">
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
                                    <Input label="Lead Admin Name" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} required className="h-14 bg-black/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Lead Admin Email" type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required className="h-14 bg-black/40" />
                                    <Input label="Initial Vault Key" type="text" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} placeholder="Auto-generated if blank" className="h-14 bg-black/40" />
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
                                <Input label="Corporate Jurisdiction" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="h-14 bg-black/40" />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5 pb-4">Authority Protocol Matrix</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.keys(permissions).map(key => (
                                        <label key={key} className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-gray-800 hover:border-primary/40 cursor-pointer transition-all group">
                                            <div className="pr-4">
                                                <span className="text-xs text-white font-black uppercase group-hover:text-primary">
                                                    {key === 'canSubmitAlbums' ? 'Album Submission Authority' : key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                            <input type="checkbox" checked={(permissions as any)[key]} onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))} className="w-6 h-6 rounded-lg border-gray-700 bg-black text-primary focus:ring-primary" />
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
                                <Button type="submit" disabled={isLoading} className="px-12 h-14 text-[10px] font-black uppercase shadow-xl shadow-primary/20">
                                    {isLoading ? <Spinner className="w-5 h-5" /> : 'Execute Onboarding'}
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
        </div>
    );
};

export default Labels;


import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, User, UserRole, UserPermissions } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader } from '../components/ui';

const Labels: React.FC = () => {
    const { user: currentUser, showToast } = useContext(AppContext);
    const [labels, setLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [filter, setFilter] = useState('');
    
    // Result State
    const [createdResult, setCreatedResult] = useState<{label: Label, user: User} | null>(null);

    // Form State
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
    });

    const fetchLabels = async () => {
        setIsLoading(true);
        try {
            const data = await api.getLabels();
            setLabels(data);
        } catch (e) {
            showToast('Failed to load label partners.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === UserRole.OWNER) {
            fetchLabels();
        }
    }, [currentUser]);

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
            showToast('Label successfully onboarded to network.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Onboarding failed.', 'error');
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
            l.id.toLowerCase().includes(filter.toLowerCase()) ||
            l.country?.toLowerCase().includes(filter.toLowerCase())
        );
    }, [labels, filter]);

    if (isLoading && labels.length === 0) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic">Label Distribution Partners</h1>
                    <p className="text-gray-400 mt-1">Manage global distribution nodes, business metadata, and revenue sharing tiers.</p>
                </div>
                <Button onClick={handleOpenCreate} className="px-8 py-3 shadow-xl shadow-primary/20">Onboard New Label</Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <Input 
                    placeholder="Search by label name, ID, or region..." 
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLabels.map(label => (
                    <Card key={label.id} className="hover:border-primary/50 border border-gray-800 transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest ${label.status === 'Suspended' ? 'bg-red-500 text-white' : 'bg-primary text-black'}`}>
                            {label.status || 'Active'}
                        </div>
                        <CardHeader className="border-b border-gray-800/50 pb-4">
                            <CardTitle className="group-hover:text-primary transition-colors truncate pr-16">{label.name}</CardTitle>
                            <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase">Partner ID: {label.id}</p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Region</p>
                                    <p className="text-xs text-gray-200 font-bold">{label.country || 'Global'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Revenue Share</p>
                                    <p className="text-xs text-primary font-black">{label.revenueShare || 70}%</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-800/40 flex gap-2">
                                <Button variant="secondary" className="flex-1 text-[10px] uppercase font-black tracking-widest py-2">Audit Profile</Button>
                                <Button variant="secondary" className="flex-1 text-[10px] uppercase font-black tracking-widest py-2">Financials</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredLabels.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                        <p className="text-gray-600 font-bold uppercase tracking-widest">No label partners found</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={createdResult ? "Success" : "Onboard Distribution Partner"} size="3xl">
                {!createdResult ? (
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Progress Stepper */}
                        <div className="flex justify-between items-center px-4 mb-8">
                            {['Authentication', 'Metadata', 'Access'].map((n, i) => (
                                <React.Fragment key={n}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${step > i + 1 ? 'bg-primary text-black' : (step === i + 1 ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-gray-800 text-gray-600')}`}>
                                            {step > i + 1 ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${step === i + 1 ? 'text-white' : 'text-gray-600'}`}>{n}</span>
                                    </div>
                                    {i < 2 && <div className={`flex-1 h-[2px] mx-4 rounded-full ${step > i + 1 ? 'bg-primary/50' : 'bg-gray-800'}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Label Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Universal Records" />
                                    <Input label="Admin Full Name" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} required placeholder="e.g. John Smith" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Admin Email (Login ID)" type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required placeholder="admin@label.com" />
                                    <Input label="Set Password" type="text" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} placeholder="Leave blank to auto-generate" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input label="Tax ID / VAT Number" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="e.g. VAT123456" />
                                    <Input label="Business Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1..." />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Revenue Share (%)</label>
                                        <input type="number" value={formData.revenueShare} onChange={e => setFormData({...formData, revenueShare: parseInt(e.target.value)})} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
                                    </div>
                                </div>
                                <Input label="Office Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                    <Input label="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.keys(permissions).map(key => (
                                        <label key={key} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-primary/30 cursor-pointer transition-all">
                                            <span className="text-sm text-gray-200 capitalize font-bold">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <input 
                                                type="checkbox" 
                                                checked={(permissions as any)[key]} 
                                                onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                                                className="w-6 h-6 rounded border-gray-700 bg-gray-800 text-primary"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-8 border-t border-gray-800">
                            <Button type="button" variant="secondary" onClick={() => step === 1 ? setIsModalOpen(false) : setStep(s => s - 1)}>
                                {step === 1 ? 'Cancel' : 'Previous'}
                            </Button>
                            {step < 3 ? (
                                <Button type="button" onClick={() => setStep(s => s + 1)}>Continue</Button>
                            ) : (
                                <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : 'Finalize Onboarding'}</Button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        <div className="p-8 bg-primary/10 border border-primary/20 rounded-3xl text-center">
                            <div className="w-16 h-16 bg-primary text-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(29,185,84,0.4)]">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Partner Onboarded</h3>
                            <p className="text-gray-400 mt-2">Administrative credentials and business profile established.</p>
                        </div>

                        <div className="bg-black p-8 rounded-3xl border border-gray-800 space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Access Endpoint</span>
                                <span className="text-xs text-white underline">{window.location.origin}/#/login</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-900 pb-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Username</span>
                                <span className="text-xs text-white font-bold">{createdResult.user.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Temp Password</span>
                                <span className="text-lg text-primary font-black select-all tracking-wider">{createdResult.user.password}</span>
                            </div>
                        </div>

                        <Button onClick={() => setIsModalOpen(false)} className="w-full py-4 text-xs font-black uppercase tracking-widest">Return to Command Center</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Labels;

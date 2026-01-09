
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, User, UserPermissions } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader } from '../components/ui';

const SubLabels: React.FC = () => {
    const { user } = useContext(AppContext);
    const [subLabels, setSubLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newLabelInfo, setNewLabelInfo] = useState<{label: Label, user: User} | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({
        canManageArtists: true,
        canManageReleases: true,
        canCreateSubLabels: false,
    });

    const fetchSubLabels = async () => {
        if (user?.labelId) {
            setIsLoading(true);
            const labels = await api.getSubLabels(user.labelId);
            setSubLabels(labels);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubLabels();
    }, [user]);

    const handleOpenEdit = async (label: Label) => {
        setEditingLabelId(label.id);
        setNewName(label.name);
        setNewLabelInfo(null);
        
        // Fetch existing permissions
        const admin = await api.getLabelAdmin(label.id);
        if (admin) {
            setPermissions(admin.permissions);
            setNewEmail(admin.email);
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (label: Label) => {
        if (window.confirm(`Are you sure you want to remove Label "${label.name}"? All associated artists and sub-labels will lose access.`)) {
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
                // Update Existing
                await api.updateLabel(editingLabelId, newName, user as User);
                const admin = await api.getLabelAdmin(editingLabelId);
                if (admin) {
                    await api.updateUserPermissions(admin.id, permissions, user as User);
                }
                setSubLabels(prev => prev.map(l => l.id === editingLabelId ? { ...l, name: newName } : l));
                setIsModalOpen(false);
            } else {
                // Create New
                const result = await api.createSubLabel({
                    name: newName,
                    adminEmail: newEmail,
                    permissions,
                    parentLabelId: user.labelId
                });
                setNewLabelInfo(result);
                setSubLabels(prev => [...prev, result.label]);
            }
        } catch (error) {
            alert('Error updating sub-label');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && subLabels.length === 0) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Sub-Label Management</h1>
                <Button onClick={() => { setEditingLabelId(null); setNewLabelInfo(null); setNewName(''); setNewEmail(''); setIsModalOpen(true); }}>Create Sub-Label</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subLabels.map(label => (
                    <Card key={label.id} className="hover:border-primary border border-gray-700 transition-all group">
                        <CardHeader className="border-b border-gray-750 pb-4 flex flex-row justify-between items-start">
                            <CardTitle className="group-hover:text-primary transition-colors">{label.name}</CardTitle>
                            <button onClick={() => handleDelete(label)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-500 uppercase font-bold">System ID</span>
                                    <span className="text-xs text-gray-300 font-mono">{label.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Permissions</span>
                                    <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">Active</span>
                                </div>
                                <div className="pt-4 flex gap-2">
                                    <Button variant="secondary" className="flex-1 text-xs py-1" onClick={() => handleOpenEdit(label)}>Edit Settings</Button>
                                    <Button variant="secondary" className="flex-1 text-xs py-1">View Data</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {subLabels.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/20">
                        <p className="text-gray-500 italic">No sub-labels created yet.</p>
                        <Button variant="secondary" className="mt-4" onClick={() => setIsModalOpen(true)}>Add your first Sub-Label</Button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLabelId ? "Edit Sub-Label Settings" : "Add New Sub-Label"} size="2xl">
                {!newLabelInfo ? (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2">Label Identity</h4>
                            <Input label="Sub-Label Name" value={newName} onChange={e => setNewName(e.target.value)} required />
                            <Input label="Admin Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required disabled={!!editingLabelId} />
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2">Access Control</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.keys(permissions).map(key => (
                                    <label key={key} className="flex items-center justify-between bg-gray-750 p-3 rounded-lg border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors">
                                        <span className="text-sm text-gray-200 capitalize">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={(permissions as any)[key]} 
                                            onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                                            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary focus:ring-offset-gray-800"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : (editingLabelId ? 'Apply Changes' : 'Generate Credentials')}</Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 bg-green-900/10 border border-green-500/30 rounded-xl text-center">
                            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-green-400 font-bold text-xl">Sub-Label Created!</h3>
                            <p className="text-sm text-gray-400 mt-1">Copy and send these one-time credentials to your partner.</p>
                        </div>
                        
                        <div className="bg-black p-6 rounded-lg font-mono text-sm space-y-4 border border-gray-700 shadow-inner">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                                <span className="text-gray-500 uppercase text-[10px] font-bold">Admin Email</span>
                                <span className="text-white">{newLabelInfo.user.email}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                                <span className="text-gray-500 uppercase text-[10px] font-bold">Temporary Password</span>
                                <span className="text-primary font-bold text-lg select-all">{newLabelInfo.user.password}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 uppercase text-[10px] font-bold">Portal Access</span>
                                <span className="text-gray-400 underline truncate ml-4">{window.location.origin}/#/login</span>
                            </div>
                        </div>
                        
                        <Button onClick={() => { setIsModalOpen(false); setNewLabelInfo(null); }} className="w-full">Dismiss & Close</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SubLabels;

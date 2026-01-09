
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { User, UserPermissions, UserRole } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Spinner } from '../components/ui';

const Settings: React.FC = () => {
    const { user } = useContext(AppContext);
    const [subUsers, setSubUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [passwordChange, setPasswordChange] = useState({ old: '', new: '', confirm: '' });

    useEffect(() => {
        const fetchSubUsers = async () => {
            // Check if user has permission to manage sub-labels/users
            if (user?.labelId && user.permissions.canCreateSubLabels) {
                const allLabels = await api.getLabels();
                const myChildren = allLabels.filter(l => l.parentLabelId === user.labelId);
                const results: User[] = [];
                for (const l of myChildren) {
                    const admin = await api.getLabelAdmin(l.id);
                    if (admin) results.push(admin);
                }
                setSubUsers(results);
            }
            setIsLoading(false);
        };
        fetchSubUsers();
    }, [user]);

    const handleTogglePermission = async (subUserId: string, field: keyof UserPermissions, value: boolean) => {
        const targetUser = subUsers.find(u => u.id === subUserId);
        if (!targetUser) return;

        const updatedPermissions = { ...targetUser.permissions, [field]: value };
        try {
            const updatedUser = await api.updateUserPermissions(subUserId, updatedPermissions, user as User);
            setSubUsers(prev => prev.map(u => u.id === subUserId ? updatedUser : u));
        } catch (error) {
            alert('Failed to update permissions');
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Spinner /></div>;

    const canManageSubUsers = user?.permissions.canCreateSubLabels || user?.role === UserRole.LABEL_ADMIN;

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Security & Access</h1>
                    <p className="text-gray-400 mt-1">Manage your identity and delegate control to your team.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: My Profile */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Identity</h2>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Personal Account</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 py-2">
                                <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xl">
                                    {user?.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-bold">{user?.name}</p>
                                    <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
                                </div>
                            </div>
                            <Input label="Primary Email" value={user?.email} disabled />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Reset Password</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input label="Current Password" type="password" value={passwordChange.old} onChange={e => setPasswordChange({...passwordChange, old: e.target.value})} />
                            <Input label="New Password" type="password" value={passwordChange.new} onChange={e => setPasswordChange({...passwordChange, new: e.target.value})} />
                            <Button variant="secondary" className="w-full" onClick={() => {alert('Password updated for demo session.'); setPasswordChange({old:'', new:'', confirm:''})}}>Change Password</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Access Control */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Permissions Hierarchy</h2>
                    
                    {canManageSubUsers ? (
                        <div className="space-y-4">
                            {subUsers.length === 0 ? (
                                <div className="p-12 text-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/10">
                                    <p className="text-gray-500 italic">No Sub-Labels found that you manage. Create partners in the "Sub-Labels" tab to manage their access here.</p>
                                </div>
                            ) : subUsers.map(subUser => (
                                <Card key={subUser.id} className="border border-gray-700">
                                    <CardHeader className="flex flex-row justify-between items-center bg-gray-750/30 border-b border-gray-700 px-6 py-4">
                                        <div>
                                            <CardTitle className="text-lg">{subUser.name}</CardTitle>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{subUser.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded font-bold uppercase tracking-wider">
                                                {subUser.role}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(subUser.permissions).map(([key, val]) => (
                                            <div key={key} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl transition-all hover:border-gray-600">
                                                <div className="pr-4">
                                                    <p className="text-sm text-gray-100 font-medium capitalize">
                                                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                        {key === 'canCreateSubLabels' ? 'Ability to onboard child labels.' : 
                                                         `Manage ${key.replace('canManage', '').toLowerCase()} catalog.`}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => handleTogglePermission(subUser.id, key as keyof UserPermissions, !val)}
                                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner flex-shrink-0 ${val ? 'bg-primary' : 'bg-gray-700'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${val ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Restricted Access</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">Your permissions are managed by your Parent Label. Please contact them to adjust your feature access levels.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;


import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { User, UserRole, UserPermissions, EMPLOYEE_DESIGNATIONS } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader, Pagination } from '../components/ui';

// Add missing canSubmitAlbums and canDeleteReleases to satisfy Record<keyof UserPermissions, ...>
const PERMISSION_DESCRIPTIONS: Record<keyof UserPermissions, { title: string, subtitle: string }> = {
    canManageArtists: { title: "Artist Catalog", subtitle: "Manage artist profiles and logins" },
    canManageReleases: { title: "Distribution Queue", subtitle: "Review and approve incoming releases" },
    canCreateSubLabels: { title: "Sub-Label Access", subtitle: "Create and manage child labels" },
    canSubmitAlbums: { title: "Final Submission", subtitle: "Authorize final delivery to distribution" },
    canManageEmployees: { title: "Staff Management", subtitle: "Hire and modify platform employees" },
    canManageNetwork: { title: "Network Oversight", subtitle: "View global organization tree" },
    canViewFinancials: { title: "Financial Reports", subtitle: "Access royalty and revenue data" },
    canOnboardLabels: { title: "Partner Labels", subtitle: "Onboard new primary distribution nodes" },
    canDeleteReleases: { title: "Hard Purge Authority", subtitle: "Permanently delete releases and binary assets" }
};

const Employees: React.FC = () => {
    const { user: currentUser } = useContext(AppContext);
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmpInfo, setNewEmpInfo] = useState<User | null>(null);

    // Filter State
    const [filterQuery, setFilterQuery] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Form State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [designation, setDesignation] = useState<string>(EMPLOYEE_DESIGNATIONS[0]);
    const [permissions, setPermissions] = useState<UserPermissions>({
        canManageArtists: true,
        canManageReleases: true,
        canViewFinancials: false,
        canCreateSubLabels: false,
        canManageEmployees: false,
        canManageNetwork: false,
        canOnboardLabels: false,
        canDeleteReleases: false
    });

    const fetchEmployees = async () => {
        if (currentUser) {
            setIsLoading(true);
            try {
                const emps = await api.getEmployees(currentUser);
                setEmployees(emps);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [currentUser]);

    // Reset pagination
    useEffect(() => {
        setCurrentPage(1);
    }, [filterQuery, filterDesignation]);

    const getDesignationRank = (d?: string) => {
        if (!d) return 999;
        return EMPLOYEE_DESIGNATIONS.indexOf(d as any);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (editingUserId) {
                const updated = await api.updateEmployee(editingUserId, {
                    name: newName,
                    email: newEmail,
                    designation,
                    permissions
                }, currentUser);
                setEmployees(prev => prev.map(emp => emp.id === editingUserId ? updated : emp));
                setIsModalOpen(false);
            } else {
                const result = await api.addEmployee({
                    name: newName,
                    email: newEmail,
                    designation: designation,
                    permissions
                }, currentUser);
                setNewEmpInfo(result);
                setEmployees(prev => [...prev, result]);
            }
        } catch (error: any) {
            alert(error.message || 'Error processing staff update');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (emp: User) => {
        if (!currentUser) return;
        if (window.confirm(`Are you sure you want to terminate ${emp.name}? This cannot be undone.`)) {
            setIsLoading(true);
            try {
                await api.deleteEmployee(emp.id, currentUser);
                await fetchEmployees();
            } catch (e: any) {
                alert(e.message || 'Termination failed');
                setIsLoading(false);
            }
        }
    };

    const handleOpenEdit = (emp: User) => {
        setEditingUserId(emp.id);
        setNewName(emp.name);
        setNewEmail(emp.email);
        setDesignation(emp.designation || EMPLOYEE_DESIGNATIONS[0]);
        setPermissions({
            canManageArtists: emp.permissions.canManageArtists || false,
            canManageReleases: emp.permissions.canManageReleases || false,
            canCreateSubLabels: emp.permissions.canCreateSubLabels || false,
            canManageEmployees: emp.permissions.canManageEmployees || false,
            canManageNetwork: emp.permissions.canManageNetwork || false,
            canViewFinancials: emp.permissions.canViewFinancials || false,
            canOnboardLabels: emp.permissions.canOnboardLabels || false,
            canDeleteReleases: emp.permissions.canDeleteReleases || false,
            canSubmitAlbums: emp.permissions.canSubmitAlbums || false
        });
        setNewEmpInfo(null);
        setIsModalOpen(true);
    };

    const handleOpenCreate = () => {
        setEditingUserId(null);
        setNewName('');
        setNewEmail('');
        setDesignation(EMPLOYEE_DESIGNATIONS[0]);
        setPermissions({
            canManageArtists: true,
            canManageReleases: true,
            canViewFinancials: false,
            canCreateSubLabels: false,
            canManageEmployees: false,
            canManageNetwork: false,
            canOnboardLabels: false,
            canDeleteReleases: false,
            canSubmitAlbums: true
        });
        setNewEmpInfo(null);
        setIsModalOpen(true);
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
                                  emp.email.toLowerCase().includes(filterQuery.toLowerCase()) ||
                                  (emp.designation && emp.designation.toLowerCase().includes(filterQuery.toLowerCase()));
            const matchesDesignation = filterDesignation === 'ALL' || emp.designation === filterDesignation;
            return matchesSearch && matchesDesignation;
        });
    }, [employees, filterQuery, filterDesignation]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    if (isLoading && employees.length === 0) return <PageLoader />;

    const myRank = getDesignationRank(currentUser?.designation);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Corporate Personnel</h1>
                    <p className="text-gray-500 mt-1 font-medium">Administration of platform authority and team hierarchy.</p>
                </div>
                <Button onClick={handleOpenCreate} className="px-10 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Initialize Staff Onboarding</Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-2xl">
                <div className="flex-1 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <Input 
                        placeholder="Filter by keyword or designation..." 
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        className="pl-11 h-12 bg-black/20 border-gray-700"
                    />
                </div>
                <div className="w-full md:w-80">
                    <select 
                        value={filterDesignation}
                        onChange={e => setFilterDesignation(e.target.value)}
                        className="w-full bg-black/20 border border-gray-700 rounded-xl px-4 py-2 text-white h-12 text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="ALL">All Company Roles</option>
                        {EMPLOYEE_DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedEmployees.map(emp => {
                    const empRank = getDesignationRank(emp.designation);
                    const canManage = currentUser?.role === UserRole.OWNER || myRank < empRank;

                    return (
                        <Card key={emp.id} className={`p-0 overflow-hidden border ${canManage ? 'border-white/5' : 'border-white/[0.02] opacity-60'} bg-white/[0.02] hover:bg-white/[0.03] hover:border-primary/40 transition-all flex flex-col group shadow-2xl rounded-[2rem]`}>
                            <div className="p-8 pb-0">
                                <CardHeader className="flex flex-row justify-between items-start pb-4 border-white/5">
                                    <div className="min-w-0">
                                        <CardTitle className="text-xl truncate group-hover:text-primary transition-colors font-black uppercase tracking-tight">{emp.name}</CardTitle>
                                        <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-2 inline-block px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">{emp.designation}</p>
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-1 ml-4">
                                            <button onClick={() => handleOpenEdit(emp)} className="text-gray-600 hover:text-primary p-2.5 bg-white/5 rounded-xl transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-4 flex-grow flex flex-col pb-8">
                                    <p className="text-[11px] text-gray-500 font-mono tracking-tighter uppercase mb-6">{emp.email}</p>
                                    <div className="mt-auto">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(emp.permissions).filter(([_, val]) => val).map(([key]) => (
                                                <span key={key} className="text-[8px] bg-white/5 text-gray-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/5">
                                                    {PERMISSION_DESCRIPTIONS[key as keyof UserPermissions]?.title || key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                            {canManage && (
                                <button 
                                    onClick={() => handleDelete(emp)} 
                                    className="w-full py-4 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all border-t border-red-500/10"
                                >
                                    Terminate Access
                                </button>
                            )}
                        </Card>
                    );
                })}
                {filteredEmployees.length === 0 && (
                    <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                        <p className="text-xl font-black text-gray-700 uppercase tracking-[0.2em]">Zero Personnel Identified</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-center mt-8">
                <Pagination 
                    totalItems={filteredEmployees.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? "Revise Profile" : "Protocol: New Hire"} size="2xl">
                {!newEmpInfo ? (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Legal Full Name" value={newName} onChange={e => setNewName(e.target.value)} required className="h-14 bg-black/40 border-gray-800" />
                            <Input label="Corporate Auth Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-14 bg-black/40 border-gray-800" />
                        </div>
                        
                        <div>
                            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Enterprise Designation</label>
                            <select 
                                value={designation} 
                                onChange={e => setDesignation(e.target.value)}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-4 text-[11px] font-black uppercase tracking-widest text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                {EMPLOYEE_DESIGNATIONS.map(d => {
                                    const rank = getDesignationRank(d);
                                    const disabled = currentUser?.role !== UserRole.OWNER && rank <= myRank;
                                    return (
                                        <option key={d} value={d} disabled={disabled}>
                                            {d} {disabled ? '(Superior)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] border-b border-white/5 pb-3">Administrative Privileges</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(PERMISSION_DESCRIPTIONS).map(key => {
                                    const { title, subtitle } = PERMISSION_DESCRIPTIONS[key as keyof UserPermissions];
                                    return (
                                        <label key={key} className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-gray-800 hover:border-primary/30 cursor-pointer group transition-all">
                                            <div className="pr-4">
                                                <span className="block text-xs text-white font-black uppercase tracking-tight group-hover:text-primary transition-colors">{title}</span>
                                                <span className="block text-[8px] text-gray-600 uppercase tracking-widest mt-1 font-bold">{subtitle}</span>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={(permissions as any)[key]} 
                                                onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                                                className="w-6 h-6 rounded-lg border-gray-700 bg-black text-primary focus:ring-primary transition-all"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-10 border-t border-white/5">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest px-10">Abort</Button>
                            <Button type="submit" disabled={isLoading} className="text-[10px] font-black uppercase tracking-widest px-10 shadow-xl shadow-primary/20 h-14">
                                {isLoading ? <Spinner className="w-5 h-5" /> : (editingUserId ? 'Push Changes' : 'Confirm Access Grant')}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-10 py-6">
                        <div className="p-10 bg-primary/10 border border-primary/20 rounded-[2.5rem] text-center">
                            <h3 className="text-white font-black text-2xl uppercase tracking-tight">Access Token Generated</h3>
                            <p className="text-gray-500 mt-2 text-sm font-medium tracking-tight">The following credentials have been assigned to the new personnel.</p>
                        </div>
                        <div className="bg-black p-10 rounded-[2.5rem] font-mono text-sm space-y-8 border border-white/5 shadow-2xl">
                            <div className="space-y-2">
                                <span className="text-gray-700 uppercase text-[9px] font-black tracking-[0.4em]">Auth Point</span>
                                <p className="text-white font-bold text-base">{newEmpInfo.email}</p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-gray-700 uppercase text-[9px] font-black tracking-[0.4em]">One-Time Key</span>
                                <p className="text-primary font-black text-2xl tracking-[0.3em] bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 inline-block">{newEmpInfo.password}</p>
                            </div>
                        </div>
                        <Button onClick={() => { setIsModalOpen(false); setNewEmpInfo(null); }} className="w-full h-16 text-[11px] font-black uppercase tracking-[0.4em]">Close Gateway</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Employees;

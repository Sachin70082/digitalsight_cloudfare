import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { User, UserRole, UserPermissions, EMPLOYEE_DESIGNATIONS } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader } from '../components/ui';

const Employees: React.FC = () => {
    const { user: currentUser } = useContext(AppContext);
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmpInfo, setNewEmpInfo] = useState<User | null>(null);

    // Filter State
    const [filterQuery, setFilterQuery] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('ALL');

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
        setPermissions(emp.permissions);
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

    if (isLoading && employees.length === 0) return <PageLoader />;

    const myRank = getDesignationRank(currentUser?.designation);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Platform Team Management</h1>
                    <p className="text-gray-400 mt-1">Manage corporate staff hierarchy and assign system privileges.</p>
                </div>
                <Button onClick={handleOpenCreate}>Hire New Staff Member</Button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-gray-800/40 p-4 rounded-xl border border-gray-800/60">
                <div className="flex-1">
                    <Input 
                        placeholder="Search by name, email or designation keyword..." 
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        value={filterDesignation}
                        onChange={e => setFilterDesignation(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white h-[42px] text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="ALL">All Designations</option>
                        {EMPLOYEE_DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(emp => {
                    const empRank = getDesignationRank(emp.designation);
                    const canManage = currentUser?.role === UserRole.OWNER || myRank < empRank;

                    return (
                        <Card key={emp.id} className={`border ${canManage ? 'border-gray-800' : 'border-gray-800/40 opacity-80'} hover:border-primary/40 transition-all flex flex-col group`}>
                            <CardHeader className="flex flex-row justify-between items-start pb-2">
                                <div className="min-w-0">
                                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">{emp.name}</CardTitle>
                                    <p className="text-[10px] text-primary-dark font-black uppercase tracking-widest mt-0.5">{emp.designation}</p>
                                </div>
                                {canManage && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenEdit(emp)} className="text-gray-600 hover:text-primary p-1 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(emp)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="pt-2 flex-grow flex flex-col">
                                <p className="text-xs text-gray-500 font-mono mb-4">{emp.email}</p>
                                <div className="mt-auto pt-4 border-t border-gray-800/40">
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(emp.permissions).filter(([_, val]) => val).map(([key]) => (
                                            <span key={key} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-tight border border-primary/20">
                                                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {filteredEmployees.length === 0 && (
                    <div className="col-span-full py-24 text-center text-gray-600 border-2 border-dashed border-gray-800 rounded-2xl">
                        <p className="text-lg font-medium">No team members found</p>
                        <p className="text-sm mt-1">Try adjusting your search query or designation filter.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? "Update Team Member" : "Onboard Platform Staff"} size="2xl">
                {!newEmpInfo ? (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Full Name" value={newName} onChange={e => setNewName(e.target.value)} required />
                            <Input label="Corporate Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Company Designation</label>
                            <select 
                                value={designation} 
                                onChange={e => setDesignation(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                {EMPLOYEE_DESIGNATIONS.map(d => {
                                    const rank = getDesignationRank(d);
                                    const disabled = currentUser?.role !== UserRole.OWNER && rank <= myRank;
                                    return (
                                        <option key={d} value={d} disabled={disabled}>
                                            {d} {disabled ? '(Unauthorized)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Note: You can only manage staff with a lower rank than yours.</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-800 pb-2">Administrative Privilege Matrix</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.keys(permissions).map(key => (
                                    <label key={key} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer group transition-colors">
                                        <span className="text-xs text-gray-200 capitalize group-hover:text-primary transition-colors">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={(permissions as any)[key]} 
                                            onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                                            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner className="w-5 h-5" /> : (editingUserId ? 'Save Changes' : 'Confirm Hire')}</Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 bg-green-900/10 border border-green-500/30 rounded-xl text-center">
                            <h3 className="text-green-400 font-bold text-xl">Staff Onboarding Complete</h3>
                            <p className="text-sm text-gray-400 mt-1">The following credentials have been generated for the employee.</p>
                        </div>
                        <div className="bg-black p-6 rounded-lg font-mono text-sm space-y-4 border border-gray-800 shadow-xl">
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Username</span>
                                <span className="text-white">{newEmpInfo.email}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Designation</span>
                                <span className="text-primary-dark font-bold">{newEmpInfo.designation}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">Temp Password</span>
                                <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">{newEmpInfo.password}</span>
                            </div>
                        </div>
                        <Button onClick={() => { setIsModalOpen(false); setNewEmpInfo(null); }} className="w-full">Dismiss</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Employees;
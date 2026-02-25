import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, User, UserRole, UserPermissions } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Spinner, PageLoader, Pagination, Skeleton } from '../components/ui';
import { TrashIcon } from '../components/Icons';
import { PmaFieldset, PmaTable, PmaTR, PmaTD, PmaButton, PmaInput, PmaSelect, PmaStatusBadge, PmaPagination, PmaInfoBar } from '../components/PmaStyle';

// phpMyAdmin style Labels page for admin users
const PmaLabelsView: React.FC<{
    currentUser: any;
    labels: Label[];
    isLoading: boolean;
    filter: string;
    setFilter: (f: string) => void;
    blockedStatus: Record<string, boolean>;
    canManage: boolean;
    onOpenCreate: () => void;
    onOpenEdit: (label: Label) => void;
    onOpenDelete: (label: Label) => void;
    onOpenBlock: (label: Label) => void;
    currentPage: number;
    setCurrentPage: (n: number) => void;
    filteredLabels: Label[];
    paginatedLabels: Label[];
    itemsPerPage: number;
    // Modal props
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    step: number;
    setStep: (n: number) => void;
    formData: any;
    setFormData: (d: any) => void;
    permissions: UserPermissions;
    setPermissions: (p: UserPermissions) => void;
    editingLabelId: string | null;
    createdResult: {label: Label, user: User} | null;
    executeSync: () => void;
    handleSendResetEmail: () => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    labelToDelete: Label | null;
    isDeleting: boolean;
    confirmDelete: () => void;
    isBlockModalOpen: boolean;
    setIsBlockModalOpen: (open: boolean) => void;
    labelToBlock: Label | null;
    blockReason: string;
    setBlockReason: (r: string) => void;
    isBlocking: boolean;
    confirmBlock: () => void;
}> = (props) => {
    const {
        currentUser, labels, isLoading, filter, setFilter, blockedStatus, canManage,
        onOpenCreate, onOpenEdit, onOpenDelete, onOpenBlock,
        currentPage, setCurrentPage, filteredLabels, paginatedLabels, itemsPerPage,
        isModalOpen, setIsModalOpen, step, setStep, formData, setFormData,
        permissions, setPermissions, editingLabelId, createdResult, executeSync,
        handleSendResetEmail, isDeleteModalOpen, setIsDeleteModalOpen, labelToDelete,
        isDeleting, confirmDelete, isBlockModalOpen, setIsBlockModalOpen, labelToBlock,
        blockReason, setBlockReason, isBlocking, confirmBlock
    } = props;

    return (
        <div className="space-y-4">
            <PmaInfoBar>
                <strong>Database:</strong> partner_labels &nbsp;|&nbsp; 
                <strong>Records:</strong> {labels.length} &nbsp;|&nbsp;
                <strong>Active:</strong> {labels.filter(l => !blockedStatus[l.id]).length}
            </PmaInfoBar>

            <PmaFieldset legend="Partner Labels">
                <div className="p-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-end mb-4">
                        <PmaInput
                            label="Search"
                            value={filter}
                            onChange={setFilter}
                            placeholder="Search name, ID or region..."
                            className="flex-1 min-w-[200px]"
                        />
                        {canManage && (
                            <PmaButton variant="primary" onClick={onOpenCreate}>
                                + Create Label
                            </PmaButton>
                        )}
                    </div>

                    {/* Results count */}
                    <div className="text-xs text-[#666] mb-2">
                        Showing {paginatedLabels.length} of {filteredLabels.length} records
                    </div>

                    {/* Table */}
                    <PmaTable
                        headers={[
                            { label: 'Name' },
                            { label: 'ID' },
                            { label: 'Region' },
                            { label: 'Artist Limit', className: 'text-center' },
                            { label: 'Revenue Share', className: 'text-center' },
                            { label: 'Status', className: 'text-center' },
                            { label: 'Actions', className: 'text-center' }
                        ]}
                    >
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <PmaTR key={i}>
                                    <PmaTD>Loading...</PmaTD>
                                    <PmaTD>...</PmaTD>
                                    <PmaTD>...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                    <PmaTD className="text-center">...</PmaTD>
                                </PmaTR>
                            ))
                        ) : paginatedLabels.length === 0 ? (
                            <PmaTR>
                                <PmaTD colSpan={7} className="text-center py-8 text-[#999]">
                                    No records found
                                </PmaTD>
                            </PmaTR>
                        ) : paginatedLabels.map(label => (
                            <PmaTR key={label.id}>
                                <PmaTD isLabel>
                                    <span className="font-medium text-black">{label.name}</span>
                                </PmaTD>
                                <PmaTD>
                                    <span className="font-mono text-xs text-black">{label.id?.toUpperCase() || 'N/A'}</span>
                                </PmaTD>
                                <PmaTD className="text-black">{label.country || 'Global'}</PmaTD>
                                <PmaTD className="text-center text-black">
                                    {label.maxArtists === 0 ? 'Unlimited' : label.maxArtists || 10}
                                </PmaTD>
                                <PmaTD className="text-center">
                                    <span className="font-bold text-[#0066cc]">{label.revenueShare || 70}%</span>
                                </PmaTD>
                                <PmaTD className="text-center">
                                    <PmaStatusBadge status={blockedStatus[label.id] ? 'Suspended' : 'Active'} />
                                </PmaTD>
                                <PmaTD className="text-center">
                                    <div className="flex justify-center gap-2">
                                        {canManage && (
                                            <>
                                                <button onClick={() => onOpenEdit(label)} className="text-[#0066cc] hover:underline text-xs">Edit</button>
                                                <button onClick={() => onOpenBlock(label)} className={`${blockedStatus[label.id] ? 'text-[#009900]' : 'text-[#cc6600]'} hover:underline text-xs`}>
                                                    {blockedStatus[label.id] ? 'Unblock' : 'Block'}
                                                </button>
                                                <button onClick={() => onOpenDelete(label)} className="text-[#cc0000] hover:underline text-xs">Delete</button>
                                            </>
                                        )}
                                    </div>
                                </PmaTD>
                            </PmaTR>
                        ))}
                    </PmaTable>

                    <PmaPagination
                        currentPage={currentPage}
                        totalItems={filteredLabels.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </PmaFieldset>

            {/* Create/Edit Modal - phpMyAdmin Style */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={createdResult ? "Label Created" : (editingLabelId ? "Edit Label" : "Create New Label")} size="2xl">
                {!createdResult ? (
                    <form onSubmit={(e) => e.preventDefault()} className="p-4 space-y-4">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-6 border-b border-[#ccc] pb-4">
                            {['Auth', 'Business', 'Rights'].map((n, i) => (
                                <div key={n} className="flex items-center">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-[#009900] text-white' : (step === i + 1 ? 'bg-[#0066cc] text-white' : 'bg-[#f0f0f0] text-[#666] border border-[#ccc]')}`}>
                                        {step > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span className={`ml-2 text-xs font-bold ${step === i + 1 ? 'text-[#333]' : 'text-[#999]'}`}>{n}</span>
                                    {i < 2 && <div className={`w-12 h-0.5 mx-4 ${step > i + 1 ? 'bg-[#009900]' : 'bg-[#ccc]'}`} />}
                                </div>
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Label Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            required
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Admin Name</label>
                                        <input
                                            type="text"
                                            value={formData.adminName}
                                            onChange={e => setFormData({...formData, adminName: e.target.value})}
                                            required
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Admin Email</label>
                                        <input
                                            type="email"
                                            value={formData.adminEmail}
                                            onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                                            required
                                            disabled={!!editingLabelId}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none disabled:bg-[#f5f5f5] text-black"
                                        />
                                    </div>
                                    {!editingLabelId && (
                                        <div>
                                            <label className="block text-xs font-bold text-black mb-1">Initial Password</label>
                                            <input
                                                type="text"
                                                value={formData.adminPassword}
                                                onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                                                placeholder="Auto-generated if blank"
                                                className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                            />
                                        </div>
                                    )}
                                </div>
                                {editingLabelId && (
                                    <div className="bg-[#fff3cd] border border-[#856404] p-3 flex justify-between items-center">
                                        <span className="text-sm text-[#856404]">Send password reset link to admin</span>
                                        <PmaButton variant="secondary" onClick={handleSendResetEmail} disabled={isLoading}>
                                            Send Reset Link
                                        </PmaButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Tax ID</label>
                                        <input
                                            type="text"
                                            value={formData.taxId}
                                            onChange={e => setFormData({...formData, taxId: e.target.value})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Phone</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Revenue Share (%)</label>
                                        <input
                                            type="number"
                                            value={formData.revenueShare}
                                            onChange={e => setFormData({...formData, revenueShare: parseInt(e.target.value)})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={e => setFormData({...formData, country: e.target.value})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Artist Limit</label>
                                        <select
                                            value={formData.maxArtists}
                                            onChange={e => setFormData({...formData, maxArtists: parseInt(e.target.value)})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black bg-white"
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Website</label>
                                        <input
                                            type="text"
                                            value={formData.website}
                                            onChange={e => setFormData({...formData, website: e.target.value})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-black mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            className="w-full border-2 border-[#ccc] px-3 py-2 text-sm focus:border-[#0066cc] outline-none text-black"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-black uppercase border-b border-[#ccc] pb-2">Permissions</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.keys(permissions).map(key => (
                                        <label key={key} className="flex items-center justify-between border border-[#ccc] p-3 hover:bg-[#f5f5f5] cursor-pointer">
                                            <span className="text-sm text-black">
                                                {key === 'canSubmitAlbums' ? 'Album Submission' : key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={(permissions as any)[key]}
                                                onChange={e => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                                                className="w-5 h-5"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4 border-t border-[#ccc]">
                            <PmaButton variant="secondary" onClick={() => step === 1 ? setIsModalOpen(false) : setStep(s => s - 1)}>
                                {step === 1 ? 'Cancel' : 'Back'}
                            </PmaButton>
                            {step < 3 ? (
                                <PmaButton variant="primary" onClick={() => setStep(s => s + 1)}>
                                    Next
                                </PmaButton>
                            ) : (
                                <PmaButton variant="primary" onClick={executeSync} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : (editingLabelId ? 'Update' : 'Create')}
                                </PmaButton>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="bg-[#e8f4e8] border border-[#009900] p-4">
                            <p className="text-[#009900] font-bold">Label created successfully!</p>
                        </div>
                        <div className="border-2 border-[#ccc] p-4 space-y-3">
                            <div>
                                <span className="text-xs text-[#666]">Auth Endpoint</span>
                                <p className="font-medium">{createdResult.user.email}</p>
                            </div>
                            <div>
                                <span className="text-xs text-[#666]">Master Key</span>
                                <p className="font-mono text-lg bg-[#f5f5f5] px-3 py-2 border border-[#ccc] inline-block">{createdResult.user.password}</p>
                            </div>
                        </div>
                        <PmaButton variant="primary" onClick={() => setIsModalOpen(false)} className="w-full">
                            Close
                        </PmaButton>
                    </div>
                )}
            </Modal>

            {/* Block Modal */}
            <Modal isOpen={isBlockModalOpen} onClose={() => !isBlocking && setIsBlockModalOpen(false)} title={blockedStatus[labelToBlock?.id || ''] ? "Restore Access" : "Suspend Access"} size="md">
                <div className="p-4 space-y-4">
                    <div className={`p-4 ${blockedStatus[labelToBlock?.id || ''] ? 'bg-[#e8f4e8] border border-[#009900]' : 'bg-[#ffcccc] border border-[#cc0000]'}`}>
                        <p className={`font-bold ${blockedStatus[labelToBlock?.id || ''] ? 'text-[#009900]' : 'text-[#cc0000]'}`}>
                            {blockedStatus[labelToBlock?.id || ''] ? 'Restore access' : 'Suspend access'} for "{labelToBlock?.name}"?
                        </p>
                    </div>
                    {!blockedStatus[labelToBlock?.id || ''] && (
                        <div>
                            <label className="block text-xs font-bold text-[#666] mb-1">Suspension Reason</label>
                            <textarea
                                value={blockReason}
                                onChange={e => setBlockReason(e.target.value)}
                                className="w-full border-2 border-[#ccc] p-3 text-sm min-h-[80px] focus:border-[#cc0000] outline-none"
                                placeholder="Enter reason for suspension..."
                            />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <PmaButton variant="secondary" onClick={() => setIsBlockModalOpen(false)} disabled={isBlocking}>Cancel</PmaButton>
                        <PmaButton variant={blockedStatus[labelToBlock?.id || ''] ? "primary" : "danger"} onClick={confirmBlock} disabled={isBlocking}>
                            {isBlocking ? 'Processing...' : (blockedStatus[labelToBlock?.id || ''] ? 'Restore' : 'Suspend')}
                        </PmaButton>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} title="Delete Label" size="md">
                <div className="p-4 space-y-4">
                    <div className="p-4 bg-[#ffcccc] border border-[#cc0000]">
                        <p className="font-bold text-[#cc0000]">
                            Are you sure you want to delete "{labelToDelete?.name}"?
                        </p>
                        <p className="text-xs text-[#cc0000] mt-2">
                            This action is irreversible and will delete all associated data (artists, releases, users).
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <PmaButton variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</PmaButton>
                        <PmaButton variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </PmaButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Original dark theme Labels for partner users (unchanged)
const PartnerLabelsView: React.FC<{
    currentUser: any;
    labels: Label[];
    isLoading: boolean;
    filter: string;
    setFilter: (f: string) => void;
    blockedStatus: Record<string, boolean>;
    canManage: boolean;
    onOpenCreate: () => void;
    onOpenEdit: (label: Label) => void;
    onOpenDelete: (label: Label) => void;
    onOpenBlock: (label: Label) => void;
    currentPage: number;
    setCurrentPage: (n: number) => void;
    filteredLabels: Label[];
    paginatedLabels: Label[];
    itemsPerPage: number;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    step: number;
    setStep: (n: number) => void;
    formData: any;
    setFormData: (d: any) => void;
    permissions: UserPermissions;
    setPermissions: (p: UserPermissions) => void;
    editingLabelId: string | null;
    createdResult: {label: Label, user: User} | null;
    executeSync: () => void;
    handleSendResetEmail: () => void;
    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (open: boolean) => void;
    labelToDelete: Label | null;
    isDeleting: boolean;
    confirmDelete: () => void;
    isBlockModalOpen: boolean;
    setIsBlockModalOpen: (open: boolean) => void;
    labelToBlock: Label | null;
    blockReason: string;
    setBlockReason: (r: string) => void;
    isBlocking: boolean;
    confirmBlock: () => void;
}> = (props) => {
    const {
        currentUser, labels, isLoading, filter, setFilter, blockedStatus, canManage,
        onOpenCreate, onOpenEdit, onOpenDelete, onOpenBlock,
        currentPage, setCurrentPage, filteredLabels, paginatedLabels, itemsPerPage,
        isModalOpen, setIsModalOpen, step, setStep, formData, setFormData,
        permissions, setPermissions, editingLabelId, createdResult, executeSync,
        handleSendResetEmail, isDeleteModalOpen, setIsDeleteModalOpen, labelToDelete,
        isDeleting, confirmDelete, isBlockModalOpen, setIsBlockModalOpen, labelToBlock,
        blockReason, setBlockReason, isBlocking, confirmBlock
    } = props;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Partner Nodes</h1>
                    <p className="text-gray-500 mt-1 font-medium">Administration of global distribution branches and revenue share policies.</p>
                </div>
                <Button onClick={onOpenCreate} className="px-10 h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Establish Label</Button>
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
                    {isLoading && labels.length === 0 ? (
                        [...Array(6)].map((_, i) => (
                            <Card key={i} className="p-0 overflow-hidden group">
                                <div className="p-8">
                                    <CardHeader className="flex flex-row justify-between items-start">
                                        <div className="min-w-0 w-full">
                                            <Skeleton className="h-6 w-3/4 mb-2" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <Skeleton className="h-2 w-12" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <Skeleton className="h-2 w-12" />
                                                <Skeleton className="h-4 w-10" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-10 w-full rounded-2xl" />
                                    </CardContent>
                                </div>
                            </Card>
                        ))
                    ) : paginatedLabels.map(label => (
                        <Card key={label.id} className="p-0 overflow-hidden group">
                            <div className="p-8">
                                <CardHeader className="flex flex-row justify-between items-start">
                                    <div className="min-w-0">
                                        <CardTitle className="group-hover:text-primary transition-colors truncate text-xl font-black uppercase tracking-tight">{label.name}</CardTitle>
                                        <p className="text-[9px] font-mono text-gray-600 mt-2 uppercase tracking-tighter">NODE ID: {label.id?.toUpperCase() || 'UNKNOWN'}</p>
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => onOpenEdit(label)}
                                                className="p-2.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                title="Revise Node"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => onOpenDelete(label)}
                                                className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Terminate Node"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => onOpenBlock(label)}
                                                className={`p-2.5 rounded-xl transition-all ${blockedStatus[label.id] ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                                                title={blockedStatus[label.id] ? "Unblock Node" : "Block Node"}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
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
                                    <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] ml-1">Authority Status</span>
                                        <span className={`text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-wider ${blockedStatus[label.id] ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                            {blockedStatus[label.id] ? 'Suspended' : 'Active'}
                                        </span>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
                <Pagination totalItems={filteredLabels.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            {/* Modals - same as original */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={createdResult ? "Node Activated" : (editingLabelId ? "Protocol: Revise Node" : "Protocol: New Node Setup")} size="3xl">
                {!createdResult ? (
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
                        <div className="flex justify-between items-center px-10">
                            {['Auth', 'Business', 'Rights'].map((n, i) => (
                                <div key={n} className="contents">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step > i + 1 ? 'bg-primary text-black' : (step === i + 1 ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-gray-800 text-gray-600')}`}>
                                            {step > i + 1 ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step === i + 1 ? 'text-white' : 'text-gray-700'}`}>{n}</span>
                                    </div>
                                    {i < 2 && <div className={`flex-1 h-px mx-6 ${step > i + 1 ? 'bg-primary/50' : 'bg-gray-800'}`} />}
                                </div>
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Registry Title" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-14 bg-black/40" />
                                    <Input label="Lead Admin Name" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} required className="h-14 bg-black/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Lead Admin Email" type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required className="h-14 bg-black/40" disabled={!!editingLabelId} />
                                    {!editingLabelId && (
                                        <Input label="Initial Vault Key" type="text" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} placeholder="Auto-generated if blank" className="h-14 bg-black/40" />
                                    )}
                                </div>
                                {editingLabelId && (
                                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-white font-black uppercase">Security Protocol</p>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Dispatch a secure password reset link to the lead admin.</p>
                                            </div>
                                            <Button type="button" variant="secondary" onClick={handleSendResetEmail} disabled={isLoading} className="px-6 py-2 text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/10">Send Reset Link</Button>
                                        </div>
                                    </div>
                                )}
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
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Artist Limit</label>
                                        <select
                                            value={formData.maxArtists}
                                            onChange={e => setFormData({...formData, maxArtists: parseInt(e.target.value)})}
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

    // Blocking State
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [labelToBlock, setLabelToBlock] = useState<Label | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [isBlocking, setIsBlocking] = useState(false);
    const [blockedStatus, setBlockedStatus] = useState<Record<string, boolean>>({});

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
        maxArtists: 10,
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

    useEffect(() => {
        const fetchBlockedStatuses = async () => {
            const statuses: Record<string, boolean> = {};
            for (const label of labels) {
                const admin = await api.getLabelAdmin(label.id);
                if (admin && admin.isBlocked) {
                    statuses[label.id] = true;
                }
            }
            setBlockedStatus(statuses);
        };
        if (labels.length > 0) {
            fetchBlockedStatuses();
        }
    }, [labels]);

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
        if (!currentUser || !labelToBlock) return;
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

    const executeSync = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (editingLabelId) {
                await api.updateLabel(editingLabelId, {
                    name: formData.name,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    taxId: formData.taxId,
                    website: formData.website,
                    phone: formData.phone,
                    revenueShare: formData.revenueShare,
                    maxArtists: formData.maxArtists
                });
                
                const admin = await api.getLabelAdmin(editingLabelId);
                if (admin) {
                    await api.updateUserPermissions(admin.id, permissions, currentUser);
                    if (formData.adminName !== admin.name) {
                        await api.updateUser(admin.id, { name: formData.adminName });
                    }
                }
                
                showToast(`Node "${formData.name}" configuration synchronized.`, 'success');
                setIsModalOpen(false);
                await fetchLabels();
            } else {
                const result = await api.createLabel({
                    ...formData,
                    permissions
                } as any);
                const castedResult = result as any;
                setCreatedResult(castedResult);
                setLabels(prev => [...prev, castedResult.label]);
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
            // Use window.confirm as a final check if not already confirmed by modal
            if (!window.confirm(`Are you absolutely sure you want to delete "${labelToDelete.name}"? This will delete all associated artists, releases, and users.`)) {
                setIsDeleting(false);
                return;
            }
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
            revenueShare: 70, maxArtists: 10, parentLabelId: ''
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
                maxArtists: label.maxArtists || 10,
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

    const handleSendResetEmail = async () => {
        if (!editingLabelId) return;
        setIsLoading(true);
        try {
            const admin = await api.getLabelAdmin(editingLabelId);
            if (admin && admin.email) {
                await api.sendPasswordResetEmail(admin.email);
                showToast(`Security reset link dispatched to ${admin.email}.`, 'success');
            } else {
                showToast('No administrative authority found for this node.', 'error');
            }
        } catch (e) {
            showToast('Failed to dispatch security reset link.', 'error');
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

    const canManage = currentUser?.role === UserRole.OWNER ||
                      currentUser?.designation === "Co-Founder / Operations Head" ||
                      currentUser?.permissions?.canOnboardLabels;

    const isPlatformSide = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.EMPLOYEE;

    // Use phpMyAdmin style for admin/employee users
    if (isPlatformSide) {
        return (
            <PmaLabelsView
                currentUser={currentUser}
                labels={labels}
                isLoading={isLoading}
                filter={filter}
                setFilter={setFilter}
                blockedStatus={blockedStatus}
                canManage={canManage}
                onOpenCreate={handleOpenCreate}
                onOpenEdit={handleOpenEdit}
                onOpenDelete={handleOpenDelete}
                onOpenBlock={handleOpenBlock}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                filteredLabels={filteredLabels}
                paginatedLabels={paginatedLabels}
                itemsPerPage={itemsPerPage}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                step={step}
                setStep={setStep}
                formData={formData}
                setFormData={setFormData}
                permissions={permissions}
                setPermissions={setPermissions}
                editingLabelId={editingLabelId}
                createdResult={createdResult}
                executeSync={executeSync}
                handleSendResetEmail={handleSendResetEmail}
                isDeleteModalOpen={isDeleteModalOpen}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                labelToDelete={labelToDelete}
                isDeleting={isDeleting}
                confirmDelete={confirmDelete}
                isBlockModalOpen={isBlockModalOpen}
                setIsBlockModalOpen={setIsBlockModalOpen}
                labelToBlock={labelToBlock}
                blockReason={blockReason}
                setBlockReason={setBlockReason}
                isBlocking={isBlocking}
                confirmBlock={confirmBlock}
            />
        );
    }

    // Use dark theme for partner users
    return (
        <PartnerLabelsView
            currentUser={currentUser}
            labels={labels}
            isLoading={isLoading}
            filter={filter}
            setFilter={setFilter}
            blockedStatus={blockedStatus}
            canManage={canManage}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            onOpenDelete={handleOpenDelete}
            onOpenBlock={handleOpenBlock}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            filteredLabels={filteredLabels}
            paginatedLabels={paginatedLabels}
            itemsPerPage={itemsPerPage}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            step={step}
            setStep={setStep}
            formData={formData}
            setFormData={setFormData}
            permissions={permissions}
            setPermissions={setPermissions}
            editingLabelId={editingLabelId}
            createdResult={createdResult}
            executeSync={executeSync}
            handleSendResetEmail={handleSendResetEmail}
            isDeleteModalOpen={isDeleteModalOpen}
            setIsDeleteModalOpen={setIsDeleteModalOpen}
            labelToDelete={labelToDelete}
            isDeleting={isDeleting}
                confirmDelete={confirmDelete}
                isBlockModalOpen={isBlockModalOpen}
            setIsBlockModalOpen={setIsBlockModalOpen}
            labelToBlock={labelToBlock}
            blockReason={blockReason}
            setBlockReason={setBlockReason}
            isBlocking={isBlocking}
            confirmBlock={confirmBlock}
        />
    );
};

export default Labels;

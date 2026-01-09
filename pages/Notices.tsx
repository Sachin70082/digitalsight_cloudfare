import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Notice, NoticeType, UserRole, EMPLOYEE_DESIGNATIONS, NoticeAudience } from '../types';
import { Button, Input, Modal, Spinner, PageLoader, Textarea } from '../components/ui';

const NOTICE_STYLING: Record<NoticeType, string> = {
    [NoticeType.URGENT]: 'border-red-500/50 bg-red-900/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    [NoticeType.UPDATE]: 'border-blue-500/50 bg-blue-900/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    [NoticeType.POLICY]: 'border-purple-500/50 bg-purple-900/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
    [NoticeType.GENERAL]: 'border-green-500/50 bg-green-900/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    [NoticeType.EVENT]: 'border-yellow-500/50 bg-yellow-900/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
};

const Notices: React.FC = () => {
    const { user: currentUser } = useContext(AppContext);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Deletion State
    const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NoticeType>(NoticeType.GENERAL);
    const [target, setTarget] = useState<NoticeAudience>('ALL_STAFF');

    const fetchNotices = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const data = await api.getNotices(currentUser);
            setNotices(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, [currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (editingId) {
                await api.updateNotice(editingId, { title, message, type, targetAudience: target }, currentUser);
            } else {
                await api.addNotice({ title, message, type, targetAudience: target }, currentUser);
            }
            await fetchNotices();
            setIsFormModalOpen(false);
        } catch (err: any) {
            alert(err.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDelete = (id: string) => {
        setNoticeToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentUser || !noticeToDelete) return;
        setIsDeleting(true);
        try {
            await api.deleteNotice(noticeToDelete, currentUser);
            await fetchNotices();
            setIsDeleteModalOpen(false);
            setNoticeToDelete(null);
        } catch (err: any) {
            alert(err.message || 'Delete failed');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setTitle('');
        setMessage('');
        setType(NoticeType.GENERAL);
        setTarget('ALL_STAFF');
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (n: Notice) => {
        setEditingId(n.id);
        setTitle(n.title);
        setMessage(n.message);
        setType(n.type);
        setTarget(n.targetAudience);
        setIsFormModalOpen(true);
    };

    const getRank = (d?: string) => {
        if (!d) return 999;
        return EMPLOYEE_DESIGNATIONS.indexOf(d as any);
    };

    const myRank = getRank(currentUser?.designation);

    if (isLoading && notices.length === 0) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Corporate Notice Board</h1>
                    <p className="text-gray-400 mt-2 text-lg">Official platform directives and communications.</p>
                </div>
                <Button onClick={handleOpenCreate} className="px-8 py-3 shadow-xl shadow-primary/20">Post New Notice</Button>
            </div>

            <div className="space-y-6">
                {notices.map(notice => {
                    const isAuthor = notice.authorId === currentUser?.id;
                    const canEdit = isAuthor || currentUser?.role === UserRole.OWNER;
                    
                    return (
                        <div 
                            key={notice.id} 
                            className={`p-6 rounded-3xl border-2 transition-all duration-300 ${NOTICE_STYLING[notice.type]} border-l-[12px] group relative`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{notice.type}</span>
                                    {notice.type === NoticeType.URGENT && (
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                         <p className="text-[10px] text-gray-500 font-mono uppercase font-bold">{new Date(notice.timestamp).toLocaleDateString()}</p>
                                         <p className="text-[9px] text-gray-600 font-mono uppercase mt-1">{new Date(notice.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(notice)} 
                                                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                                                title="Edit Notice"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleOpenDelete(notice.id)} 
                                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-gray-400 hover:text-red-500"
                                                title="Remove Notice"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{notice.title}</h2>
                            <p className="text-gray-300 leading-relaxed text-lg mb-6 whitespace-pre-wrap">{notice.message}</p>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-t border-white/5 pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl text-primary border border-white/10">
                                        {notice.authorName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white uppercase tracking-wider">{notice.authorName}</p>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{notice.authorDesignation}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Notice Audience</p>
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${
                                        notice.targetAudience === 'EVERYONE' ? 'bg-primary/10 border-primary text-primary' : 
                                        notice.targetAudience === 'ALL_LABELS' ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
                                        notice.targetAudience === 'ALL_ARTISTS' ? 'bg-green-500/10 border-green-500 text-green-400' :
                                        'bg-white/5 border-white/10 text-gray-400'
                                    }`}>
                                        {notice.targetAudience === 'ALL_STAFF' ? 'Internal Staff Only' : 
                                         notice.targetAudience === 'ALL_LABELS' ? 'All Partner Labels' :
                                         notice.targetAudience === 'ALL_ARTISTS' ? 'All Artist Portal Users' :
                                         notice.targetAudience === 'EVERYONE' ? 'Global Broadcast' :
                                         notice.targetAudience}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Creation/Edit Modal */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingId ? "Revise Board Notice" : "Broadcast Board Notice"} size="2xl">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Notice Classification</label>
                            <select 
                                value={type}
                                onChange={e => setType(e.target.value as NoticeType)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                            >
                                {Object.values(NoticeType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Target Visibility</label>
                            <select 
                                value={target}
                                onChange={e => setTarget(e.target.value as any)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
                            >
                                <optgroup label="Internal Staff">
                                    <option value="ALL_STAFF">Broadcast to All Internal Staff</option>
                                    {EMPLOYEE_DESIGNATIONS.map(d => {
                                        const rank = getRank(d);
                                        const disabled = currentUser?.role !== UserRole.OWNER && rank <= myRank;
                                        return (
                                            <option key={d} value={d} disabled={disabled}>
                                                Internal: {d} {disabled ? '(Superior Level)' : ''}
                                            </option>
                                        );
                                    })}
                                </optgroup>
                                <optgroup label="External Partners">
                                    <option value="ALL_LABELS">All Partner Labels (Incl. Sub-Labels)</option>
                                    <option value="ALL_ARTISTS">All Artists (Direct Access)</option>
                                </optgroup>
                                <optgroup label="Global">
                                    <option value="EVERYONE">Global Broadcast (All Portal Users)</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <Input 
                        label="Headline" 
                        placeholder="Notice heading..." 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required 
                    />

                    <Textarea 
                        label="Message Body" 
                        placeholder="Detailed directive message..." 
                        rows={8} 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        required 
                    />

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                        <Button type="button" variant="secondary" onClick={() => setIsFormModalOpen(false)}>Discard</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : (editingId ? 'Update Notice' : 'Post to Board')}</Button>
                    </div>
                </form>
            </Modal>

            {/* Deletion Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion" size="md">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                        This notice will be permanently removed from all staff and partner dashboards. This action cannot be undone.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Spinner className="w-4 h-4" /> : 'Yes, Delete Post'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #282828; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default Notices;
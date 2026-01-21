
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Artist, ArtistType, User, UserRole, Label } from '../types';
import { Button, Card, Input, Modal, Spinner, PageLoader, Pagination, Table, THead, TBody, TR, TH, TD, Skeleton } from '../components/ui';

const ArtistForm: React.FC<{
    initialData?: Artist, 
    onSave: (data: {artist: Artist, user?: User}) => void, 
    onClose: () => void
}> = ({ initialData, onSave, onClose }) => {
    const { user, showToast } = useContext(AppContext);
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<ArtistType>(initialData?.type || ArtistType.SINGER);
    const [email, setEmail] = useState(initialData?.email || '');
    const [spotifyId, setSpotifyId] = useState(initialData?.spotifyId || '');
    const [appleMusicId, setAppleMusicId] = useState(initialData?.appleMusicId || '');
    const [instagramUrl, setInstagramUrl] = useState(initialData?.instagramUrl || '');
    const [targetLabelId, setTargetLabelId] = useState(initialData?.labelId || user?.labelId || '');
    const [hierarchyLabels, setHierarchyLabels] = useState<Label[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadHierarchy = async () => {
            if (user?.labelId) {
                const subLabels = await api.getSubLabels(user.labelId);
                const selfLabel = await api.getLabel(user.labelId);
                setHierarchyLabels(selfLabel ? [selfLabel, ...subLabels] : subLabels);
            }
        };
        loadHierarchy();
    }, [user]);

    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const artistData = {
            name,
            type,
            email,
            spotifyId,
            appleMusicId,
            instagramUrl,
            labelId: targetLabelId,
        };
        
        try {
            if (isEditing) {
                const updatedArtist = await api.updateArtist(initialData.id, artistData, user as User);
                showToast(`Profile for ${name} updated successfully.`, 'success');
                onSave({ artist: updatedArtist });
            } else {
                // Check artist limit
                const targetLabel = hierarchyLabels.find(l => l.id === targetLabelId);
                if (targetLabel && targetLabel.maxArtists !== undefined && targetLabel.maxArtists !== 0) {
                    const allArtists = await api.getAllArtists();
                    const currentCount = allArtists.filter(a => a.labelId === targetLabelId).length;
                    if (currentCount >= targetLabel.maxArtists) {
                        throw new Error(`Artist limit reached for this label (${targetLabel.maxArtists}). Please contact support to upgrade.`);
                    }
                }

                const result = await api.addArtist(artistData);
                showToast(`New artist ${name} onboarded.`, 'success');
                onSave(result);
            }
        } catch (err: any) {
            showToast(err.message || 'Failed to save artist details', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {hierarchyLabels.length > 1 && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-4">
                    <label className="block text-[11px] font-black text-primary uppercase tracking-widest mb-2">Target Node Assignment</label>
                    <select 
                        value={targetLabelId} 
                        onChange={e => setTargetLabelId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                    >
                        {hierarchyLabels.map(l => (
                            <option key={l.id} value={l.id}>
                                {l.id === user?.labelId ? `[MASTER] ${l.name}` : `↳ [CHILD] ${l.name}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Artist/Band Name" value={name} onChange={e => setName(e.target.value)} required placeholder="Stage Name" />
                <div>
                    <label htmlFor="artistType" className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Primary Role</label>
                    <select 
                        id="artistType"
                        value={type} 
                        onChange={e => setType(e.target.value as ArtistType)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                    >
                        {Object.values(ArtistType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-4 border-t border-white/5 pt-4 mt-2">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact & Portal Access</h4>
                <Input label="Official Identity Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email for secure portal login" />
            </div>

            <div className="space-y-4 border-t border-white/5 pt-4 mt-2">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Store Profile Mappings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Spotify Artist ID" value={spotifyId} onChange={e => setSpotifyId(e.target.value)} placeholder="e.g. 5444a57..." />
                    <Input label="Apple Music ID" value={appleMusicId} onChange={e => setAppleMusicId(e.target.value)} placeholder="e.g. 14407..." />
                </div>
                <Input label="Instagram Handle/URL" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-white/5 mt-4">
                <Button type="button" variant="secondary" onClick={onClose} className="text-[10px] font-black px-8">Discard</Button>
                <Button type="submit" disabled={isLoading} className="text-[10px] font-black px-8">{isLoading ? <Spinner className="w-4 h-4" /> : (isEditing ? 'Sync Changes' : 'Initialize Profile')}</Button>
            </div>
        </form>
    );
};

const Artists: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
    const [newCredentials, setNewCredentials] = useState<User | null>(null);
    const [justCreated, setJustCreated] = useState<Artist | null>(null);
    const [filter, setFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Delete Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const fetchArtists = async () => {
        setIsLoading(true);
        try {
            if (user?.role === UserRole.OWNER || user?.role === UserRole.EMPLOYEE) {
                const data = await api.getAllArtists();
                setArtists(Array.isArray(data) ? data : []);
            } else if (user?.labelId) {
                // api.getArtistsByLabel is now hierarchical
                const data = await api.getArtistsByLabel(user.labelId);
                setArtists(Array.isArray(data) ? data : []);
            }
        } catch (err: any) {
            showToast('Failed to load artist catalog.', 'error');
            setArtists([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArtists();
    }, [user]);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const handleArtistSaved = (result: {artist: Artist, user?: User}) => {
        // Refresh the entire list from the server to ensure we have the correct data
        fetchArtists();
        
        // Close modal and reset states
        setIsModalOpen(false);
        setEditingArtist(null);
        setNewCredentials(null);
        setJustCreated(null);
        
        if (!editingArtist && result.user) {
            showToast(`Artist created. Password: ${result.user.password}`, 'success');
        } else if (editingArtist) {
            showToast(`Artist profile updated.`, 'success');
        }
    };

    const handleOpenEdit = (artist: Artist) => {
        setNewCredentials(null);
        setJustCreated(null);
        setEditingArtist(artist);
        setIsModalOpen(true);
    };

    const handleOpenDelete = (artist: Artist) => {
        setArtistToDelete(artist);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!user || !artistToDelete) return;
        setIsDeleting(true);
        try {
            await api.deleteArtist(artistToDelete.id, user);
            showToast(`${artistToDelete.name} successfully removed from catalog.`, 'success');
            setIsDeleteModalOpen(false);
            setArtistToDelete(null);
            await fetchArtists();
        } catch (err: any) {
            showToast(err.message || 'Deletion blocked by active releases.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredArtists = useMemo(() => {
        return artists.filter(artist =>
            (artist?.name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
            (artist?.type?.toLowerCase() || '').includes(filter.toLowerCase()) ||
            (artist?.id && artist.id.toLowerCase().includes(filter.toLowerCase()))
        ).sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    }, [artists, filter]);

    const paginatedArtists = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredArtists.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredArtists, currentPage]);

    return (
        <div className="animate-fade-in">
            <Card className="p-0 overflow-hidden">
                <div className="p-8 flex flex-col gap-4 border-b border-white/5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Artist Roster</h2>
                        <Button onClick={() => { setEditingArtist(null); setIsModalOpen(true); }} className="text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20">Onboard Artist</Button>
                    </div>
                    <div className="w-full md:w-80 relative group mt-4">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <Input placeholder="Search roster..." value={filter} onChange={e => setFilter(e.target.value)} className="pl-11 h-12 bg-black/20 border-gray-700" />
                    </div>
                </div>
                <Table>
                    <THead>
                        <TR>
                            <TH>Identity</TH>
                            <TH>Role</TH>
                            <TH>Contact</TH>
                            <TH>Mappings</TH>
                            <TH className="text-right">Actions</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {isLoading && artists.length === 0 ? (
                            [...Array(10)].map((_, i) => (
                                <TR key={i}>
                                    <TD>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-2 w-20" />
                                            </div>
                                        </div>
                                    </TD>
                                    <TD><Skeleton className="h-3 w-24" /></TD>
                                    <TD><Skeleton className="h-3 w-32" /></TD>
                                    <TD><div className="flex gap-2"><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /></div></TD>
                                    <TD className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-xl" /></TD>
                                </TR>
                            ))
                        ) : paginatedArtists.length === 0 ? (
                            <TR>
                                <TD colSpan={5} className="p-32 text-center text-gray-600 uppercase font-black tracking-widest text-xs opacity-50">
                                    No artist profiles matched your parameters.
                                </TD>
                            </TR>
                        ) : paginatedArtists.map(artist => (
                            <TR key={artist?.id || Math.random().toString()}>
                                <TD>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark text-black rounded-xl flex items-center justify-center font-black shadow-lg shadow-primary/10">
                                            {(artist?.name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase text-sm">{artist?.name || 'Unknown Artist'}</p>
                                            <p className="text-[9px] text-gray-600 font-mono mt-0.5 tracking-tighter uppercase">NODE ID: {artist?.id?.toUpperCase() || 'UNKNOWN'}</p>
                                        </div>
                                    </div>
                                </TD>
                                <TD className="text-[11px] font-black uppercase tracking-widest text-gray-400">{artist?.type || 'UNKNOWN'}</TD>
                                <TD className="text-[11px] font-mono text-gray-500">{artist?.email || <span className="text-gray-700 opacity-50 font-sans font-bold">REDACTED</span>}</TD>
                                <TD>
                                    <div className="flex gap-2">
                                        {artist?.spotifyId && <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-black uppercase tracking-widest">Spotify</span>}
                                        {artist?.appleMusicId && <span className="text-[9px] bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full border border-red-500/20 font-black uppercase tracking-widest">Apple</span>}
                                        {artist?.instagramUrl && <span className="text-[9px] bg-purple-500/10 text-purple-500 px-2.5 py-1 rounded-full border border-purple-500/20 font-black uppercase tracking-widest">Social</span>}
                                    </div>
                                </TD>
                                <TD className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(artist)}
                                            className="p-2.5 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                            title="Edit Profile"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenDelete(artist)}
                                            className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                            title="Terminate Link"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
                <Pagination 
                    totalItems={filteredArtists.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={newCredentials || justCreated ? "Onboarding Result" : (editingArtist ? `Update Profile: ${editingArtist.name}` : "Initialize Artist Portal")} size="2xl">
                {!newCredentials && !justCreated ? (
                    <ArtistForm initialData={editingArtist || undefined} onClose={() => setIsModalOpen(false)} onSave={handleArtistSaved} />
                ) : (
                    <div className="space-y-8 py-4">
                        <div className="p-8 bg-primary/10 border border-primary/20 rounded-[2rem] text-center">
                            <div className="w-16 h-16 bg-primary text-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-white font-black text-2xl uppercase tracking-tight">Node Activated</h3>
                            <p className="text-gray-400 mt-2 font-medium">
                                {newCredentials 
                                  ? "Encrypted dash access has been synchronized for this artist." 
                                  : "Roster mapping successful. No portal access was requested."}
                            </p>
                        </div>
                        
                        {newCredentials && (
                            <div className="bg-black/60 p-8 rounded-[2rem] font-mono text-sm space-y-6 border border-white/5 shadow-2xl">
                                <div className="space-y-1">
                                    <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em]">Login Endpoint</span>
                                    <p className="text-white font-bold">{newCredentials.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em]">Temporary Credential</span>
                                    <p className="text-primary text-2xl font-black tracking-widest bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 inline-block">{newCredentials.password}</p>
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest pt-4 border-t border-white/5">Advise artist to reset credential upon first sync.</p>
                            </div>
                        )}

                        <Button onClick={() => setIsModalOpen(false)} className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em]">Dismiss Protocol</Button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Terminate Roster Mapping" size="md">
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Confirm Deletion</h3>
                    <p className="text-gray-500 font-medium max-w-xs mx-auto leading-relaxed mb-10">
                        Profile for <span className="text-white font-bold">{artistToDelete?.name}</span> will be purged from the distribution archive. This action is irreversible.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Abort</Button>
                        <Button variant="danger" className="flex-1 h-14 text-[10px] font-black uppercase tracking-widest" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Spinner className="w-4 h-4" /> : 'Confirm Purge'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Artists;

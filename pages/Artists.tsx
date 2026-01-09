
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Artist, ArtistType, User, UserRole } from '../types';
import { Button, Card, Input, Modal, Spinner, PageLoader } from '../components/ui';

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
    const [isLoading, setIsLoading] = useState(false);

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
            labelId: initialData?.labelId || user?.labelId || 'global',
        };
        
        try {
            if (isEditing) {
                const updatedArtist = await api.updateArtist(initialData.id, artistData, user as User);
                showToast(`Profile for ${name} updated successfully.`, 'success');
                onSave({ artist: updatedArtist });
            } else {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Artist/Band Name" value={name} onChange={e => setName(e.target.value)} required placeholder="Stage Name" />
                <div>
                    <label htmlFor="artistType" className="block text-sm font-medium text-gray-400 mb-1">Primary Role</label>
                    <select 
                        id="artistType"
                        value={type} 
                        onChange={e => setType(e.target.value as ArtistType)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    >
                        {Object.values(ArtistType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-4 border-t border-gray-700 pt-4 mt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact & Portal Access (Optional)</h4>
                <Input label="Official Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email for portal login" />
                {!isEditing && email.trim() !== '' && <p className="text-[10px] text-gray-500 italic">* A temporary password will be generated for this artist if email is provided.</p>}
            </div>

            <div className="space-y-4 border-t border-gray-700 pt-4 mt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Store Profile Links (IDs)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Spotify ID" value={spotifyId} onChange={e => setSpotifyId(e.target.value)} placeholder="e.g., 5444a57..." />
                    <Input label="Apple Music ID" value={appleMusicId} onChange={e => setAppleMusicId(e.target.value)} placeholder="e.g., 14407..." />
                </div>
                <Input label="Instagram URL" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 mt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? <Spinner /> : (isEditing ? 'Save Profile' : 'Create Artist')}</Button>
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

    // Delete Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const fetchArtists = async () => {
        setIsLoading(true);
        try {
            if (user?.role === UserRole.OWNER) {
                const data = await api.getAllArtists();
                setArtists(data);
            } else if (user?.labelId) {
                // api.getArtistsByLabel is now hierarchical
                const data = await api.getArtistsByLabel(user.labelId);
                setArtists(data);
            }
        } catch (err: any) {
            showToast('Failed to load artist catalog.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArtists();
    }, [user]);

    const handleArtistSaved = (result: {artist: Artist, user?: User}) => {
        if (editingArtist) {
            setArtists(prev => prev.map(a => a.id === result.artist.id ? result.artist : a).sort((a, b) => a.name.localeCompare(b.name)));
            setIsModalOpen(false);
            setEditingArtist(null);
        } else {
            setArtists(prev => [...prev, result.artist].sort((a, b) => a.name.localeCompare(b.name)));
            if (result.user) {
                setNewCredentials(result.user);
            } else {
                setJustCreated(result.artist);
            }
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
            artist.name.toLowerCase().includes(filter.toLowerCase()) ||
            artist.type.toLowerCase().includes(filter.toLowerCase()) ||
            artist.id.toLowerCase().includes(filter.toLowerCase())
        );
    }, [artists, filter]);

    if (isLoading && artists.length === 0) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">
                        {user?.role === UserRole.OWNER ? 'Global Artist Catalog' : 'Network Artist Catalog'}
                    </h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Input 
                            placeholder="Filter by name, ID, type..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full md:w-64"
                        />
                        <Button onClick={() => { setEditingArtist(null); setNewCredentials(null); setJustCreated(null); setIsModalOpen(true); }}>Add Artist</Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4">Stage Name</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Contact Email</th>
                                <th className="px-6 py-4">Linked IDs</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredArtists.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-500 italic">
                                        No artists found in your network branch.
                                    </td>
                                </tr>
                            ) : filteredArtists.map(artist => (
                                <tr key={artist.id} className="hover:bg-gray-800 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-white group-hover:text-primary transition-colors">{artist.name}</p>
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {artist.id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{artist.type}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{artist.email || <span className="text-gray-600 italic">Not set</span>}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {artist.spotifyId && <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-900/50 font-bold">Spotify</span>}
                                            {artist.appleMusicId && <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-600/30 font-bold">Apple</span>}
                                            {artist.instagramUrl && <span className="text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-900/50 font-bold">Instagram</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenEdit(artist)} 
                                                className="text-gray-400 hover:text-primary transition-colors p-2"
                                                title="Edit profile"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleOpenDelete(artist)} 
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                                title="Remove Artist"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Creation/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={newCredentials || justCreated ? "Success!" : (editingArtist ? `Edit ${editingArtist.name}` : "Add Artist")} 
                size="2xl"
            >
                {!newCredentials && !justCreated ? (
                    <ArtistForm 
                        initialData={editingArtist || undefined} 
                        onClose={() => setIsModalOpen(false)} 
                        onSave={handleArtistSaved} 
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 bg-blue-900/10 border border-blue-500/30 rounded-xl text-center">
                            <h3 className="text-blue-400 font-bold text-xl">Artist Profile Created</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {newCredentials 
                                  ? "A personalized dashboard access has been generated." 
                                  : "Artist has been added to your catalog without a login account."}
                            </p>
                        </div>
                        
                        {newCredentials && (
                            <div className="bg-black p-6 rounded-lg font-mono text-sm space-y-4 border border-gray-700">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase">Login Email</span>
                                    <span className="text-white">{newCredentials.email}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase">Password</span>
                                    <span className="text-primary font-bold">{newCredentials.password}</span>
                                </div>
                            </div>
                        )}

                        <Button onClick={() => setIsModalOpen(false)} className="w-full">Finish</Button>
                    </div>
                )}
            </Modal>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Termination"
                size="md"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Are you absolutely sure?</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed mb-8">
                        This will permanently delete the profile for <span className="text-white font-bold">{artistToDelete?.name}</span> and revoke all portal access immediately.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? <Spinner className="w-4 h-4" /> : 'Yes, Delete Artist'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Artists;

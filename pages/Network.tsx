
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Label, Artist, UserRole, User, UserPermissions, ArtistType } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner, Input, Modal, PageLoader } from '../components/ui';
import { ChevronDownIcon } from '../components/Icons';

interface HierarchyNode {
    id: string;
    name: string;
    type: 'Label' | 'Artist';
    email?: string;
    artistType?: ArtistType;
    spotifyId?: string;
    appleMusicId?: string;
    instagramUrl?: string;
    children?: HierarchyNode[];
    parentId?: string;
}

const Network: React.FC = () => {
    const { user, showToast } = useContext(AppContext);
    const [tree, setTree] = useState<HierarchyNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // Removal Modal State
    const [isRemovalModalOpen, setRemovalModalOpen] = useState(false);
    const [nodeToRemove, setNodeToRemove] = useState<HierarchyNode | null>(null);
    const [removalNote, setRemovalNote] = useState('');

    // Modification Modal State
    const [isModifyModalOpen, setModifyModalOpen] = useState(false);
    const [nodeToModify, setNodeToModify] = useState<HierarchyNode | null>(null);
    const [modifyName, setModifyName] = useState('');
    const [modifyEmail, setModifyEmail] = useState('');
    const [modifyArtistType, setModifyArtistType] = useState<ArtistType>(ArtistType.SINGER);
    const [modifySpotifyId, setModifySpotifyId] = useState('');
    const [modifyAppleMusicId, setModifyAppleMusicId] = useState('');
    const [modifyInstagramUrl, setModifyInstagramUrl] = useState('');
    const [modifyPermissions, setModifyPermissions] = useState<UserPermissions | null>(null);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const buildTree = async () => {
        setIsLoading(true);
        const allLabels = await api.getLabels();
        const allArtists = await api.getAllArtists();
        
        // Pre-fetch admins for all labels to get emails
        const labelAdminMap = new Map<string, string>();
        for(const l of allLabels) {
            const admin = await api.getLabelAdmin(l.id);
            if (admin) labelAdminMap.set(l.id, admin.email);
        }

        const getSubtree = (parentId: string | undefined): HierarchyNode[] => {
            const filteredLabels = allLabels.filter(l => l.parentLabelId === parentId);
            const nodes: HierarchyNode[] = filteredLabels.map(label => ({
                id: label.id,
                name: label.name,
                type: 'Label',
                email: labelAdminMap.get(label.id),
                parentId: parentId,
                children: [
                    ...getSubtree(label.id),
                    ...allArtists
                        .filter(a => a.labelId === label.id)
                        .map(a => ({ 
                            id: a.id, 
                            name: a.name, 
                            type: 'Artist' as const, 
                            email: a.email,
                            artistType: a.type,
                            spotifyId: a.spotifyId,
                            appleMusicId: a.appleMusicId,
                            instagramUrl: a.instagramUrl
                        }))
                ]
            }));
            return nodes;
        };

        let finalNodes: HierarchyNode[] = [];
        if (user?.role === UserRole.OWNER) {
            finalNodes = getSubtree(undefined);
        } else if (user?.labelId) {
            const myLabel = allLabels.find(l => l.id === user.labelId);
            if (myLabel) {
                finalNodes = [{
                    id: myLabel.id,
                    name: myLabel.name,
                    type: 'Label',
                    email: user.email,
                    children: [
                        ...getSubtree(myLabel.id),
                        ...allArtists.filter(a => a.labelId === myLabel.id).map(a => ({ 
                            id: a.id, 
                            name: a.name, 
                            type: 'Artist' as const, 
                            email: a.email,
                            artistType: a.type,
                            spotifyId: a.spotifyId,
                            appleMusicId: a.appleMusicId,
                            instagramUrl: a.instagramUrl
                        }))
                    ]
                }];
                // Expand current user's root by default
                setExpandedIds(prev => new Set([...prev, myLabel.id]));
            }
        }
        setTree(finalNodes);
        setIsLoading(false);
    };

    useEffect(() => {
        buildTree();
    }, [user]);

    // Recursive search logic: keep parents of matching children
    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree;

        const term = searchTerm.toLowerCase();
        
        const filterNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
            return nodes
                .map(node => {
                    const childrenMatch = node.children ? filterNodes(node.children) : [];
                    const selfMatches = 
                        node.name.toLowerCase().includes(term) || 
                        node.id.toLowerCase().includes(term) ||
                        (node.email && node.email.toLowerCase().includes(term));
                    
                    if (selfMatches || childrenMatch.length > 0) {
                        // If searching, auto-expand parents
                        if (term.length > 1) {
                            setExpandedIds(prev => {
                                const next = new Set(prev);
                                next.add(node.id);
                                return next;
                            });
                        }
                        return { ...node, children: childrenMatch };
                    }
                    return null;
                })
                .filter(n => n !== null) as HierarchyNode[];
        };

        return filterNodes(tree);
    }, [tree, searchTerm]);

    const handleOpenRemove = (node: HierarchyNode) => {
        setNodeToRemove(node);
        setRemovalNote('');
        setRemovalModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!nodeToRemove || !removalNote.trim() || !user) return;
        setIsLoading(true);
        
        try {
            if (nodeToRemove.type === 'Label') {
                await api.deleteLabel(nodeToRemove.id, user);
            } else {
                await api.deleteArtist(nodeToRemove.id, user);
            }
            showToast(`${nodeToRemove.name} terminated from network.`, 'success');
            setRemovalModalOpen(false);
            setNodeToRemove(null);
            await buildTree();
        } catch (e: any) {
            showToast(e.message || 'Termination failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModify = async (node: HierarchyNode) => {
        setNodeToModify(node);
        setModifyName(node.name);
        setModifyEmail(node.email || '');
        
        if (node.type === 'Label') {
            const admin = await api.getLabelAdmin(node.id);
            if (admin) setModifyPermissions(admin.permissions);
            setModifyArtistType(ArtistType.SINGER);
            setModifySpotifyId('');
            setModifyAppleMusicId('');
            setModifyInstagramUrl('');
        } else {
            setModifyPermissions(null);
            setModifyArtistType(node.artistType || ArtistType.SINGER);
            setModifySpotifyId(node.spotifyId || '');
            setModifyAppleMusicId(node.appleMusicId || '');
            setModifyInstagramUrl(node.instagramUrl || '');
        }
        setModifyModalOpen(true);
    };

    const handleConfirmModify = async () => {
        if (!nodeToModify || !user) return;
        setIsLoading(true);

        try {
            if (nodeToModify.type === 'Label') {
                await api.updateLabel(nodeToModify.id, modifyName, user);
                if (modifyPermissions) {
                    const admin = await api.getLabelAdmin(nodeToModify.id);
                    if (admin) {
                        await api.updateUserPermissions(admin.id, modifyPermissions, user);
                    }
                }
            } else {
                await api.updateArtist(nodeToModify.id, {
                    name: modifyName,
                    email: modifyEmail,
                    type: modifyArtistType,
                    spotifyId: modifySpotifyId,
                    appleMusicId: modifyAppleMusicId,
                    instagramUrl: modifyInstagramUrl
                }, user);
            }
            showToast('Changes synchronized with network hierarchy.', 'success');
            setModifyModalOpen(false);
            await buildTree();
        } catch (e: any) {
            showToast(e.message || 'Failed to modify node', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const renderNode = (node: HierarchyNode, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        
        const isOwnRoot = user?.labelId === node.id && user?.role !== UserRole.OWNER;
        const canAction = !isOwnRoot;

        return (
            <div key={node.id} className="select-none">
                <div 
                    className={`flex items-center justify-between py-4 px-5 rounded-lg transition-all hover:bg-gray-800/80 group border-b border-gray-800/30 ${isOwnRoot ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    style={{ marginLeft: `${depth * 28}px` }}
                >
                    <div className="flex items-center gap-4">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(node.id)} className={`transition-transform duration-200 p-1 hover:bg-gray-700 rounded ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                <ChevronDownIcon className="w-4 h-4 text-primary" />
                            </button>
                        ) : (
                            <div className="w-6 h-6"></div>
                        )}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${node.type === 'Label' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></span>
                                <span className={`font-bold ${node.type === 'Label' ? 'text-white text-base' : 'text-gray-200 text-sm'}`}>{node.name}</span>
                                {isOwnRoot && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-sm font-bold ml-1 uppercase">Your Label</span>}
                                {!isOwnRoot && <span className="text-[9px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-sm font-bold ml-1 uppercase">{node.parentId === user?.labelId ? 'Direct Child' : 'Sub-Network'}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-mono text-gray-500">{node.type === 'Label' ? 'LABEL' : 'ARTIST'} ID: {node.id}</span>
                                <span className="text-gray-700">|</span>
                                <span className="text-[10px] text-gray-400 italic">{node.email || 'No email registered'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {canAction && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
                            <Button 
                                variant="secondary" 
                                className="text-[10px] py-1 px-4 uppercase tracking-wider h-8 font-bold"
                                onClick={() => handleOpenModify(node)}
                            >
                                Modify
                            </Button>
                            <Button 
                                variant="danger" 
                                className="text-[10px] py-1 px-4 uppercase tracking-wider h-8 font-bold"
                                onClick={() => handleOpenRemove(node)}
                            >
                                Terminate
                            </Button>
                        </div>
                    )}
                </div>
                {isExpanded && node.children && (
                    <div className="mt-1">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading && tree.length === 0) return <PageLoader />;

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Organization Network</h1>
                    <p className="text-gray-400 mt-2 text-lg">Parent-to-child hierarchy management. Only parents can modify or terminate descendants.</p>
                </div>
                <div className="w-full md:w-80">
                    <Input 
                        placeholder="Search name, ID, or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-800 border-gray-700 focus:ring-primary"
                    />
                </div>
            </div>

            <Card className="bg-gray-900/40 border-gray-800/60 shadow-2xl backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-gray-800/70 px-8 py-4 flex justify-between text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-700/50">
                        <span>Organization Structure</span>
                        <span>Administrative Actions</span>
                    </div>
                    <div className="min-h-[500px] overflow-x-auto">
                        <div className="min-w-[800px] p-4">
                            {filteredTree.length === 0 ? (
                                <div className="p-32 text-center">
                                    <div className="text-gray-600 mb-4 flex justify-center">
                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <p className="text-gray-500 text-xl font-medium">No matches found for "{searchTerm}"</p>
                                    <Button variant="secondary" className="mt-4" onClick={() => setSearchTerm('')}>Clear Search</Button>
                                </div>
                            ) : filteredTree.map(rootNode => renderNode(rootNode))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Modal 
                isOpen={isRemovalModalOpen} 
                onClose={() => setRemovalModalOpen(false)} 
                title="Terminate Partnership" 
                size="md"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400 font-bold uppercase mb-2">Warning</p>
                        <p className="text-sm text-gray-300">
                            You are about to terminate access for <span className="text-white font-bold">{nodeToRemove?.name}</span>. 
                            This action is permanent and will suspend all active releases and portal access for this node and its descendants.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Reason for Removal (Mandatory)</label>
                        <textarea 
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[100px]"
                            placeholder="Please provide a mandatory reason for termination (e.g., suspicious activity, contract ended)..."
                            value={removalNote}
                            onChange={(e) => setRemovalNote(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setRemovalModalOpen(false)}>Cancel</Button>
                        <Button 
                            variant="danger" 
                            className="flex-1" 
                            disabled={!removalNote.trim() || isLoading}
                            onClick={handleConfirmRemove}
                        >
                            {isLoading ? <Spinner /> : 'Confirm Termination'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isModifyModalOpen}
                onClose={() => setModifyModalOpen(false)}
                title={`Modify ${nodeToModify?.type} Details`}
                size="2xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label={`${nodeToModify?.type} Name`}
                            value={modifyName}
                            onChange={(e) => setModifyName(e.target.value)}
                        />
                        <Input 
                            label="Contact Email"
                            value={modifyEmail}
                            onChange={(e) => setModifyEmail(e.target.value)}
                        />
                    </div>

                    {nodeToModify?.type === 'Artist' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2">Artist Profile Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Artist Type</label>
                                    <select 
                                        value={modifyArtistType} 
                                        onChange={e => setModifyArtistType(e.target.value as ArtistType)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    >
                                        {Object.values(ArtistType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <Input label="Spotify ID" value={modifySpotifyId} onChange={e => setModifySpotifyId(e.target.value)} />
                                <Input label="Apple Music ID" value={modifyAppleMusicId} onChange={e => setModifyAppleMusicId(e.target.value)} />
                                <Input label="Instagram URL" value={modifyInstagramUrl} onChange={e => setModifyInstagramUrl(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {modifyPermissions && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2">Access Control</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.keys(modifyPermissions).map(key => (
                                    <label key={key} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors">
                                        <span className="text-sm text-gray-200 capitalize">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={(modifyPermissions as any)[key]} 
                                            onChange={e => setModifyPermissions(prev => prev ? ({ ...prev, [key]: e.target.checked }) : null)}
                                            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary focus:ring-offset-gray-800"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                        <Button variant="secondary" onClick={() => setModifyModalOpen(false)}>Discard</Button>
                        <Button onClick={handleConfirmModify} disabled={isLoading}>
                            {isLoading ? <Spinner /> : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .backdrop-blur-sm { backdrop-filter: blur(8px); }
            `}</style>
        </div>
    );
};

export default Network;

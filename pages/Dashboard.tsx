
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Release, Artist, UserRole, Notice, NoticeType } from '../types';
import { Card, CardContent, PageLoader, Badge, Skeleton } from '../components/ui';
import { CreateReleaseIcon, UserGroupIcon, SpotifyIcon, AppleMusicIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons';

const NOTICE_STYLING: Record<NoticeType, string> = {
    [NoticeType.URGENT]: 'border-red-500/50 bg-red-900/10',
    [NoticeType.UPDATE]: 'border-blue-500/50 bg-blue-900/10',
    [NoticeType.POLICY]: 'border-purple-500/50 bg-purple-900/10',
    [NoticeType.GENERAL]: 'border-green-500/50 bg-green-900/10',
    [NoticeType.EVENT]: 'border-yellow-500/50 bg-yellow-900/10'
};

const TopStat = ({ title, value, color = "text-white", loading = false, link }: { title: string, value: string | number, color?: string, loading?: boolean, link?: string }) => {
    const content = (
        <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl transition-all duration-300 hover:border-primary/20 h-full">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2 ml-1">{title}</p>
            {loading ? <Skeleton className="h-9 w-24 rounded-lg" /> : <p className={`text-3xl font-black ${color} tracking-tight`}>{value.toLocaleString()}</p>}
        </div>
    );
    
    if (link) {
        return <Link to={link} className="block h-full hover:scale-[1.02] transition-transform">{content}</Link>;
    }
    return content;
};

const NoticesWidget = ({ notices, loading }: { notices: Notice[], loading: boolean }) => (
    <Card className="h-full">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Corporate Board
            </h3>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                        <div className="flex justify-between mb-2"><Skeleton className="h-2 w-12" /><Skeleton className="h-2 w-16" /></div>
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                ))
            ) : notices.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">No active board notices.</div>
            ) : notices.map(notice => (
                <div key={notice.id} className={`p-4 rounded-xl border-l-4 ${NOTICE_STYLING[notice.type]} transition-transform hover:scale-[1.01] duration-200`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{notice.type}</span>
                        <div className="text-right">
                             <p className="text-[8px] text-gray-500 font-mono leading-none">{new Date(notice.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{notice.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">{notice.message}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-2">
                        <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">{(notice.authorName || 'A').charAt(0)}</div>
                        <span className="text-[9px] text-gray-500 truncate font-bold uppercase tracking-tight">{notice.authorDesignation || 'System'}</span>
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [stats, setStats] = useState({ 
        artists: 0, 
        labels: 0, 
        drafted: 0, 
        published: 0, 
        rejected: 0, 
        correction: 0, 
        takedown: 0,
        pending: 0 
    });
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
   
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, allNotices] = await Promise.all([
                    api.getStats(),
                    api.getNotices(user!)
                ]);
                setStats(statsData);
                setNotices(allNotices.slice(0, 10));
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Platform Admin Console</h1>
                    <p className="text-gray-500 font-medium mt-1">Global Distribution Network Oversight • <span className="text-primary font-bold">{user?.name}</span> ({user?.designation})</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/releases?status=Pending" className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-black font-black uppercase text-[10px] px-6 py-3 rounded-full transition-all tracking-widest shadow-xl shadow-primary/20">
                        Review Queue {stats.pending > 0 && <span className="bg-black text-primary px-1.5 rounded-full text-[8px]">{stats.pending}</span>}
                    </Link>
                    {user?.role === UserRole.OWNER && (
                        <Link to="/labels" className="bg-gray-800 hover:bg-gray-700 text-white font-black uppercase text-[10px] px-6 py-3 rounded-full transition-all tracking-widest border border-gray-700">
                            Partner Network
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <TopStat title="Artists" value={stats.artists} link="/artists" loading={isLoading} />
                <TopStat title="Labels" value={stats.labels} link="/labels" color="text-blue-400" loading={isLoading} />
                <TopStat title="Drafted" value={stats.drafted} link="/releases?status=Draft" color="text-gray-400" loading={isLoading} />
                <TopStat title="Published" value={stats.published} link="/releases?status=Published" color="text-green-500" loading={isLoading} />
                <TopStat title="Rejected" value={stats.rejected} link="/releases?status=Rejected" color="text-red-500" loading={isLoading} />
                <TopStat title="Correction" value={stats.correction} link="/correction-queue" color="text-yellow-500" loading={isLoading} />
                <TopStat title="Taken Down" value={stats.takedown} link="/releases?status=Takedown" color="text-red-700" loading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-br from-gray-800 to-black border-gray-700 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors"></div>
                        <CardContent className="pt-6 relative z-10">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Distribution Engine Status</h2>
                            <p className="text-gray-400 max-w-lg leading-relaxed text-sm">Monitoring ingest queues and metadata compliance globally across {isLoading ? '...' : stats.labels} primary distribution nodes.</p>
                            
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link to="/correction-queue" className="flex items-center justify-between p-4 bg-gray-900/60 rounded-xl border border-gray-700 hover:border-yellow-500/50 transition-all">
                                    <div>
                                        <p className="text-xs font-bold text-white">Correction Queue</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest">Returned Assets</p>
                                    </div>
                                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </Link>
                                <Link to="/accounting" className="flex items-center justify-between p-4 bg-gray-900/60 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all">
                                    <div>
                                        <p className="text-xs font-bold text-white">Financial Explorer</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest">Revenue Analytics</p>
                                    </div>
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(user?.role === UserRole.OWNER || user?.permissions?.canManageNetwork) && (
                            <Link to="/network" className="group bg-gray-800 p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-all shadow-xl">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <UserGroupIcon className="w-6 h-6" />
                                </div>
                                <h4 className="text-white font-bold text-lg">Network Architecture</h4>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">Hierarchy Explorer</p>
                            </Link>
                        )}
                        {(user?.role === UserRole.OWNER || user?.permissions?.canManageEmployees) && (
                            <Link to="/employees" className="group bg-gray-800 p-6 rounded-2xl border border-gray-800 hover:border-primary/50 transition-all shadow-xl">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <h4 className="text-white font-bold text-lg">Platform Personnel</h4>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">Staff Control Center</p>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <NoticesWidget notices={notices} loading={isLoading} />
                </div>
            </div>
        </div>
    );
};

const PartnerDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [stats, setStats] = useState({ 
        artists: 0, 
        labels: 0, 
        drafted: 0, 
        published: 0, 
        rejected: 0, 
        correction: 0, 
        takedown: 0,
        pending: 0 
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [myReleases, allNotices, statsData] = await Promise.all([
                    api.getReleasesByLabel(user?.labelId || ''),
                    api.getNotices(user!),
                    api.getStats(user?.labelId)
                ]);
                setReleases(myReleases.slice(0, 5));
                setNotices(allNotices.slice(0, 10));
                setStats(statsData);
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <TopStat title="Artists" value={stats.artists} link="/artists" loading={isLoading} />
                <TopStat title="Drafted" value={stats.drafted} link="/releases?status=Draft" color="text-gray-400" loading={isLoading} />
                <TopStat title="Published" value={stats.published} link="/releases?status=Published" color="text-green-500" loading={isLoading} />
                <TopStat title="Rejected" value={stats.rejected} link="/releases?status=Rejected" color="text-red-500" loading={isLoading} />
                <TopStat title="Correction" value={stats.correction} link="/releases?status=Needs Info" color="text-yellow-500" loading={isLoading} />
                <TopStat title="Taken Down" value={stats.takedown} link="/releases?status=Takedown" color="text-red-700" loading={isLoading} />
                <TopStat title="Pending" value={stats.pending} link="/releases?status=Pending" color="text-blue-500" loading={isLoading} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                        <CardContent className="pt-2">
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Partner Portal</h2>
                            <p className="text-gray-400 text-sm font-medium">Welcome back, {user?.name}. Distribution oversight for <span className="text-primary font-bold uppercase tracking-tight">{user?.role}</span> accounts is active.</p>
                            <div className="mt-8 flex gap-3">
                                <Link to="/releases" className="bg-primary text-black font-black uppercase text-[10px] px-8 py-4 rounded-xl tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">My Catalog</Link>
                                {user?.role !== UserRole.ARTIST && (
                                    <Link to="/artists" className="bg-white/5 text-white font-black uppercase text-[10px] px-8 py-4 rounded-xl tracking-widest hover:bg-white/10 transition-all border border-white/10">Manage Artists</Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-white uppercase text-[10px] tracking-[0.2em] text-gray-500">Distribution Activity</h3>
                            <Link to="/releases" className="text-[10px] text-primary hover:underline font-black uppercase tracking-wider">Full Catalog</Link>
                        </div>
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800/50">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-10 h-10 rounded" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-3 w-32" />
                                                <Skeleton className="h-2 w-20" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                ))
                            ) : releases.length === 0 ? (
                                <div className="py-12 text-center text-gray-600">No releases in your catalog yet.</div>
                            ) : releases.map(rel => (
                                <Link to={`/releases/${rel.id}`} key={rel.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-900 rounded overflow-hidden shadow-md">
                                            <img 
                                                src={rel.artworkUrl} 
                                                className="w-full h-full object-cover" 
                                                alt="" 
                                                loading="lazy" 
                                                decoding="async" 
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm tracking-tight">{rel.title}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">CAT: {rel.catalogueNumber}</p>
                                        </div>
                                    </div>
                                    <Badge status={rel.status} />
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                    <NoticesWidget notices={notices} loading={isLoading} />
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) return null;
    if (user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE) {
        return <AdminDashboard />;
    }
    return <PartnerDashboard />;
};

export default Dashboard;

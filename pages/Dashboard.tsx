import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { Release, Artist, UserRole, Notice, NoticeType } from '../types';
import { Card, CardContent, PageLoader, Badge } from '../components/ui';
import { CreateReleaseIcon, UserGroupIcon, SpotifyIcon, AppleMusicIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons';

const NOTICE_STYLING: Record<NoticeType, string> = {
    [NoticeType.URGENT]: 'border-red-500/50 bg-red-900/10',
    [NoticeType.UPDATE]: 'border-blue-500/50 bg-blue-900/10',
    [NoticeType.POLICY]: 'border-purple-500/50 bg-purple-900/10',
    [NoticeType.GENERAL]: 'border-green-500/50 bg-green-900/10',
    [NoticeType.EVENT]: 'border-yellow-500/50 bg-yellow-900/10'
};

const TopStat = ({ title, value }: { title: string, value: string | number }) => (
    <div>
        <p className="text-sm text-gray-400 uppercase font-black tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
);

const NoticesWidget = ({ notices }: { notices: Notice[] }) => (
    <Card className="h-full border-gray-800 bg-black/20 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Corporate Intel
            </h3>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {notices.length === 0 ? (
                <div className="py-10 text-center text-gray-500 italic text-sm">No active notices for your designation.</div>
            ) : notices.map(notice => (
                <div key={notice.id} className={`p-4 rounded-xl border-l-4 ${NOTICE_STYLING[notice.type]} transition-transform hover:scale-[1.01] duration-200`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{notice.type}</span>
                        <div className="text-right">
                             <p className="text-[9px] text-gray-500 font-mono leading-none">{new Date(notice.timestamp).toLocaleDateString()}</p>
                             <p className="text-[9px] text-gray-500 font-mono leading-none mt-1">{new Date(notice.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{notice.title}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{notice.message}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">{notice.authorName.charAt(0)}</div>
                        <span className="text-[10px] text-gray-500">Source: <span className="text-gray-300 font-bold">{notice.authorDesignation}</span></span>
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

const OwnerDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [stats, setStats] = useState({ releases: 0, labels: 0, pending: 0 });
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
   
    useEffect(() => {
        const fetchData = async () => {
            const [allReleases, allLabels, allNotices] = await Promise.all([
                api.getAllReleases(), 
                api.getLabels(),
                api.getNotices(user!)
            ]);
            setStats({
                releases: allReleases.length,
                labels: allLabels.length,
                pending: allReleases.filter(r => r.status === 'Pending').length
            });
            setNotices(allNotices.slice(0, 10));
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-8 border-b border-gray-800 pb-6">
                <TopStat title="Total Releases" value={stats.releases} />
                <TopStat title="Managed Labels" value={stats.labels} />
                <TopStat title="Pending Review" value={stats.pending} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-br from-gray-800 to-black border-gray-700 shadow-2xl">
                        <CardContent className="pt-6">
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Platform Command Center</h2>
                            <p className="text-gray-400 max-w-lg leading-relaxed">Welcome, Platform Owner. You have oversight over the entire distribution network. Review submissions from partner labels and broadcast critical board notices below.</p>
                            <div className="mt-8 flex gap-3">
                                <Link to="/releases" className="bg-primary hover:bg-primary-dark text-black font-black uppercase text-xs px-6 py-3 rounded-full transition-all tracking-widest shadow-lg shadow-primary/20">Review Queue</Link>
                                <Link to="/notices" className="bg-gray-700 hover:bg-gray-600 text-white font-black uppercase text-xs px-6 py-3 rounded-full transition-all tracking-widest">Post Global Notice</Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/labels" className="group bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-primary/50 transition-all shadow-xl">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m-1 4h1m6-12h1m-1 4h1m-1 4h1m-1 4h1" /></svg>
                            </div>
                            <h4 className="text-white font-bold text-lg">Partner Labels</h4>
                            <p className="text-xs text-gray-500 mt-1">Manage network relationships and sub-distribution nodes.</p>
                        </Link>
                        <Link to="/employees" className="group bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-primary/50 transition-all shadow-xl">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <h4 className="text-white font-bold text-lg">Platform Staff</h4>
                            <p className="text-xs text-gray-500 mt-1">Configure hierarchical access for corporate operations team.</p>
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <NoticesWidget notices={notices} />
                </div>
            </div>
        </div>
    );
};

const StaffDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [recentReleases, setRecentReleases] = useState<Release[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [allReleases, allNotices] = await Promise.all([
                api.getAllReleases(),
                api.getNotices(user!)
            ]);
            setRecentReleases(allReleases.slice(0, 5));
            setNotices(allNotices.slice(0, 10));
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-r from-primary/10 to-transparent border-gray-800 border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold text-white mb-1">Internal Operations Dashboard</h2>
                            <p className="text-gray-400 text-sm">Hello, {user?.name}. Your role as <span className="text-primary font-bold">{user?.designation}</span> is active.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white uppercase text-xs tracking-widest text-gray-500">Queue: Latest Submissions</h3>
                            <Link to="/releases" className="text-xs text-primary hover:underline font-bold uppercase tracking-wider">Review All</Link>
                        </div>
                        <div className="space-y-4">
                            {recentReleases.map(rel => (
                                <Link to={`/release/${rel.id}`} key={rel.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <img src={rel.artworkUrl} className="w-10 h-10 rounded shadow-md object-cover" alt="" />
                                        <div>
                                            <p className="font-bold text-white text-sm">{rel.title}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">UPC: {rel.upc}</p>
                                        </div>
                                    </div>
                                    <Badge status={rel.status} />
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                    <NoticesWidget notices={notices} />
                </div>
            </div>
        </div>
    );
};

const PartnerDashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    const [releases, setReleases] = useState<Release[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [myReleases, allNotices] = await Promise.all([
                api.getReleasesByLabel(user?.labelId || ''),
                api.getNotices(user!)
            ]);
            setReleases(myReleases.slice(0, 5));
            setNotices(allNotices.slice(0, 10));
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-r from-gray-800 to-black border-gray-700 shadow-xl">
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold text-white mb-1">Partner Portal</h2>
                            <p className="text-gray-400 text-sm">Welcome back, {user?.name}. Oversight for <span className="text-primary font-bold">{user?.role}</span> accounts is synchronized.</p>
                            <div className="mt-6 flex gap-3">
                                <Link to="/releases" className="bg-primary text-black font-black uppercase text-[10px] px-6 py-3 rounded-full tracking-widest">My Catalog</Link>
                                {user?.role !== UserRole.ARTIST && (
                                    <Link to="/artists" className="bg-gray-700 text-white font-black uppercase text-[10px] px-6 py-3 rounded-full tracking-widest">Manage Artists</Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white uppercase text-xs tracking-widest text-gray-500">Distribution Activity</h3>
                            <Link to="/releases" className="text-xs text-primary hover:underline font-bold uppercase tracking-wider">Full Catalog</Link>
                        </div>
                        <div className="space-y-4">
                            {releases.length === 0 ? (
                                <div className="py-12 text-center text-gray-600 italic">No releases in your catalog yet.</div>
                            ) : releases.map(rel => (
                                <Link to={`/releases/${rel.id}`} key={rel.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <img src={rel.artworkUrl} className="w-10 h-10 rounded shadow-md object-cover" alt="" />
                                        <div>
                                            <p className="font-bold text-white text-sm">{rel.title}</p>
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
                    <NoticesWidget notices={notices} />
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) return null;
    
    // Platform Side (Owner or Employee)
    if (user.role === UserRole.OWNER) return <OwnerDashboard />;
    if (user.role === UserRole.EMPLOYEE) return <StaffDashboard />;
    
    // External Side (Label or Artist)
    return <PartnerDashboard />;
};

export default Dashboard;
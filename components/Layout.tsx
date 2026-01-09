
import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { AppContext } from '../App';
import { DashboardIcon, MusicIcon, BuildingIcon, LogoutIcon, UserGroupIcon, MenuIcon, CashIcon, SupportIcon, QuestionMarkIcon } from './Icons';
import UniversalSearch from './UniversalSearch';

const HubMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hubItems = [
        { name: 'Financials', icon: <CashIcon className="w-5 h-5" />, path: '/accounting', color: 'text-primary' },
        { name: 'Customer Support', icon: <SupportIcon className="w-5 h-5" />, path: '/support', color: 'text-blue-400', external: true },
        { name: 'FAQ & Docs', icon: <QuestionMarkIcon className="w-5 h-5" />, path: '/faq', color: 'text-purple-400', external: true },
    ];

    return (
        <div className="relative mb-2 px-4" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all border ${isOpen ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
                <MenuIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Apps Hub</span>
                <div className="ml-auto">
                    <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-slide-up z-50">
                    <div className="p-2 space-y-1">
                        {hubItems.map((item) => (
                            item.external ? (
                                <a 
                                    key={item.name}
                                    href={`/#${item.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
                                >
                                    <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                                    <span className="text-xs font-semibold text-gray-300 group-hover:text-white">{item.name}</span>
                                    <svg className="ml-auto w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ) : (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
                                >
                                    <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                                    <span className="text-xs font-semibold text-gray-300 group-hover:text-white">{item.name}</span>
                                </Link>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Layout: React.FC = () => {
    const { user, logout } = useContext(AppContext);

    if (!user) return null;

    const navLinks = [
        { to: "/", text: "Dashboard", icon: <DashboardIcon /> },
    ];

    const isPlatformSide = user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE;

    if (isPlatformSide) {
        navLinks.push({ to: "/notices", text: "Corporate Board", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg> });

        if (user.role === UserRole.OWNER || user.permissions.canManageReleases) {
            navLinks.push({ to: "/releases", text: "Distribution Queue", icon: <MusicIcon /> });
            navLinks.push({ to: "/correction-queue", text: "Correction Queue", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> });
        }
        if (user.role === UserRole.OWNER || user.permissions.canManageNetwork) {
            navLinks.push({ to: "/labels", text: "Label Partners", icon: <BuildingIcon /> });
            navLinks.push({ to: "/network", text: "Network Tree", icon: <UserGroupIcon /> });
        }
        if (user.role === UserRole.OWNER || user.permissions.canManageEmployees) {
            navLinks.push({ to: "/employees", text: "Team Management", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> });
        }
    } else {
        // Label or Artist Side
        navLinks.push({ to: "/releases", text: "My Releases", icon: <MusicIcon /> });
        
        if (user.role !== UserRole.ARTIST) {
            navLinks.push({ to: "/artists", text: "Artists", icon: <UserGroupIcon /> });
        }
        
        if (user.permissions.canCreateSubLabels) {
            navLinks.push({ to: "/sub-labels", text: "Sub-Labels", icon: <BuildingIcon /> });
            navLinks.push({ to: "/network", text: "My Network", icon: <UserGroupIcon /> });
        }
    }

    // Settings for all non-artists
    if (user.role !== UserRole.ARTIST) {
        navLinks.push({ to: "/settings", text: "Settings", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> });
    }

    // New contextual naming logic
    const headerMainText = isPlatformSide ? user.name : (user.labelName || user.artistName || user.name);
    const headerSubText = isPlatformSide ? user.designation : user.role;

    return (
        <div className="flex h-screen bg-gray-900">
            <aside className="w-64 bg-black flex-shrink-0 flex flex-col border-r border-gray-800">
                <div className="h-16 flex items-center justify-center text-primary font-bold text-2xl">
                    MusicDistro Pro
                </div>
                <nav className="flex-grow px-2 py-4 overflow-y-auto">
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `flex items-center px-4 py-2 mt-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                            end={link.to === "/"}
                        >
                            <span className={link.icon ? "" : "invisible"}>{link.icon}</span>
                            <span className="ml-3">{link.text}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-800">
                    {!isPlatformSide && <HubMenu />}
                    <div className="mb-4 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Operator</p>
                        <p className="text-xs text-white truncate font-medium">{user.name}</p>
                        <p className="text-[9px] text-primary-dark font-black uppercase mt-0.5">{user.designation || user.role}</p>
                    </div>
                    <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm font-semibold text-gray-400 rounded-lg hover:text-white hover:bg-gray-800 transition-colors">
                        <LogoutIcon />
                        <span className="ml-3">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 gap-4">
                    <div className="flex-1 flex justify-center">
                        <UniversalSearch />
                    </div>
                    <div className="flex items-center group cursor-default">
                        <div className="text-right mr-4 hidden sm:block">
                            <p className="text-white text-sm font-black tracking-tight leading-none">{headerMainText}</p>
                            <p className="text-[9px] text-gray-500 uppercase font-bold mt-1 tracking-widest">{headerSubText}</p>
                        </div>
                        <div className="relative">
                            <span className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-black items-center justify-center font-black shadow-lg shadow-primary/20 border border-white/10 group-hover:scale-105 transition-transform duration-300">
                                {headerMainText.charAt(0)}
                            </span>
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800"></span>
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;

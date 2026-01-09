
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { RevenueEntry, Label, Release, Artist, UserRole } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Spinner, PageLoader, Pagination } from '../components/ui';
import { DownloadIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons';
import { exportFinancialsToExcel } from '../services/excelService';

const Accounting: React.FC = () => {
    const { user } = useContext(AppContext);
    const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
    const [labels, setLabels] = useState<Map<string, Label>>(new Map());
    const [releases, setReleases] = useState<Map<string, Release>>(new Map());
    const [artists, setArtists] = useState<Map<string, Artist>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [monthFilter, setMonthFilter] = useState('ALL');
    const [labelFilter, setLabelFilter] = useState('ALL');
    const [storeFilter, setStoreFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allRev, allLabels, allReleases, allArtists] = await Promise.all([
                    user?.role === UserRole.OWNER 
                      ? api.getAllRevenue() 
                      : api.getRevenueForLabelHierarchy(user!.labelId!),
                    api.getLabels(),
                    api.getAllReleases(),
                    api.getAllArtists()
                ]);

                setRevenue(allRev);
                
                const months = (Array.from(new Set(allRev.map(r => r.reportMonth))) as string[]).sort((a,b) => b.localeCompare(a));
                if (months.length > 0) {
                    setMonthFilter(months[0]);
                }

                const labelMap = new Map<string, Label>();
                allLabels.forEach(l => labelMap.set(l.id, l));
                setLabels(labelMap);

                const releaseMap = new Map<string, Release>();
                allReleases.forEach(r => releaseMap.set(r.id, r));
                setReleases(releaseMap);

                const artistMap = new Map<string, Artist>();
                allArtists.forEach(a => artistMap.set(a.id, a));
                setArtists(artistMap);
            } catch (error) {
                console.error("Failed to fetch accounting data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [monthFilter, labelFilter, storeFilter, startDate, endDate]);

    const filteredRevenue = useMemo(() => {
        return revenue.filter(e => {
            const matchesMonth = monthFilter === 'ALL' || e.reportMonth === monthFilter;
            const matchesLabel = labelFilter === 'ALL' || e.labelId === labelFilter;
            const matchesStore = storeFilter === 'ALL' || e.store === storeFilter;
            
            let matchesDate = true;
            if (startDate && endDate) {
                const entryTime = new Date(e.date).getTime();
                const startTime = new Date(startDate).getTime();
                const endTime = new Date(endDate).getTime();
                matchesDate = entryTime >= startTime && entryTime <= endTime;
            }

            return matchesMonth && matchesLabel && matchesStore && matchesDate;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [revenue, monthFilter, labelFilter, storeFilter, startDate, endDate]);

    const paginatedRevenue = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRevenue.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRevenue, currentPage]);

    const stats = useMemo(() => {
        let totalVal = 0;
        let paidVal = 0;
        filteredRevenue.forEach(e => {
            const amount = Number(e.amount) || 0;
            totalVal += amount;
            if (e.paymentStatus === 'Paid') {
                paidVal += amount;
            }
        });
        const pendingVal = totalVal - paidVal;
        return { total: totalVal, paid: paidVal, pending: pendingVal };
    }, [filteredRevenue]);

    const storeBreakdown = useMemo(() => {
        const total = stats.total || 1;
        const grouped = filteredRevenue.reduce((acc, curr) => {
            acc[curr.store] = (acc[curr.store] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        return (Object.entries(grouped) as [string, number][])
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: (amount / total) * 100
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredRevenue, stats.total]);

    const chartData = useMemo(() => {
        const grouped = filteredRevenue.reduce((acc, curr) => {
            const month = curr.reportMonth;
            acc[month] = (acc[month] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        return (Object.entries(grouped) as [string, number][])
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, amount]) => ({ month, amount }));
    }, [filteredRevenue]);

    const maxTrendVal = Math.max(...chartData.map(d => d.amount), 1);
    const availableMonths = useMemo(() => (Array.from(new Set(revenue.map(r => r.reportMonth))) as string[]).sort((a,b) => b.localeCompare(a)), [revenue]);

    const handleExport = () => {
        exportFinancialsToExcel(filteredRevenue, labels, releases, artists);
    };

    const getHierarchyOptions = () => {
        const all: Label[] = Array.from(labels.values());
        const result: { id: string, name: string, depth: number }[] = [];
        const visited = new Set<string>();

        const traverse = (parentId: string | undefined, depth: number) => {
            const children = all.filter((l: Label) => l.parentLabelId === parentId);
            children.forEach((c: Label) => {
                if (visited.has(c.id)) return;
                visited.add(c.id);
                result.push({ id: c.id, name: c.name, depth });
                traverse(c.id, depth + 1);
            });
        };

        if (user?.role === UserRole.OWNER) {
            traverse(undefined, 0);
        } else if (user?.labelId) {
            const myLabel = labels.get(user.labelId);
            if (myLabel) {
                visited.add(myLabel.id);
                result.push({ id: myLabel.id, name: `${myLabel.name} (Self)`, depth: 0 });
                traverse(myLabel.id, 1);
            }
        }
        return result;
    };

    const hierarchyOptions = useMemo(getHierarchyOptions, [labels, user]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Earnings Architecture</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 text-[10px] px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                        <DownloadIcon className="w-4 h-4" /> Export Analytics
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-8 border-primary bg-black/40 shadow-xl p-8">
                    <CardContent className="p-0">
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">Aggregated Gross</p>
                        <p className="text-4xl font-black text-white mt-1 tracking-tighter">${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-8 border-blue-500 bg-black/40 shadow-xl p-8">
                    <CardContent className="p-0">
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">Authenticated Payouts</p>
                        <p className="text-4xl font-black text-white mt-1 tracking-tighter">${stats.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-8 border-yellow-500 bg-black/40 shadow-xl p-8">
                    <CardContent className="p-0">
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">Accumulating Balance</p>
                        <p className="text-4xl font-black text-white mt-1 tracking-tighter">${stats.pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                <Card className="lg:col-span-1 h-fit border-white/5 bg-white/[0.02]">
                    <CardHeader className="border-white/5 mb-6">
                        <CardTitle className="text-xs uppercase tracking-[0.2em] font-black text-gray-500">Intelligent Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Node Selection</label>
                            <select 
                                value={labelFilter} 
                                onChange={e => setLabelFilter(e.target.value)}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-3 text-[11px] font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                <option value="ALL">All Network Nodes</option>
                                {hierarchyOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                        {'\u00A0'.repeat(opt.depth * 3)}{opt.depth > 0 ? '↳ ' : ''}{opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Statement Cycle</label>
                            <select 
                                value={monthFilter} 
                                onChange={e => setMonthFilter(e.target.value)}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-3 text-[11px] font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                <option value="ALL">Entire Archive</option>
                                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Store Endpoint</label>
                            <select 
                                value={storeFilter} 
                                onChange={e => setStoreFilter(e.target.value)}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-3 text-[11px] font-bold text-white focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                <option value="ALL">All Global Stores</option>
                                {(Array.from(new Set(revenue.map(r => r.store))) as string[]).sort().map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <Button variant="secondary" onClick={() => {
                            setMonthFilter('ALL');
                            setLabelFilter('ALL');
                            setStoreFilter('ALL');
                        }} className="w-full text-[9px] uppercase font-black tracking-[0.2em] py-4">Purge Query</Button>
                    </CardContent>
                </Card>

                <div className="lg:col-span-3 space-y-8">
                    <Card className="p-0 overflow-hidden border-white/5 shadow-2xl">
                        <CardHeader className="p-8 border-white/5 flex flex-row justify-between items-center bg-white/[0.01]">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Statement of Revenue</CardTitle>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-black/20 px-4 py-1 rounded-full border border-white/5">{filteredRevenue.length} Total Entries</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black/20 text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-5">Node Identity</th>
                                            <th className="px-8 py-5">Endpoint / Region</th>
                                            <th className="px-8 py-5">Cycle</th>
                                            <th className="px-8 py-5 text-right">Net Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedRevenue.map(e => {
                                            const label = labels.get(e.labelId);
                                            return (
                                                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <p className="text-white font-black text-xs uppercase group-hover:text-primary transition-colors tracking-tight">{label?.name || 'Unknown Node'}</p>
                                                        <p className="text-[9px] text-gray-600 font-mono mt-1 uppercase">ID: {e.labelId.slice(0,12)}...</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-2.5 py-1 bg-black/40 border border-white/5 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">{e.store}</span>
                                                        <span className="ml-3 text-[10px] text-gray-600 font-bold uppercase">{e.territory}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-[10px] text-gray-500 font-black tracking-widest uppercase">{e.reportMonth}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className={`font-mono font-black text-sm tracking-tighter ${e.paymentStatus === 'Paid' ? 'text-white' : 'text-yellow-500/80'}`}>
                                                            ${e.amount.toFixed(2)}
                                                        </div>
                                                        <div className={`text-[8px] uppercase font-black tracking-[0.2em] mt-1 ${e.paymentStatus === 'Paid' ? 'text-primary' : 'text-yellow-600'}`}>
                                                            {e.paymentStatus}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {paginatedRevenue.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-40 text-center text-gray-700 uppercase font-black tracking-widest text-[11px] opacity-40">
                                                    Zero revenue data identified for this branch.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination 
                                totalItems={filteredRevenue.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Accounting;

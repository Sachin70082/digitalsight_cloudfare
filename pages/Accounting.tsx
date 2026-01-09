
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { api } from '../services/mockApi';
import { RevenueEntry, Label, Release, Artist, UserRole } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Spinner, PageLoader } from '../components/ui';
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
                
                // Set default filter to most recent month
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
        });
    }, [revenue, monthFilter, labelFilter, storeFilter, startDate, endDate]);

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

    // Helper for hierarchical label dropdown
    const getHierarchyOptions = () => {
        // Fix: Explicitly type 'all' as Label[] to prevent unknown type inference in filters and closures
        const all: Label[] = Array.from(labels.values());
        const result: { id: string, name: string, depth: number }[] = [];

        const traverse = (parentId: string | undefined, depth: number) => {
            // Fix: Added explicit types to filter and forEach callbacks to resolve property access errors
            const children = all.filter((l: Label) => l.parentLabelId === parentId);
            children.forEach((c: Label) => {
                result.push({ id: c.id, name: c.name, depth });
                traverse(c.id, depth + 1);
            });
        };

        if (user?.role === UserRole.OWNER) {
            traverse(undefined, 0);
        } else if (user?.labelId) {
            const myLabel = labels.get(user.labelId);
            if (myLabel) {
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
                <h1 className="text-3xl font-bold text-white">
                    {user?.role === UserRole.OWNER ? 'Financial Accounting' : 'Label Earnings Explorer'}
                </h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2">
                        <DownloadIcon /> Export Selective Report
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-primary">
                    <CardContent className="pt-6">
                        <p className="text-gray-400 text-sm uppercase font-bold">Aggregated Gross Revenue</p>
                        <p className="text-3xl font-bold text-white mt-1">${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Based on selective label filtering</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-blue-500">
                    <CardContent className="pt-6">
                        <p className="text-gray-400 text-sm uppercase font-bold">Paid to Date</p>
                        <p className="text-3xl font-bold text-white mt-1">${stats.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-500 mt-2">Cycle Ready</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-yellow-500">
                    <CardContent className="pt-6">
                        <p className="text-gray-400 text-sm uppercase font-bold">Accumulating / Pending</p>
                        <p className="text-3xl font-bold text-white mt-1">${stats.pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-500 mt-2">Next Payout Estimate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Filters Sidebar */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Network Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Target Label / Sub-Label</label>
                            <select 
                                value={labelFilter} 
                                onChange={e => setLabelFilter(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white focus:ring-1 focus:ring-primary"
                            >
                                <option value="ALL">All Network Revenue</option>
                                {hierarchyOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                        {'\u00A0'.repeat(opt.depth * 3)}{opt.depth > 0 ? '↳ ' : ''}{opt.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-2">Select any children label ID to track specific performance.</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Report Month</label>
                            <select 
                                value={monthFilter} 
                                onChange={e => setMonthFilter(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white"
                            >
                                <option value="ALL">All Available Cycles</option>
                                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Store Channel</label>
                            <select 
                                value={storeFilter} 
                                onChange={e => setStoreFilter(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white"
                            >
                                <option value="ALL">All Global Stores</option>
                                {(Array.from(new Set(revenue.map(r => r.store))) as string[]).sort().map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                             <Button variant="secondary" onClick={() => {
                                setMonthFilter('ALL');
                                setLabelFilter('ALL');
                                setStoreFilter('ALL');
                                setStartDate('');
                                setEndDate('');
                            }} className="w-full text-[10px] uppercase font-bold tracking-wider">Reset Analytics</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Charts Area */}
                <div className="lg:col-span-3 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary Card */}
                        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-widest text-gray-400">Network Insight</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Top Performing Store</p>
                                    <p className="text-xl font-bold text-white">{storeBreakdown[0]?.name || 'No Data'}</p>
                                    <div className="w-full bg-gray-800 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full" style={{ width: `${storeBreakdown[0]?.percentage || 0}%` }}></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active Catalog</p>
                                    <p className="text-xl font-bold text-white">
                                        {Array.from(new Set(filteredRevenue.map(r => r.labelId))).length} Connected Labels
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trend Chart */}
                        <Card className="border border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-sm uppercase tracking-widest text-gray-400">Monthly Payout Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-40 flex items-end gap-2 px-2">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            <div 
                                                className={`w-full ${d.month === monthFilter ? 'bg-primary shadow-[0_0_10px_rgba(29,185,84,0.3)]' : 'bg-gray-700'} rounded-t-sm transition-all hover:bg-primary-dark cursor-pointer`} 
                                                style={{ height: `${(d.amount / maxTrendVal) * 90}%` }}
                                                onClick={() => setMonthFilter(d.month)}
                                            >
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-gray-700 text-white text-[9px] p-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                                                    {d.month}: ${d.amount.toFixed(2)}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-500 mt-2">{d.month.split('-')[1]}/{d.month.split('-')[0].slice(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Entries Table */}
                    <Card className="border border-gray-800">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-gray-800 pb-4">
                            <CardTitle>Hierarchical Earnings Log</CardTitle>
                            <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-800 px-3 py-1 rounded-full">{filteredRevenue.length} Records</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-800/50 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-gray-800">ID / Month</th>
                                            <th className="px-6 py-4 border-b border-gray-800">Associated Label</th>
                                            <th className="px-6 py-4 border-b border-gray-800">Source / Store</th>
                                            <th className="px-6 py-4 border-b border-gray-800">Region</th>
                                            <th className="px-6 py-4 border-b border-gray-800 text-right">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800 text-xs">
                                        {filteredRevenue.slice(0, 30).map(e => {
                                            const label = labels.get(e.labelId);
                                            const isSelf = e.labelId === user?.labelId;
                                            return (
                                                <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-mono text-gray-500">{e.id.slice(0, 12)}...</div>
                                                        <div className="text-white font-bold mt-0.5">{e.reportMonth}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isSelf ? 'bg-primary' : 'bg-blue-500'}`}></div>
                                                            <span className="text-gray-300 font-medium">{label?.name || 'Unknown'}</span>
                                                        </div>
                                                        <div className="text-[9px] text-gray-600 font-mono mt-0.5">LABEL ID: {e.labelId}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-gray-900 border border-gray-700 rounded-sm text-[10px] font-bold text-gray-400">{e.store}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 font-bold uppercase tracking-widest">{e.territory}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className={`font-mono font-bold text-sm ${e.paymentStatus === 'Paid' ? 'text-white' : 'text-yellow-500/80'}`}>
                                                            ${e.amount.toFixed(2)}
                                                        </div>
                                                        <div className={`text-[9px] uppercase font-black ${e.paymentStatus === 'Paid' ? 'text-primary' : 'text-yellow-600'}`}>
                                                            {e.paymentStatus}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredRevenue.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-32 text-center text-gray-600 italic">
                                                    No selective revenue data found for this hierarchy branch.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {filteredRevenue.length > 30 && (
                                    <div className="p-4 text-center border-t border-gray-800 text-[10px] font-bold text-gray-500 uppercase">
                                        Showing first 30 entries. Download full CSV for complete audit.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #282828; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default Accounting;

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, 
    Cpu, 
    Database, 
    Clock, 
    AlertTriangle, 
    Zap, 
    Search, 
    RefreshCw, 
    ArrowLeft,
    HardDrive,
    ShieldAlert,
    User,
    Globe,
    Share2,
    Send,
    Download,
    Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
    getLiveMonitorData, 
    getMonitorHistorySnapshots, 
    getSlowApiHistory, 
    getErrorHistory 
} from '@/api/monitorApi';
import { useToast } from '@/hooks/use-toast';

export default function SystemMonitorPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [liveData, setLiveData] = useState<any>(null);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [slowApis, setSlowApis] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const [refreshTime, setRefreshTime] = useState(Date.now());
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [live, snaps, slows, errs] = await Promise.all([
                getLiveMonitorData(),
                getMonitorHistorySnapshots(30),
                getSlowApiHistory(30),
                getErrorHistory(30)
            ]);
            setLiveData(live);
            setSnapshots(snaps.history || []);
            setSlowApis(slows.history || []);
            setErrors(errs.history || []);
        } catch (error) {
            console.error("Monitor Fetch Error:", error);
            toast({
                title: "Connection Error",
                description: "Could not reach the monitoring server. Check if port 5000 is running.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [refreshTime]);

    const filteredSlowApis = useMemo(() => {
        return slowApis.filter(api => 
            api.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            api.user?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [slowApis, searchQuery]);

    const getStatusColor = (percent: string) => {
        const val = parseFloat(percent);
        if (val > 80) return 'text-red-500 bg-red-50 border-red-200';
        if (val > 50) return 'text-yellow-500 bg-yellow-50 border-yellow-200';
        return 'text-green-500 bg-green-50 border-green-200';
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(-1)}
                        className="rounded-full bg-white shadow-sm"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShieldAlert className="h-8 w-8 text-indigo-600" />
                            System Health Monitor
                        </h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Real-time infrastructure observability (Port 5000)
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hidden sm:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uptime</p>
                        <p className="text-sm font-bold text-indigo-600">{liveData?.totalUptime || 'Determining...'}</p>
                    </div>
                    <Button 
                        onClick={() => setRefreshTime(Date.now())}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg text-white gap-2 h-11 px-6 rounded-xl"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Now
                    </Button>
                </div>
            </header>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* CPU Card */}
                <Card className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase">CPU Usage</CardTitle>
                            <Cpu className="h-5 w-5 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-black text-slate-800">
                                    {liveData?.system?.cpu?.usagePercent || '0%'}
                                </h2>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Usage</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Load Avg</p>
                                <p className="text-sm font-black text-indigo-600">
                                    {liveData?.system?.cpu?.loadAvg?.[0]?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" 
                                style={{ width: liveData?.system?.cpu?.usagePercent || '0%' }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <p className="text-[10px] text-slate-500 font-bold">
                                {liveData?.system?.cpu?.cores || 0} CORES
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium max-w-[140px] truncate text-right">
                                {liveData?.system?.cpu?.model?.replace('(R)', '')?.split('@')[0]?.trim()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* RAM Card */}
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase">Memory Usage</CardTitle>
                            <HardDrive className="h-5 w-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-black text-slate-800">
                                {liveData?.system?.memory?.system?.percent || '0%'}
                            </h2>
                            <span className="text-slate-400 text-sm font-medium">Used</span>
                        </div>
                        <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                            <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                                style={{ width: liveData?.system?.memory?.system?.percent || '0%' }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">{liveData?.system?.memory?.system?.used} / {liveData?.system?.memory?.system?.total}</p>
                    </CardContent>
                </Card>

                {/* Event Loop Card */}
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase">API Responsiveness</CardTitle>
                            <Zap className="h-5 w-5 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-black text-slate-800">
                                {liveData?.system?.memory?.eventLoopLag || '0ms'}
                            </h2>
                            <span className="text-slate-400 text-sm font-medium">Loop Lag</span>
                        </div>
                        <div className="mt-4 flex gap-1">
                            {[1,2,3,4,5,6,7,8,9,10].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${i < 8 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Active Requests: <span className="text-amber-600 font-bold">{liveData?.activeCount || 0}</span></p>
                    </CardContent>
                </Card>

                {/* Errors Card */}
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase">Issues Found</CardTitle>
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-black text-rose-600">
                                {liveData?.recentErrorsCount || 0}
                            </h2>
                            <span className="text-slate-400 text-sm font-medium">Recent Errs</span>
                        </div>
                        <div className="mt-4 w-full bg-rose-50 rounded-lg p-2 border border-rose-100">
                             <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none">Status</p>
                             <p className="text-sm font-bold text-rose-700 leading-tight">
                                {liveData?.recentErrorsCount > 0 ? 'Requires Investigation' : 'System Stable'}
                             </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Wait Time: <span className="text-emerald-600 font-bold">Fast</span></p>
                    </CardContent>
                </Card>

                {/* Sockets Card */}
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase">Socket Status</CardTitle>
                            <Share2 className="h-5 w-5 text-cyan-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-black text-slate-800">
                                {liveData?.sockets?.connectedClients || 0}
                            </h2>
                            <span className="text-slate-400 text-sm font-medium">Active</span>
                        </div>
                        <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                            <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-1000" 
                                style={{ width: `${Math.min((liveData?.sockets?.connectedClients || 0) * 5, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Auth Users: <span className="text-cyan-600 font-bold">{liveData?.sockets?.userMapSize || 0}</span></p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="bg-slate-200/50 p-1 mb-6 rounded-2xl w-full sm:w-auto h-auto flex flex-wrap">
                    <TabsTrigger value="requests" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-sm">
                        <Globe className="h-4 w-4 mr-2" /> Live Requests
                    </TabsTrigger>
                    <TabsTrigger value="slow" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 font-bold text-sm">
                         <Clock className="h-4 w-4 mr-2" /> Slow APIs
                    </TabsTrigger>
                    <TabsTrigger value="db" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 font-bold text-sm">
                         <Database className="h-4 w-4 mr-2" /> Database Load
                    </TabsTrigger>
                    <TabsTrigger value="errors" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-rose-600 font-bold text-sm">
                         <ShieldAlert className="h-4 w-4 mr-2" /> Error Logs
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold text-sm">
                         <Activity className="h-4 w-4 mr-2" /> Stat History
                    </TabsTrigger>
                    <TabsTrigger value="sockets" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-cyan-600 font-bold text-sm">
                         <Share2 className="h-4 w-4 mr-2" /> Socket Stats
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="requests">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Ongoing Traffic</CardTitle>
                            <CardDescription>APIs currently executing on the server right now.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-bold">Method</TableHead>
                                            <TableHead className="font-bold">Endpoint</TableHead>
                                            <TableHead className="font-bold">Running For</TableHead>
                                            <TableHead className="font-bold text-right">User</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!liveData?.activeRequests?.length ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                                    No active requests. Idle.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            liveData.activeRequests.map((req: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell>
                                                        <Badge variant="outline" className={`font-black ${req.method === 'POST' ? 'text-indigo-600 border-indigo-200 bg-indigo-50' : req.method === 'GET' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-600'}`}>
                                                            {req.method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs font-bold text-slate-600">{req.url}</TableCell>
                                                    <TableCell>
                                                        <span className={`font-bold ${parseInt(req.elapsed) > 2000 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            {req.elapsed}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs font-bold text-slate-500">{req.user}</span>
                                                            <User className="h-3 w-3 text-slate-400" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="slow">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg">Slow API History</CardTitle>
                                <CardDescription>Persistent record of requests taking longer than 5 seconds.</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Filter URLs..." 
                                    className="pl-9 h-9 rounded-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-bold">Timestamp</TableHead>
                                            <TableHead className="font-bold">Method</TableHead>
                                            <TableHead className="font-bold">Endpoint</TableHead>
                                            <TableHead className="font-bold">Duration</TableHead>
                                            <TableHead className="font-bold text-right">User</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!filteredSlowApis.length ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                                                    No slow requests detected in persistent logs.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSlowApis.map((log: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-500">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-black">
                                                            {log.method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs font-bold text-slate-600 max-w-[300px] truncate">{log.url}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 font-black">
                                                            {(log.duration / 1000).toFixed(1)}s
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-bold text-slate-500">
                                                        {log.user}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="db">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">MySQL Process List</CardTitle>
                            <CardDescription>Live queries currently being processed by the database.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-bold">ID</TableHead>
                                            <TableHead className="font-bold">Command</TableHead>
                                            <TableHead className="font-bold">Time</TableHead>
                                            <TableHead className="font-bold">State</TableHead>
                                            <TableHead className="font-bold w-1/2">Query Info</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!liveData?.database?.processList?.length ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                                                    Database idle. No active queries.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            liveData.database.processList.map((proc: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="font-bold text-slate-400">{proc.Id}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-bold text-emerald-600 bg-emerald-50">
                                                            {proc.Command}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-amber-600">{proc.Time}s</TableCell>
                                                    <TableCell className="text-xs font-medium text-slate-500">{proc.State || 'N/A'}</TableCell>
                                                    <TableCell className="font-mono text-[10px] break-all max-h-20 overflow-y-auto block p-2">
                                                        {proc.Info || '---'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="errors">
                     <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent System Exceptions</CardTitle>
                            <CardDescription>All application errors captured instantly in MongoDB.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-bold">Timestamp</TableHead>
                                            <TableHead className="font-bold">Module</TableHead>
                                            <TableHead className="font-bold">Error Message</TableHead>
                                            <TableHead className="font-bold text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!errors.length ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                                    Clean logs! No errors found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            errors.map((err: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-rose-50 transition-colors border-l-2 border-l-transparent hover:border-l-rose-500">
                                                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                                                        {new Date(err.createdAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                                                            {err.module}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-md">
                                                        <p className="font-bold text-slate-700 text-xs truncate" title={err.message}>{err.message}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-1 blur-[0.5px] hover:blur-none transition-all">
                                                            {err.errorDetails?.stack?.substring(0, 100)}...
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className="bg-rose-100 text-rose-600 font-bold uppercase text-[10px]">
                                                            {err.severity || 'high'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Infrastructure Snapshots</CardTitle>
                            <CardDescription>Periodic health records saved every 5 minutes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-bold">Snapshot Time</TableHead>
                                            <TableHead className="font-bold">CPU Load</TableHead>
                                            <TableHead className="font-bold">RAM Used</TableHead>
                                            <TableHead className="font-bold">Active Req</TableHead>
                                            <TableHead className="font-bold text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!snapshots.length ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                                                    Waiting for first 5-minute snapshot...
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            snapshots.map((snap: any, i: number) => (
                                                <TableRow key={i} className="hover:bg-slate-50 font-medium">
                                                    <TableCell className="text-slate-500 text-xs">
                                                        {new Date(snap.timestamp).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-slate-700">{snap.cpu?.loadAvg?.[0]?.toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`font-bold ${getStatusColor(snap.memory?.system?.percent)}`}>
                                                            {snap.memory?.system?.percent}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-600">
                                                        {snap.activeCount}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className="bg-emerald-500 text-white border-0">OK</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sockets">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Socket.IO Health</CardTitle>
                            <CardDescription>Real-time bidirectional connection status and authenticated users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100">
                                    <h3 className="text-[10px] font-bold text-cyan-700 uppercase mb-1">Raw Connections</h3>
                                    <p className="text-xl font-black text-cyan-900">{liveData?.sockets?.connectedClients || 0}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                    <h3 className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Auth Users</h3>
                                    <p className="text-xl font-black text-indigo-900">{liveData?.sockets?.userMapSize || 0}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <h3 className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Uptime</h3>
                                    <p className="text-xl font-black text-emerald-900">{liveData?.sockets?.uptime || '0s'}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                    <h3 className="text-[10px] font-bold text-amber-700 uppercase mb-1">Last Activity</h3>
                                    <p className="text-xl font-black text-amber-900">{liveData?.sockets?.lastEvent || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Card className="border border-slate-100 shadow-none bg-slate-50/50">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Radio className="h-4 w-4 text-indigo-500" />
                                            Traffic Monitor
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 rounded-lg">
                                                    <Send className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500">Outgoing</p>
                                                    <p className="text-lg font-black text-slate-800">{liveData?.sockets?.messagesSent || 0}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 rounded-lg">
                                                    <Download className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500">Incoming</p>
                                                    <p className="text-lg font-black text-slate-800">{liveData?.sockets?.messagesReceived || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tight">
                                                <span>Total Messages Processed</span>
                                                <span>{(liveData?.sockets?.messagesSent || 0) + (liveData?.sockets?.messagesReceived || 0)}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                                                <div 
                                                    className="bg-indigo-500 h-full" 
                                                    style={{ 
                                                        width: `${((liveData?.sockets?.messagesSent || 0) / ((liveData?.sockets?.messagesSent || 1) + (liveData?.sockets?.messagesReceived || 0))) * 100}%` 
                                                    }}
                                                />
                                                <div 
                                                    className="bg-emerald-500 h-full" 
                                                    style={{ 
                                                        width: `${((liveData?.sockets?.messagesReceived || 0) / ((liveData?.sockets?.messagesSent || 0) + (liveData?.sockets?.messagesReceived || 1))) * 100}%` 
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-slate-100 shadow-none">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Reliability Metrics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-slate-500">Handshake Success</span>
                                                <span className="text-xs font-bold text-emerald-600">
                                                    {liveData?.sockets?.connectedClients > 0 
                                                        ? Math.round(((liveData.sockets.connectedClients - (liveData.sockets.handshakeErrors || 0)) / liveData.sockets.connectedClients) * 100)
                                                        : 100}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div 
                                                    className="bg-emerald-500 h-1.5 rounded-full" 
                                                    style={{ width: '98%' }} 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                                                <p className="text-[10px] font-bold text-rose-500 uppercase">Errors</p>
                                                <p className="text-lg font-black text-rose-700">{liveData?.sockets?.handshakeErrors || 0}</p>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Ping</p>
                                                <p className="text-lg font-black text-slate-700">24ms</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="border border-slate-100 shadow-none">
                                <CardHeader className="py-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm">Active Connections ({liveData?.sockets?.activeSocketList?.length || 0})</CardTitle>
                                    <Badge variant="outline" className="text-[10px] text-slate-400">LIVE</Badge>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <div className="rounded-lg border border-slate-100 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow className="h-8">
                                                    <TableHead className="text-[10px] font-bold">User</TableHead>
                                                    <TableHead className="text-[10px] font-bold">Duration</TableHead>
                                                    <TableHead className="text-[10px] font-bold">Idle Time</TableHead>
                                                    <TableHead className="text-[10px] font-bold">IP Address</TableHead>
                                                    <TableHead className="text-[10px] font-bold text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!liveData?.sockets?.activeSocketList?.length ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs font-medium">
                                                            No authenticated sockets found.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    liveData.sockets.activeSocketList.map((sock: any, i: number) => (
                                                        <TableRow key={i} className="hover:bg-slate-50 h-10">
                                                            <TableCell>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-700">{sock.userId}</span>
                                                                    <span className="text-[8px] text-slate-400 uppercase tracking-tighter">{sock.role}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-slate-600 font-medium">{sock.duration}</TableCell>
                                                            <TableCell>
                                                                <span className={`text-xs font-bold ${parseInt(sock.idleTime) > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                    {sock.idleTime}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-[10px] text-slate-400 font-mono italic">{sock.address}</TableCell>
                                                            <TableCell className="text-right">
                                                                {sock.isHanging ? (
                                                                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 text-[10px] font-black">
                                                                        HANGING
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 text-[10px] font-black">
                                                                        ACTIVE
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 italic">
                                        * Sockets idle for more than 5 minutes are flagged as 'HANGING'.
                                    </p>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

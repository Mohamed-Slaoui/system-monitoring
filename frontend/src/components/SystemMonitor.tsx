import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Activity, Cpu, HardDrive, Network, Wifi, Server } from "lucide-react";
import type {
    AlertsResp,
    CpuResp,
    DiskResp,
    MemResp,
    NetResp,
    ProcessesResp,
    SystemInfoResp,
} from "../types/index";
import { formatGB, getStatusColor, getStatusBadge, safeFetch, safeToFixed } from "../lib/utils";
import { useNowLabel } from "../hooks/hook";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_BASE = import.meta.env.VITE_API_BASE;

export default function SystemMonitor() {
    const [cpuUsage, setCpuUsage] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);
    const [diskUsage, setDiskUsage] = useState(0);
    const [networkUp, setNetworkUp] = useState(0.0);
    const [networkDown, setNetworkDown] = useState(0.0);

    // --------------------------------
    const [memUsedBytes, setMemUsedBytes] = useState(0);
    const [memTotalBytes, setMemTotalBytes] = useState(0);
    const [diskUsedBytes, setDiskUsedBytes] = useState(0);
    const [diskTotalBytes, setDiskTotalBytes] = useState(0);
    // --------------------------------

    const currentTime = useNowLabel();

    const [systemInfo, setSystemInfo] = useState({
        hostname: "---",
        os: "---",
        uptime: "---",
        cpuModel: "---",
        memory: "---",
    });

    const [processes, setProcesses] = useState<Array<{ name: string; cpu: number }>>(
        Array(5).fill({ name: "---", cpu: 0 })
    );

    const [alerts, setAlerts] = useState<string[]>(["Loading..."]);

    // Chart Data
    const [cpuLabels, setCpuLabels] = useState<string[]>([]);
    const [cpuValues, setCpuValues] = useState<number[]>([]);

    const [networkLabels, setNetworkLabels] = useState<string[]>([]);
    const [networkUpload, setNetworkUpload] = useState<number[]>([]);
    const [networkDownload, setNetworkDownload] = useState<number[]>([]);

    // Initialize with empty data
    useEffect(() => {
        const times = Array.from({ length: 6 }, (_, i) =>
            new Date(Date.now() - i * 5000).toLocaleTimeString()
        ).reverse();

        setCpuLabels(times);
        setCpuValues(Array(6).fill(0));

        setNetworkLabels(times);
        setNetworkUpload(Array(6).fill(0));
        setNetworkDownload(Array(6).fill(0));
    }, []);

    const generateMockData = () => {
        const newCpu = Math.max(5, Math.min(95, Math.random() * 40 + 30));
        const newMemory = Math.max(20, Math.min(90, Math.random() * 30 + 40));
        const newDisk = Math.max(10, Math.min(80, Math.random() * 20 + 30));
        const newNetUp = Math.max(0, Math.random() * 5);
        const newNetDown = Math.max(0, Math.random() * 20);

        setCpuUsage(Math.round(newCpu));
        setMemoryUsage(Math.round(newMemory));
        setDiskUsage(Math.round(newDisk));
        setNetworkUp(parseFloat(newNetUp.toFixed(1)));
        setNetworkDown(parseFloat(newNetDown.toFixed(1)));

        // Update CPU chart
        setCpuLabels(prev => [...prev.slice(1), currentTime]);
        setCpuValues(prev => [...prev.slice(1), Math.round(newCpu)]);

        // Update Network chart
        setNetworkLabels(prev => [...prev.slice(1), currentTime]);
        setNetworkUpload(prev => [...prev.slice(1), parseFloat(newNetUp.toFixed(1))]);
        setNetworkDownload(prev => [...prev.slice(1), parseFloat(newNetDown.toFixed(1))]);
    };

    const loadData = async () => {
        try {
            const [cpu, mem, disk, net, sysInfo, proc, alert] = await Promise.all([
                safeFetch<CpuResp>(API_BASE, "/cpu"),
                safeFetch<MemResp>(API_BASE, "/memory"),
                safeFetch<DiskResp>(API_BASE, "/disk"),
                safeFetch<NetResp>(API_BASE, "/network"),
                safeFetch<SystemInfoResp>(API_BASE, "/system"),
                safeFetch<ProcessesResp>(API_BASE, "/processes"),
                safeFetch<AlertsResp>(API_BASE, "/alerts"),
            ]);

            // CPU
            if (cpu?.usage !== undefined) {
                const usage = Math.max(0, Math.min(100, Number(cpu.usage)));
                setCpuUsage(usage);
                setCpuLabels(prev => [...prev.slice(1), currentTime]);
                setCpuValues(prev => [...prev.slice(1), usage]);
            }

            // Memory
            if (mem) {
                const usage = typeof mem.usage === "number"
                    ? mem.usage
                    : (mem.used || 0) / (mem.total || 1) * 100;
                setMemoryUsage(Math.max(0, Math.min(100, usage)));

                // Set real bytes
                setMemUsedBytes(mem.used || 0);
                setMemTotalBytes(mem.total || 0);
            }

            // Disk
            if (disk) {
                setDiskUsage(Math.max(0, Math.min(100, Number(disk.usage))));
                setDiskUsedBytes(disk.used || 0);
                setDiskTotalBytes(disk.total || 0);
            }

            // Network
            if (net) {
                const up = parseFloat((net.upload || 0).toFixed(1));
                const down = parseFloat((net.download || 0).toFixed(1));

                setNetworkUp(up);
                setNetworkDown(down);

                setNetworkLabels(prev => [...prev.slice(1), currentTime]);
                setNetworkUpload(prev => [...prev.slice(1), up]);
                setNetworkDownload(prev => [...prev.slice(1), down]);
            }

            // System Info
            if (sysInfo) setSystemInfo(sysInfo);
            if (proc) setProcesses(proc.slice(0, 5));
            if (alert) setAlerts(alert.length > 0 ? alert : ["No alerts"]);
        } catch (error) {
            console.error("Load failed", error);
            generateMockData();
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Mini Chart Options (used in cards)
    const miniChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
        scales: { x: { display: false }, y: { display: false, min: 0, max: 100 } },
    } as any;

    const networkMiniOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
    } as any;

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
    } as any;

    // Full Chart Options
    const fullChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
        },
        scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
    } as any;

    const networkFullOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" as const },
            tooltip: { mode: "index", intersect: false },
        },
        scales: { y: { beginAtZero: true } },
    } as any;

    return (
        <main className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* CPU */}
                <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Cpu className="h-4 w-4" /> CPU Usage
                        </CardTitle>
                        <Badge variant={getStatusBadge(cpuUsage, "cpu").variant}>
                            {getStatusBadge(cpuUsage, "cpu").text}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{cpuUsage}%</div>
                        <Progress value={cpuUsage} className="mb-4" />
                        <div className="h-20 w-full">
                            <Line
                                data={{
                                    labels: cpuLabels,
                                    datasets: [
                                        {
                                            data: cpuValues,
                                            borderColor: getStatusColor(cpuUsage, "cpu"),
                                            backgroundColor: "transparent",
                                            borderWidth: 2,
                                            tension: 0.4,
                                            fill: false,
                                        },
                                    ],
                                }}
                                options={miniChartOptions}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Memory */}
                <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Memory Usage
                        </CardTitle>
                        <Badge variant={getStatusBadge(memoryUsage, "memory").variant}>
                            {getStatusBadge(memoryUsage, "memory").text}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{memoryUsage}%</div>
                        <Progress value={memoryUsage} className="mb-4" />
                        <div className="text-sm text-gray-500">
                            <div className="flex justify-between">
                                <span>Used: {formatGB(memUsedBytes)}</span>
                                <span>Total: {formatGB(memTotalBytes)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Disk */}
                <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <HardDrive className="h-4 w-4" /> Disk Usage
                        </CardTitle>
                        <Badge variant={getStatusBadge(diskUsage, "disk").variant}>
                            {getStatusBadge(diskUsage, "disk").text}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold mb-2">{diskUsage}%</div>
                        <div className="h-20 mb-2">
                            <Pie
                                data={{
                                    datasets: [
                                        {
                                            data: [diskUsage, 100 - diskUsage],
                                            backgroundColor: ["#3b82f6", "#e5e7eb"],
                                            borderWidth: 0,
                                        },
                                    ],
                                }}
                                options={pieOptions}
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            <div className="flex justify-between">
                                <span>Used: {formatGB(diskUsedBytes)}</span>
                                <span>Free: {formatGB(Math.max(diskTotalBytes - diskUsedBytes, 0))}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Network */}
                <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="flex items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Network className="h-4 w-4" /> Network Activity
                        </CardTitle>
                        <Badge variant="outline" className="border-green-500 text-green-600">
                            <Wifi className="h-3 w-3 mr-1" /> Active
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-lg font-semibold text-blue-600">
                                {safeToFixed(networkUp)} MB/s
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                                {safeToFixed(networkDown)} MB/s
                            </div>
                        </div>
                        <div className="h-20 w-full">
                            <Line
                                data={{
                                    labels: networkLabels,
                                    datasets: [
                                        {
                                            data: networkDownload,
                                            borderColor: "#10b981",
                                            backgroundColor: "transparent",
                                            borderWidth: 2,
                                            tension: 0.4,
                                            fill: false,
                                        },
                                        {
                                            data: networkUpload,
                                            borderColor: "#3b82f6",
                                            backgroundColor: "transparent",
                                            borderWidth: 2,
                                            tension: 0.4,
                                            fill: false,
                                        },
                                    ],
                                }}
                                options={networkMiniOptions}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Info, Processes, Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" /> System Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Hostname:</span>
                                <span className="font-medium">{systemInfo.hostname}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">OS:</span>
                                <span className="font-medium">{systemInfo.os}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Uptime:</span>
                                <span className="font-medium">{systemInfo.uptime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">CPU Model:</span>
                                <span className="font-medium">{systemInfo.cpuModel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Memory:</span>
                                <span className="font-medium">{systemInfo.memory}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Top Processes</CardTitle>
                            <span className="text-xs text-gray-500">CPU %</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            {processes.map((p, i) => (
                                <div key={i} className="flex justify-between">
                                    <span>{p.name}</span>
                                    <span className="font-medium">{p.cpu}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Recent Alerts</CardTitle>
                            <span className="text-xs text-gray-500">Last 24h</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((a, i) => (
                                <div key={i} className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div
                                            className={`h-2 w-2 rounded-full ${a.toLowerCase().includes("operational")
                                                ? "bg-green-500"
                                                : "bg-red-500"
                                                }`}
                                        ></div>
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <p>{a.replace(/^✅\s?/, "").replace(/^⚠️\s?/, "")}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                {/* CPU Full */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="h-5 w-5" /> CPU Usage History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <Line
                                data={{
                                    labels: cpuLabels,
                                    datasets: [
                                        {
                                            label: "CPU Usage (%)",
                                            data: cpuValues,
                                            borderColor: "#3b82f6",
                                            backgroundColor: (ctx) => {
                                                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
                                                gradient.addColorStop(0, "rgba(59, 130, 246, 0.6)");
                                                gradient.addColorStop(1, "rgba(59, 130, 246, 0.1)");
                                                return gradient;
                                            },
                                            fill: true,
                                            tension: 0.4,
                                            borderWidth: 2,
                                        },
                                    ],
                                }}
                                options={fullChartOptions}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Network Full */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Network className="h-5 w-5" /> Network Activity History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full">
                            <Line
                                data={{
                                    labels: networkLabels,
                                    datasets: [
                                        {
                                            label: "Download (MB/s)",
                                            data: networkDownload,
                                            borderColor: "#10b981",
                                            backgroundColor: "rgba(16, 185, 129, 0.2)",
                                            fill: true,
                                            tension: 0.4,
                                            borderWidth: 2,
                                        },
                                        {
                                            label: "Upload (MB/s)",
                                            data: networkUpload,
                                            borderColor: "#3b82f6",
                                            backgroundColor: "rgba(59, 130, 246, 0.2)",
                                            fill: true,
                                            tension: 0.4,
                                            borderWidth: 2,
                                        },
                                    ],
                                }}
                                options={networkFullOptions}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
const express = require("express");
const cors = require("cors");
const si = require("systeminformation");

const app = express();
app.use(cors());
app.use(express.json());

// Helper: Safely format number to fixed decimal (as number, not string)
const toFixedNumber = (value, digits = 2) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Number(num.toFixed(digits));
};

// CPU usage
app.get("/api/cpu", async (req, res) => {
  try {
    const load = await si.currentLoad();
    const usage = toFixedNumber(load.currentLoad, 2);
    res.json({ usage }); // number
  } catch (error) {
    console.error("CPU error:", error);
    res.status(500).json({ error: "Failed to get CPU data" });
  }
});

// Memory
app.get("/api/memory", async (req, res) => {
  try {
    const mem = await si.mem();
    const total = mem.total || 0;
    const used = mem.used || mem.active || 0; // prefer 'used' over 'active'
    const free = total - used;
    const usage = total > 0 ? toFixedNumber((used / total) * 100, 2) : 0;

    res.json({
      total,
      used,
      free,
      usage,
    });
  } catch (error) {
    console.error("Memory error:", error);
    res.status(500).json({ error: "Failed to get memory data" });
  }
});

// Disk
app.get("/api/disk", async (req, res) => {
  try {
    const disks = await si.fsSize();
    if (!Array.isArray(disks) || disks.length === 0) {
      return res.json({
        total: 0,
        used: 0,
        usage: 0,
      });
    }

    // Try to find system/boot disk; fallback to first
    const disk = disks.find(d => d.mount === "/" || d.type === "Local Disk") || disks[0];

    const total = disk.size || 0;
    const used = disk.used || 0;
    const usage = total > 0 ? toFixedNumber((used / total) * 100, 2) : 0;

    res.json({
      total,
      used,
      usage,
    });
  } catch (error) {
    console.error("Disk error:", error);
    res.status(500).json({ error: "Failed to get disk data" });
  }
});

// Network
app.get("/api/network", async (req, res) => {
  try {
    const net = await si.networkStats();

    // Handle empty or invalid response
    if (!Array.isArray(net) || net.length === 0) {
      return res.json({ upload: 0, download: 0 });
    }

    // Find the most active or first active interface
    const activeInterface = net.find(
      (iface) => iface.rx_sec > 0 || iface.tx_sec > 0
    ) || net[0]; // fallback to first interface

    const upload = activeInterface.tx_sec || 0;
    const download = activeInterface.rx_sec || 0;

    // Return numbers, not strings
    res.json({
      upload: parseFloat((upload / 1024).toFixed(2)), // MB/s as number
      download: parseFloat((download / 1024).toFixed(2)), // MB/s as number
    });
  } catch (error) {
    console.error("Network error:", error);
    res.status(500).json({ error: "Failed to get network data" });
  }
});

// System information
app.get("/api/system", async (req, res) => {
  try {
    const [osInfo, cpu, mem, time] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.time(),
    ]);

    // Format uptime: d h m
    const uptimeSeconds = time.uptime || 0;
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${days}d ${hours}h ${minutes}m`;

    // Safe strings
    const hostname = osInfo.hostname || "unknown";
    const os = `${osInfo.distro || "Unknown"} ${osInfo.release || ""}`.trim();
    const cpuModel = [cpu.manufacturer, cpu.brand].filter(Boolean).join(" ") || "Unknown CPU";
    const memory = toFixedNumber(mem.total / (1024 ** 3), 1); // GB

    res.json({
      hostname,
      os,
      uptime,
      cpuModel,
      memory: `${memory} GB`,
    });
  } catch (error) {
    console.error("System info error:", error);
    res.status(500).json({ error: "Failed to get system info" });
  }
});

// Top processes
app.get("/api/processes", async (req, res) => {
  try {
    const processes = await si.processes();
    const list = Array.isArray(processes?.list) ? processes.list : [];

    const top5 = list
      .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name || p.command || "Unknown",
        cpu: toFixedNumber(p.cpu, 1), // number
      }));

    res.json(top5);
  } catch (error) {
    console.error("Processes error:", error);
    res.status(500).json({ error: "Failed to get processes data" });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  const alerts = [];

  try {
    const [load, mem] = await Promise.all([
      si.currentLoad().catch(() => null),
      si.mem().catch(() => null),
    ]);

    if (load && load.currentLoad > 85) {
      alerts.push("⚠️ High CPU usage: " + toFixedNumber(load.currentLoad) + "%");
    }

    if (mem && mem.total > 0) {
      const memUsage = (mem.used || mem.active || 0) / mem.total * 100;
      if (memUsage > 80) {
        alerts.push("⚠️ High Memory usage: " + toFixedNumber(memUsage) + "%");
      }
    }

    try {
      const disks = await si.fsSize();
      const disk = disks.find(d => d.mount === "/" || d.type === "Local Disk") || disks[0];
      if (disk && disk.use > 80) {
        alerts.push(`⚠️ High Disk usage: ${toFixedNumber(disk.use)}% on ${disk.mount || "disk"}`);
      }
    } catch (e) {
      console.warn("Failed to check disk for alerts:", e);
    }

  } catch (error) {
    console.error("Alerts evaluation error:", error);
  }

  // Return default if no issues
  res.json(alerts.length > 0 ? alerts : ["✅ All systems operational"]);
});

// Start server
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints: /api/cpu, /api/memory, /api/disk, /api/network, /api/system, /api/processes, /api/alerts`);
});
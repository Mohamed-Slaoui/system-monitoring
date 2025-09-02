export type CpuResp = { usage: number };
export type MemResp = { total: number; used: number; free: number; usage: number };
export type DiskResp = { total: number; used: number; usage: number };
export type NetResp = { upload: number; download: number };
export type SystemInfoResp = { 
  hostname: string; 
  os: string; 
  uptime: string; 
  cpuModel: string; 
  memory: string;
};
export type ProcessesResp = { name: string; cpu: number }[];
export type AlertsResp = string[];
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import {
    Router,
    Network,
    Server,
    Monitor,
    Laptop,
    Cloud,
    Globe,
    Camera,
    Wifi,
    Cpu,
    Box,
    Layers,
    Database,
    Shield,
    Check,
    AlertTriangle,
    Zap,
    Plug,
    Usb,
    SlidersHorizontal,
    Activity,
    Wind,
    BatteryMedium,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HardwareNodeData, HardwareType } from '../store/networkStore';
import { useNetworkStore } from '../store/networkStore';

const iconMap: Record<HardwareType, LucideIcon> = {
    router: Router,
    switch: Network,
    server: Server,
    pc: Monitor,
    laptop: Laptop,
    cloud: Cloud,
    isp: Globe,
    cctv: Camera,
    accesspoint: Wifi,
    ont: Globe,
    mikrotik: Cpu,
    proxmox: Layers,
    docker: Box,
    nas: Database,
    firewall: Shield,
    // Electrical Types
    power_strip: Zap,
    adapter: Plug,
    dock: Layers,
    kvm: Box,
    monitor_display: Monitor,
    peripheral: Usb,
    controller: SlidersHorizontal,
    hub: Activity,
    power_source: Wind,
    ups: BatteryMedium,
};

const colorMap: Record<HardwareType, { bg: string; accent: string }> = {
    router: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#667eea' },
    switch: { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', accent: '#11998e' },
    server: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f5576c' },
    pc: { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', accent: '#4facfe' },
    laptop: { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', accent: '#a18cd1' },
    cloud: { bg: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', accent: '#66a6ff' },
    isp: { bg: 'linear-gradient(135deg, #434343 0%, #000000 100%)', accent: '#434343' },
    cctv: { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', accent: '#ff9a9e' },
    accesspoint: { bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', accent: '#f6d365' },
    ont: { bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', accent: '#00c6ff' },
    mikrotik: { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', accent: '#30cfd0' },
    proxmox: { bg: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)', accent: '#f83600' },
    docker: { bg: 'linear-gradient(135deg, #243949 0%, #517fa4 100%)', accent: '#243949' },
    nas: { bg: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', accent: '#0ba360' },
    firewall: { bg: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)', accent: '#ed213a' },
    // Electrical Types (using similar palette)
    power_strip: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', accent: '#f59e0b' },
    adapter: { bg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)', accent: '#fbbf24' },
    dock: { bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', accent: '#6366f1' },
    kvm: { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', accent: '#3b82f6' },
    monitor_display: { bg: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', accent: '#06b6d4' },
    peripheral: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', accent: '#8b5cf6' },
    controller: { bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', accent: '#ec4899' },
    hub: { bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', accent: '#10b981' },
    power_source: { bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', accent: '#f43f5e' },
    ups: { bg: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', accent: '#059669' },
};

const typeLabels: Record<HardwareType, string> = {
    router: 'Router',
    switch: 'Switch',
    server: 'Server',
    pc: 'PC',
    laptop: 'Laptop',
    cloud: 'Cloud',
    isp: 'ISP',
    cctv: 'CCTV',
    accesspoint: 'Access Point',
    ont: 'ONT',
    mikrotik: 'Mikrotik',
    proxmox: 'Proxmox',
    docker: 'Docker',
    nas: 'NAS',
    firewall: 'Firewall',
    // Electrical Labels
    power_strip: 'Power Strip',
    adapter: 'Adapter',
    dock: 'Docking Station',
    kvm: 'KVM Switch',
    monitor_display: 'Monitor/Display',
    peripheral: 'Peripheral',
    controller: 'Controller',
    hub: 'USB/Data Hub',
    power_source: 'Power Source',
    ups: 'UPS',
};

type HardwareNodeType = Node<HardwareNodeData, 'hardware'>;

function HardwareNode({ id, data, selected }: NodeProps<HardwareNodeType>) {
    const setSelectedNode = useNetworkStore((state) => state.setSelectedNode);
    const nodes = useNetworkStore((state) => state.nodes);

    const nodeData = data as HardwareNodeData;
    const Icon = iconMap[nodeData.hardwareType] || Server;
    const colors = colorMap[nodeData.hardwareType] || colorMap.router;

    const handleClick = () => {
        const node = nodes.find((n) => n.id === id);
        if (node) setSelectedNode(node);
    };

    const isOnline = nodeData.status === 'online';
    const isOffline = nodeData.status === 'offline';
    const isWarning = nodeData.status === 'warning';

    return (
        <div
            className={`uptime-kuma-node ${selected ? 'selected' : ''} ${nodeData.status}`}
            onClick={handleClick}
        >
            <Handle type="target" position={Position.Top} className="handle-modern" />
            <Handle type="target" position={Position.Left} className="handle-modern" id="left" />

            {/* Status Icon in top right */}
            <div className="status-badge-top">
                {isOnline && <div className="dot online"><Check size={8} strokeWidth={4} /></div>}
                {(isOffline || isWarning) && <div className="dot offline"><AlertTriangle size={8} strokeWidth={4} /></div>}
            </div>

            <div className="node-card-content">
                <div className="node-icon-uptime" style={{ color: colors.accent }}>
                    <Icon size={32} strokeWidth={1.5} />
                </div>

                <div className="node-main-info">
                    <h4 className="node-title">{nodeData.label}</h4>
                    <span className="node-subtitle">{typeLabels[nodeData.hardwareType] || 'Device'}</span>
                    {nodeData.ip && <span className="node-ip">{nodeData.ip}</span>}
                </div>

                <div className={`status-pill ${nodeData.status}`}>
                    {nodeData.status?.toUpperCase() || 'UNKNOWN'}
                </div>

                {nodeData.uptimeKumaId && (
                    <div className="uptime-info">
                        <span className="uptime-label">UPTIMEKUMA</span>
                        {nodeData.latency && <span className="uptime-latency">{nodeData.latency}</span>}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="handle-modern" />
            <Handle type="source" position={Position.Right} className="handle-modern" id="right" />
        </div>
    );
}

export default memo(HardwareNode);

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

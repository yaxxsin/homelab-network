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
    AppWindow,
    Database,
    Mail,
    Globe2,
    Camera,
    Wifi,
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
};

const statusColors: Record<string, string> = {
    online: '#22c55e',
    offline: '#ef4444',
    warning: '#f59e0b',
};

const appIconMap: Record<string, LucideIcon> = {
    web: Globe2,
    database: Database,
    api: AppWindow,
    mail: Mail,
    dns: Globe,
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

    const hasVlans = nodeData.vlans && nodeData.vlans.length > 0;
    const hasApps = nodeData.applications && nodeData.applications.length > 0;

    return (
        <div className={`hardware-node-modern ${selected ? 'selected' : ''}`} onClick={handleClick}>
            <Handle type="target" position={Position.Top} className="handle-modern" />
            <Handle type="target" position={Position.Left} className="handle-modern" id="left" />

            <div className="node-icon-wrapper" style={{ background: colors.bg }}>
                <Icon size={28} strokeWidth={1.8} color="#fff" />
            </div>

            <div className="node-info">
                <div className="node-label-modern">{nodeData.label}</div>
                {nodeData.ip && <div className="node-meta">{nodeData.ip}</div>}

                {hasVlans && (
                    <div className="node-tags">
                        {nodeData.vlans!.slice(0, 2).map((v) => (
                            <span key={v.id} className="node-tag vlan">VLAN {v.id}</span>
                        ))}
                        {nodeData.vlans!.length > 2 && <span className="node-tag more">+{nodeData.vlans!.length - 2}</span>}
                    </div>
                )}

                {hasApps && (
                    <div className="node-apps">
                        {nodeData.applications!.slice(0, 3).map((app, i) => {
                            const AppIcon = appIconMap[app.type] || AppWindow;
                            return (
                                <div key={i} className={`app-badge ${app.status}`} title={`${app.name} (${app.status})`}>
                                    <AppIcon size={12} />
                                </div>
                            );
                        })}
                        {nodeData.applications!.length > 3 && <span className="app-more">+{nodeData.applications!.length - 3}</span>}
                    </div>
                )}
            </div>

            <div
                className="status-indicator"
                style={{
                    backgroundColor: statusColors[nodeData.status] || '#22c55e',
                    boxShadow: `0 0 8px ${statusColors[nodeData.status] || '#22c55e'}`
                }}
                title={nodeData.status}
            />

            <Handle type="source" position={Position.Bottom} className="handle-modern" />
            <Handle type="source" position={Position.Right} className="handle-modern" id="right" />
        </div>
    );
}

export default memo(HardwareNode);

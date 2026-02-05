import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import {
    Zap,
    Plug,
    Activity,
    Monitor,
    Usb,
    Layers,
    SlidersHorizontal,
    Box,
    Wind,
    BatteryMedium
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HardwareNodeData } from '../store/networkStore';
import { useNetworkStore } from '../store/networkStore';

const iconMap: Record<string, LucideIcon> = {
    power_strip: Zap,
    adapter: Plug,
    dock: Layers,
    kvm: Box,
    monitor_display: Monitor,
    peripheral: Usb,
    controller: SlidersHorizontal,
    hub: Activity,
    power_source: Wind,
    ups: BatteryMedium
};

const colorMap: Record<string, string> = {
    power_strip: '#f59e0b',
    adapter: '#fbbf24',
    dock: '#6366f1',
    kvm: '#3b82f6',
    monitor_display: '#06b6d4',
    peripheral: '#8b5cf6',
    controller: '#ec4899',
    hub: '#10b981',
    power_source: '#f43f5e',
    ups: '#059669'
};

type ElectricalNodeType = Node<HardwareNodeData, 'electrical'>;

function ElectricalNode({ id, data, selected }: NodeProps<ElectricalNodeType>) {
    const setSelectedNode = useNetworkStore((state) => state.setSelectedNode);
    const nodes = useNetworkStore((state) => state.nodes);

    const nodeData = data as HardwareNodeData;
    const Icon = iconMap[nodeData.hardwareType] || Box;
    const accentColor = colorMap[nodeData.hardwareType] || '#64748b';

    const handleClick = () => {
        const node = nodes.find((n) => n.id === id);
        if (node) setSelectedNode(node);
    };

    // Calculate layout for multiple handles
    const ports = nodeData.electricalPorts || [];
    const inputs = ports.filter(p => p.direction === 'input' || p.direction === 'both');
    const outputs = ports.filter(p => p.direction === 'output' || p.direction === 'both');

    return (
        <div
            className={`electrical-node ${selected ? 'selected' : ''}`}
            onClick={handleClick}
            style={{ '--accent-color': accentColor } as any}
        >
            {/* Input Handles */}
            <div className="ports-column-left">
                {inputs.map((port) => (
                    <div key={port.id} className="port-wrapper">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={port.id}
                            className={`port-handle port-${port.type}`}
                        />
                    </div>
                ))}
            </div>

            <div className="electrical-node-body">
                <div className="electrical-icon" style={{ backgroundColor: accentColor }}>
                    <Icon size={20} color="white" strokeWidth={2} />
                </div>
                <div className="electrical-info">
                    <h4 className="electrical-title">{nodeData.label}</h4>
                    {nodeData.wattage && <span className="electrical-wattage">{nodeData.wattage}W</span>}
                </div>
            </div>

            {/* Output Handles */}
            <div className="ports-column-right">
                {outputs.map((port) => (
                    <div key={port.id} className="port-wrapper text-right">
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={port.id}
                            className={`port-handle port-${port.type}`}
                        />
                    </div>
                ))}
            </div>

            {/* Default handles if no ports defined */}
            {ports.length === 0 && (
                <>
                    <Handle type="target" position={Position.Left} className="port-handle" />
                    <Handle type="source" position={Position.Right} className="port-handle" />
                </>
            )}
        </div>
    );
}

export default memo(ElectricalNode);

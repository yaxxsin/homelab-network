import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { HardwareNodeData } from '../store/networkStore';

type ShapeNodeType = Node<HardwareNodeData, 'shape'>;

function ShapeNode({ data, selected }: NodeProps<ShapeNodeType>) {
    const {
        label,
        backgroundColor,
        borderColor,
        textColor,
        fontSize,
        shapeType
    } = data;

    const style: React.CSSProperties = {
        backgroundColor: backgroundColor || '#cbd5e1',
        border: `2px solid ${borderColor || '#94a3b8'}`,
        color: textColor || '#1e293b',
        fontSize: fontSize ? `${fontSize}px` : '14px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: shapeType === 'circle' ? '50%' : '4px',
    };

    return (
        <div className={`shape-node ${shapeType || 'rectangle'} ${selected ? 'selected' : ''}`} style={{ width: '100%', height: '100%' }}>
            <NodeResizer
                minWidth={50}
                minHeight={50}
                isVisible={selected}
                lineClassName="border-indigo-500"
                handleClassName="h-3 w-3 bg-white border-2 border-indigo-500 rounded"
            />
            <div className="shape-node-content" style={style}>
                {label}
            </div>
        </div>
    );
}

export default memo(ShapeNode);

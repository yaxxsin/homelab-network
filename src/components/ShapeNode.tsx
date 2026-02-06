import { memo, useEffect, useRef } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import rough from 'roughjs';
import type { HardwareNodeData } from '../store/networkStore';

type ShapeNodeType = Node<HardwareNodeData, 'shape'>;

function ShapeNode({ data, selected }: NodeProps<ShapeNodeType>) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        label,
        backgroundColor,
        borderColor,
        textColor,
        fontSize,
        shapeType,
        roughness = 1,
        fillStyle = 'hachure',
        strokeWidth = 2,
        opacity = 1,
        width = 150,
        height = 100
    } = data;

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rc = rough.canvas(canvas);
        const ctx = canvas.getContext('2d');

        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const options = {
            roughness: roughness,
            stroke: borderColor || '#64748b',
            strokeWidth: strokeWidth,
            fill: backgroundColor || '#cbd5e1',
            fillStyle: fillStyle,
            fillWeight: 3,
            hachureAngle: 60,
            hachureGap: 4,
        };

        if (shapeType === 'circle') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const diameter = Math.min(canvas.width, canvas.height) - 10;
            rc.circle(centerX, centerY, diameter, options);
        } else {
            rc.rectangle(5, 5, canvas.width - 10, canvas.height - 10, options);
        }
    }, [backgroundColor, borderColor, shapeType, roughness, fillStyle, strokeWidth, width, height]);

    return (
        <div className={`shape-node ${shapeType || 'rectangle'} ${selected ? 'selected' : ''}`} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <NodeResizer
                minWidth={50}
                minHeight={50}
                isVisible={selected}
                lineClassName="border-indigo-500"
                handleClassName="h-3 w-3 bg-white border-2 border-indigo-500 rounded"
            />
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    opacity: opacity
                }}
            />
            <div
                className="shape-node-content"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    color: textColor || '#1e293b',
                    fontSize: fontSize ? `${fontSize}px` : '14px',
                }}
            >
                {label}
            </div>
        </div>
    );
}

export default memo(ShapeNode);

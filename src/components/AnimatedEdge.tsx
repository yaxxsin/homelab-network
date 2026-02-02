import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export default function AnimatedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data,
    selected,
}: EdgeProps) {
    // Get line type and animation type from edge data
    const lineType = (data as { lineType?: string })?.lineType || 'bezier';
    const animationType = (data as { animationType?: string })?.animationType || 'dashed';

    // Calculate path based on line type
    const pathParams = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    };

    const [edgePath, labelX, labelY] = lineType === 'smoothstep'
        ? getSmoothStepPath(pathParams)
        : getBezierPath(pathParams);

    const isDashed = animationType === 'dashed';
    const isDot = animationType === 'dot';

    return (
        <>
            {/* Base edge - solid for dot, dashed for dashed animation */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeDasharray: isDashed ? '5 5' : 'none',
                    animation: isDashed ? 'dashdraw 0.5s linear infinite' : undefined,
                }}
            />

            {/* Dot animation */}
            {isDot && (
                <circle r="5" fill="#6366f1" filter="url(#glow)">
                    <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
                </circle>
            )}

            {/* Glow filter for dot */}
            {isDot && (
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            )}

            {/* Edge label */}
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            fontSize: 10,
                            fontWeight: 500,
                            background: selected ? '#6366f1' : '#fff',
                            color: selected ? '#fff' : '#1e293b',
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

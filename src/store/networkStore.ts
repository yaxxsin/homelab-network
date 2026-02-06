import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Edge, Node, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

export type ProjectType = 'network' | 'electrical';

export type HardwareType =
    // Network Types
    | 'router' | 'switch' | 'server' | 'pc' | 'laptop' | 'cloud' | 'isp' | 'cctv' | 'accesspoint' | 'ont' | 'mikrotik' | 'proxmox' | 'docker' | 'nas' | 'firewall'
    // Electrical Types
    | 'power_strip' | 'adapter' | 'dock' | 'kvm' | 'monitor_display' | 'peripheral' | 'controller' | 'hub' | 'power_source' | 'ups'
    // Shape Types
    | 'shape';

export interface ElectricalPort {
    id: string;
    type: 'usb-a' | 'usb-c' | 'hdmi' | 'displayport' | 'power' | 'network' | 'audio' | 'vga' | 'dvi';
    label: string;
    direction: 'input' | 'output' | 'both';
}

// Application info that lives inside servers
export interface ApplicationInfo {
    name: string;
    type: string;
    port?: string;
    protocol?: string;
    version?: string;
    status: 'running' | 'stopped' | 'error';
}

// VLAN info that lives inside network devices (router/switch)
export interface VlanInfo {
    id: string;
    name: string;
    ipRange?: string;
    gateway?: string;
    description?: string;
}

export interface HardwareNodeData extends Record<string, unknown> {
    label: string;
    hardwareType: HardwareType;
    ip?: string;
    status: 'online' | 'offline' | 'warning';
    // Shape/Generic properties
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    fontSize?: number;
    textColor?: string;
    shapeType?: 'rectangle' | 'circle';
    ports?: number;
    description?: string;
    location?: string;
    subnetMask?: string;
    macAddress?: string;
    dns?: string;
    vlans?: VlanInfo[];
    applications?: ApplicationInfo[];
    bandwidth?: string;
    ispType?: string;
    accountId?: string;
    publicIp?: string;
    uptimeKumaId?: string;
    latency?: string | number;
    customDetails?: { id: string, key: string, value: string }[];
    // Extended Info
    os?: string;
    serialNumber?: string;
    cpu?: string;
    ram?: string;
    storage?: string;
    // Electrical specific
    electricalPorts?: ElectricalPort[];
    current?: string;
}

export type HardwareNode = Node<HardwareNodeData, 'hardware' | 'electrical' | 'shape'>;

// Enhanced Edge with network info
export interface CustomEdge extends Edge {
    connectionType?: 'ethernet' | 'fiber' | 'wireless' | 'serial';
    bandwidth?: string;
    animationType?: 'dashed' | 'dot' | 'none';
    lineType?: 'bezier' | 'smoothstep';
    networkInfo?: {
        ip?: string;
        subnetMask?: string;
        gateway?: string;
        dns?: string;
        vlanId?: string;
        mtu?: string;
    };
}

export interface Project {
    id: string;
    name: string;
    type: ProjectType;
    description?: string;
    updatedAt: number;
    nodes: HardwareNode[];
    edges: CustomEdge[];
}

interface NetworkState {
    projects: Project[];
    currentProjectId: string | null;
    nodes: HardwareNode[];
    edges: CustomEdge[];
    selectedNode: HardwareNode | null;
    selectedEdge: CustomEdge | null;
    connectionMode: boolean;
    past: { nodes: HardwareNode[], edges: CustomEdge[] }[];
    future: { nodes: HardwareNode[], edges: CustomEdge[] }[];

    // Project Actions
    createProject: (name: string, type: ProjectType, description?: string) => void;
    selectProject: (id: string) => void;
    deleteProject: (id: string) => void;
    backToDashboard: () => void;

    // Node/Edge Actions
    onNodesChange: OnNodesChange<HardwareNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    addNode: (node: HardwareNode) => void;
    addNodeFromData: (data: HardwareNodeData) => void;
    addEdgeFromData: (data: Partial<CustomEdge> & { source: string; target: string }) => void;
    updateNode: (id: string, data: Partial<HardwareNodeData>) => void;
    setSelectedNode: (node: HardwareNode | null) => void;
    setSelectedEdge: (edge: CustomEdge | null) => void;
    deleteNode: (id: string) => void;
    deleteEdge: (id: string) => void;
    updateEdge: (id: string, data: Partial<CustomEdge>) => void;
    setConnectionMode: (mode: boolean) => void;
    exportTopology: () => string;
    importTopology: (json: string) => boolean;
    clearAll: () => void;
    _sync: () => void;
    _syncToServer: () => Promise<void>;
    initStore: () => Promise<void>;
    resetStore: () => void;
    isInitialized: boolean;
    isLoading: boolean;
    // Undo/Redo actions
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
    // Detail CRUD
    addNodeDetail: (nodeId: string, key: string, value: string) => void;
    updateNodeDetail: (nodeId: string, detailId: string, key: string, value: string) => void;
    deleteNodeDetail: (nodeId: string, detailId: string) => void;
}

let nodeIdCounter = Date.now();
const getNodeId = () => `node_${nodeIdCounter++}`;

export const useNetworkStore = create<NetworkState>()(
    persist(
        (set, get) => ({
            projects: [],
            currentProjectId: null,
            nodes: [],
            edges: [],
            selectedNode: null,
            selectedEdge: null,
            connectionMode: false,
            isInitialized: false,
            isLoading: false,
            past: [] as { nodes: HardwareNode[], edges: CustomEdge[] }[],
            future: [] as { nodes: HardwareNode[], edges: CustomEdge[] }[],

            initStore: async () => {
                if (get().isLoading) return;
                set({ isLoading: true });
                try {
                    const response = await fetch('/api/projects');
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.projects) {
                            const { currentProjectId } = get();
                            const updatedProjects = data.projects;

                            // If server has projects
                            if (updatedProjects.length > 0) {
                                let nextNodes = get().nodes;
                                let nextEdges = get().edges;
                                let nextProjectId = currentProjectId;

                                if (currentProjectId) {
                                    const serverProject = updatedProjects.find((p: Project) => p.id === currentProjectId);
                                    if (serverProject) {
                                        nextNodes = serverProject.nodes;
                                        nextEdges = serverProject.edges;
                                    }
                                }

                                set({
                                    projects: updatedProjects,
                                    nodes: nextNodes,
                                    edges: nextEdges,
                                    currentProjectId: nextProjectId,
                                    isInitialized: true
                                });
                            } else {
                                set({ isInitialized: true });
                            }
                        } else {
                            set({ isInitialized: true });
                        }
                    }
                } catch (err) {
                    console.error('Failed to load projects from server:', err);
                } finally {
                    set({ isLoading: false });
                }
            },

            resetStore: () => {
                set({
                    projects: [],
                    currentProjectId: null,
                    nodes: [],
                    edges: [],
                    selectedNode: null,
                    selectedEdge: null,
                    connectionMode: false,
                    isInitialized: false,
                    isLoading: false
                });
            },

            _syncToServer: async () => {
                // IMPORTANT: Never sync if we haven't successfully loaded from server yet
                // OR if it's the very first load and we're still checking
                if (!get().isInitialized || get().isLoading) {
                    console.log('Skipping sync: Store not yet initialized from server');
                    return;
                }

                // Debounce the sync to prevent deadlocks and excessive server load
                const { _syncTimer } = get() as any;
                if (_syncTimer) clearTimeout(_syncTimer);

                const timer = setTimeout(async () => {
                    try {
                        const { projects } = get();
                        console.log('Syncing projects to server...', projects.length);
                        const res = await fetch('/api/projects', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ projects }),
                        });
                        if (!res.ok) console.error('Server sync failed:', res.statusText);
                    } catch (err) {
                        console.error('Failed to sync projects to server:', err);
                    }
                }, 1000); // 1s debounce

                set({ _syncTimer: timer } as any);
            },

            // Undo/Redo Logic
            takeSnapshot: () => {
                const { nodes, edges, past } = get();
                // Limit history to 50 steps
                const newPast = [...past, { nodes: [...nodes], edges: [...edges] }].slice(-50);
                set({ past: newPast, future: [] });
            },

            undo: () => {
                const { past, future, nodes, edges } = get();
                if (past.length === 0) return;

                const previous = past[past.length - 1];
                const newPast = past.slice(0, past.length - 1);

                set({
                    nodes: previous.nodes,
                    edges: previous.edges,
                    past: newPast,
                    future: [{ nodes, edges }, ...future].slice(0, 50),
                    selectedNode: null,
                    selectedEdge: null
                });
                get()._sync();
            },

            redo: () => {
                const { past, future, nodes, edges } = get();
                if (future.length === 0) return;

                const next = future[0];
                const newFuture = future.slice(1);

                set({
                    nodes: next.nodes,
                    edges: next.edges,
                    past: [...past, { nodes, edges }].slice(-50),
                    future: newFuture,
                    selectedNode: null,
                    selectedEdge: null
                });
                get()._sync();
            },

            createProject: (name, type, description) => {
                get().takeSnapshot();
                const newProject: Project = {
                    id: `proj_${Date.now()}`,
                    name: name || 'Untitled Project',
                    type: type || 'network',
                    description: description || '',
                    updatedAt: Date.now(),
                    nodes: [],
                    edges: [],
                };
                set((state) => ({
                    projects: [newProject, ...state.projects],
                    currentProjectId: newProject.id,
                    nodes: [],
                    edges: [],
                    selectedNode: null,
                    selectedEdge: null,
                }));
                get()._sync();
            },

            selectProject: (id) => {
                const project = get().projects.find(p => p.id === id);
                if (project) {
                    set({
                        currentProjectId: id,
                        nodes: project.nodes,
                        edges: project.edges,
                        selectedNode: null,
                        selectedEdge: null,
                        past: [],
                        future: []
                    });
                }
            },

            deleteProject: (id) => {
                set((state) => ({
                    projects: state.projects.filter(p => p.id !== id),
                    currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
                }));
                get()._syncToServer();
            },

            backToDashboard: () => {
                // Save current state to project before leaving
                const { currentProjectId, nodes, edges, projects } = get();
                if (currentProjectId) {
                    const updatedProjects = projects.map(p =>
                        p.id === currentProjectId
                            ? { ...p, nodes, edges, updatedAt: Date.now() }
                            : p
                    );
                    set({ projects: updatedProjects, currentProjectId: null });
                    get()._syncToServer();
                } else {
                    set({ currentProjectId: null });
                }
            },

            // Helper to sync changes to current project
            _sync: () => {
                const { currentProjectId, nodes, edges, projects } = get();
                if (currentProjectId) {
                    const updatedProjects = projects.map(p =>
                        p.id === currentProjectId
                            ? { ...p, nodes, edges, updatedAt: Date.now() }
                            : p
                    );
                    set({ projects: updatedProjects });
                    get()._syncToServer();
                }
            },

            onNodesChange: (changes) => {
                // Only snapshot on drag end or significant changes to avoid spamming past
                const isDragEnd = changes.some(c => c.type === 'position' && (c as any).dragging === false);
                const isSelection = changes.every(c => c.type === 'select');
                if (isDragEnd && !isSelection) get().takeSnapshot();

                const updatedNodes = applyNodeChanges(changes, get().nodes);
                set({ nodes: updatedNodes });
                get()._sync();
            },

            onEdgesChange: (changes) => {
                const isSelection = changes.every(c => c.type === 'select');
                if (!isSelection) get().takeSnapshot();

                const updatedEdges = applyEdgeChanges(changes, get().edges) as CustomEdge[];
                set({ edges: updatedEdges });
                get()._sync();
            },

            onConnect: (connection) => {
                get().takeSnapshot();
                const newEdge: CustomEdge = {
                    ...connection,
                    id: `edge_${Date.now()}`,
                    animated: true,
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                };
                set({
                    edges: addEdge(newEdge, get().edges) as CustomEdge[],
                    connectionMode: false,
                });
                get()._sync();
            },

            addNode: (node) => {
                get().takeSnapshot();
                set({
                    nodes: [...get().nodes, node],
                });
                get()._sync();
            },

            addNodeFromData: (data) => {
                get().takeSnapshot();
                const nodeType = data.hardwareType === 'shape' ? 'shape' :
                    (get().projects.find(p => p.id === get().currentProjectId)?.type === 'electrical' ? 'electrical' : 'hardware');
                const newNode: HardwareNode = {
                    id: getNodeId(),
                    type: nodeType,
                    position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
                    data,
                };
                set({
                    nodes: [...get().nodes, newNode],
                });
                get()._sync();
            },

            addEdgeFromData: (data) => {
                get().takeSnapshot();
                const animationType = data.animationType || 'dashed';
                const lineType = data.lineType || 'bezier';
                const newEdge: CustomEdge = {
                    id: `edge_${Date.now()}`,
                    type: 'animated',
                    source: data.source,
                    target: data.target,
                    label: data.label,
                    bandwidth: data.bandwidth,
                    connectionType: data.connectionType,
                    networkInfo: data.networkInfo,
                    animationType,
                    lineType,
                    data: { animationType, lineType },
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                };
                set({
                    edges: [...get().edges, newEdge],
                });
                get()._sync();
            },

            updateNode: (id, data) => {
                // If it's a major update (not just selection), snapshot
                get().takeSnapshot();
                const updatedNodes = get().nodes.map((node) =>
                    node.id === id ? { ...node, data: { ...node.data, ...data } } : node
                );
                const currentSelected = get().selectedNode;
                const updatedSelectedNode = currentSelected?.id === id
                    ? updatedNodes.find(n => n.id === id) || null
                    : currentSelected;
                set({
                    nodes: updatedNodes,
                    selectedNode: updatedSelectedNode,
                });
                get()._sync();
            },

            setSelectedNode: (node) => {
                set({ selectedNode: node, selectedEdge: null });
            },

            setSelectedEdge: (edge) => {
                set({ selectedEdge: edge, selectedNode: null });
            },

            deleteNode: (id) => {
                get().takeSnapshot();
                set({
                    nodes: get().nodes.filter((node) => node.id !== id),
                    edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
                    selectedNode: get().selectedNode?.id === id ? null : get().selectedNode,
                });
                get()._sync();
            },

            deleteEdge: (id) => {
                get().takeSnapshot();
                set({
                    edges: get().edges.filter((edge) => edge.id !== id),
                    selectedEdge: get().selectedEdge?.id === id ? null : get().selectedEdge,
                });
                get()._sync();
            },

            updateEdge: (id, data) => {
                get().takeSnapshot();
                const updatedEdges = get().edges.map((edge) => {
                    if (edge.id === id) {
                        const updatedEdge = { ...edge, ...data };
                        if (data.animationType || data.lineType) {
                            updatedEdge.data = {
                                ...updatedEdge.data,
                                animationType: data.animationType || updatedEdge.animationType,
                                lineType: data.lineType || updatedEdge.lineType,
                            };
                        }
                        return updatedEdge;
                    }
                    return edge;
                });
                const currentSelected = get().selectedEdge;
                const updatedSelectedEdge = currentSelected?.id === id
                    ? updatedEdges.find(e => e.id === id) || null
                    : currentSelected;
                set({
                    edges: updatedEdges,
                    selectedEdge: updatedSelectedEdge,
                });
                get()._sync();
            },

            addNodeDetail: (nodeId, key, value) => {
                get().takeSnapshot();
                const detail = { id: `detail_${Date.now()}`, key, value };
                const updatedNodes = get().nodes.map(n => {
                    if (n.id === nodeId) {
                        const details = n.data.customDetails || [];
                        return { ...n, data: { ...n.data, customDetails: [...details, detail] } };
                    }
                    return n;
                });
                set({
                    nodes: updatedNodes,
                    selectedNode: get().selectedNode?.id === nodeId ? updatedNodes.find(n => n.id === nodeId) : get().selectedNode
                });
                get()._sync();
            },

            updateNodeDetail: (nodeId, detailId, key, value) => {
                get().takeSnapshot();
                const updatedNodes = get().nodes.map(n => {
                    if (n.id === nodeId) {
                        const details = (n.data.customDetails || []).map(d =>
                            d.id === detailId ? { ...d, key, value } : d
                        );
                        return { ...n, data: { ...n.data, customDetails: details } };
                    }
                    return n;
                });
                set({
                    nodes: updatedNodes,
                    selectedNode: get().selectedNode?.id === nodeId ? updatedNodes.find(n => n.id === nodeId) : get().selectedNode
                });
                get()._sync();
            },

            deleteNodeDetail: (nodeId, detailId) => {
                get().takeSnapshot();
                const updatedNodes = get().nodes.map(n => {
                    if (n.id === nodeId) {
                        const details = (n.data.customDetails || []).filter(d => d.id !== detailId);
                        return { ...n, data: { ...n.data, customDetails: details } };
                    }
                    return n;
                });
                set({
                    nodes: updatedNodes,
                    selectedNode: get().selectedNode?.id === nodeId ? updatedNodes.find(n => n.id === nodeId) : get().selectedNode
                });
                get()._sync();
            },

            setConnectionMode: (mode) => {
                set({ connectionMode: mode });
            },

            exportTopology: () => {
                const { nodes, edges } = get();
                return JSON.stringify({ nodes, edges }, null, 2);
            },

            importTopology: (json: string) => {
                try {
                    const data = JSON.parse(json);
                    if (data.nodes && data.edges) {
                        set({
                            nodes: data.nodes,
                            edges: data.edges,
                            selectedNode: null,
                            selectedEdge: null,
                        });
                        get()._sync();
                        return true;
                    }
                    return false;
                } catch {
                    return false;
                }
            },

            clearAll: () => {
                set({
                    nodes: [],
                    edges: [],
                    selectedNode: null,
                    selectedEdge: null,
                });
                get()._sync();
            },
        }),
        {
            name: 'network-designer-projects',
            partialize: (state) => ({
                projects: state.projects,
                currentProjectId: state.currentProjectId
            }),
        }
    )
);

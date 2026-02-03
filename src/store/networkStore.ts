import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Edge, Node, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

export type HardwareType = 'router' | 'switch' | 'server' | 'pc' | 'laptop' | 'cloud' | 'isp' | 'cctv' | 'accesspoint' | 'ont' | 'mikrotik' | 'proxmox' | 'docker' | 'nas' | 'firewall';

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
}

export type HardwareNode = Node<HardwareNodeData, 'hardware'>;

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

    // Project Actions
    createProject: (name: string, description?: string) => void;
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

            initStore: async () => {
                try {
                    const response = await fetch('/api/projects');
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.projects) {
                            const { currentProjectId } = get();
                            const updatedProjects = data.projects;

                            // If we have an active project, update it from the server data
                            if (currentProjectId) {
                                const serverProject = updatedProjects.find((p: Project) => p.id === currentProjectId);
                                if (serverProject) {
                                    set({
                                        projects: updatedProjects,
                                        nodes: serverProject.nodes,
                                        edges: serverProject.edges
                                    });
                                } else {
                                    set({ projects: updatedProjects });
                                }
                            } else {
                                set({ projects: updatedProjects });
                            }
                        }
                    }
                } catch (err) {
                    console.error('Failed to load projects from server:', err);
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
                    connectionMode: false
                });
                // Clear localStorage manually if needed, but Zustand persist does it on set
            },

            _syncToServer: async () => {
                // Debounce the sync to prevent deadlocks and excessive server load
                const { _syncTimer } = get() as any;
                if (_syncTimer) clearTimeout(_syncTimer);

                const timer = setTimeout(async () => {
                    try {
                        const { projects } = get();
                        await fetch('/api/projects', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ projects }),
                        });
                    } catch (err) {
                        console.error('Failed to sync projects to server:', err);
                    }
                }, 1000); // 1s debounce

                set({ _syncTimer: timer } as any);
            },

            createProject: (name, description) => {
                const newProject: Project = {
                    id: `proj_${Date.now()}`,
                    name: name || 'Untitled Project',
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
                const updatedNodes = applyNodeChanges(changes, get().nodes);
                set({ nodes: updatedNodes });
                get()._sync();
            },

            onEdgesChange: (changes) => {
                const updatedEdges = applyEdgeChanges(changes, get().edges) as CustomEdge[];
                set({ edges: updatedEdges });
                get()._sync();
            },

            onConnect: (connection) => {
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
                set({
                    nodes: [...get().nodes, node],
                });
                get()._sync();
            },

            addNodeFromData: (data) => {
                const newNode: HardwareNode = {
                    id: getNodeId(),
                    type: 'hardware',
                    position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
                    data,
                };
                set({
                    nodes: [...get().nodes, newNode],
                });
                get()._sync();
            },

            addEdgeFromData: (data) => {
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
                set({
                    nodes: get().nodes.filter((node) => node.id !== id),
                    edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
                    selectedNode: get().selectedNode?.id === id ? null : get().selectedNode,
                });
                get()._sync();
            },

            deleteEdge: (id) => {
                set({
                    edges: get().edges.filter((edge) => edge.id !== id),
                    selectedEdge: get().selectedEdge?.id === id ? null : get().selectedEdge,
                });
                get()._sync();
            },

            updateEdge: (id, data) => {
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

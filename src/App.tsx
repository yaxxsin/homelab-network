import { useCallback, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
} from '@xyflow/react';
import type { ReactFlowInstance, EdgeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import HardwareNode from './components/HardwareNode';
import AnimatedEdge from './components/AnimatedEdge';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import Dashboard from './components/Dashboard';
import { useNetworkStore } from './store/networkStore';
import { useAuthStore } from './store/authStore';
import Login from './components/Login';
import type { HardwareNode as HardwareNodeType, HardwareType, CustomEdge } from './store/networkStore';
import './App.css';

const nodeTypes = {
  hardware: HardwareNode,
} as const;

const edgeTypes = {
  animated: AnimatedEdge,
} as const;

let id = 0;
const getId = () => `device_${id++}`;

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<HardwareNodeType, CustomEdge> | null>(null);

  const nodes = useNetworkStore((state) => state.nodes);
  const edges = useNetworkStore((state) => state.edges);
  const onNodesChange = useNetworkStore((state) => state.onNodesChange);
  const onEdgesChange = useNetworkStore((state) => state.onEdgesChange);
  const onConnect = useNetworkStore((state) => state.onConnect);
  const addNode = useNetworkStore((state) => state.addNode);
  const connectionMode = useNetworkStore((state) => state.connectionMode);
  const setSelectedEdge = useNetworkStore((state) => state.setSelectedEdge);
  const setSelectedNode = useNetworkStore((state) => state.setSelectedNode);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;

      const { type, label } = JSON.parse(data) as { type: HardwareType; label: string };

      if (!reactFlowInstance.current || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: HardwareNodeType = {
        id: getId(),
        type: 'hardware',
        position,
        data: {
          label: `${label} ${id}`,
          hardwareType: type,
          status: 'online',
        },
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onInit = useCallback((instance: ReactFlowInstance<HardwareNodeType, CustomEdge>) => {
    reactFlowInstance.current = instance;
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setSelectedNode(null);
    setSelectedEdge(edge as CustomEdge);
  }, [setSelectedEdge, setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const nodeColor = (node: HardwareNodeType) => {
    const colors: Record<HardwareType, string> = {
      router: '#6366f1',
      switch: '#10b981',
      server: '#f59e0b',
      pc: '#3b82f6',
      laptop: '#8b5cf6',
      cloud: '#06b6d4',
      isp: '#475569',
      cctv: '#f472b6',
      accesspoint: '#fb923c',
      ont: '#0072ff',
      mikrotik: '#330867',
      proxmox: '#f83600',
      docker: '#243949',
      nas: '#0ba360',
      firewall: '#ed213a',
    };
    return colors[node.data.hardwareType] || '#888';
  };

  return (
    <div className={`app-container ${connectionMode ? 'connection-mode' : ''}`}>
      <Sidebar />
      <div className="react-flow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'animated',
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
          edgesReconnectable
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Controls />
          <MiniMap
            nodeColor={nodeColor}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>
        {connectionMode && (
          <div className="connection-mode-banner">
            Click on a node handle, then drag to another node to create a connection
          </div>
        )}
      </div>
      <PropertiesPanel />
    </div>
  );
}

export default function App() {
  const currentProjectId = useNetworkStore((state) => state.currentProjectId);
  const initStore = useNetworkStore((state) => state.initStore);
  const resetStore = useNetworkStore((state) => state.resetStore);

  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sync store based on user state
  useEffect(() => {
    if (user) {
      initStore();

      // Poll for updates every 30 seconds
      const interval = setInterval(() => {
        initStore();
      }, 30000);

      return () => clearInterval(interval);
    } else if (!isLoading) {
      resetStore();
    }
  }, [user, isLoading, initStore, resetStore]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!currentProjectId) {
    return <Dashboard />;
  }

  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

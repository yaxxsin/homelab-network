import { useRef, useState } from 'react';
import {
    Server,
    Network,
    Link2,
    Download,
    Upload,
    Trash2,
    Monitor,
    ChevronLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HardwareType, HardwareNodeData, CustomEdge } from '../store/networkStore';
import { useNetworkStore } from '../store/networkStore';
import {
    AddDeviceModal,
    AddConnectionModal,
    AddNetworkDeviceModal,
    AddServerModal,
    type ModalType,
} from './AddElementModals';

interface AddElementButton {
    type: ModalType;
    label: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

const addElementButtons: AddElementButton[] = [
    { type: 'network', label: 'Add Network Device', icon: Network, color: '#fff', bgColor: '#6366f1' },
    { type: 'server', label: 'Add Server', icon: Server, color: '#fff', bgColor: '#f59e0b' },
    { type: 'device', label: 'Add Device', icon: Monitor, color: '#fff', bgColor: '#3b82f6' },
    { type: 'connection', label: 'Add Connection', icon: Link2, color: '#fff', bgColor: '#22c55e' },
];

export default function Sidebar() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const nodes = useNetworkStore((state) => state.nodes);
    const addNodeFromData = useNetworkStore((state) => state.addNodeFromData);
    const addEdgeFromData = useNetworkStore((state) => state.addEdgeFromData);
    const exportTopology = useNetworkStore((state) => state.exportTopology);
    const importTopology = useNetworkStore((state) => state.importTopology);
    const clearAll = useNetworkStore((state) => state.clearAll);
    const deleteProject = useNetworkStore((state) => state.deleteProject);
    const backToDashboard = useNetworkStore((state) => state.backToDashboard);
    const currentProjectId = useNetworkStore((state) => state.currentProjectId);
    const projects = useNetworkStore((state) => state.projects);

    const currentProject = projects.find(p => p.id === currentProjectId);

    const handleAddDevice = (data: Partial<HardwareNodeData> & { hardwareType: HardwareType }) => {
        addNodeFromData(data as HardwareNodeData);
    };

    const handleAddConnection = (data: Partial<CustomEdge> & { source: string; target: string }) => {
        addEdgeFromData(data);
    };

    const handleExport = () => {
        const json = exportTopology();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-topology-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const success = importTopology(content);
            if (!success) alert('Invalid topology file');
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const nodesList = nodes.map((n) => ({ id: n.id, label: n.data.label }));

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <button className="btn-back-projects" onClick={backToDashboard}>
                        <ChevronLeft size={16} />
                        Back to Projects
                    </button>
                    <h2>{currentProject?.name || 'Network Designer'}</h2>
                    <p>{currentProject?.description || 'Design your network topology'}</p>
                </div>

                <div className="add-elements-section">
                    <h3>Add Elements</h3>
                    <div className="add-elements-list">
                        {addElementButtons.map((btn) => (
                            <button
                                key={btn.type}
                                className="add-element-btn"
                                style={{ backgroundColor: btn.bgColor }}
                                onClick={() => setActiveModal(btn.type)}
                            >
                                <btn.icon size={16} />
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="io-section">
                    <h3>Topology</h3>
                    <div className="io-buttons">
                        <button className="io-btn export" onClick={handleExport}>
                            <Download size={16} /> Export JSON
                        </button>
                        <button className="io-btn import" onClick={handleImport}>
                            <Upload size={16} /> Import JSON
                        </button>
                        <button className="io-btn clear" onClick={clearAll}>
                            <Trash2 size={16} /> Clear All
                        </button>
                        <button
                            className="io-btn delete-project"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this entire project? This action cannot be undone.')) {
                                    deleteProject(currentProjectId!);
                                }
                            }}
                        >
                            <Trash2 size={16} /> Delete Project
                        </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                <div className="sidebar-footer">
                    <div className="legend">
                        <div className="legend-item"><span className="legend-dot online"></span><span>Online</span></div>
                        <div className="legend-item"><span className="legend-dot offline"></span><span>Offline</span></div>
                        <div className="legend-item"><span className="legend-dot warning"></span><span>Warning</span></div>
                    </div>
                    <div className="autosave-indicator">✓ Autosave enabled</div>
                </div>
            </aside>

            <AddNetworkDeviceModal
                isOpen={activeModal === 'network'}
                onClose={() => setActiveModal(null)}
                onAdd={handleAddDevice}
            />
            <AddServerModal
                isOpen={activeModal === 'server'}
                onClose={() => setActiveModal(null)}
                onAdd={(data) => handleAddDevice(data as HardwareNodeData & { hardwareType: HardwareType })}
            />
            <AddDeviceModal
                isOpen={activeModal === 'device'}
                onClose={() => setActiveModal(null)}
                onAdd={handleAddDevice}
            />
            <AddConnectionModal
                isOpen={activeModal === 'connection'}
                onClose={() => setActiveModal(null)}
                onAdd={handleAddConnection}
                nodes={nodesList}
            />
        </>
    );
}

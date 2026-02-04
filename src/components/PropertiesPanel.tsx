import { useState, useEffect } from 'react';
import { X, Trash2, Link2, Plus } from 'lucide-react';
import { useNetworkStore } from '../store/networkStore';
import type { HardwareType, CustomEdge, ApplicationInfo, VlanInfo } from '../store/networkStore';
import { EditApplicationModal, EditCustomDetailModal } from './AddElementModals';

const typeLabels: Record<HardwareType, string> = {
    router: 'ROUTER',
    switch: 'SWITCH',
    server: 'SERVER',
    pc: 'PC',
    laptop: 'LAPTOP',
    cloud: 'CLOUD',
    isp: 'ISP',
    cctv: 'CCTV',
    accesspoint: 'ACCESS POINT',
    ont: 'ONT (FIBER)',
    mikrotik: 'MIKROTIK',
    proxmox: 'PROXMOX NODE',
    docker: 'DOCKER HOST',
    nas: 'NAS (STORAGE)',
    firewall: 'FIREWALL',
};

export default function PropertiesPanel() {
    const selectedNode = useNetworkStore((state) => state.selectedNode);
    const selectedEdge = useNetworkStore((state) => state.selectedEdge);
    const updateNode = useNetworkStore((state) => state.updateNode);
    const deleteNode = useNetworkStore((state) => state.deleteNode);
    const setSelectedNode = useNetworkStore((state) => state.setSelectedNode);
    const setSelectedEdge = useNetworkStore((state) => state.setSelectedEdge);
    const deleteEdge = useNetworkStore((state) => state.deleteEdge);
    const updateEdge = useNetworkStore((state) => state.updateEdge);
    const nodes = useNetworkStore((state) => state.nodes);

    // State for adding new app/vlan
    const [showAddApp, setShowAddApp] = useState(false);
    const [newApp, setNewApp] = useState<ApplicationInfo>({ name: '', type: 'web', port: '', status: 'running' });
    const [editingApp, setEditingApp] = useState<{ index: number; app: ApplicationInfo } | null>(null);
    const [showAddVlan, setShowAddVlan] = useState(false);
    const [newVlan, setNewVlan] = useState<VlanInfo>({ id: '', name: '', ipRange: '', gateway: '' });
    const [editingDetail, setEditingDetail] = useState<{ id: string; key: string; value: string } | null>(null);
    const [showAddDetail, setShowAddDetail] = useState(false);
    const [monitors, setMonitors] = useState<{ id: number; name: string; status: string; latency: string | null }[]>([]);
    const [isLoadingMonitors, setIsLoadingMonitors] = useState(false);
    const [monitorError, setMonitorError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedNode) {
            setIsLoadingMonitors(true);
            setMonitorError(null);
            fetch('/api/uptime-kuma/monitors')
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
                    return data;
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setMonitors(data);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch monitors:', err);
                    setMonitorError(err.message);
                })
                .finally(() => setIsLoadingMonitors(false));
        }
    }, [selectedNode?.id]);

    // Edge editing panel
    if (selectedEdge) {
        const edge = selectedEdge as CustomEdge;
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        return (
            <aside className="properties-panel">
                <div className="panel-header">
                    <h3>Connection Properties</h3>
                    <button className="close-btn" onClick={() => setSelectedEdge(null)}>
                        <X size={18} />
                    </button>
                </div>

                <div className="panel-content">
                    <div className="connection-info">
                        <div className="connection-endpoint">
                            <span className="endpoint-label">From</span>
                            <span className="endpoint-value">{sourceNode?.data.label || 'Unknown'}</span>
                        </div>
                        <div className="connection-arrow">
                            <Link2 size={20} />
                        </div>
                        <div className="connection-endpoint">
                            <span className="endpoint-label">To</span>
                            <span className="endpoint-value">{targetNode?.data.label || 'Unknown'}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Label</label>
                        <input
                            type="text"
                            value={(edge.label as string) || ''}
                            onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
                            placeholder="Connection label"
                        />
                    </div>

                    <div className="form-group">
                        <label>Bandwidth</label>
                        <input
                            type="text"
                            value={edge.bandwidth || ''}
                            onChange={(e) => updateEdge(edge.id, { bandwidth: e.target.value })}
                            placeholder="e.g., 1 Gbps"
                        />
                    </div>

                    {edge.networkInfo && (
                        <>
                            <div className="section-title">Network Configuration</div>
                            <div className="form-group">
                                <label>IP Address</label>
                                <input type="text" value={edge.networkInfo.ip || ''} onChange={(e) => updateEdge(edge.id, { networkInfo: { ...edge.networkInfo, ip: e.target.value } })} placeholder="192.168.1.0" />
                            </div>
                            <div className="form-group">
                                <label>Subnet Mask</label>
                                <input type="text" value={edge.networkInfo.subnetMask || ''} onChange={(e) => updateEdge(edge.id, { networkInfo: { ...edge.networkInfo, subnetMask: e.target.value } })} placeholder="255.255.255.0" />
                            </div>
                            <div className="form-group">
                                <label>Gateway</label>
                                <input type="text" value={edge.networkInfo.gateway || ''} onChange={(e) => updateEdge(edge.id, { networkInfo: { ...edge.networkInfo, gateway: e.target.value } })} placeholder="192.168.1.1" />
                            </div>
                            <div className="form-group">
                                <label>DNS</label>
                                <input type="text" value={edge.networkInfo.dns || ''} onChange={(e) => updateEdge(edge.id, { networkInfo: { ...edge.networkInfo, dns: e.target.value } })} placeholder="8.8.8.8" />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Animation</label>
                        <div className="style-buttons">
                            <button
                                className={`style-btn ${edge.animationType === 'dashed' || !edge.animationType ? 'active' : ''}`}
                                onClick={() => updateEdge(edge.id, { animationType: 'dashed' })}
                            >
                                Dashed
                            </button>
                            <button
                                className={`style-btn ${edge.animationType === 'dot' ? 'active' : ''}`}
                                onClick={() => updateEdge(edge.id, { animationType: 'dot' })}
                            >
                                Dot
                            </button>
                            <button
                                className={`style-btn ${edge.animationType === 'none' ? 'active' : ''}`}
                                onClick={() => updateEdge(edge.id, { animationType: 'none' })}
                            >
                                None
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Line Type</label>
                        <div className="style-buttons">
                            <button
                                className={`style-btn ${edge.lineType === 'bezier' || !edge.lineType ? 'active' : ''}`}
                                onClick={() => updateEdge(edge.id, { lineType: 'bezier' })}
                            >
                                Bezier
                            </button>
                            <button
                                className={`style-btn ${edge.lineType === 'smoothstep' ? 'active' : ''}`}
                                onClick={() => updateEdge(edge.id, { lineType: 'smoothstep' })}
                            >
                                Smooth Steps
                            </button>
                        </div>
                    </div>

                    <div className="panel-actions">
                        <button className="delete-btn" onClick={() => deleteEdge(edge.id)}>
                            <Trash2 size={16} />
                            Delete Connection
                        </button>
                    </div>
                </div>
            </aside>
        );
    }

    // Node editing panel
    if (!selectedNode) {
        return (
            <aside className="properties-panel empty">
                <div className="empty-state">
                    <p>Select a device or connection to view properties</p>
                </div>
            </aside>
        );
    }

    const isServer = ['server', 'proxmox', 'docker'].includes(selectedNode.data.hardwareType);
    const isNetworkDevice = ['router', 'switch', 'mikrotik', 'ont'].includes(selectedNode.data.hardwareType);
    const apps = selectedNode.data.applications || [];
    const vlans = selectedNode.data.vlans || [];

    const handleAddApp = () => {
        if (!newApp.name) return;
        updateNode(selectedNode.id, { applications: [...apps, newApp] });
        setNewApp({ name: '', type: 'web', port: '', status: 'running' });
        setShowAddApp(false);
    };

    const handleRemoveApp = (index: number) => {
        updateNode(selectedNode.id, { applications: apps.filter((_, i) => i !== index) });
    };

    const handleSaveEditedApp = (updatedApp: ApplicationInfo) => {
        if (!editingApp || !selectedNode) return;
        const newApps = [...apps];
        newApps[editingApp.index] = updatedApp;
        updateNode(selectedNode.id, { applications: newApps });
        setEditingApp(null);
    };

    const handleAddVlan = () => {
        if (!newVlan.id) return;
        updateNode(selectedNode.id, { vlans: [...vlans, newVlan] });
        setNewVlan({ id: '', name: '', ipRange: '', gateway: '' });
        setShowAddVlan(false);
    };

    const handleRemoveVlan = (index: number) => {
        updateNode(selectedNode.id, { vlans: vlans.filter((_, i) => i !== index) });
    };

    return (
        <aside className="properties-panel">
            <div className="panel-header">
                <h3>Device Properties</h3>
                <button className="close-btn" onClick={() => setSelectedNode(null)}>
                    <X size={18} />
                </button>
            </div>

            <div className="panel-content">
                <div className="form-group">
                    <label>Name</label>
                    <input type="text" value={selectedNode.data.label} onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })} placeholder="Device name" />
                </div>

                <div className="form-group">
                    <label>IP Address</label>
                    <input type="text" value={selectedNode.data.ip || ''} onChange={(e) => updateNode(selectedNode.id, { ip: e.target.value })} placeholder="192.168.1.1" />
                </div>

                <div className="form-group">
                    <label>Uptime Kuma Monitor</label>
                    <select
                        value={selectedNode.data.uptimeKumaId || ''}
                        onChange={(e) => {
                            const monitorId = e.target.value;
                            const monitor = monitors.find(m => m.id.toString() === monitorId);
                            if (monitor) {
                                updateNode(selectedNode.id, {
                                    uptimeKumaId: monitorId,
                                    status: monitor.status as any,
                                    latency: monitor.latency || undefined
                                });
                            } else {
                                updateNode(selectedNode.id, { uptimeKumaId: '' });
                            }
                        }}
                        disabled={isLoadingMonitors}
                    >
                        <option value="">- No Monitoring -</option>
                        {monitors.map(m => (
                            <option key={m.id} value={m?.id?.toString() || ''}>{m.name}</option>
                        ))}
                    </select>
                    <p className={`text-xs mt-1 ${monitorError ? 'text-red-400' : 'text-slate-400'}`}>
                        {isLoadingMonitors ? 'Loading monitors...' : (monitorError ? `Error: ${monitorError}` : 'Select a monitor from Uptime Kuma')}
                    </p>
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <div className="type-badge">{typeLabels[selectedNode.data.hardwareType] || 'DEVICE'}</div>
                </div>

                {/* Enhanced Fields */}
                <div className="form-group">
                    <label>Operating System</label>
                    <input
                        type="text"
                        value={selectedNode.data.os || ''}
                        onChange={(e) => updateNode(selectedNode.id, { os: e.target.value })}
                        placeholder="e.g. RouterOS, Ubuntu 22.04"
                    />
                </div>

                <div className="form-group">
                    <label>Serial Number</label>
                    <input
                        type="text"
                        value={selectedNode.data.serialNumber || ''}
                        onChange={(e) => updateNode(selectedNode.id, { serialNumber: e.target.value })}
                        placeholder="SN123456789"
                    />
                </div>

                {isServer && (
                    <div className="form-row">
                        <div className="form-group">
                            <label>CPU</label>
                            <input type="text" value={selectedNode.data.cpu || ''} onChange={(e) => updateNode(selectedNode.id, { cpu: e.target.value })} placeholder="8 Cores" />
                        </div>
                        <div className="form-group">
                            <label>RAM</label>
                            <input type="text" value={selectedNode.data.ram || ''} onChange={(e) => updateNode(selectedNode.id, { ram: e.target.value })} placeholder="16GB" />
                        </div>
                        <div className="form-group">
                            <label>Storage</label>
                            <input type="text" value={selectedNode.data.storage || ''} onChange={(e) => updateNode(selectedNode.id, { storage: e.target.value })} placeholder="512GB SSD" />
                        </div>
                    </div>
                )}

                {/* VLANs for Network Devices */}
                {isNetworkDevice && (
                    <div className="form-group">
                        <div className="section-header">
                            <label>VLANs</label>
                            <button className="btn-add-small" onClick={() => setShowAddVlan(true)}><Plus size={12} /> Add</button>
                        </div>
                        {vlans.length > 0 && (
                            <div className="info-list">
                                {vlans.map((v, i) => (
                                    <div key={i} className="info-item-editable">
                                        <div className="info-main">
                                            <span className="info-label">VLAN {v.id}</span>
                                            <span className="info-value">{v.name}</span>
                                        </div>
                                        <button className="btn-remove-small" onClick={() => handleRemoveVlan(i)}><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showAddVlan && (
                            <div className="add-form">
                                <input type="text" placeholder="VLAN ID" value={newVlan.id} onChange={(e) => setNewVlan({ ...newVlan, id: e.target.value })} style={{ width: '60px' }} />
                                <input type="text" placeholder="Name" value={newVlan.name} onChange={(e) => setNewVlan({ ...newVlan, name: e.target.value })} />
                                <button className="btn-confirm" onClick={handleAddVlan}>Add</button>
                                <button className="btn-cancel-small" onClick={() => setShowAddVlan(false)}>✕</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Applications for Servers */}
                {isServer && (
                    <div className="form-group">
                        <div className="section-header">
                            <label>Applications</label>
                            <button className="btn-add-small" onClick={() => setShowAddApp(true)}><Plus size={12} /> Add</button>
                        </div>
                        {apps.length > 0 && (
                            <div className="info-list">
                                {apps.map((app, i) => (
                                    <div key={i} className="info-item-editable">
                                        <div className="info-main" onClick={() => setEditingApp({ index: i, app })}>
                                            <span className="info-label">{app.name}</span>
                                            <span className={`info-status ${app.status}`}>{app.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {editingApp && (
                            <EditApplicationModal
                                isOpen={!!editingApp}
                                onClose={() => setEditingApp(null)}
                                app={editingApp.app}
                                onSave={handleSaveEditedApp}
                                onDelete={() => handleRemoveApp(editingApp.index)}
                            />
                        )}
                        {showAddApp && (
                            <div className="add-form">
                                <input type="text" placeholder="App name" value={newApp.name} onChange={(e) => setNewApp({ ...newApp, name: e.target.value })} />
                                <select value={newApp.type} onChange={(e) => setNewApp({ ...newApp, type: e.target.value })}>
                                    <option value="web">Web</option>
                                    <option value="database">Database</option>
                                    <option value="api">API</option>
                                    <option value="mail">Mail</option>
                                </select>
                                <input type="text" placeholder="Port" value={newApp.port} onChange={(e) => setNewApp({ ...newApp, port: e.target.value })} style={{ width: '60px' }} />
                                <button className="btn-confirm" onClick={handleAddApp}>Add</button>
                                <button className="btn-cancel-small" onClick={() => setShowAddApp(false)}>✕</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Custom Details CRUD */}
                <div className="form-group border-t border-slate-700/50 pt-4 mt-2">
                    <div className="section-header">
                        <label className="text-indigo-400 font-bold text-xs tracking-wider uppercase">Custom Details</label>
                        <button
                            className="btn-add-small"
                            onClick={() => setShowAddDetail(true)}
                        >
                            <Plus size={12} /> Add
                        </button>
                    </div>

                    <div className="space-y-1">
                        {(selectedNode.data.customDetails || []).map((detail) => (
                            <div key={detail.id} className="group relative bg-slate-800/40 hover:bg-slate-800/60 p-2 rounded-md border border-slate-700/30 transition-all">
                                <div className="flex flex-col pr-6 cursor-pointer" onClick={() => setEditingDetail(detail)}>
                                    <span className="text-[10px] text-slate-500 uppercase font-medium">{detail.key}</span>
                                    <span className="text-sm text-slate-200">{detail.value}</span>
                                </div>
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => useNetworkStore.getState().deleteNodeDetail(selectedNode.id, detail.id)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {(!selectedNode.data.customDetails || selectedNode.data.customDetails.length === 0) && (
                            <div className="text-center py-4 bg-slate-800/20 rounded-md border border-dashed border-slate-700/50">
                                <p className="text-[10px] text-slate-500 italic uppercase">No details added</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals for Custom Details */}
                {editingDetail && (
                    <EditCustomDetailModal
                        isOpen={!!editingDetail}
                        onClose={() => setEditingDetail(null)}
                        detail={editingDetail}
                        onSave={(updated) => useNetworkStore.getState().updateNodeDetail(selectedNode.id, updated.id, updated.key, updated.value)}
                        onDelete={() => useNetworkStore.getState().deleteNodeDetail(selectedNode.id, editingDetail.id)}
                    />
                )}
                {showAddDetail && (
                    <EditCustomDetailModal
                        isOpen={showAddDetail}
                        onClose={() => setShowAddDetail(false)}
                        detail={null}
                        isNew
                        onSave={(newDetail) => useNetworkStore.getState().addNodeDetail(selectedNode.id, newDetail.key, newDetail.value)}
                    />
                )}

                <div className="panel-actions">
                    <button className="delete-btn" onClick={() => deleteNode(selectedNode.id)}>
                        <Trash2 size={16} />
                        Delete Device
                    </button>
                </div>
            </div>
        </aside>
    );
}

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { HardwareType, HardwareNodeData, CustomEdge, VlanInfo, ApplicationInfo } from '../store/networkStore';

export type ModalType = 'device' | 'connection' | 'server' | 'network' | 'electrical' | 'shape' | null;

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<HardwareNodeData> & { hardwareType: HardwareType }) => void;
}

const deviceTypes: { value: HardwareType; label: string }[] = [
    { value: 'pc', label: 'PC' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'cloud', label: 'Cloud' },
    { value: 'isp', label: 'ISP' },
    { value: 'cctv', label: 'CCTV' },
    { value: 'accesspoint', label: 'Access Point' },
    { value: 'ont', label: 'ONT (Fiber Modem)' },
    { value: 'mikrotik', label: 'MikroTik Device' },
    { value: 'proxmox', label: 'Proxmox Node' },
    { value: 'docker', label: 'Docker Host' },
    { value: 'nas', label: 'NAS (Storage)' },
    { value: 'firewall', label: 'Firewall' },
];

export function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceType, setDeviceType] = useState<HardwareType>('pc');
    const [ip, setIp] = useState('');
    const [subnetMask, setSubnetMask] = useState('');
    const [macAddress, setMacAddress] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            label: name || `${deviceType} Device`,
            hardwareType: deviceType,
            ip: ip || undefined,
            status: 'online',
            subnetMask: subnetMask || undefined,
            macAddress: macAddress || undefined,
            location: location || undefined,
            description: description || undefined,
        });
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName('');
        setDeviceType('pc');
        setIp('');
        setSubnetMask('');
        setMacAddress('');
        setLocation('');
        setDescription('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Device</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Device Name:</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter device name" />
                            </div>
                            <div className="form-group">
                                <label>Device Type:</label>
                                <select value={deviceType} onChange={(e) => setDeviceType(e.target.value as HardwareType)}>
                                    {deviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>IP Address:</label>
                                <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1" />
                            </div>
                            <div className="form-group">
                                <label>Subnet Mask:</label>
                                <input type="text" value={subnetMask} onChange={(e) => setSubnetMask(e.target.value)} placeholder="255.255.255.0" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>MAC Address:</label>
                                <input type="text" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="00:1A:2B:3C:4D:5E" />
                            </div>
                            <div className="form-group">
                                <label>Location:</label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Office A" />
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>Description:</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description..." rows={2} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Add Device</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Network Device Modal (Router/Switch) with VLANs
interface AddNetworkDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<HardwareNodeData> & { hardwareType: HardwareType }) => void;
}

export function AddNetworkDeviceModal({ isOpen, onClose, onAdd }: AddNetworkDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceType, setDeviceType] = useState<'router' | 'switch'>('router');
    const [ip, setIp] = useState('');
    const [ports, setPorts] = useState('');
    const [vlans, setVlans] = useState<VlanInfo[]>([]);
    const [location, setLocation] = useState('');
    const [os, setOs] = useState('');
    const [serialNumber, setSerialNumber] = useState('');

    const addVlan = () => {
        setVlans([...vlans, { id: '', name: '', ipRange: '', gateway: '' }]);
    };

    const updateVlan = (index: number, field: keyof VlanInfo, value: string) => {
        const updated = [...vlans];
        updated[index] = { ...updated[index], [field]: value };
        setVlans(updated);
    };

    const removeVlan = (index: number) => {
        setVlans(vlans.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            label: name || `${deviceType}`,
            hardwareType: deviceType,
            ip: ip || undefined,
            ports: ports ? parseInt(ports) : undefined,
            vlans: vlans.filter(v => v.id),
            location: location || undefined,
            os: os || undefined,
            serialNumber: serialNumber || undefined,
            status: 'online',
        });
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName(''); setDeviceType('router'); setIp(''); setPorts(''); setVlans([]); setLocation('');
        setOs(''); setSerialNumber('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Network Device</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Device Name:</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Router" />
                            </div>
                            <div className="form-group">
                                <label>Device Type:</label>
                                <select value={deviceType} onChange={(e) => setDeviceType(e.target.value as 'router' | 'switch')}>
                                    <option value="router">Router</option>
                                    <option value="switch">Switch</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Management IP:</label>
                                <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1" />
                            </div>
                            <div className="form-group">
                                <label>Ports:</label>
                                <input type="text" value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="24" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Operating System:</label>
                                <input type="text" value={os} onChange={(e) => setOs(e.target.value)} placeholder="RouterOS, IOS, etc." />
                            </div>
                            <div className="form-group">
                                <label>Serial Number:</label>
                                <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN123456" />
                            </div>
                        </div>

                        <div className="section-divider">
                            <span>VLANs Configuration</span>
                            <button type="button" className="btn-add-small" onClick={addVlan}><Plus size={14} /> Add VLAN</button>
                        </div>

                        {vlans.map((vlan, index) => (
                            <div key={index} className="nested-form-row">
                                <input type="text" placeholder="VLAN ID" value={vlan.id} onChange={(e) => updateVlan(index, 'id', e.target.value)} style={{ width: '80px' }} />
                                <input type="text" placeholder="Name" value={vlan.name} onChange={(e) => updateVlan(index, 'name', e.target.value)} />
                                <input type="text" placeholder="IP Range" value={vlan.ipRange} onChange={(e) => updateVlan(index, 'ipRange', e.target.value)} />
                                <input type="text" placeholder="Gateway" value={vlan.gateway} onChange={(e) => updateVlan(index, 'gateway', e.target.value)} />
                                <button type="button" className="btn-remove-small" onClick={() => removeVlan(index)}><Trash2 size={14} /></button>
                            </div>
                        ))}

                        <div className="form-group full-width">
                            <label>Location:</label>
                            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Server Room" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Add Network Device</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Server Modal with Applications
interface AddServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<HardwareNodeData> & { hardwareType: 'server' }) => void;
}

export function AddServerModal({ isOpen, onClose, onAdd }: AddServerModalProps) {
    const [name, setName] = useState('');
    const [ip, setIp] = useState('');
    const [subnetMask, setSubnetMask] = useState('');
    const [dns, setDns] = useState('');
    const [applications, setApplications] = useState<ApplicationInfo[]>([]);
    const [location, setLocation] = useState('');
    const [os, setOs] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [cpu, setCpu] = useState('');
    const [ram, setRam] = useState('');
    const [storage, setStorage] = useState('');

    const addApp = () => {
        setApplications([...applications, { name: '', type: 'web', port: '', protocol: 'TCP', status: 'running' }]);
    };

    const updateApp = (index: number, field: keyof ApplicationInfo, value: string) => {
        const updated = [...applications];
        updated[index] = { ...updated[index], [field]: value } as ApplicationInfo;
        setApplications(updated);
    };

    const removeApp = (index: number) => {
        setApplications(applications.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            label: name || 'Server',
            hardwareType: 'server',
            ip: ip || undefined,
            subnetMask: subnetMask || undefined,
            dns: dns || undefined,
            applications: applications.filter(a => a.name),
            location: location || undefined,
            os: os || undefined,
            serialNumber: serialNumber || undefined,
            cpu: cpu || undefined,
            ram: ram || undefined,
            storage: storage || undefined,
            status: 'online',
        });
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName(''); setIp(''); setSubnetMask(''); setDns(''); setApplications([]); setLocation('');
        setOs(''); setSerialNumber(''); setCpu(''); setRam(''); setStorage('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Server</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Server Name:</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Web Server 01" />
                            </div>
                            <div className="form-group">
                                <label>Location:</label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rack A1" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>IP Address:</label>
                                <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.10" />
                            </div>
                            <div className="form-group">
                                <label>Subnet Mask:</label>
                                <input type="text" value={subnetMask} onChange={(e) => setSubnetMask(e.target.value)} placeholder="255.255.255.0" />
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>DNS Servers:</label>
                            <input type="text" value={dns} onChange={(e) => setDns(e.target.value)} placeholder="8.8.8.8, 8.8.4.4" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Operating System:</label>
                                <input type="text" value={os} onChange={(e) => setOs(e.target.value)} placeholder="Ubuntu, Windows, Debian" />
                            </div>
                            <div className="form-group">
                                <label>Serial Number:</label>
                                <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN7890" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>CPU:</label>
                                <input type="text" value={cpu} onChange={(e) => setCpu(e.target.value)} placeholder="8 Cores / AMD EPYC" />
                            </div>
                            <div className="form-group">
                                <label>RAM:</label>
                                <input type="text" value={ram} onChange={(e) => setRam(e.target.value)} placeholder="16 GB DDR4" />
                            </div>
                            <div className="form-group">
                                <label>Storage:</label>
                                <input type="text" value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="500 GB NVMe" />
                            </div>
                        </div>

                        <div className="section-divider">
                            <span>Applications</span>
                            <button type="button" className="btn-add-small" onClick={addApp}><Plus size={14} /> Add App</button>
                        </div>

                        {applications.map((app, index) => (
                            <div key={index} className="nested-form-row">
                                <input type="text" placeholder="Name" value={app.name} onChange={(e) => updateApp(index, 'name', e.target.value)} />
                                <select value={app.type} onChange={(e) => updateApp(index, 'type', e.target.value)}>
                                    <option value="web">Web</option>
                                    <option value="database">Database</option>
                                    <option value="api">API</option>
                                    <option value="mail">Mail</option>
                                    <option value="dns">DNS</option>
                                </select>
                                <input type="text" placeholder="Port" value={app.port} onChange={(e) => updateApp(index, 'port', e.target.value)} style={{ width: '70px' }} />
                                <select value={app.status} onChange={(e) => updateApp(index, 'status', e.target.value)}>
                                    <option value="running">Running</option>
                                    <option value="stopped">Stopped</option>
                                    <option value="error">Error</option>
                                </select>
                                <button type="button" className="btn-remove-small" onClick={() => removeApp(index)}><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Add Server</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Connection Modal with Network Info
interface AddConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<CustomEdge> & { source: string; target: string }) => void;
    nodes: { id: string; label: string }[];
}

export function AddConnectionModal({ isOpen, onClose, onAdd, nodes }: AddConnectionModalProps) {
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [label, setLabel] = useState('');
    const [connectionType, setConnectionType] = useState<'ethernet' | 'fiber' | 'wireless' | 'serial'>('ethernet');
    const [bandwidth, setBandwidth] = useState('');
    const [ip, setIp] = useState('');
    const [subnetMask, setSubnetMask] = useState('');
    const [gateway, setGateway] = useState('');
    const [dns, setDns] = useState('');
    const [vlanId, setVlanId] = useState('');
    const [mtu, setMtu] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceId || !targetId || sourceId === targetId) {
            alert('Please select different source and target devices');
            return;
        }
        onAdd({
            source: sourceId,
            target: targetId,
            label: label || undefined,
            connectionType,
            bandwidth: bandwidth || undefined,
            networkInfo: {
                ip: ip || undefined,
                subnetMask: subnetMask || undefined,
                gateway: gateway || undefined,
                dns: dns || undefined,
                vlanId: vlanId || undefined,
                mtu: mtu || undefined,
            },
        });
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setSourceId(''); setTargetId(''); setLabel(''); setConnectionType('ethernet');
        setBandwidth(''); setIp(''); setSubnetMask(''); setGateway(''); setDns(''); setVlanId(''); setMtu('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Connection</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Source Device:</label>
                                <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                                    <option value="">Select device</option>
                                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Target Device:</label>
                                <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                                    <option value="">Select device</option>
                                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Connection Type:</label>
                                <select value={connectionType} onChange={(e) => setConnectionType(e.target.value as typeof connectionType)}>
                                    <option value="ethernet">Ethernet</option>
                                    <option value="fiber">Fiber Optic</option>
                                    <option value="wireless">Wireless</option>
                                    <option value="serial">Serial</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Bandwidth:</label>
                                <input type="text" value={bandwidth} onChange={(e) => setBandwidth(e.target.value)} placeholder="1 Gbps" />
                            </div>
                        </div>

                        <div className="section-divider"><span>Network Configuration</span></div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>IP Address:</label>
                                <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.0" />
                            </div>
                            <div className="form-group">
                                <label>Subnet Mask:</label>
                                <input type="text" value={subnetMask} onChange={(e) => setSubnetMask(e.target.value)} placeholder="255.255.255.0" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Gateway:</label>
                                <input type="text" value={gateway} onChange={(e) => setGateway(e.target.value)} placeholder="192.168.1.1" />
                            </div>
                            <div className="form-group">
                                <label>DNS:</label>
                                <input type="text" value={dns} onChange={(e) => setDns(e.target.value)} placeholder="8.8.8.8" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>VLAN ID:</label>
                                <input type="text" value={vlanId} onChange={(e) => setVlanId(e.target.value)} placeholder="100" />
                            </div>
                            <div className="form-group">
                                <label>MTU:</label>
                                <input type="text" value={mtu} onChange={(e) => setMtu(e.target.value)} placeholder="1500" />
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>Label:</label>
                            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Connection label" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Add Connection</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface EditApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    app: ApplicationInfo;
    onSave: (updatedApp: ApplicationInfo) => void;
    onDelete: () => void;
}

const electricalDeviceTypes: { value: HardwareType; label: string }[] = [
    { value: 'power_strip', label: 'Power Strip' },
    { value: 'adapter', label: 'Adapter' },
    { value: 'dock', label: 'Docking Station' },
    { value: 'kvm', label: 'KVM Switch' },
    { value: 'monitor_display', label: 'Monitor / Display' },
    { value: 'peripheral', label: 'Peripheral (USB/etc)' },
    { value: 'controller', label: 'Controller' },
    { value: 'hub', label: 'USB/Data Hub' },
    { value: 'power_source', label: 'Power Source (Wall/UPS)' },
    { value: 'ups', label: 'UPS' },
];

interface AddElectricalDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<HardwareNodeData> & { hardwareType: HardwareType }) => void;
}

export function AddElectricalDeviceModal({ isOpen, onClose, onAdd }: AddElectricalDeviceModalProps) {
    const [name, setName] = useState('');
    const [deviceType, setDeviceType] = useState<HardwareType>('power_strip');
    const [wattage, setWattage] = useState('');
    const [voltage, setVoltage] = useState('220V');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            label: name || `${deviceType.replace('_', ' ')}`,
            hardwareType: deviceType,
            wattage: wattage || undefined,
            voltage: voltage || undefined,
            location: location || undefined,
            description: description || undefined,
            status: 'online',
        });
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName('');
        setDeviceType('power_strip');
        setWattage('');
        setVoltage('220V');
        setLocation('');
        setDescription('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Electrical Component</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Asset Name:</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Power Strip" />
                            </div>
                            <div className="form-group">
                                <label>Component Type:</label>
                                <select value={deviceType} onChange={(e) => setDeviceType(e.target.value as HardwareType)}>
                                    {electricalDeviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Wattage (W):</label>
                                <input type="text" value={wattage} onChange={(e) => setWattage(e.target.value)} placeholder="e.g. 50" />
                            </div>
                            <div className="form-group">
                                <label>Voltage:</label>
                                <select value={voltage} onChange={(e) => setVoltage(e.target.value)}>
                                    <option value="220V">220V (Standard)</option>
                                    <option value="110V">110V</option>
                                    <option value="12V">12V DC</option>
                                    <option value="5V">5V DC</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group full-width">
                                <label>Location:</label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Under Desk" />
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>Description:</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Power strip for main PC setup..." rows={2} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Add Component</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function EditApplicationModal({ isOpen, onClose, app, onSave, onDelete }: EditApplicationModalProps) {
    const [name, setName] = useState(app.name);
    const [type, setType] = useState(app.type);
    const [port, setPort] = useState(app.port || '');
    const [protocol, setProtocol] = useState(app.protocol || 'TCP');
    const [version, setVersion] = useState(app.version || '');
    const [status, setStatus] = useState(app.status);

    // Update local state when app prop changes
    useState(() => {
        setName(app.name);
        setType(app.type);
        setPort(app.port || '');
        setProtocol(app.protocol || 'TCP');
        setVersion(app.version || '');
        setStatus(app.status);
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            type,
            port: port || undefined,
            protocol: protocol || undefined,
            version: version || undefined,
            status: status as 'running' | 'stopped' | 'error',
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Application Details</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Application Name:</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Type:</label>
                                <select value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="web">Web</option>
                                    <option value="database">Database</option>
                                    <option value="api">API</option>
                                    <option value="mail">Mail</option>
                                    <option value="dns">DNS</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Port:</label>
                                <input type="text" value={port} onChange={(e) => setPort(e.target.value)} placeholder="e.g., 80" />
                            </div>
                            <div className="form-group">
                                <label>Protocol:</label>
                                <input type="text" value={protocol} onChange={(e) => setProtocol(e.target.value)} placeholder="e.g., TCP" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Version:</label>
                                <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g., 1.0.0" />
                            </div>
                            <div className="form-group">
                                <label>Status:</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                                    <option value="running">Running</option>
                                    <option value="stopped">Stopped</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-delete-modal" onClick={() => { if (confirm('Delete application?')) { onDelete(); onClose(); } }}>
                            <Trash2 size={16} /> Delete
                        </button>
                        <div style={{ flex: 1 }}></div>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface EditCustomDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    detail: { id: string; key: string; value: string } | null;
    onSave: (detail: { id: string; key: string; value: string }) => void;
    onDelete?: () => void;
    isNew?: boolean;
}

export function EditCustomDetailModal({ isOpen, onClose, detail, onSave, onDelete, isNew }: EditCustomDetailModalProps) {
    const [key, setKey] = useState(detail?.key || '');
    const [value, setValue] = useState(detail?.value || '');

    // Reset local state when detail opens
    useState(() => {
        if (detail) {
            setKey(detail.key);
            setValue(detail.value);
        } else {
            setKey('');
            setValue('');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: detail?.id || `detail_${Date.now()}`,
            key,
            value,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isNew ? 'Add Custom Detail' : 'Edit Custom Detail'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group full-width">
                            <label>Property Name:</label>
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="e.g. Serial Number, Asset Tag"
                                required
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Value:</label>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Enter value"
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        {!isNew && onDelete && (
                            <button type="button" className="btn-delete-modal" onClick={() => { if (window.confirm('Delete this detail?')) { onDelete(); onClose(); } }}>
                                <Trash2 size={16} /> Delete
                            </button>
                        )}
                        <div style={{ flex: 1 }}></div>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">{isNew ? 'Add Detail' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface AddShapeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<HardwareNodeData> & { hardwareType: 'shape' }) => void;
}

export function AddShapeModal({ isOpen, onClose, onAdd }: AddShapeModalProps) {
    const [name, setName] = useState('');
    const [shapeType, setShapeType] = useState<'rectangle' | 'circle'>('rectangle');
    const [color, setColor] = useState('#cbd5e1');

    const colors = [
        { label: 'Gray', value: '#cbd5e1' },
        { label: 'Blue', value: '#93c5fd' },
        { label: 'Green', value: '#81ecac' },
        { label: 'Yellow', value: '#fde047' },
        { label: 'Red', value: '#fca5a5' },
        { label: 'Indigo', value: '#a5b4fc' },
        { label: 'Purple', value: '#d8b4fe' },
        { label: 'Orange', value: '#fdba74' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            label: name || 'New Shape',
            hardwareType: 'shape',
            shapeType: shapeType,
            backgroundColor: color,
            borderColor: '#64748b',
            textColor: '#1e293b',
            width: 150,
            height: 100,
            status: 'online',
        });
        setName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Custom Shape</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Shape Label:</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Zone A, DMZ, etc." />
                        </div>
                        <div className="form-group">
                            <label>Shape Type:</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className={`btn-selector ${shapeType === 'rectangle' ? 'active' : ''}`}
                                    onClick={() => setShapeType('rectangle')}
                                    style={{ flex: 1, padding: '10px' }}
                                >
                                    Rectangle
                                </button>
                                <button
                                    type="button"
                                    className={`btn-selector ${shapeType === 'circle' ? 'active' : ''}`}
                                    onClick={() => setShapeType('circle')}
                                    style={{ flex: 1, padding: '10px' }}
                                >
                                    Circle
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Background Color:</label>
                            <div className="grid grid-cols-4 gap-2">
                                {colors.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        className={`color-swatch ${color === c.value ? 'active' : ''}`}
                                        style={{ backgroundColor: c.value, height: '30px', borderRadius: '4px', border: color === c.value ? '2px solid #6366f1' : '1px solid #e2e8f0' }}
                                        onClick={() => setColor(c.value)}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Add Shape</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

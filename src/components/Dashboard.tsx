import { useState } from 'react';
import {
    Plus,
    Trash2,
    Clock as ClockIcon,
    Layout,
    Search,
    Network,
    Database,
    ChevronRight,
    X,
    Activity,
    Cpu,
    HardDrive,
    Server
} from 'lucide-react';
import axios from 'axios';
import { useNetworkStore } from '../store/networkStore';
import { useAuthStore } from '../store/authStore';
import Clock from './Clock';

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const projects = useNetworkStore((state) => state.projects);
    const createProject = useNetworkStore((state) => state.createProject);
    const selectProject = useNetworkStore((state) => state.selectProject);
    const deleteProject = useNetworkStore((state) => state.deleteProject);

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [serverStats, setServerStats] = useState<any>(null);
    const [isFetchingStats, setIsFetchingStats] = useState(false);

    const fetchServerStats = async () => {
        try {
            setIsFetchingStats(true);
            const res = await axios.get('/api/server/stats');
            setServerStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setIsFetchingStats(false);
        }
    };

    // Polling effect for stats
    useState(() => {
        let interval: any;
        if (isStatsModalOpen) {
            fetchServerStats();
            interval = setInterval(fetchServerStats, 10000);
        }
        return () => clearInterval(interval);
    });

    useState(() => {
        if (isStatsModalOpen) {
            fetchServerStats();
        }
    });

    const openStats = () => {
        setIsStatsModalOpen(true);
        fetchServerStats();
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createProject(newProjectName, newProjectDesc);
        setNewProjectName('');
        setNewProjectDesc('');
        setIsCreateModalOpen(false);
    };

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(ts).toLocaleDateString();
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <div className="brand">
                        <div className="brand-icon">
                            <Network size={24} color="#fff" />
                        </div>
                        <div>
                            <h1>Netwatch</h1>
                            <p>Manage your infrastructure topologies</p>
                        </div>
                    </div>

                    <div className="dashboard-actions">
                        <div className="search-wrapper">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-create" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus size={20} />
                            New Project
                        </button>
                        <button className="btn-stats" onClick={openStats}>
                            <Activity size={20} />
                            Server Status
                        </button>
                        <Clock />

                        {user && (
                            <div className="user-profile">
                                <img src={user.avatar_url} alt={user.name} className="user-avatar" />
                                <div className="user-info-dropdown">
                                    <span className="user-name">{user.name}</span>
                                    <button className="btn-logout" onClick={logout}>Logout</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-main-inner">
                    {projects.length === 0 ? (
                        <div className="empty-dashboard">
                            <div className="empty-icon">
                                <Layout size={64} />
                            </div>
                            <h2>No projects found</h2>
                            <p>Create your first network topology to get started</p>
                            <button className="btn-create-lg" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus size={24} />
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="project-grid">
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="project-card" onClick={() => selectProject(project.id)}>
                                    <div className="project-card-header">
                                        <div className="project-icon">
                                            <Network size={20} />
                                        </div>
                                        <button
                                            className="btn-delete-project"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete this project?')) deleteProject(project.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="project-card-body">
                                        <h3>{project.name}</h3>
                                        <p className="project-desc">{project.description || 'No description'}</p>
                                    </div>

                                    <div className="project-card-footer">
                                        <div className="project-meta">
                                            <div className="meta-item">
                                                <ClockIcon size={14} />
                                                <span>{formatTime(project.updatedAt)}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Database size={14} />
                                                <span>{project.nodes.length} nodes</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="arrow-icon" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content dashboard-modal">
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="btn-close" onClick={() => setIsCreateModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g., Home Network Lab"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    placeholder="Brief description of your network topology..."
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isStatsModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content stats-modal">
                        <div className="modal-header">
                            <div className="flex items-center gap-2">
                                <Activity className="text-indigo-500" size={24} />
                                <h2>Server Resource Monitor</h2>
                            </div>
                            <button className="btn-close" onClick={() => setIsStatsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {serverStats ? (
                            <div className="stats-grid">
                                <div className="stats-card">
                                    <div className="stats-card-header">
                                        <Cpu size={20} />
                                        <span>CPU Usage</span>
                                    </div>
                                    <div className="stats-value">{serverStats.cpu.load}%</div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${serverStats.cpu.load}%`, backgroundColor: serverStats.cpu.load > 80 ? '#ef4444' : '#6366f1' }}
                                        />
                                    </div>
                                    <div className="stats-detail">{serverStats.cpu.cores} Cores</div>
                                </div>

                                <div className="stats-card">
                                    <div className="stats-card-header">
                                        <Database size={20} />
                                        <span>Memory (RAM)</span>
                                    </div>
                                    <div className="stats-value">{serverStats.memory.percentage}%</div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${serverStats.memory.percentage}%`, backgroundColor: serverStats.memory.percentage > 85 ? '#ef4444' : '#10b981' }}
                                        />
                                    </div>
                                    <div className="stats-detail">{serverStats.memory.used} / {serverStats.memory.total} GB</div>
                                </div>

                                <div className="stats-card">
                                    <div className="stats-card-header">
                                        <HardDrive size={20} />
                                        <span>Disk Storage</span>
                                    </div>
                                    <div className="stats-value">{serverStats.storage.percentage}%</div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${serverStats.storage.percentage}%`, backgroundColor: serverStats.storage.percentage > 90 ? '#ef4444' : '#f59e0b' }}
                                        />
                                    </div>
                                    <div className="stats-detail">{serverStats.storage.used} / {serverStats.storage.total} GB</div>
                                </div>

                                <div className="stats-card full-width">
                                    <div className="stats-card-header">
                                        <Server size={20} />
                                        <span>System Information</span>
                                    </div>
                                    <div className="system-info-grid">
                                        <div className="info-item">
                                            <label>Hostname</label>
                                            <p>{serverStats.os.hostname}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>OS Platform</label>
                                            <p>{serverStats.os.distro} ({serverStats.os.platform})</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Server Uptime</label>
                                            <p>{serverStats.uptime} Hours</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Status</label>
                                            <p className="status-online">Healthy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="stats-loading">
                                <div className="spinner"></div>
                                <p>Collecting data from server...</p>
                            </div>
                        )}

                        <div className="modal-footer" style={{ marginTop: '20px', fontSize: '12px', opacity: 0.6, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {isFetchingStats && <div className="spinner-mini" />}
                            {isFetchingStats ? 'Refreshing data...' : 'Data updates automatically every 10 seconds'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

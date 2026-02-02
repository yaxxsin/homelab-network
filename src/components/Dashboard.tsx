import { useState } from 'react';
import {
    Plus,
    Trash2,
    Clock,
    Layout,
    Search,
    Network,
    Database,
    ChevronRight,
    X
} from 'lucide-react';
import { useNetworkStore } from '../store/networkStore';

export default function Dashboard() {
    const projects = useNetworkStore((state) => state.projects);
    const createProject = useNetworkStore((state) => state.createProject);
    const selectProject = useNetworkStore((state) => state.selectProject);
    const deleteProject = useNetworkStore((state) => state.deleteProject);

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

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
                <div className="brand">
                    <div className="brand-icon">
                        <Network size={24} color="#fff" />
                    </div>
                    <div>
                        <h1>Network Designer</h1>
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
                </div>
            </header>

            <main className="dashboard-main">
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
                                            <Clock size={14} />
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
        </div>
    );
}

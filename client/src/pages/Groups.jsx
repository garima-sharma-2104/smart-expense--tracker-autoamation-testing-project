import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";

function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups");
      setGroups(res.data.data);
    } catch (err) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setSubmitting(true);
    try {
      const res = await API.post("/groups", { name: newGroupName });
      setGroups([res.data.data, ...groups]);
      setNewGroupName("");
      setShowCreate(false);
      toast.success("Group created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating group");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page fadeUp">
        <h2 className="mb-4">SplitSphere Groups</h2>
        <SkeletonLoader type="stat-cards" count={3} />
      </div>
    );
  }

  return (
    <div className="page fadeUp">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">SplitSphere</h1>
          <p className="dashboard-subtitle">Manage shared expenses with friends</p>
        </div>
        <button 
          className="btn btn-primary"
          data-testid="new-group-button"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Cancel" : "+ New Group"}
        </button>
      </div>

      {showCreate && (
        <div className="dashboard-card mb-4 animate-fade-in">
          <h4>Create New Group</h4>
          <form onSubmit={handleCreateGroup} className="d-flex gap-2 mt-3" data-testid="group-form">
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Goa Trip" 
              data-testid="group-name-input"
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-success" disabled={submitting} data-testid="group-create-submit">
              {submitting ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-state" data-testid="groups-empty">
          <span className="empty-icon">👥</span>
          <h2>No Groups Yet</h2>
          <p>Create a group to start splitting bills and tracking shared expenses.</p>
        </div>
      ) : (
        <div className="row g-4">
          {groups.map((group) => (
            <div className="col-md-4" key={group._id} data-testid="group-card" data-group-id={group._id}>
              <div className="dashboard-card h-100 hover-scale" style={{ cursor: 'pointer' }}>
                <Link to={`/groups/${group._id}`} className="text-decoration-none text-reset" data-testid="group-card-link">
                  <div className="d-flex justify-content-between mb-3">
                    <h3 className="mb-0 text-primary" data-testid="group-card-name">{group.name}</h3>
                    <span className="badge bg-light text-dark border" data-testid="group-card-members">{group.members?.length || 0} Members</span>
                  </div>
                  <p className="text-muted fs-7 mb-0">Created on {new Date(group.createdAt).toLocaleDateString()}</p>
                  <div className="mt-3 text-end">
                    <span className="text-info fw-bold">View Dashboard →</span>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Groups;

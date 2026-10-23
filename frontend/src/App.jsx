import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintError, setComplaintError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoadingComplaints(true);
        setComplaintError("");

        const response = await fetch("/api/complaints");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load complaints");
        }

        setComplaints(Array.isArray(data) ? data : data.complaints || []);
      } catch (error) {
        setComplaintError(error.message || "Unable to load complaints");
      } finally {
        setLoadingComplaints(false);
      }
    };

    fetchComplaints();
  }, []);

  const filteredComplaints = complaints.filter((item) => {
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  return (
    <div className="app">
      {" "}
      <aside className="sidebar">
        {" "}
        <div className="brand">
          {" "}
          <div className="brand-icon">C</div>{" "}
          <div>
            {" "}
            <h2>CampusCare</h2> <span>Infrastructure Portal</span>{" "}
          </div>{" "}
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <a className="nav-item active" href="#dashboard">
            Dashboard
          </a>
          <a className="nav-item" href="#submit">
            Submit Complaint
          </a>
          <a className="nav-item" href="#complaints">
            My Complaints
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">S</div>
          <div>
            <strong>Test Student</strong>
            <span>Student Account</span>
          </div>
        </div>
      </aside>
      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">CAMPUS SERVICES</p>
            <h1>Infrastructure Dashboard</h1>
            <p className="subtitle">
              Report an issue and help keep your campus running smoothly.
            </p>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            Maintenance Portal
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon blue">▤</span>
            <p>Total Complaints</p>
            <h2>—</h2>
            <span className="stat-note">Campus-wide overview</span>
          </article>
          <article className="stat-card">
            <span className="stat-icon amber">◷</span>
            <p>Pending</p>
            <h2>—</h2>
            <span className="stat-note">Awaiting assignment</span>
          </article>
          <article className="stat-card">
            <span className="stat-icon violet">⚙</span>
            <p>In Progress</p>
            <h2>—</h2>
            <span className="stat-note">Under maintenance</span>
          </article>
          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>Resolved</p>
            <h2>—</h2>
            <span className="stat-note">Completed issues</span>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel submit-panel" id="submit">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">NEW REQUEST</p>
                <h2>Report an issue</h2>
              </div>
              <span className="step-badge">01 / 01</span>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setSubmitting(true);
                setMessage("");

                try {
                  const response = await fetch("/api/complaints", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      user_id: 1,
                      complaint_text: complaint,
                      location_description: location,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.error ||
                        data.message ||
                        "Failed to submit complaint.",
                    );
                  }

                  setMessage("Complaint submitted successfully!");
                  setComplaint("");
                  setLocation("");
                } catch (error) {
                  setMessage(error.message || "Could not submit complaint.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {message && <p role="status">{message}</p>}
              <label htmlFor="complaint">Describe the problem</label>
              <textarea
                id="complaint"
                value={complaint}
                onChange={(event) => setComplaint(event.target.value)}
                placeholder="E.g. The ceiling fan in classroom 204 is not working..."
                rows={5}
                required
              />

              <label htmlFor="location">Campus location</label>
              <input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="E.g. Block A, Classroom 204"
                required
              />

              <div className="form-hint">
                Your complaint will be classified by the AI service and routed
                to the relevant maintenance department.
              </div>

              <button type="submit">
                {submitting ? "Submitting..." : "Submit Complaint"}{" "}
                <span>→</span>
              </button>
            </form>
          </article>

          <article className="panel complaints-panel" id="complaints">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">ACTIVITY</p>
                <h2>Recent complaints</h2>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  alert("Complaint list will connect to the backend next.")
                }
              >
                View all →
              </button>
            </div>

            <div className="complaint-filters">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                <option value="All">All categories</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Civil">Civil</option>
                <option value="Furniture">Furniture</option>
                <option value="Networking">Networking</option>
                <option value="Sanitation">Sanitation</option>
              </select>
            </div>

            <div className="empty-state">
              {loadingComplaints ? (
                <p>Loading complaints...</p>
              ) : complaintError ? (
                <p role="alert">{complaintError}</p>
              ) : filteredComplaints.length === 0 ? (
                <p>No complaints submitted yet.</p>
              ) : (
                <div className="complaint-list">
                  {filteredComplaints.map((item) => (
                    <article className="complaint-item" key={item.id}>
                      <div className="complaint-item-header">
                        <h3>Complaint #{item.id}</h3>
                        <span className="complaint-status">
                          {item.status || "Pending"}
                        </span>
                      </div>

                      <p>{item.complaint_text}</p>

                      <p>
                        <strong>Category:</strong>{" "}
                        {item.category || "Unclassified"}
                      </p>

                      <p>
                        <strong>Department:</strong>{" "}
                        {item.department_name ||
                          item.department ||
                          "Unassigned"}
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        {item.location_description || "Not provided"}
                      </p>

                      <p>
                        <strong>Submitted:</strong>{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "Unknown"}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="workflow">
              <p className="eyebrow">HOW IT WORKS</p>
              <div className="workflow-step">
                <span>1</span>
                <div>
                  <strong>Submit</strong>
                  <p>Describe the infrastructure issue.</p>
                </div>
              </div>
              <div className="workflow-step">
                <span>2</span>
                <div>
                  <strong>Classify & assign</strong>
                  <p>AI predicts the category and department.</p>
                </div>
              </div>
              <div className="workflow-step">
                <span>3</span>
                <div>
                  <strong>Track resolution</strong>
                  <p>Follow progress until the issue is resolved.</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <footer>
          <span>CampusCare · Infrastructure Maintenance System</span>
          <span>AI-assisted complaint management</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

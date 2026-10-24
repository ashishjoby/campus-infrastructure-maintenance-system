import { useState, useEffect, useCallback } from "react";
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

  const [expandedComplaintId, setExpandedComplaintId] = useState(null);
  const [complaintDetails, setComplaintDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(null);
  const [token, setToken] = useState(
    () => sessionStorage.getItem("campuscare_token") || "",
  );

  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = sessionStorage.getItem("campuscare_user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch complaints from the backend
  const fetchComplaints = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      setComplaintError("");

      const response = await fetch("/api/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const responseText = await response.text();

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to load complaints");
      }

      setComplaints(Array.isArray(data) ? data : data.complaints || []);
    } catch (error) {
      setComplaintError(error.message || "Unable to load complaints");
    } finally {
      setLoadingComplaints(false);
    }
  }, [token]);

  // Load complaints when the dashboard opens
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Filter complaints by status and category
  const filteredComplaints = complaints.filter((item) => {
    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  // Calculate live summary counts
  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (item) => item.status === "Pending",
  ).length;

  const inProgressComplaints = complaints.filter(
    (item) => item.status === "In Progress",
  ).length;

  const resolvedComplaints = complaints.filter(
    (item) => item.status === "Resolved",
  ).length;

  // Submit a complaint
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!complaint.trim() || !location.trim()) {
      setMessage("Please enter both the complaint and its location.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      console.time("Complaint submission");
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          complaint_text: complaint.trim(),
          location_description: location.trim(),
        }),
      });
      console.timeEnd("Complaint submission");

      const responseText = await response.text();

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to submit complaint.",
        );
      }

      setComplaint("");
      setLocation("");
      setMessage("Complaint submitted successfully!");

      // Refresh the complaint list and summary counts
      await fetchComplaints();
    } catch (error) {
      setMessage(error.message || "Could not submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (complaintId) => {
    if (expandedComplaintId === complaintId) {
      setExpandedComplaintId(null);
      return;
    }

    setExpandedComplaintId(complaintId);

    if (complaintDetails[complaintId]) {
      return;
    }

    setDetailsLoading(complaintId);

    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load complaint details");
      }

      setComplaintDetails((previous) => ({
        ...previous,
        [complaintId]: data,
      }));
    } catch (error) {
      setComplaintDetails((previous) => ({
        ...previous,
        [complaintId]: { error: error.message },
      }));
    } finally {
      setDetailsLoading(null);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      sessionStorage.setItem("campuscare_token", data.token);
      sessionStorage.setItem("campuscare_user", JSON.stringify(data.user));

      setToken(data.token);
      setLoggedInUser(data.user);
      setLoginPassword("");
      setAuthMessage("Login successful.");
    } catch (error) {
      setAuthMessage(error.message || "Unable to log in.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      {!token || !loggedInUser ? (
        <div className="auth-page">
          <form className="auth-card" onSubmit={handleLogin}>
            <div className="brand-icon">C</div>
            <h1>CampusCare</h1>
            <p>Sign in to your campus maintenance portal.</p>

            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            {authMessage && (
              <p role="alert" aria-live="polite">
                {authMessage}
              </p>
            )}

            <button type="submit" disabled={authLoading}>
              {authLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      ) : (
        <div className="app">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-icon">C</div>
              <div>
                <h2>CampusCare</h2>
                <span>Infrastructure Portal</span>
              </div>
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

            {/* Live summary cards */}
            <section className="stats-grid">
              <article className="stat-card">
                <span className="stat-icon blue">▤</span>
                <p>Total Complaints</p>
                <h2>{totalComplaints}</h2>
                <span className="stat-note">Campus-wide overview</span>
              </article>

              <article className="stat-card">
                <span className="stat-icon amber">◷</span>
                <p>Pending</p>
                <h2>{pendingComplaints}</h2>
                <span className="stat-note">Awaiting assignment</span>
              </article>

              <article className="stat-card">
                <span className="stat-icon violet">⚙</span>
                <p>In Progress</p>
                <h2>{inProgressComplaints}</h2>
                <span className="stat-note">Under maintenance</span>
              </article>

              <article className="stat-card">
                <span className="stat-icon green">✓</span>
                <p>Resolved</p>
                <h2>{resolvedComplaints}</h2>
                <span className="stat-note">Completed issues</span>
              </article>
            </section>

            <section className="content-grid">
              {/* Complaint submission form */}
              <article className="panel submit-panel" id="submit">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">NEW REQUEST</p>
                    <h2>Report an issue</h2>
                  </div>
                  <span className="step-badge">01 / 01</span>
                </div>

                <form onSubmit={handleSubmit}>
                  {message && (
                    <p role="status" aria-live="polite">
                      {message}
                    </p>
                  )}

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
                    Your complaint will be classified by the AI service and
                    routed to the relevant maintenance department.
                  </div>

                  <button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Complaint"}{" "}
                    <span>→</span>
                  </button>
                </form>
              </article>

              {/* Recent complaints */}
              <article className="panel complaints-panel" id="complaints">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">ACTIVITY</p>
                    <h2>Recent complaints</h2>
                  </div>

                  <button
                    className="text-button"
                    type="button"
                    onClick={fetchComplaints}
                    disabled={loadingComplaints}
                  >
                    {loadingComplaints ? "Loading..." : "Refresh ↻"}
                  </button>
                </div>

                {/* Status and category filters */}
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
                    <div>
                      <p role="alert">{complaintError}</p>
                      <button type="button" onClick={fetchComplaints}>
                        Try again
                      </button>
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <p>
                      {complaints.length === 0
                        ? "No complaints submitted yet."
                        : "No complaints match the selected filters."}
                    </p>
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
                            {item.department ||
                              item.department_name ||
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

                          <button
                            type="button"
                            className="text-button"
                            onClick={() => handleViewDetails(item.id)}
                          >
                            {expandedComplaintId === item.id
                              ? "Hide Details"
                              : "View Details"}
                          </button>

                          {expandedComplaintId === item.id && (
                            <div className="complaint-details">
                              {detailsLoading === item.id ? (
                                <p>Loading complaint details...</p>
                              ) : complaintDetails[item.id]?.error ? (
                                <p role="alert">
                                  {complaintDetails[item.id].error}
                                </p>
                              ) : complaintDetails[item.id] ? (
                                <>
                                  <h4>Complaint Details</h4>

                                  <p>
                                    <strong>Complaint ID:</strong>{" "}
                                    {complaintDetails[item.id].complaint?.id}
                                  </p>

                                  <p>
                                    <strong>Description:</strong>{" "}
                                    {
                                      complaintDetails[item.id].complaint
                                        ?.complaint_text
                                    }
                                  </p>

                                  <p>
                                    <strong>Department:</strong>{" "}
                                    {complaintDetails[item.id].complaint
                                      ?.department || "Unassigned"}
                                  </p>

                                  <h4>Status History</h4>

                                  {complaintDetails[item.id].status_history
                                    ?.length ? (
                                    <ol>
                                      {complaintDetails[
                                        item.id
                                      ].status_history.map((history) => (
                                        <li key={history.id}>
                                          <strong>{history.status}</strong>
                                          <p>
                                            {history.changed_at
                                              ? new Date(
                                                  history.changed_at,
                                                ).toLocaleString()
                                              : "Time unavailable"}
                                          </p>
                                          <p>
                                            Updated by:{" "}
                                            {history.changed_by_name ||
                                              "System"}
                                          </p>
                                        </li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <p>No status history available.</p>
                                  )}
                                </>
                              ) : null}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workflow explanation */}
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
                      <strong>Classify &amp; assign</strong>
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
      )}
    </>
  );
}

export default App;

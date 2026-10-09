import { useState } from "react";
import "./App.css";

function App() {
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
                {submitting ? "Submitting..." : "Submit Complaint"} <span>→</span>
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

            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>Your complaints will appear here</h3>
              <p>
                Submit your first report to start tracking its assignment and
                resolution.
              </p>
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

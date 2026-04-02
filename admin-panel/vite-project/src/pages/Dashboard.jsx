import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../config";

const Dashboard = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchInterviews = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/interviews/all`);
      setInterviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    const interval = setInterval(fetchInterviews, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleDelete = async (candidateId, name) => {
    if (!window.confirm(`Delete ${name} and all their data?`)) return;
    setActionId(candidateId);
    try {
      await axios.delete(`${API_BASE_URL}/api/candidates/delete/${candidateId}`);
      setMessage({ type: "success", text: `✓ ${name} deleted successfully!` });
      await fetchInterviews();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Delete failed!" });
    } finally {
      setActionId(null);
    }
  };

  const handleRetry = async (candidateId, name) => {
    setActionId(candidateId + "_retry");
    try {
      await axios.post(`${API_BASE_URL}/api/candidates/retry/${candidateId}`);
      setMessage({ type: "success", text: `✓ Retry message sent to ${name}!` });
      await fetchInterviews();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Retry failed!" });
    } finally {
      setActionId(null);
    }
  };

  const stats = [
    { label: "Total", value: interviews.length, icon: "🎯", accent: "var(--text-primary)" },
    { label: "Confirmed", value: interviews.filter(i => i.status === "confirmed").length, icon: "✅", accent: "var(--accent)" },
    { label: "Pending", value: interviews.filter(i => i.status === "pending").length, icon: "⏳", accent: "var(--accent-2)" },
    { label: "Cancelled", value: interviews.filter(i => i.status === "cancelled").length, icon: "✕", accent: "var(--danger)" },
  ];

  const getBadge = (status) => {
    if (status === "confirmed") return <span className="badge badge-success">● Confirmed</span>;
    if (status === "cancelled") return <span className="badge badge-danger">● Cancelled</span>;
    return <span className="badge badge-warning">● Pending</span>;
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.1 }}>
            Good morning 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
            Here's what's happening with your interviews today.
          </p>
        </div>
        <button className="btn-ghost" onClick={fetchInterviews}>↻ Refresh</button>
      </motion.div>

      {/* Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 20, overflow: "hidden" }}
          >
            <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}>
              <span>{message.type === "success" ? "✓" : "✕"}</span>
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}
        className="mobile-grid-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
            style={{ padding: "20px 22px" }}
          >
            <div style={{ fontSize: 22, marginBottom: 10 }}>{stat.icon}</div>
            <div style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 700, color: stat.accent, lineHeight: 1, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card"
        style={{ overflow: "hidden" }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>All Interviews</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--surface-2)", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
            {interviews.length} total
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 12 }} />)}
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No interviews yet. Add a candidate to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hide-mobile">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    {["Candidate", "Phone", "Role", "Slot", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {interviews.map((iv, i) => (
                      <motion.tr
                        key={iv._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ borderTop: "1px solid var(--border)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 8,
                              background: "var(--surface-2)", border: "1px solid var(--border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0
                            }}>
                              {iv.candidate?.name?.charAt(0).toUpperCase()}
                            </div>
                            {iv.candidate?.name}
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontSize: 13 }}>{iv.candidate?.phone}</td>
                        <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontSize: 13 }}>{iv.candidate?.jobRole}</td>
                        <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontSize: 13 }}>
                          {iv.slot ? `${iv.slot.date} · ${iv.slot.time}` : "—"}
                        </td>
                        <td style={{ padding: "14px 20px" }}>{getBadge(iv.status)}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {iv.status === "pending" && (
                              <button
                                className="btn-ghost"
                                onClick={() => handleRetry(iv.candidate?._id, iv.candidate?.name)}
                                disabled={actionId === iv.candidate?._id + "_retry"}
                                style={{ fontSize: 11, padding: "5px 10px", color: "var(--accent)", borderColor: "var(--accent)" }}
                              >
                                {actionId === iv.candidate?._id + "_retry" ? "..." : "↺ Retry"}
                              </button>
                            )}
                            <button
                              className="btn-ghost"
                              onClick={() => handleDelete(iv.candidate?._id, iv.candidate?.name)}
                              disabled={actionId === iv.candidate?._id}
                              style={{ fontSize: 11, padding: "5px 10px", color: "var(--danger)", borderColor: "var(--danger)" }}
                            >
                              {actionId === iv.candidate?._id ? "..." : "🗑"}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div style={{ display: "none" }} className="mobile-cards">
              {interviews.map((iv, i) => (
                <motion.div
                  key={iv._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: "var(--text-secondary)"
                      }}>
                        {iv.candidate?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{iv.candidate?.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{iv.candidate?.jobRole}</p>
                      </div>
                    </div>
                    {getBadge(iv.status)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.8 }}>
                    <span>📱 {iv.candidate?.phone}</span><br />
                    <span>📅 {iv.slot ? `${iv.slot.date} · ${iv.slot.time}` : "No slot"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {iv.status === "pending" && (
                      <button
                        className="btn-ghost"
                        onClick={() => handleRetry(iv.candidate?._id, iv.candidate?.name)}
                        style={{ fontSize: 12, color: "var(--accent)", borderColor: "var(--accent)", flex: 1, justifyContent: "center" }}
                      >
                        ↺ Retry
                      </button>
                    )}
                    <button
                      className="btn-ghost"
                      onClick={() => handleDelete(iv.candidate?._id, iv.candidate?.name)}
                      style={{ fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)", flex: 1, justifyContent: "center" }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .mobile-cards { display: block !important; }
          .mobile-grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
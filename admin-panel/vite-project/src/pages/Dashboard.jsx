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
    { label: "Total", value: interviews.length, icon: "🎯", accent: "#1a1916" },
    { label: "Confirmed", value: interviews.filter(i => i.status === "confirmed").length, icon: "✅", accent: "#2d6a4f" },
    { label: "Pending", value: interviews.filter(i => i.status === "pending").length, icon: "⏳", accent: "#c17d3c" },
    { label: "Rejected", value: interviews.filter(i => i.status === "rejected").length, icon: "❌", accent: "#c0392b" },
  ];

  const getBadge = (status) => {
    if (status === "confirmed") return <span className="badge badge-success">● Confirmed</span>;
    if (status === "cancelled") return <span className="badge badge-danger">● Cancelled</span>;
    if (status === "rejected") return <span className="badge badge-danger">● Rejected</span>;
    return <span className="badge badge-warning">● Pending</span>;
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}
      >
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.1 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
            style={{ padding: "24px 28px" }}
          >
            <div style={{ fontSize: 24, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: stat.accent, lineHeight: 1, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</div>
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
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>All Interviews</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--surface-2)", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
            {interviews.length} total
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 32 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 48, marginBottom: 12 }} />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No interviews yet. Add a candidate to get started.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Candidate", "Phone", "Role", "Slot", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
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
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: iv.status === "rejected" ? "#fff8f8" : "transparent"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = iv.status === "rejected" ? "#ffefef" : "var(--surface-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = iv.status === "rejected" ? "#fff8f8" : "transparent"}
                  >
                    <td style={{ padding: "14px 24px", fontWeight: 600, fontSize: 14 }}>{iv.candidate?.name}</td>
                    <td style={{ padding: "14px 24px", color: "var(--text-secondary)", fontSize: 14 }}>{iv.candidate?.phone}</td>
                    <td style={{ padding: "14px 24px", color: "var(--text-secondary)", fontSize: 14 }}>{iv.candidate?.jobRole}</td>
                    <td style={{ padding: "14px 24px", color: "var(--text-secondary)", fontSize: 14 }}>
                      {iv.slot ? `${iv.slot.date} · ${iv.slot.time}` : "—"}
                    </td>
                    <td style={{ padding: "14px 24px" }}>{getBadge(iv.status)}</td>
                    <td style={{ padding: "14px 24px" }}>
                      {iv.status === "rejected" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          {/* Retry button */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-ghost"
                            onClick={() => handleRetry(iv.candidate?._id, iv.candidate?.name)}
                            disabled={actionId === iv.candidate?._id + "_retry"}
                            style={{ fontSize: 11, padding: "5px 10px", color: "#2d6a4f", borderColor: "#2d6a4f" }}
                          >
                            {actionId === iv.candidate?._id + "_retry" ? "..." : "↺ Retry"}
                          </motion.button>

                          {/* Delete button */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-ghost"
                            onClick={() => handleDelete(iv.candidate?._id, iv.candidate?.name)}
                            disabled={actionId === iv.candidate?._id}
                            style={{ fontSize: 11, padding: "5px 10px", color: "#c0392b", borderColor: "#c0392b" }}
                          >
                            {actionId === iv.candidate?._id ? "..." : "🗑 Delete"}
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
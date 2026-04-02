import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../config";

const WhatsAppSettings = () => {
  const [status, setStatus] = useState({ connected: false, hasQR: false });
  const [qrImage, setQrImage] = useState(null);
  const [serverUp, setServerUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [retryingId, setRetryingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const pollingRef = useRef(null);

  const checkServer = async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/health`);
      setServerUp(true);
      return true;
    } catch {
      setServerUp(false);
      return false;
    }
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/whatsapp/status`);
      setStatus(res.data);
      if (res.data.hasQR && !res.data.connected) {
        fetchQR();
      } else if (res.data.connected) {
        setQrImage(null);
      }
    } catch (err) {
      console.error("Status check failed:", err);
    }
  };

  const fetchQR = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/whatsapp/qr`);
      setQrImage(res.data.qr);
    } catch {
      setQrImage(null);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/interviews/all`);
      const pending = res.data.filter((i) => i.status === "pending");
      setPendingCandidates(pending);
    } catch (err) {
      console.error(err);
    }
  };

  const init = async () => {
    setLoading(true);
    const up = await checkServer();
    if (up) {
      await checkStatus();
      await fetchPending();
    }
    setLoading(false);
  };

  useEffect(() => {
    init();
    pollingRef.current = setInterval(async () => {
      const up = await checkServer();
      if (up) await checkStatus();
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout from WhatsApp? You'll need to scan QR again.")) return;
    setLogoutLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/whatsapp/logout`);
      setMessage({ type: "success", text: res.data.message });
      setStatus({ connected: false, hasQR: false });
      setQrImage(null);
      setTimeout(async () => { await checkStatus(); }, 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Logout failed!" });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleRetry = async (candidateId, candidateName) => {
    setRetryingId(candidateId);
    try {
      await axios.post(`${API_BASE_URL}/api/candidates/retry/${candidateId}`);
      setMessage({ type: "success", text: `✓ Retry message sent to ${candidateName}!` });
      await fetchPending();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Retry failed!" });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (candidateId, candidateName) => {
    if (!window.confirm(`Delete ${candidateName} and all their data? This cannot be undone.`)) return;
    setDeletingId(candidateId);
    try {
      await axios.delete(`${API_BASE_URL}/api/candidates/delete/${candidateId}`);
      setMessage({ type: "success", text: `✓ ${candidateName} deleted successfully!` });
      await fetchPending();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Delete failed!" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.skeletonWrap}>
          {[1, 2, 3].map(i => (
            <div key={i} style={styles.skeletonCard}>
              <div style={styles.skeletonInner} />
            </div>
          ))}
        </div>
        <style>{skeletonCSS}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.847L.057 23.25a.75.75 0 00.918.928l5.532-1.454A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.68-.513-5.21-1.41l-.374-.22-3.882 1.02 1.04-3.793-.242-.389A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>WhatsApp Settings</h1>
            <p style={styles.subtitle}>Manage your bot connection and pending interviews</p>
          </div>
        </div>
      </motion.div>

      {/* Toast Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            style={{
              ...styles.toast,
              background: message.type === "success" ? "#f0fdf4" : "#fff5f5",
              borderColor: message.type === "success" ? "#86efac" : "#fca5a5",
              color: message.type === "success" ? "#166534" : "#991b1b",
            }}
          >
            <span style={styles.toastIcon}>
              {message.type === "success" ? "✓" : "✕"}
            </span>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Cards Row */}
      <div style={styles.statusRow}>
        {/* Server Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={styles.statusCard}
          className="wa-card"
        >
          <div style={styles.statusCardLeft}>
            <div style={{
              ...styles.statusIcon,
              background: serverUp ? "#f0fdf4" : "#fff5f5",
              color: serverUp ? "#16a34a" : "#dc2626",
            }}>
              🖥️
            </div>
            <div>
              <p style={styles.statusLabel}>Backend Server</p>
              <p style={styles.statusSub}>{API_BASE_URL}</p>
            </div>
          </div>
          <div style={styles.pill(serverUp ? "green" : "red")}>
            <span style={styles.dot(serverUp ? "#16a34a" : "#dc2626", serverUp)} />
            {serverUp ? "Online" : "Offline"}
          </div>
        </motion.div>

        {/* WhatsApp Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={styles.statusCard}
          className="wa-card"
        >
          <div style={styles.statusCardLeft}>
            <div style={{
              ...styles.statusIcon,
              background: status.connected ? "#f0fdf4" : status.hasQR ? "#fffbeb" : "#fff5f5",
              color: status.connected ? "#16a34a" : status.hasQR ? "#d97706" : "#dc2626",
            }}>
              📱
            </div>
            <div>
              <p style={styles.statusLabel}>WhatsApp Bot</p>
              <p style={styles.statusSub}>
                {status.connected
                  ? "Active — ready to send & receive"
                  : status.hasQR
                  ? "Waiting for QR scan"
                  : "Disconnected"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.pill(status.connected ? "green" : status.hasQR ? "amber" : "red")}>
              <span style={styles.dot(
                status.connected ? "#16a34a" : status.hasQR ? "#d97706" : "#dc2626",
                status.connected
              )} />
              {status.connected ? "Connected" : status.hasQR ? "Scan QR" : "Disconnected"}
            </div>
            {status.connected && (
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                style={styles.logoutBtn}
                className="wa-logout-btn"
              >
                {logoutLoading ? "..." : "Logout"}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* QR Section */}
      <AnimatePresence>
        {!status.connected && (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={styles.qrCard}
            className="wa-card"
          >
            <div style={styles.qrLeft}>
              <div style={styles.qrTextBlock}>
                <p style={styles.qrTitle}>
                  {status.hasQR ? "📲 Scan to Connect" : "⏳ Generating QR..."}
                </p>
                <p style={styles.qrDesc}>
                  {status.hasQR
                    ? "Open WhatsApp on your phone, go to Linked Devices, then tap Link a Device and scan this code."
                    : "The QR code will appear here automatically once the server is ready. It refreshes every 5 seconds."}
                </p>
                {status.hasQR && (
                  <div style={styles.steps}>
                    {["Open WhatsApp", "Linked Devices", "Link a Device", "Scan Code"].map((step, i) => (
                      <div key={i} style={styles.step}>
                        <span style={styles.stepNum}>{i + 1}</span>
                        <span style={styles.stepText}>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.qrRight}>
              {qrImage ? (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={styles.qrImageWrap}
                >
                  <img
                    src={qrImage}
                    alt="WhatsApp QR Code"
                    style={styles.qrImage}
                  />
                  <p style={styles.qrRefreshNote}>Auto-refreshes every 5s</p>
                </motion.div>
              ) : (
                <div style={styles.qrPlaceholder}>
                  <div style={styles.qrSpinnerWrap}>
                    <div className="wa-spinner" style={styles.qrSpinner} />
                  </div>
                  <p style={styles.qrWaitText}>Waiting for QR...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={styles.pendingCard}
        className="wa-card"
      >
        <div style={styles.pendingHeader}>
          <div>
            <p style={styles.pendingTitle}>Pending Candidates</p>
            <p style={styles.pendingDesc}>Candidates who haven't responded yet</p>
          </div>
          <div style={styles.countBadge}>
            {pendingCandidates.length}
          </div>
        </div>

        {pendingCandidates.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎉</div>
            <p style={styles.emptyTitle}>All caught up!</p>
            <p style={styles.emptyDesc}>No pending candidates — everyone has responded.</p>
          </div>
        ) : (
          <div>
            {pendingCandidates.map((interview, i) => (
              <motion.div
                key={interview._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  ...styles.candidateRow,
                  borderTop: i > 0 ? "1px solid var(--border, #f1f5f9)" : "none",
                }}
                className="wa-candidate-row"
              >
                <div style={styles.candidateLeft}>
                  <div style={styles.avatar}>
                    {interview.candidate?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.candidateName}>{interview.candidate?.name}</p>
                    <p style={styles.candidateMeta}>
                      {interview.candidate?.phone}
                      {interview.candidate?.jobRole && (
                        <span style={styles.roleTag}>{interview.candidate.jobRole}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={styles.actionBtns}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleRetry(interview.candidate?._id, interview.candidate?.name)}
                    disabled={retryingId === interview.candidate?._id || deletingId === interview.candidate?._id}
                    style={styles.retryBtn}
                    className="wa-retry-btn"
                  >
                    {retryingId === interview.candidate?._id ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="wa-btn-spinner" style={styles.btnSpinner} />
                        Sending...
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 4v6h6M23 20v-6h-6"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Retry
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleDelete(interview.candidate?._id, interview.candidate?.name)}
                    disabled={deletingId === interview.candidate?._id || retryingId === interview.candidate?._id}
                    style={styles.deleteBtn}
                    className="wa-delete-btn"
                  >
                    {deletingId === interview.candidate?._id ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="wa-btn-spinner-red" style={{ ...styles.btnSpinner, borderTopColor: "#dc2626" }} />
                        Deleting...
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                        Delete
                      </span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "clamp(20px, 4vw, 40px) clamp(12px, 4vw, 24px)",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    marginBottom: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    flexShrink: 0,
    boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
  },
  title: {
    fontSize: "clamp(20px, 4vw, 26px)",
    fontWeight: 700,
    color: "var(--text-primary, #0f172a)",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 13,
    color: "var(--text-muted, #64748b)",
    marginTop: 3,
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  toastIcon: {
    fontWeight: 700,
    fontSize: 15,
  },
  statusRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  statusCard: {
    background: "var(--surface, #ffffff)",
    border: "1px solid var(--border, #e2e8f0)",
    borderRadius: 16,
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.2s",
  },
  statusCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
  },
  statusLabel: {
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary, #0f172a)",
    margin: 0,
  },
  statusSub: {
    fontSize: 11,
    color: "var(--text-muted, #94a3b8)",
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 200,
  },
  pill: (color) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 11px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: color === "green" ? "#f0fdf4" : color === "amber" ? "#fffbeb" : "#fff5f5",
    color: color === "green" ? "#15803d" : color === "amber" ? "#b45309" : "#b91c1c",
    border: `1px solid ${color === "green" ? "#bbf7d0" : color === "amber" ? "#fde68a" : "#fecaca"}`,
    whiteSpace: "nowrap",
  }),
  dot: (color, pulse) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
    flexShrink: 0,
    animation: pulse ? "wa-pulse 2s ease-in-out infinite" : "none",
  }),
  logoutBtn: {
    padding: "5px 12px",
    borderRadius: 8,
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  qrCard: {
    background: "var(--surface, #ffffff)",
    border: "1px solid var(--border, #e2e8f0)",
    borderRadius: 20,
    padding: "clamp(20px, 4vw, 32px)",
    marginBottom: 12,
    display: "flex",
    gap: "clamp(20px, 4vw, 40px)",
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  qrLeft: {
    flex: "1 1 240px",
    minWidth: 200,
  },
  qrTextBlock: {},
  qrTitle: {
    fontWeight: 700,
    fontSize: "clamp(16px, 3vw, 19px)",
    color: "var(--text-primary, #0f172a)",
    margin: "0 0 8px",
    letterSpacing: "-0.3px",
  },
  qrDesc: {
    fontSize: 13,
    color: "var(--text-muted, #64748b)",
    lineHeight: 1.65,
    margin: "0 0 20px",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #25d366, #128c7e)",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    fontSize: 13,
    color: "var(--text-primary, #374151)",
    fontWeight: 500,
  },
  qrRight: {
    display: "flex",
    justifyContent: "center",
    flex: "0 0 auto",
  },
  qrImageWrap: {
    textAlign: "center",
  },
  qrImage: {
    width: "clamp(180px, 30vw, 220px)",
    height: "clamp(180px, 30vw, 220px)",
    borderRadius: 16,
    border: "2px solid var(--border, #e2e8f0)",
    padding: 10,
    background: "white",
    display: "block",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  qrRefreshNote: {
    fontSize: 11,
    color: "var(--text-muted, #94a3b8)",
    marginTop: 10,
    textAlign: "center",
  },
  qrPlaceholder: {
    width: "clamp(180px, 30vw, 220px)",
    height: "clamp(180px, 30vw, 220px)",
    borderRadius: 16,
    border: "2px dashed var(--border, #cbd5e1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "var(--surface-2, #f8fafc)",
  },
  qrSpinnerWrap: {},
  qrSpinner: {
    width: 36,
    height: 36,
    border: "3px solid var(--border, #e2e8f0)",
    borderTopColor: "#25d366",
    borderRadius: "50%",
    animation: "wa-spin 0.8s linear infinite",
  },
  qrWaitText: {
    fontSize: 12,
    color: "var(--text-muted, #94a3b8)",
    fontWeight: 500,
  },
  pendingCard: {
    background: "var(--surface, #ffffff)",
    border: "1px solid var(--border, #e2e8f0)",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  pendingHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--border, #f1f5f9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pendingTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: "var(--text-primary, #0f172a)",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  pendingDesc: {
    fontSize: 12,
    color: "var(--text-muted, #94a3b8)",
    marginTop: 2,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    background: "var(--surface-2, #f1f5f9)",
    border: "1px solid var(--border, #e2e8f0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-primary, #374151)",
    padding: "0 10px",
  },
  emptyState: {
    padding: "52px 24px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: "var(--text-primary, #0f172a)",
    margin: "0 0 6px",
  },
  emptyDesc: {
    fontSize: 13,
    color: "var(--text-muted, #64748b)",
  },
  candidateRow: {
    padding: "15px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    transition: "background 0.15s",
  },
  candidateLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
  },
  candidateName: {
    fontWeight: 600,
    fontSize: 14,
    color: "var(--text-primary, #0f172a)",
    margin: 0,
  },
  candidateMeta: {
    fontSize: 12,
    color: "var(--text-muted, #64748b)",
    marginTop: 3,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  roleTag: {
    background: "var(--surface-2, #f1f5f9)",
    border: "1px solid var(--border, #e2e8f0)",
    borderRadius: 999,
    padding: "1px 8px",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--text-secondary, #475569)",
  },
  actionBtns: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },
  retryBtn: {
    padding: "7px 14px",
    borderRadius: 9,
    border: "1px solid var(--border, #e2e8f0)",
    background: "var(--surface, #ffffff)",
    color: "var(--text-primary, #374151)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  deleteBtn: {
    padding: "7px 14px",
    borderRadius: 9,
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  btnSpinner: {
    width: 11,
    height: 11,
    border: "2px solid #e2e8f0",
    borderTopColor: "#374151",
    borderRadius: "50%",
    display: "inline-block",
    animation: "wa-spin 0.8s linear infinite",
  },
  skeletonWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  skeletonCard: {
    borderRadius: 16,
    background: "var(--surface, #ffffff)",
    border: "1px solid var(--border, #e2e8f0)",
    padding: 20,
    height: 80,
    overflow: "hidden",
  },
  skeletonInner: {
    height: "100%",
    borderRadius: 8,
    background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
    backgroundSize: "200% 100%",
    animation: "wa-shimmer 1.5s infinite",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  @keyframes wa-spin { to { transform: rotate(360deg); } }
  @keyframes wa-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes wa-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .wa-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.07) !important;
  }
  .wa-logout-btn:hover:not(:disabled) {
    background: #fecaca !important;
  }
  .wa-retry-btn:hover:not(:disabled) {
    background: var(--surface-2, #f8fafc) !important;
    border-color: #cbd5e1 !important;
  }
  .wa-delete-btn:hover:not(:disabled) {
    background: #fecaca !important;
  }
  .wa-candidate-row:hover {
    background: var(--surface-2, #f8fafc) !important;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const skeletonCSS = `
  @keyframes wa-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default WhatsAppSettings;
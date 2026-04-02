import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../config";

const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ date: "", time: "" });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/interviews/slot/all`);
      setSlots(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchSlots(); }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const [hours, minutes] = form.time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const formattedTime = `${hour12}:${minutes} ${ampm}`;

      const dateObj = new Date(form.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      await axios.post(`${API_BASE_URL}/api/interviews/slot/add`, {
        date: formattedDate,
        time: formattedTime,
      });

      setMessage({ type: "success", text: "✓ Slot added successfully!" });
      setForm({ date: "", time: "" });
      fetchSlots();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to add slot!" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId, isBooked) => {
    if (isBooked) {
      setMessage({ type: "error", text: "Cannot delete a booked slot!" });
      return;
    }
    if (!window.confirm("Delete this slot?")) return;
    setDeletingId(slotId);
    try {
      await axios.delete(`${API_BASE_URL}/api/interviews/slot/delete/${slotId}`);
      setMessage({ type: "success", text: "✓ Slot deleted!" });
      fetchSlots();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete slot!" });
    } finally {
      setDeletingId(null);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ms-layout {
          max-width: 960px;
          margin: 0 auto;
          padding: 28px 16px;
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
        }

        .ms-slots-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding-top: 4px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ms-slot-card {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .ms-slot-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .ms-slot-text {
          min-width: 0;
          flex: 1;
        }

        .ms-slot-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .ms-badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Mobile: stack form above slots */
        @media (max-width: 700px) {
          .ms-layout {
            grid-template-columns: 1fr;
            padding: 16px 12px;
            gap: 20px;
          }

          .ms-slot-card {
            padding: 12px 14px;
          }

          /* On mobile, compress badge text */
          .ms-badge-text {
            display: none;
          }
          .ms-badge-dot::before {
            content: "●";
          }
        }
      `}</style>

      <div className="ms-layout">

        {/* Left — Form */}
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(22px, 5vw, 32px)",
              fontWeight: 400,
              color: "var(--text-primary)",
            }}>
              Manage Slots
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
              Add available interview time slots.
            </p>
          </motion.div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: 14, overflow: "hidden" }}
              >
                <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}>
                  <span>{message.type === "success" ? "✓" : "✕"}</span>
                  {message.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{ padding: "20px 20px" }}
          >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Date Picker */}
              <div>
                <label className="label" style={{ marginBottom: 8, display: "block" }}>
                  📅 Interview Date
                </label>
                <input
                  type="date"
                  className="field"
                  value={form.date}
                  min={today}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  style={{ width: "100%", cursor: "pointer", boxSizing: "border-box" }}
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="label" style={{ marginBottom: 8, display: "block" }}>
                  🕐 Interview Time
                </label>
                <input
                  type="time"
                  className="field"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                  style={{ width: "100%", cursor: "pointer", boxSizing: "border-box" }}
                />
                {form.time && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, paddingLeft: 4 }}
                  >
                    ⏱ {formatTime(form.time)}
                  </motion.p>
                )}
              </div>

              {/* Preview Card */}
              <AnimatePresence>
                {form.date && form.time && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      padding: "12px 14px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                  >
                    <p style={{
                      fontWeight: 600, fontSize: 11, color: "var(--text-muted)",
                      marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em"
                    }}>
                      Preview
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📅</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13, wordBreak: "break-word" }}>
                          {new Date(form.date).toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric",
                            month: "long", day: "numeric",
                          })}
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
                          {formatTime(form.time)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 2 }}
              >
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="spinner" />
                    Adding...
                  </div>
                ) : "+ Add Slot"}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Right — Slots List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="ms-slots-header">
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
              All Slots
            </span>
            <div className="ms-badge-row">
              <span style={{
                fontSize: 12, color: "#2d6a4f",
                background: "#e8f5ef", padding: "3px 10px",
                borderRadius: 20, border: "1px solid #b7dfc9",
                whiteSpace: "nowrap",
              }}>
                {slots.filter((s) => !s.isBooked).length} available
              </span>
              <span style={{
                fontSize: 12, color: "#c17d3c",
                background: "#fdf3e7", padding: "3px 10px",
                borderRadius: 20, border: "1px solid #f0d4a8",
                whiteSpace: "nowrap",
              }}>
                {slots.filter((s) => s.isBooked).length} booked
              </span>
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🗓️</div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                No slots added yet. Add your first slot!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AnimatePresence>
                {slots.map((slot, i) => (
                  <motion.div
                    key={slot._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className="card ms-slot-card"
                    style={{
                      borderLeft: slot.isBooked ? "3px solid #e74c3c" : "3px solid #2d6a4f",
                    }}
                  >
                    {/* Left: icon + text */}
                    <div className="ms-slot-left">
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: slot.isBooked ? "#fdf0ef" : "#e8f5ef",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
                        flexShrink: 0,
                      }}>
                        {slot.isBooked ? "🔒" : "📅"}
                      </div>
                      <div className="ms-slot-text">
                        <p style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {slot.date}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          🕐 {slot.time}
                        </p>
                      </div>
                    </div>

                    {/* Right: badge + delete */}
                    <div className="ms-slot-right">
                      <span
                        className={`badge ${slot.isBooked ? "badge-danger" : "badge-success"}`}
                        style={{ whiteSpace: "nowrap", fontSize: 11 }}
                      >
                        {slot.isBooked ? "● Booked" : "● Free"}
                      </span>

                      {!slot.isBooked && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="btn-ghost"
                          onClick={() => handleDelete(slot._id, slot.isBooked)}
                          disabled={deletingId === slot._id}
                          style={{
                            fontSize: 11,
                            padding: "5px 10px",
                            color: "#c0392b",
                            borderColor: "#c0392b",
                            flexShrink: 0,
                          }}
                        >
                          {deletingId === slot._id ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{
                                width: 10, height: 10,
                                border: "2px solid #c0392b",
                                borderTopColor: "#e74c3c",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                              }} />
                            </div>
                          ) : "🗑"}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ManageSlots;
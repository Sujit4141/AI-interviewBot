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

  // Auto dismiss message
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
      // Format time nicely from HH:MM to 10:00 AM
      const [hours, minutes] = form.time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const formattedTime = `${hour12}:${minutes} ${ampm}`;

      // Format date nicely
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

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "40px 24px",
      display: "grid", gridTemplateColumns: "360px 1fr",
      gap: 24, alignItems: "start"
    }}>

      {/* Left — Form */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 32, fontWeight: 400,
            color: "var(--text-primary)"
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
              style={{ marginBottom: 16, overflow: "hidden" }}
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
          style={{ padding: 28 }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

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
                style={{ width: "100%", cursor: "pointer" }}
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
                style={{ width: "100%", cursor: "pointer" }}
              />
              {/* Time preview */}
              {form.time && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 6,
                    paddingLeft: 4
                  }}
                >
                  ⏱ {(() => {
                    const [h, m] = form.time.split(":");
                    const hour = parseInt(h);
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const h12 = hour % 12 === 0 ? 12 : hour % 12;
                    return `${h12}:${m} ${ampm}`;
                  })()}
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
                    padding: "14px 16px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Preview
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📅</span>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                        {new Date(form.date).toLocaleDateString("en-US", {
                          weekday: "long", year: "numeric",
                          month: "long", day: "numeric"
                        })}
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        {(() => {
                          const [h, m] = form.time.split(":");
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? "PM" : "AM";
                          const h12 = hour % 12 === 0 ? 12 : hour % 12;
                          return `${h12}:${m} ${ampm}`;
                        })()}
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
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
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
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16, paddingTop: 4
        }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>All Slots</span>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{
              fontSize: 12, color: "#2d6a4f",
              background: "#e8f5ef", padding: "3px 10px",
              borderRadius: 20, border: "1px solid #b7dfc9"
            }}>
              {slots.filter(s => !s.isBooked).length} available
            </span>
            <span style={{
              fontSize: 12, color: "#c17d3c",
              background: "#fdf3e7", padding: "3px 10px",
              borderRadius: 20, border: "1px solid #f0d4a8"
            }}>
              {slots.filter(s => s.isBooked).length} booked
            </span>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗓️</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No slots added yet. Add your first slot!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <AnimatePresence>
              {slots.map((slot, i) => (
                <motion.div
                  key={slot._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="card"
                  style={{
                    padding: "16px 20px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    borderLeft: slot.isBooked
                      ? "3px solid #e74c3c"
                      : "3px solid #2d6a4f",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: slot.isBooked ? "#fdf0ef" : "#e8f5ef",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 18
                    }}>
                      {slot.isBooked ? "🔒" : "📅"}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                        {slot.date}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                        🕐 {slot.time}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`badge ${slot.isBooked ? "badge-danger" : "badge-success"}`}>
                      {slot.isBooked ? "● Booked" : "● Available"}
                    </span>

                    {/* Delete button — only for available slots */}
                    {!slot.isBooked && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-ghost"
                        onClick={() => handleDelete(slot._id, slot.isBooked)}
                        disabled={deletingId === slot._id}
                        style={{
                          fontSize: 11, padding: "5px 10px",
                          color: "#c0392b", borderColor: "#c0392b"
                        }}
                      >
                        {deletingId === slot._id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div className="spinner" style={{
                              width: 10, height: 10,
                              border: "2px solid #c0392b",
                              borderTopColor: "#e74c3c",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite"
                            }} />
                            ...
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ManageSlots;
import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const AddCandidate = () => {
  const [form, setForm] = useState({ name: "", phone: "", jobRole: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post("http://localhost:5000/api/candidates/add", form);
      setMessage({ type: "success", text: res.data.message });
      setForm({ name: "", phone: "", jobRole: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Something went wrong!" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name", label: "Full Name", placeholder: "e.g. Sujit Kumar", hint: null },
    { key: "phone", label: "WhatsApp Number", placeholder: "e.g. 919876543210", hint: "Include country code — India: 91XXXXXXXXXX" },
    { key: "jobRole", label: "Job Role", placeholder: "e.g. Full Stack Developer", hint: null },
  ];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px" }}>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.1 }}>
          Add Candidate
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          Fill in the details below. A WhatsApp message will be sent automatically to schedule the interview.
        </p>
      </motion.div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ padding: 32 }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {fields.map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
            >
              <label className="label">{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                className="field"
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                required
              />
              {field.hint && (
                <p style={{ marginTop: 5, fontSize: 12, color: "var(--text-muted)" }}>
                  {field.hint}
                </p>
              )}
            </motion.div>
          ))}

          <div className="divider" style={{ margin: "4px 0" }} />

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "13px 24px" }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Sending WhatsApp message...
              </>
            ) : (
              <>📤 Add & Send WhatsApp Invite</>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          marginTop: 16,
          padding: "14px 16px",
          background: "var(--surface-2)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        💡 The candidate will receive a WhatsApp message with available slots. The AI will handle the rest of the conversation automatically.
      </motion.div>
    </div>
  );
};

export default AddCandidate;
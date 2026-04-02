import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import API_BASE_URL from "../config";

const ServerLoader = ({ children }) => {
  const [serverStatus, setServerStatus] = useState("checking"); // checking | starting | ready
  const [dots, setDots] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const elapsedRef = useRef(null);
  const MAX_ATTEMPTS = 30; // 30 * 5s = 2.5 minutes max wait

  const checkHealth = async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
      setServerStatus("ready");
      clearInterval(intervalRef.current);
      clearInterval(elapsedRef.current);
    } catch {
      setAttempt(prev => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          setServerStatus("failed");
          clearInterval(intervalRef.current);
          clearInterval(elapsedRef.current);
        } else {
          setServerStatus("starting");
        }
        return next;
      });
    }
  };

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    // Track elapsed time
    elapsedRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Check health immediately then every 5 seconds
    checkHealth();
    intervalRef.current = setInterval(checkHealth, 5000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(elapsedRef.current);
      clearInterval(dotsInterval);
    };
  }, []);

  const handleRetry = () => {
    setServerStatus("checking");
    setAttempt(0);
    setElapsed(0);
    checkHealth();
    intervalRef.current = setInterval(checkHealth, 5000);
    elapsedRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
  };

  if (serverStatus === "ready") return children;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--surface, #faf9f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          flexDirection: "column",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            textAlign: "center",
            maxWidth: 420,
            padding: "0 24px",
          }}
        >
          {/* Logo / Icon */}
          <div style={{
            width: 72, height: 72,
            borderRadius: 20,
            background: "var(--surface-2, #f0ede8)",
            border: "1px solid var(--border, #e5e2dc)",
            display: "flex", alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 28px",
          }}>
            🤖
          </div>

          {serverStatus === "failed" ? (
            <>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 26, fontWeight: 400,
                color: "var(--text-primary, #1a1916)",
                marginBottom: 10
              }}>
                Server unreachable
              </h2>
              <p style={{
                color: "var(--text-muted, #888)",
                fontSize: 14, lineHeight: 1.6,
                marginBottom: 28
              }}>
                Could not connect after {elapsed}s. The server might be down or there's a network issue.
              </p>
              <button
                onClick={handleRetry}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "1px solid var(--border, #e5e2dc)",
                  background: "var(--surface-2, #f0ede8)",
                  color: "var(--text-primary, #1a1916)",
                  fontWeight: 600, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                ↺ Try Again
              </button>
            </>
          ) : (
            <>
              <h2 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 26, fontWeight: 400,
                color: "var(--text-primary, #1a1916)",
                marginBottom: 10
              }}>
                {serverStatus === "checking" ? "Connecting" : "Waking up server"}{dots}
              </h2>
              <p style={{
                color: "var(--text-muted, #888)",
                fontSize: 14, lineHeight: 1.6,
                marginBottom: 32
              }}>
                {serverStatus === "checking"
                  ? "Checking server connection..."
                  : "The server is starting up on Render. This usually takes 30–60 seconds on the free plan."}
              </p>

              {/* Progress bar */}
              <div style={{
                width: "100%",
                height: 4,
                background: "var(--border, #e5e2dc)",
                borderRadius: 99,
                overflow: "hidden",
                marginBottom: 16,
              }}>
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  style={{
                    height: "100%",
                    width: "40%",
                    background: "var(--accent, #1a1916)",
                    borderRadius: 99,
                  }}
                />
              </div>

              {/* Status info */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--text-muted, #888)",
              }}>
                <span>Attempt {attempt + 1} of {MAX_ATTEMPTS}</span>
                <span>{elapsed}s elapsed</span>
              </div>

              {/* Tip after 15 seconds */}
              <AnimatePresence>
                {elapsed > 15 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 24,
                      padding: "12px 16px",
                      background: "var(--surface-2, #f0ede8)",
                      border: "1px solid var(--border, #e5e2dc)",
                      borderRadius: 12,
                      fontSize: 13,
                      color: "var(--text-secondary, #555)",
                      lineHeight: 1.5,
                    }}
                  >
                    💡 Render free servers sleep after inactivity. First load may take up to 60 seconds.
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServerLoader;
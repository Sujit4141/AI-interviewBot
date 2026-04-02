import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/add-candidate", label: "Add Candidate", icon: "➕" },
    { to: "/manage-slots", label: "Slots", icon: "🗓️" },
    { to: "/whatsapp", label: "WhatsApp", icon: "📱" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "0 20px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: "var(--text-primary)",
              borderRadius: 8,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 15,
            }}>📅</div>
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 18,
              color: "var(--text-primary)",
              fontWeight: 400,
            }}>InterviewAI</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}
          className="hide-mobile">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} style={{ textDecoration: "none" }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "var(--surface)" : "transparent",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    border: active ? "1px solid var(--border)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                  }}
                >
                  {link.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            style={{
              width: 36, height: 36,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              transition: "all 0.15s ease",
            }}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </motion.button>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 36, height: 36,
              borderRadius: 8,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              cursor: "pointer",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
            className="mobile-menu-btn"
          >
            {menuOpen ? "✕" : "☰"}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
              overflow: "hidden",
            }}
          >
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{ textDecoration: "none" }}
                  onClick={() => setMenuOpen(false)}
                >
                  <div style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderBottom: "1px solid var(--border)",
                    background: active ? "var(--surface-2)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: active ? 600 : 400,
                    fontSize: 14,
                    transition: "all 0.15s ease",
                  }}>
                    <span>{link.icon}</span>
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </motion.header>
  );
};

export default Navbar;
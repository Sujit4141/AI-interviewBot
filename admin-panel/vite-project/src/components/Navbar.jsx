import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/add-candidate", label: "Add Candidate" },
    { to: "/manage-slots", label: "Manage Slots" },
    { to: "/whatsapp", label: "WhatsApp" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "rgba(249,248,246,0.85)",
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
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              background: "var(--text-primary)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}>📅</div>
            <span style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 18,
              color: "var(--text-primary)",
              fontWeight: 400,
            }}>InterviewAI</span>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
      </div>
    </motion.header>
  );
};

export default Navbar;
// import { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import API_BASE_URL from "../config";

// const WhatsAppSettings = () => {
//   const [status, setStatus] = useState({ connected: false, hasQR: false });
//   const [qrImage, setQrImage] = useState(null);
//   const [serverUp, setServerUp] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [logoutLoading, setLogoutLoading] = useState(false);
//   const [message, setMessage] = useState(null);
//   const [pendingCandidates, setPendingCandidates] = useState([]);
//   const [retryingId, setRetryingId] = useState(null);
//   const [deletingId, setDeletingId] = useState(null);
//   const pollingRef = useRef(null);

//   const checkServer = async () => {
//     try {
//       await axios.get(`${API_BASE_URL}/api/health`);
//       setServerUp(true);
//       return true;
//     } catch {
//       setServerUp(false);
//       return false;
//     }
//   };

//   const checkStatus = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/whatsapp/status`);
//       setStatus(res.data);
//       if (res.data.hasQR && !res.data.connected) {
//         fetchQR();
//       } else if (res.data.connected) {
//         setQrImage(null);
//       }
//     } catch (err) {
//       console.error("Status check failed:", err);
//     }
//   };

//   const fetchQR = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/whatsapp/qr`);
//       setQrImage(res.data.qr);
//     } catch {
//       setQrImage(null);
//     }
//   };

//   const fetchPending = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/interviews/all`);
//       const pending = res.data.filter((i) => i.status === "pending");
//       setPendingCandidates(pending);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const init = async () => {
//     setLoading(true);
//     const up = await checkServer();
//     if (up) {
//       await checkStatus();
//       await fetchPending();
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     init();
//     pollingRef.current = setInterval(async () => {
//       const up = await checkServer();
//       if (up) await checkStatus();
//     }, 5000);
//     return () => clearInterval(pollingRef.current);
//   }, []);

//   // Auto dismiss message after 3 seconds
//   useEffect(() => {
//     if (message) {
//       const t = setTimeout(() => setMessage(null), 3000);
//       return () => clearTimeout(t);
//     }
//   }, [message]);

//   const handleLogout = async () => {
//     if (!window.confirm("Are you sure you want to logout from WhatsApp? You'll need to scan QR again.")) return;
//     setLogoutLoading(true);
//     setMessage(null);
//     try {
//       const res = await axios.post(`${API_BASE_URL}/api/whatsapp/logout`);
//       setMessage({ type: "success", text: res.data.message });
//       setStatus({ connected: false, hasQR: false });
//       setQrImage(null);
//       setTimeout(async () => { await checkStatus(); }, 3000);
//     } catch (err) {
//       setMessage({ type: "error", text: err.response?.data?.message || "Logout failed!" });
//     } finally {
//       setLogoutLoading(false);
//     }
//   };

//   const handleRetry = async (candidateId, candidateName) => {
//     setRetryingId(candidateId);
//     try {
//       await axios.post(`${API_BASE_URL}/api/candidates/retry/${candidateId}`);
//       setMessage({ type: "success", text: `✓ Retry message sent to ${candidateName}!` });
//       await fetchPending();
//     } catch (err) {
//       setMessage({ type: "error", text: err.response?.data?.message || "Retry failed!" });
//     } finally {
//       setRetryingId(null);
//     }
//   };

//   const handleDelete = async (candidateId, candidateName) => {
//     if (!window.confirm(`Delete ${candidateName} and all their data? This cannot be undone.`)) return;
//     setDeletingId(candidateId);
//     try {
//       await axios.delete(`${API_BASE_URL}/api/candidates/delete/${candidateId}`);
//       setMessage({ type: "success", text: `✓ ${candidateName} deleted successfully!` });
//       await fetchPending();
//     } catch (err) {
//       setMessage({ type: "error", text: err.response?.data?.message || "Delete failed!" });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
//         <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//           {[1, 2, 3].map(i => (
//             <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>

//       {/* Header */}
//       <motion.div
//         initial={{ opacity: 0, y: 12 }}
//         animate={{ opacity: 1, y: 0 }}
//         style={{ marginBottom: 32 }}
//       >
//         <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400, color: "var(--text-primary)" }}>
//           WhatsApp Settings
//         </h1>
//         <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
//           Monitor connection, scan QR, manage sessions and retry messages.
//         </p>
//       </motion.div>

//       {/* Alert */}
//       <AnimatePresence>
//         {message && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             style={{ marginBottom: 20, overflow: "hidden" }}
//           >
//             <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}>
//               <span>{message.type === "success" ? "✓" : "✕"}</span>
//               {message.text}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Server Status */}
//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.05 }}
//         className="card"
//         style={{ padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//           <div style={{
//             width: 42, height: 42, borderRadius: 12,
//             background: serverUp ? "#e8f5ef" : "#fdf0ef",
//             display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
//           }}>
//             🖥️
//           </div>
//           <div>
//             <p style={{ fontWeight: 600, fontSize: 14 }}>Backend Server</p>
//             <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{API_BASE_URL}</p>
//           </div>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <div style={{
//             width: 8, height: 8, borderRadius: "50%",
//             background: serverUp ? "#2d6a4f" : "#c0392b",
//             boxShadow: serverUp ? "0 0 6px rgba(45,106,79,0.5)" : "0 0 6px rgba(192,57,43,0.5)",
//             animation: serverUp ? "pulse 2s infinite" : "none"
//           }} />
//           <span style={{ fontSize: 13, fontWeight: 600, color: serverUp ? "#2d6a4f" : "#c0392b" }}>
//             {serverUp ? "Online" : "Offline"}
//           </span>
//         </div>
//       </motion.div>

//       {/* WhatsApp Status */}
//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1 }}
//         className="card"
//         style={{ padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//           <div style={{
//             width: 42, height: 42, borderRadius: 12,
//             background: status.connected ? "#e8f5ef" : status.hasQR ? "#fdf3e7" : "#fdf0ef",
//             display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
//           }}>
//             📱
//           </div>
//           <div>
//             <p style={{ fontWeight: 600, fontSize: 14 }}>WhatsApp Bot</p>
//             <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
//               {status.connected
//                 ? "Bot is active and ready to send/receive messages"
//                 : status.hasQR
//                 ? "Waiting for QR scan — scroll down to scan"
//                 : "Disconnected"}
//             </p>
//           </div>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <div style={{
//               width: 8, height: 8, borderRadius: "50%",
//               background: status.connected ? "#2d6a4f" : status.hasQR ? "#c17d3c" : "#c0392b",
//               boxShadow: status.connected
//                 ? "0 0 6px rgba(45,106,79,0.5)"
//                 : status.hasQR
//                 ? "0 0 6px rgba(193,125,60,0.5)"
//                 : "0 0 6px rgba(192,57,43,0.5)",
//             }} />
//             <span style={{
//               fontSize: 13, fontWeight: 600,
//               color: status.connected ? "#2d6a4f" : status.hasQR ? "#c17d3c" : "#c0392b"
//             }}>
//               {status.connected ? "Connected" : status.hasQR ? "Scan QR" : "Disconnected"}
//             </span>
//           </div>
//           {status.connected && (
//             <button
//               className="btn-ghost"
//               onClick={handleLogout}
//               disabled={logoutLoading}
//               style={{ fontSize: 12, padding: "6px 12px", color: "#c0392b", borderColor: "#c0392b" }}
//             >
//               {logoutLoading ? "..." : "Logout"}
//             </button>
//           )}
//         </div>
//       </motion.div>

//       {/* QR Code Section */}
//       <AnimatePresence>
//         {!status.connected && (
//           <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             transition={{ delay: 0.15 }}
//             className="card"
//             style={{ padding: 28, marginBottom: 16, textAlign: "center" }}
//           >
//             <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
//               {status.hasQR ? "📲 Scan QR Code" : "⏳ Waiting for QR..."}
//             </p>
//             <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
//               {status.hasQR
//                 ? "Open WhatsApp → Linked Devices → Link a Device → Scan"
//                 : "QR code will appear here once the server is ready. This auto-refreshes every 5 seconds."}
//             </p>
//             {qrImage ? (
//               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: "inline-block" }}>
//                 <img
//                   src={qrImage}
//                   alt="WhatsApp QR Code"
//                   style={{ width: 220, height: 220, borderRadius: 16, border: "2px solid var(--border)", padding: 12, background: "white" }}
//                 />
//                 <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
//                   QR refreshes automatically every 5 seconds
//                 </p>
//               </motion.div>
//             ) : (
//               <div style={{
//                 width: 220, height: 220, margin: "0 auto", borderRadius: 16,
//                 border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center"
//               }}>
//                 <div className="spinner" style={{
//                   width: 32, height: 32,
//                   border: "3px solid var(--border)",
//                   borderTopColor: "var(--accent)",
//                   borderRadius: "50%",
//                   animation: "spin 0.8s linear infinite"
//                 }} />
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Pending Candidates */}
//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2 }}
//         className="card"
//         style={{ overflow: "hidden" }}
//       >
//         <div style={{
//           padding: "18px 24px",
//           borderBottom: "1px solid var(--border)",
//           display: "flex", alignItems: "center", justifyContent: "space-between"
//         }}>
//           <span style={{ fontWeight: 600, fontSize: 15 }}>Pending Candidates</span>
//           <span style={{
//             fontSize: 12, color: "var(--text-muted)",
//             background: "var(--surface-2)", padding: "3px 10px",
//             borderRadius: 20, border: "1px solid var(--border)"
//           }}>
//             {pendingCandidates.length} pending
//           </span>
//         </div>

//         {pendingCandidates.length === 0 ? (
//           <div style={{ padding: "48px 24px", textAlign: "center" }}>
//             <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
//             <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
//               No pending candidates! Everyone has responded.
//             </p>
//           </div>
//         ) : (
//           <div>
//             {pendingCandidates.map((interview, i) => (
//               <motion.div
//                 key={interview._id}
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: i * 0.05 }}
//                 style={{
//                   padding: "16px 24px",
//                   borderTop: i > 0 ? "1px solid var(--border)" : "none",
//                   display: "flex", alignItems: "center", justifyContent: "space-between",
//                 }}
//                 onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
//                 onMouseLeave={e => e.currentTarget.style.background = "transparent"}
//               >
//                 {/* Candidate Info */}
//                 <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//                   <div style={{
//                     width: 38, height: 38, borderRadius: 10,
//                     background: "var(--surface-2)", border: "1px solid var(--border)",
//                     display: "flex", alignItems: "center", justifyContent: "center",
//                     fontSize: 16, fontWeight: 700, color: "var(--text-secondary)"
//                   }}>
//                     {interview.candidate?.name?.charAt(0).toUpperCase()}
//                   </div>
//                   <div>
//                     <p style={{ fontWeight: 600, fontSize: 14 }}>
//                       {interview.candidate?.name}
//                     </p>
//                     <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
//                       {interview.candidate?.phone} · {interview.candidate?.jobRole}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div style={{ display: "flex", gap: 8 }}>
//                   {/* Retry Button */}
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.97 }}
//                     className="btn-ghost"
//                     onClick={() => handleRetry(interview.candidate?._id, interview.candidate?.name)}
//                     disabled={retryingId === interview.candidate?._id || deletingId === interview.candidate?._id}
//                     style={{ fontSize: 12, padding: "7px 14px" }}
//                   >
//                     {retryingId === interview.candidate?._id ? (
//                       <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                         <div className="spinner" style={{
//                           width: 12, height: 12,
//                           border: "2px solid var(--border)",
//                           borderTopColor: "var(--accent)",
//                           borderRadius: "50%",
//                           animation: "spin 0.8s linear infinite"
//                         }} />
//                         Sending...
//                       </div>
//                     ) : "↺ Retry"}
//                   </motion.button>

//                   {/* Delete Button */}
//                   <motion.button
//                     whileHover={{ scale: 1.03 }}
//                     whileTap={{ scale: 0.97 }}
//                     className="btn-ghost"
//                     onClick={() => handleDelete(interview.candidate?._id, interview.candidate?.name)}
//                     disabled={deletingId === interview.candidate?._id || retryingId === interview.candidate?._id}
//                     style={{
//                       fontSize: 12, padding: "7px 14px",
//                       color: "#c0392b", borderColor: "#c0392b"
//                     }}
//                   >
//                     {deletingId === interview.candidate?._id ? (
//                       <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                         <div className="spinner" style={{
//                           width: 12, height: 12,
//                           border: "2px solid #c0392b",
//                           borderTopColor: "#e74c3c",
//                           borderRadius: "50%",
//                           animation: "spin 0.8s linear infinite"
//                         }} />
//                         Deleting...
//                       </div>
//                     ) : "🗑 Delete"}
//                   </motion.button>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         )}
//       </motion.div>

//       <style>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }
//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default WhatsAppSettings;

// import { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { motion, AnimatePresence } from "framer-motion";
// import API_BASE_URL from "../config";

// const WhatsAppSettings = () => {
//   const [status, setStatus] = useState({ connected: false, hasQR: false });
//   const [qrImage, setQrImage] = useState(null);
//   const [serverUp, setServerUp] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [logoutLoading, setLogoutLoading] = useState(false);
//   const [message, setMessage] = useState(null);
//   const [pendingCandidates, setPendingCandidates] = useState([]);
//   const [retryingId, setRetryingId] = useState(null);
//   const [deletingId, setDeletingId] = useState(null);
//   const [pairMode, setPairMode] = useState("qr"); // "qr" or "phone"
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [pairCode, setPairCode] = useState(null);
//   const [pairLoading, setPairLoading] = useState(false);
//   const pollingRef = useRef(null);

//   const checkServer = async () => {
//     try {
//       await axios.get(`${API_BASE_URL}/api/health`);
//       setServerUp(true);
//       return true;
//     } catch {
//       setServerUp(false);
//       return false;
//     }
//   };

//   const checkStatus = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/whatsapp/status`);
//       setStatus(res.data);
//       if (res.data.hasQR && !res.data.connected && pairMode === "qr") fetchQR();
//       else if (res.data.connected) { setQrImage(null); setPairCode(null); }
//     } catch (err) { console.error("Status check failed:", err); }
//   };

//   const fetchQR = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/whatsapp/qr`);
//       setQrImage(res.data.qr);
//     } catch { setQrImage(null); }
//   };

//   const fetchPending = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/interviews/all`);
//       setPendingCandidates(res.data.filter(i => i.status === "pending"));
//     } catch (err) { console.error(err); }
//   };

//   const init = async () => {
//     setLoading(true);
//     const up = await checkServer();
//     if (up) { await checkStatus(); await fetchPending(); }
//     setLoading(false);
//   };

//   useEffect(() => {
//     init();
//     pollingRef.current = setInterval(async () => {
//       const up = await checkServer();
//       if (up) await checkStatus();
//     }, 5000);
//     return () => clearInterval(pollingRef.current);
//   }, []);

//   useEffect(() => {
//     if (message) {
//       const t = setTimeout(() => setMessage(null), 3000);
//       return () => clearTimeout(t);
//     }
//   }, [message]);

//   const handleLogout = async () => {
//     if (!window.confirm("Logout from WhatsApp? You'll need to reconnect.")) return;
//     setLogoutLoading(true);
//     try {
//       const res = await axios.post(`${API_BASE_URL}/api/whatsapp/logout`);
//       setMessage({ type: "success", text: res.data.message });
//       setStatus({ connected: false, hasQR: false });
//       setQrImage(null); setPairCode(null);
//       setTimeout(async () => { await checkStatus(); }, 3000);
//     } catch (err) {
//       setMessage({ type: "error", text: err.response?.data?.message || "Logout failed!" });
//     } finally { setLogoutLoading(false); }
//   };

//   const handlePairWithPhone = async () => {
//     if (!phoneNumber || phoneNumber.length < 10) {
//       setMessage({ type: "error", text: "Enter a valid phone number with country code!" });
//       return;
//     }
//     setPairLoading(true);
//     setPairCode(null);
//     try {
//       const res = await axios.post(`${API_BASE_URL}/api/whatsapp/pair`, { phone: phoneNumber });
//       setPairCode(res.data.code);
//       setMessage({ type: "success", text: "Pairing code generated! Enter it in WhatsApp." });
//     } catch (err) {
//       setMessage({ type: "error", text: err.response?.data?.message || "Failed to generate pairing code!" });
//     } finally { setPairLoading(false); }
//   };

//   const handleRetry = async (candidateId, candidateName) => {
//     setRetryingId(candidateId);
//     try {
//       await axios.post(`${API_BASE_URL}/api/candidates/retry/${candidateId}`);
//       setMessage({ type: "success", text: `✓ Retry message sent to ${candidateName}!` });
//       await fetchPending();
//     } catch (err) {
//       setMessage({ type: "error", text: err.response?.data?.message || "Retry failed!" });
//     } finally { setRetryingId(null); }
//   };

//   const handleDelete = async (candidateId, candidateName) => {
//     if (!window.confirm(`Delete ${candidateName}?`)) return;
//     setDeletingId(candidateId);
//     try {
//       await axios.delete(`${API_BASE_URL}/api/candidates/delete/${candidateId}`);
//       setMessage({ type: "success", text: `✓ ${candidateName} deleted!` });
//       await fetchPending();
//     } catch (err) {
//       setMessage({ type: "error", text: "Delete failed!" });
//     } finally { setDeletingId(null); }
//   };

//   if (loading) {
//     return (
//       <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
//         {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 16 }} />)}
//       </div>
//     );
//   }

//   return (
//     <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

//       {/* Header */}
//       <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
//         <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 400, color: "var(--text-primary)" }}>
//           WhatsApp Settings
//         </h1>
//         <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
//           Monitor connection, scan QR or pair with phone number.
//         </p>
//       </motion.div>

//       {/* Alert */}
//       <AnimatePresence>
//         {message && (
//           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 20, overflow: "hidden" }}>
//             <div className={`alert alert-${message.type === "success" ? "success" : "error"}`}>
//               <span>{message.type === "success" ? "✓" : "✕"}</span>
//               {message.text}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Server Status */}
//       <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
//         className="card" style={{ padding: "18px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div style={{ width: 40, height: 40, borderRadius: 10, background: serverUp ? "var(--accent-light)" : "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖥️</div>
//           <div>
//             <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Backend Server</p>
//             <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{API_BASE_URL}</p>
//           </div>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <div style={{ width: 8, height: 8, borderRadius: "50%", background: serverUp ? "var(--accent)" : "var(--danger)", animation: serverUp ? "pulse 2s infinite" : "none" }} />
//           <span style={{ fontSize: 13, fontWeight: 600, color: serverUp ? "var(--accent)" : "var(--danger)" }}>
//             {serverUp ? "Online" : "Offline"}
//           </span>
//         </div>
//       </motion.div>

//       {/* WhatsApp Status */}
//       <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
//         className="card" style={{ padding: "18px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div style={{ width: 40, height: 40, borderRadius: 10, background: status.connected ? "var(--accent-light)" : status.hasQR ? "var(--accent-2-light)" : "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📱</div>
//           <div>
//             <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>WhatsApp Bot</p>
//             <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
//               {status.connected ? "Bot is active and ready" : status.hasQR ? "Waiting to connect" : "Disconnected"}
//             </p>
//           </div>
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//             <div style={{ width: 8, height: 8, borderRadius: "50%", background: status.connected ? "var(--accent)" : status.hasQR ? "var(--accent-2)" : "var(--danger)" }} />
//             <span style={{ fontSize: 13, fontWeight: 600, color: status.connected ? "var(--accent)" : status.hasQR ? "var(--accent-2)" : "var(--danger)" }}>
//               {status.connected ? "Connected" : status.hasQR ? "Scan QR" : "Disconnected"}
//             </span>
//           </div>
//           {status.connected && (
//             <button className="btn-ghost" onClick={handleLogout} disabled={logoutLoading}
//               style={{ fontSize: 12, padding: "5px 12px", color: "var(--danger)", borderColor: "var(--danger)" }}>
//               {logoutLoading ? "..." : "Logout"}
//             </button>
//           )}
//         </div>
//       </motion.div>

//       {/* Connection Section */}
//       <AnimatePresence>
//         {!status.connected && (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.15 }}
//             className="card" style={{ padding: 24, marginBottom: 12 }}>

//             {/* Mode Toggle */}
//             <div style={{ display: "flex", gap: 8, marginBottom: 24, padding: 4, background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
//               {["qr", "phone"].map(mode => (
//                 <button key={mode} onClick={() => { setPairMode(mode); setPairCode(null); }}
//                   style={{
//                     flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
//                     background: pairMode === mode ? "var(--surface)" : "transparent",
//                     color: pairMode === mode ? "var(--text-primary)" : "var(--text-muted)",
//                     fontWeight: pairMode === mode ? 600 : 500,
//                     fontSize: 13, cursor: "pointer",
//                     boxShadow: pairMode === mode ? "var(--shadow-sm)" : "none",
//                     transition: "all 0.15s ease",
//                   }}>
//                   {mode === "qr" ? "📷 Scan QR Code" : "📞 Phone Number"}
//                 </button>
//               ))}
//             </div>

//             {/* QR Mode */}
//             {pairMode === "qr" && (
//               <div style={{ textAlign: "center" }}>
//                 <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "var(--text-primary)" }}>
//                   {status.hasQR ? "📲 Scan QR Code" : "⏳ Generating QR..."}
//                 </p>
//                 <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
//                   Open WhatsApp → Linked Devices → Link a Device → Scan
//                 </p>
//                 {qrImage ? (
//                   <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
//                     <img src={qrImage} alt="WhatsApp QR Code"
//                       style={{ width: 200, height: 200, borderRadius: 16, border: "2px solid var(--border)", padding: 10, background: "white", display: "block", margin: "0 auto" }} />
//                     <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>Auto-refreshes every 5 seconds</p>
//                   </motion.div>
//                 ) : (
//                   <div style={{ width: 200, height: 200, margin: "0 auto", borderRadius: 16, border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <div style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Phone Pairing Mode */}
//             {pairMode === "phone" && (
//               <div>
//                 <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "var(--text-primary)" }}>
//                   📞 Pair with Phone Number
//                 </p>
//                 <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
//                   Enter your WhatsApp number. You'll get an 8-digit code to enter in WhatsApp → Linked Devices → Link with phone number.
//                 </p>
//                 <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//                   <input
//                     type="text"
//                     className="field"
//                     placeholder="e.g. 919876543210"
//                     value={phoneNumber}
//                     onChange={e => setPhoneNumber(e.target.value)}
//                     style={{ flex: 1, minWidth: 200 }}
//                   />
//                   <button
//                     className="btn-primary"
//                     onClick={handlePairWithPhone}
//                     disabled={pairLoading}
//                     style={{ whiteSpace: "nowrap" }}
//                   >
//                     {pairLoading ? <><div className="spinner" />Getting Code...</> : "Get Code"}
//                   </button>
//                 </div>

//                 {/* Pairing Code Display */}
//                 <AnimatePresence>
//                   {pairCode && (
//                     <motion.div
//                       initial={{ opacity: 0, y: 10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0 }}
//                       style={{ marginTop: 20, padding: "20px 24px", background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 12, textAlign: "center" }}
//                     >
//                       <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                         Your Pairing Code
//                       </p>
//                       <p style={{ fontSize: 36, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.15em", fontFamily: "monospace" }}>
//                         {pairCode}
//                       </p>
//                       <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 10, opacity: 0.8 }}>
//                         Enter this code in WhatsApp → Linked Devices → Link with phone number
//                       </p>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Pending Candidates */}
//       <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ overflow: "hidden" }}>
//         <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//           <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>Pending Candidates</span>
//           <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--surface-2)", padding: "3px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
//             {pendingCandidates.length} pending
//           </span>
//         </div>

//         {pendingCandidates.length === 0 ? (
//           <div style={{ padding: "40px 24px", textAlign: "center" }}>
//             <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
//             <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No pending candidates!</p>
//           </div>
//         ) : (
//           pendingCandidates.map((interview, i) => (
//             <motion.div key={interview._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
//               style={{ padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}
//               onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
//               onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
//               <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                 <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>
//                   {interview.candidate?.name?.charAt(0).toUpperCase()}
//                 </div>
//                 <div>
//                   <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{interview.candidate?.name}</p>
//                   <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
//                     {interview.candidate?.phone} · {interview.candidate?.jobRole}
//                   </p>
//                 </div>
//               </div>
//               <div style={{ display: "flex", gap: 8 }}>
//                 <button className="btn-ghost" onClick={() => handleRetry(interview.candidate?._id, interview.candidate?.name)}
//                   disabled={retryingId === interview.candidate?._id}
//                   style={{ fontSize: 12, padding: "6px 12px" }}>
//                   {retryingId === interview.candidate?._id ? "..." : "↺ Retry"}
//                 </button>
//                 <button className="btn-ghost" onClick={() => handleDelete(interview.candidate?._id, interview.candidate?.name)}
//                   disabled={deletingId === interview.candidate?._id}
//                   style={{ fontSize: 12, padding: "6px 12px", color: "var(--danger)", borderColor: "var(--danger)" }}>
//                   {deletingId === interview.candidate?._id ? "..." : "🗑 Delete"}
//                 </button>
//               </div>
//             </motion.div>
//           ))
//         )}
//       </motion.div>

//       <style>{`
//         @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
//         @keyframes spin { to { transform: rotate(360deg); } }
//       `}</style>
//     </div>
//   );
// };

// export default WhatsAppSettings;



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
  const [pairMode, setPairMode] = useState("qr"); // "qr" or "phone"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairCode, setPairCode] = useState(null);
  const [pairLoading, setPairLoading] = useState(false);

  // FIX 1: Ref to track pairMode inside polling interval (avoids stale closure)
  const pairModeRef = useRef("qr");
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
      // FIX 1: Use pairModeRef.current instead of pairMode state (no stale closure)
      if (res.data.hasQR && !res.data.connected && pairModeRef.current === "qr") {
        fetchQR();
      } else if (res.data.connected) {
        setQrImage(null);
        setPairCode(null);
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
      setPendingCandidates(res.data.filter((i) => i.status === "pending"));
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
    if (!window.confirm("Logout from WhatsApp? You'll need to reconnect.")) return;
    setLogoutLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/whatsapp/logout`);
      setMessage({ type: "success", text: res.data.message });
      setStatus({ connected: false, hasQR: false });
      setQrImage(null);
      setPairCode(null);
      setTimeout(async () => {
        await checkStatus();
      }, 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Logout failed!" });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handlePairWithPhone = async () => {
    // FIX 2: Strip all non-digit characters before sending (removes +, spaces, dashes)
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      setMessage({
        type: "error",
        text: "Enter a valid number with country code (digits only, e.g. 919876543210).",
      });
      return;
    }
    setPairLoading(true);
    setPairCode(null);
    try {
      // FIX 2: Send `cleaned` (pure digits) instead of raw `phoneNumber`
      const res = await axios.post(`${API_BASE_URL}/api/whatsapp/pair`, { phone: cleaned });
      setPairCode(res.data.code);
      setMessage({ type: "success", text: "Pairing code generated! Enter it in WhatsApp." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to generate pairing code!",
      });
    } finally {
      setPairLoading(false);
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
    if (!window.confirm(`Delete ${candidateName}?`)) return;
    setDeletingId(candidateId);
    try {
      await axios.delete(`${API_BASE_URL}/api/candidates/delete/${candidateId}`);
      setMessage({ type: "success", text: `✓ ${candidateName} deleted!` });
      await fetchPending();
    } catch (err) {
      setMessage({ type: "error", text: "Delete failed!" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 80, borderRadius: 14, marginBottom: 16 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(24px, 5vw, 36px)",
            fontWeight: 400,
            color: "var(--text-primary)",
          }}
        >
          WhatsApp Settings
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 14 }}>
          Monitor connection, scan QR or pair with phone number.
        </p>
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

      {/* Server Status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card"
        style={{
          padding: "18px 20px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: serverUp ? "var(--accent-light)" : "var(--danger-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🖥️
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
              Backend Server
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {API_BASE_URL}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: serverUp ? "var(--accent)" : "var(--danger)",
              animation: serverUp ? "pulse 2s infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: serverUp ? "var(--accent)" : "var(--danger)",
            }}
          >
            {serverUp ? "Online" : "Offline"}
          </span>
        </div>
      </motion.div>

      {/* WhatsApp Status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{
          padding: "18px 20px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: status.connected
                ? "var(--accent-light)"
                : status.hasQR
                ? "var(--accent-2-light)"
                : "var(--danger-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            📱
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
              WhatsApp Bot
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {status.connected
                ? "Bot is active and ready"
                : status.hasQR
                ? "Waiting to connect"
                : "Disconnected"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: status.connected
                  ? "var(--accent)"
                  : status.hasQR
                  ? "var(--accent-2)"
                  : "var(--danger)",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: status.connected
                  ? "var(--accent)"
                  : status.hasQR
                  ? "var(--accent-2)"
                  : "var(--danger)",
              }}
            >
              {status.connected ? "Connected" : status.hasQR ? "Scan QR" : "Disconnected"}
            </span>
          </div>
          {status.connected && (
            <button
              className="btn-ghost"
              onClick={handleLogout}
              disabled={logoutLoading}
              style={{ fontSize: 12, padding: "5px 12px", color: "var(--danger)", borderColor: "var(--danger)" }}
            >
              {logoutLoading ? "..." : "Logout"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Connection Section */}
      <AnimatePresence>
        {!status.connected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
            style={{ padding: 24, marginBottom: 12 }}
          >
            {/* Mode Toggle */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                padding: 4,
                background: "var(--surface-2)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              {["qr", "phone"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    // FIX 1: Update both state AND ref together
                    setPairMode(mode);
                    pairModeRef.current = mode;
                    setPairCode(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: pairMode === mode ? "var(--surface)" : "transparent",
                    color: pairMode === mode ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: pairMode === mode ? 600 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: pairMode === mode ? "var(--shadow-sm)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {mode === "qr" ? "📷 Scan QR Code" : "📞 Phone Number"}
                </button>
              ))}
            </div>

            {/* QR Mode */}
            {pairMode === "qr" && (
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 6,
                    color: "var(--text-primary)",
                  }}
                >
                  {status.hasQR ? "📲 Scan QR Code" : "⏳ Generating QR..."}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                  Open WhatsApp → Linked Devices → Link a Device → Scan
                </p>
                {qrImage ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <img
                      src={qrImage}
                      alt="WhatsApp QR Code"
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 16,
                        border: "2px solid var(--border)",
                        padding: 10,
                        background: "white",
                        display: "block",
                        margin: "0 auto",
                      }}
                    />
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                      Auto-refreshes every 5 seconds
                    </p>
                  </motion.div>
                ) : (
                  <div
                    style={{
                      width: 200,
                      height: 200,
                      margin: "0 auto",
                      borderRadius: 16,
                      border: "2px dashed var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        border: "3px solid var(--border)",
                        borderTopColor: "var(--accent)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Phone Pairing Mode */}
            {pairMode === "phone" && (
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 6,
                    color: "var(--text-primary)",
                  }}
                >
                  📞 Pair with Phone Number
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 20,
                    lineHeight: 1.6,
                  }}
                >
                  Enter your WhatsApp number with country code (digits only — no +, spaces, or
                  dashes). You'll get an 8-digit code to enter in WhatsApp → Linked Devices → Link
                  with phone number.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    className="field"
                    // FIX 2: Updated placeholder to make format crystal clear
                    placeholder="Country code + number, e.g. 919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handlePairWithPhone}
                    disabled={pairLoading}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {pairLoading ? (
                      <>
                        <div className="spinner" />
                        Getting Code...
                      </>
                    ) : (
                      "Get Code"
                    )}
                  </button>
                </div>

                {/* Pairing Code Display */}
                <AnimatePresence>
                  {pairCode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: 20,
                        padding: "20px 24px",
                        background: "var(--accent-light)",
                        border: "1px solid var(--accent)",
                        borderRadius: 12,
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--accent)",
                          fontWeight: 600,
                          marginBottom: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Your Pairing Code
                      </p>
                      <p
                        style={{
                          fontSize: 36,
                          fontWeight: 800,
                          color: "var(--accent)",
                          letterSpacing: "0.15em",
                          fontFamily: "monospace",
                        }}
                      >
                        {pairCode}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--accent)",
                          marginTop: 10,
                          opacity: 0.8,
                        }}
                      >
                        Enter this code in WhatsApp → Linked Devices → Link with phone number
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{ overflow: "hidden" }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
            Pending Candidates
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              background: "var(--surface-2)",
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid var(--border)",
            }}
          >
            {pendingCandidates.length} pending
          </span>
        </div>

        {pendingCandidates.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No pending candidates!</p>
          </div>
        ) : (
          pendingCandidates.map((interview, i) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: "14px 20px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  {interview.candidate?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                    {interview.candidate?.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {interview.candidate?.phone} · {interview.candidate?.jobRole}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-ghost"
                  onClick={() =>
                    handleRetry(interview.candidate?._id, interview.candidate?.name)
                  }
                  disabled={retryingId === interview.candidate?._id}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  {retryingId === interview.candidate?._id ? "..." : "↺ Retry"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() =>
                    handleDelete(interview.candidate?._id, interview.candidate?.name)
                  }
                  disabled={deletingId === interview.candidate?._id}
                  style={{
                    fontSize: 12,
                    padding: "6px 12px",
                    color: "var(--danger)",
                    borderColor: "var(--danger)",
                  }}
                >
                  {deletingId === interview.candidate?._id ? "..." : "🗑 Delete"}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default WhatsAppSettings;
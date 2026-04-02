import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AddCandidate from "./pages/AddCandidate";
import ManageSlots from "./pages/ManageSlots";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import ServerLoader from "./components/ServerLoader";

function App() {
  return (
    <ServerLoader>
    <div className="bg-main">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-candidate" element={<AddCandidate />} />
          <Route path="/manage-slots" element={<ManageSlots />} />
          <Route path="/whatsapp" element={<WhatsAppSettings />} />
        </Routes>
      </div>
    </div>
    </ServerLoader>
  );
}

export default App;
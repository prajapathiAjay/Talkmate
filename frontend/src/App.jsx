import { useEffect } from "react";
import "./App.css";
import socket from "./Socket.jsx";
import RoutingSetup from "./components/RoutingSetup.jsx";
import { useAuth } from "./contexts/AuthContext.js";

function App() {
  const { userData } = useAuth();

  useEffect(() => {
    // The login token is attached in Socket.jsx
    if (userData && !socket.connected) {
      socket.connect();
    }

    if (!userData && socket.connected) {
      socket.disconnect();
    }
  }, [userData]);

  return <RoutingSetup />;
}

export default App;

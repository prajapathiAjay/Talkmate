import Login from "../pages/Login.jsx";
import Chat from "../pages/Chat.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import { Terms, Privacy } from "../pages/Legal.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "../contexts/AuthContext.js";

const RoutingSetup = () => {
  const { userData } = useAuth();
  const isLoggedIn = !!userData;

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        theme="light"
        closeButton
        toastOptions={{
          style: {
            zIndex: 999999999,
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn ? "/chat" : "/signIn"} replace />} />
        <Route path="/signIn" element={isLoggedIn ? <Navigate to="/chat" replace /> : <Login />} />
        <Route path="/chat" element={isLoggedIn ? <Chat /> : <Navigate to="/signIn" replace />} />
        {/* Open to everyone, signed in or not */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RoutingSetup;

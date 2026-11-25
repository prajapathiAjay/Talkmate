import Login from "../pages/Login.jsx";
import Chat from "../pages/Chat.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "../contexts/AuthProvider.jsx";

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RoutingSetup;

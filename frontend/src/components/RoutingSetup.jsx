import React from "react";
import Login from "../pages/Login.jsx";
import Chat from "../pages/Chat.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {Toaster} from "sonner";

const RoutingSetup = () => {
  return (
    <BrowserRouter>
      <Toaster
  position="top-left"
  richColors
  closeButton
  toastOptions={{
    style: {
      zIndex: 999999999,
    },
  }}
/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat/>} />
      </Routes>
    </BrowserRouter>
  );
};

export default RoutingSetup;

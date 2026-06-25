import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./contexts/AuthProvider.jsx";
import { RoomProvider } from "./contexts/RoomProvider.jsx";
console.log("MAIN JSX LOADED");
createRoot(document.getElementById("root")).render(
  // <StrictMode>
   
      <AuthProvider>
         <RoomProvider>
        <App />
        </RoomProvider>
      </AuthProvider>
   
  // </StrictMode>,
);

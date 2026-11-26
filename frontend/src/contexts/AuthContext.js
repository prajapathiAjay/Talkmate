import { createContext, useContext } from "react";

// Kept apart from AuthProvider.jsx so that file only exports a component
// (React fast refresh needs that to hot-reload it without a full page reload)
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

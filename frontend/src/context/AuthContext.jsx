import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(null);
const getUsers = () => { try { return JSON.parse(localStorage.getItem("dakroma_users") || "{}"); } catch { return {}; } };
const saveUsers = (u) => localStorage.setItem("dakroma_users", JSON.stringify(u));
const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem("dakroma_current") || "null"); } catch { return null; } };
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const s = getCurrentUser(); if (s) { setUser(s); setProfile(s); } setLoading(false); }, []);
  const register = async (email, password, username) => {
    const users = getUsers();
    if (users[email]) throw new Error("Email already registered");
    const avatar = "https://api.dicebear.com/7.x/cyberpunk/svg?seed=" + username;
    const u = { uid: "user_" + Date.now(), username, email, avatar, xp: 0, level: 1, joinedAt: new Date().toISOString() };
    users[email] = { ...u, password }; saveUsers(users);
    localStorage.setItem("dakroma_current", JSON.stringify(u));
    setUser(u); setProfile(u); return u;
  };
  const login = async (email, password) => {
    const users = getUsers(); const found = users[email];
    if (!found) throw new Error("No account found");
    if (found.password !== password) throw new Error("Wrong password");
    const { password: _, ...u } = found;
    localStorage.setItem("dakroma_current", JSON.stringify(u));
    setUser(u); setProfile(u); return u;
  };
  const loginWithGoogle = async () => {
    const u = { uid: "g_" + Date.now(), username: "GridPilot" + Math.floor(Math.random()*9999), email: "google@dakroma.app", avatar: "https://api.dicebear.com/7.x/cyberpunk/svg?seed=g" + Date.now(), xp: 0, level: 1, joinedAt: new Date().toISOString() };
    localStorage.setItem("dakroma_current", JSON.stringify(u)); setUser(u); setProfile(u); return u;
  };
  const logout = () => { localStorage.removeItem("dakroma_current"); setUser(null); setProfile(null); };
  const saveProfile = async (uid, data) => { const u = { ...profile, ...data }; localStorage.setItem("dakroma_current", JSON.stringify(u)); setProfile(u); };
  return <AuthContext.Provider value={{ user, profile, loading, register, login, loginWithGoogle, logout, saveProfile }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "dakroma_profile";
const USERS_KEY = "dakroma_users";

const loadProfile = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
};

const saveToStorage = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch {}
};

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
  catch { return {}; }
};

const saveUsers = (users) => {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  catch {}
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setUser(saved);
      setProfile(saved);
    }
    setLoading(false);
  }, []);

  const register = async (email, password, username) => {
    const users = getUsers();
    if (users[email]) throw new Error("Email already registered");
    const avatar = `https://api.dicebear.com/7.x/cyberpunk/svg?seed=${username}`;
    const id = Math.floor(10000 + Math.random() * 90000);
    const newUser = {
      uid: "user_" + Date.now(),
      memberId: "DK-" + id,
      username, email, avatar,
      xp: 0, level: 1, energy: 3,
      status: "online",
      joinedAt: new Date().toISOString(),
    };
    users[email] = { ...newUser, password };
    saveUsers(users);
    saveToStorage(newUser);
    setUser(newUser);
    setProfile(newUser);
    return newUser;
  };

  const login = async (email, password) => {
    const users = getUsers();
    const found = users[email];
    if (!found) throw new Error("No account found with this email");
    if (found.password !== password) throw new Error("Wrong password");
    const { password: _, ...userData } = found;
    saveToStorage(userData);
    setUser(userData);
    setProfile(userData);
    return userData;
  };

  const loginWithGoogle = async () => {
    const id = Math.floor(10000 + Math.random() * 90000);
    const userData = {
      uid: "g_" + Date.now(),
      memberId: "DK-" + id,
      username: "GridPilot" + Math.floor(Math.random() * 9999),
      email: "google@dakroma.app",
      avatar: `https://api.dicebear.com/7.x/cyberpunk/svg?seed=g${Date.now()}`,
      xp: 0, level: 1, energy: 3,
      status: "online",
      joinedAt: new Date().toISOString(),
    };
    saveToStorage(userData);
    setUser(userData);
    setProfile(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setProfile(null);
  };

  const saveProfile = async (uid, data) => {
    const updated = { ...profile, ...data };
    saveToStorage(updated);
    setProfile(updated);
    setUser(updated);
    // Also update in users store
    const users = getUsers();
    if (profile?.email && users[profile.email]) {
      users[profile.email] = { ...users[profile.email], ...data };
      saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, loginWithGoogle, logout, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

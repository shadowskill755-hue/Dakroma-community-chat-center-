// Temporary mock Firebase for testing
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb) => { cb(null); return () => {}; },
};

export const db = {};
export const storage = {};
export const googleProvider = null;
export default {};

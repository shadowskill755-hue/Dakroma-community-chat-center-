import { create } from "zustand";

const useChatStore = create((set, get) => ({
  messages:     {},
  onlineUsers:  [],
  typingUsers:  {},
  rooms:        [],
  activeRoom:   "global",
  systemMsgs:   [],

  setActiveRoom: (room) => set({ activeRoom: room }),

  addMessage: (msg) =>
    set((s) => {
      const room = msg.room || "global";
      const prev = s.messages[room] || [];
      return { messages: { ...s.messages, [room]: [...prev, msg].slice(-300) } };
    }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setTyping: (data) =>
    set((s) => {
      const room    = data.room || "global";
      const current = s.typingUsers[room] || [];
      const next    = data.typing
        ? [...current.filter((u) => u.uid !== data.uid), { uid: data.uid, username: data.username }]
        : current.filter((u) => u.uid !== data.uid);
      return { typingUsers: { ...s.typingUsers, [room]: next } };
    }),

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) =>
    set((s) => ({ rooms: [...s.rooms.filter((r) => r.id !== room.id), room] })),

  addSystemMsg: (msg) => {
    const id = Date.now();
    set((s) => ({ systemMsgs: [...s.systemMsgs.slice(-2), { ...msg, id }] }));
    // Auto remove after 3 seconds
    setTimeout(() => {
      set((s) => ({ systemMsgs: s.systemMsgs.filter((m) => m.id !== id) }));
    }, 3000);
  },

  applyReaction: ({ messageId, emoji, uid, room }) =>
    set((s) => {
      const r    = room || "global";
      const msgs = (s.messages[r] || []).map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        if (!reactions[emoji]) reactions[emoji] = [];
        if (reactions[emoji].includes(uid)) {
          reactions[emoji] = reactions[emoji].filter((u) => u !== uid);
        } else {
          reactions[emoji] = [...reactions[emoji], uid];
        }
        return { ...m, reactions };
      });
      return { messages: { ...s.messages, [r]: msgs } };
    }),
}));

export default useChatStore;

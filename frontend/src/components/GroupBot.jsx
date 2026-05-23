// ============================================================
// GroupBot - dk. command system
// ============================================================
import { notify } from "./NotificationSystem";
import { playSound } from "./SoundManager";

export const BOT_NAME = "DK-BOT";
export const BOT_PREFIX = "dk.";

export const processBotCommand = ({ text, sender, members, roomId, isAdmin, onKick, onMute, onUnmute, onPromote, onDeleteMsg, onMuteAll, onUnmuteAll, addBotMessage }) => {
  if (!text.startsWith(BOT_PREFIX)) return false;
  if (!isAdmin) {
    addBotMessage("⚠️ Only admins can use bot commands!", roomId);
    return true;
  }

  const parts = text.slice(BOT_PREFIX.length).trim().split(" ");
  const cmd = parts[0]?.toLowerCase();
  const targetId = parts[1];
  const extra = parts.slice(2).join(" ");

  const target = members?.find((m) => m.id === targetId || m.username === targetId);

  switch (cmd) {
    case "kick":
      if (!target) { addBotMessage(`⚠️ Member ${targetId} not found`, roomId); break; }
      onKick?.(target);
      addBotMessage(`💀 ${sender.username} kicked ${target.username} from the group`, roomId);
      playSound("error");
      break;

    case "mute":
      if (!target) { addBotMessage(`⚠️ Member ${targetId} not found`, roomId); break; }
      const duration = extra || "10min";
      onMute?.(target, duration);
      addBotMessage(`🔇 ${target.username} has been muted for ${duration} by ${sender.username}`, roomId);
      playSound("click");
      break;

    case "unmute":
      if (!target) { addBotMessage(`⚠️ Member ${targetId} not found`, roomId); break; }
      onUnmute?.(target);
      addBotMessage(`🔊 ${target.username} has been unmuted by ${sender.username}`, roomId);
      playSound("message");
      break;

    case "muteall":
      onMuteAll?.();
      addBotMessage(`🔇 ${sender.username} has muted ALL members for 1 hour. Only admin can send messages.`, roomId);
      playSound("notification");
      break;

    case "unmuteall":
      onUnmuteAll?.();
      addBotMessage(`🔊 ${sender.username} has unmuted ALL members. Chat is open again!`, roomId);
      playSound("message");
      break;

    case "status":
      if (!target) { addBotMessage(`⚠️ Member ${targetId} not found`, roomId); break; }
      addBotMessage(`👤 STATUS REPORT\nName: ${target.username}\nID: ${target.id}\nRank: ${target.rank || "Bronze"}\nXP: ${target.xp || 0}\nStatus: ${target.online ? "🟢 Online" : "🔴 Offline"}`, roomId);
      break;

    case "translate":
      if (!extra) { addBotMessage("⚠️ Usage: dk.translate [userId] [message]", roomId); break; }
      addBotMessage(`🌐 Translation requested for: "${extra}"\n(Connect translation API for live translations)`, roomId);
      break;

    case "callall":
      addBotMessage(`📢 ATTENTION! Admin ${sender.username} wants to share something important! Tap to join the group now! 🔴`, roomId);
      notify(`📢 ${sender.username} called all members!`, "warning", 5000);
      playSound("notification");
      break;

    case "prompt":
      if (!target) { addBotMessage(`⚠️ Member ${targetId} not found`, roomId); break; }
      addBotMessage(`🎖️ CONGRATULATIONS ${target.username}! You have been promoted to Admin by ${sender.username}! Welcome to the leadership!`, roomId);
      onPromote?.(target);
      playSound("levelup");
      break;

    case "live":
      addBotMessage(`🔴 ${sender.username} is about to go LIVE! All members tap to watch! 🔴`, roomId);
      notify(`🔴 ${sender.username} is LIVE!`, "rank", 5000);
      playSound("notification");
      break;

    case "tournament":
      addBotMessage(`🏆 ${sender.username} is hosting a TOURNAMENT! Participants will be announced soon! Get ready pilots! ⚡`, roomId);
      playSound("levelup");
      break;

    case "myprofile":
      addBotMessage(`👤 ADMIN PROFILE\nName: ${sender.username}\nRank: ${sender.rank || "Grand Master"}\nXP: ${sender.xp || 0}\nStatus: 🟢 Online`, roomId);
      break;

    case "delete":
      addBotMessage(`🗑️ Message deletion requested by ${sender.username}`, roomId);
      break;

    default:
      addBotMessage(`⚠️ Unknown command: dk.${cmd}\n\nAvailable commands:\ndk.kick [id]\ndk.mute [id] [time]\ndk.unmute [id]\ndk.muteall\ndk.unmuteall\ndk.status [id]\ndk.callall\ndk.prompt [id]\ndk.live\ndk.tournament\ndk.myprofile\ndk.translate [id] [msg]`, roomId);
  }

  return true;
};

export const BotMessage = ({ text }) => (
  <div className="flex items-start gap-2 my-2">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center text-xs font-cyber flex-shrink-0">
      🤖
    </div>
    <div className="glass rounded-xl px-3 py-2 border border-purple-500/30 max-w-[80%]">
      <p className="text-xs font-cyber text-purple-400 mb-1">DK-BOT</p>
      <p className="text-sm text-cyber-text whitespace-pre-wrap">{text}</p>
    </div>
  </div>
);

export default { processBotCommand, BotMessage };

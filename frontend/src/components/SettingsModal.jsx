import { useState, useEffect } from "react";
import { X, Bell, BellOff, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext.js";
import CustomApiService from "../services/CustomApiService";
import { saveToken, isRemembered } from "../utils/session.js";
import { nameProblem, passwordProblem } from "../utils/validation.js";
import { avatarGradient } from "../utils/avatarColor.js";

const Section = ({ title, children }) => (
  <section className="pt-5 first:pt-0">
    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">{title}</h3>
    {children}
  </section>
);

const ErrorText = ({ children }) =>
  children ? <p className="mt-1.5 text-xs text-red-600">{children}</p> : null;

// Mute the open chat
const MuteSetting = () => {
  const { chatRoomId, roomType, currentPartner, isMuted, setRoomMuted } = useAuth();
  const [saving, setSaving] = useState(false);
  const muted = isMuted(chatRoomId);
  const chatName = roomType === "public" ? "Public Room" : currentPartner?.name || "this chat";

  const toggle = async () => {
    setSaving(true);
    try {
      await setRoomMuted(chatRoomId, !muted);
      toast.success(muted ? `${chatName} unmuted` : `${chatName} muted`);
    } catch (err) {
      toast.error(err.message || "Couldn't change notifications for this chat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={muted}
      onClick={toggle}
      disabled={saving || !chatRoomId}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/70 hover:bg-white/70 text-left transition-colors"
    >
      <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${muted ? "bg-gray-200 text-gray-600" : "bg-violet-100 text-violet-600"}`}>
        {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-gray-800 truncate">Mute {chatName}</span>
        <span className="block text-xs text-gray-500">
          {muted ? "No unread badges from this chat" : "You'll see unread badges for new messages"}
        </span>
      </span>
      {/* Switch */}
      <span className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${muted ? "bg-violet-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${muted ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
};

const NameSetting = () => {
  const { PATCH } = CustomApiService();
  const { userData, updateUserName } = useAuth();
  const currentName = userData?.user?.name || "";
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const unchanged = name.trim() === currentName;

  const onSubmit = async (e) => {
    e.preventDefault();
    const problem = nameProblem(name);
    if (problem) return setError(problem);

    setSaving(true);
    setError("");
    try {
      const response = await PATCH("user/profile", {}, {}, { name: name.trim() });
      updateUserName(response.data.name);
      setName(response.data.name);
      toast.success("Name updated");
    } catch (err) {
      setError(err.message || "Couldn't update your name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="flex-1 min-w-0 px-3 py-2.5 text-base sm:text-sm field rounded-xl"
          placeholder="Your name"
        />
        <button
          type="submit"
          disabled={saving || unchanged}
          className="shrink-0 px-4 text-sm font-semibold rounded-xl btn-primary disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
      <p className="mt-1.5 text-xs text-gray-500">Messages you've already sent keep your old name.</p>
    </form>
  );
};

const PasswordSetting = () => {
  const { PATCH } = CustomApiService();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const problem =
      (!form.current && "Enter your current password") ||
      passwordProblem(form.next) ||
      (form.next !== form.confirm && "New passwords must match") ||
      null;
    if (problem) return setError(problem);

    setSaving(true);
    setError("");
    try {
      const response = await PATCH(
        "user/password",
        {},
        {},
        { currentPassword: form.current, newPassword: form.next, rememberMe: isRemembered() },
      );
      // Old logins (other devices) stop working; this device continues with the new one
      saveToken(response.token);
      setForm({ current: "", next: "", confirm: "" });
      toast.success(response.message || "Password changed");
    } catch (err) {
      setError(err.message || "Couldn't change your password");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 text-base sm:text-sm field rounded-xl";
  const type = show ? "text" : "password";

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="relative">
        <input
          type={type}
          value={form.current}
          onChange={update("current")}
          autoComplete="current-password"
          className={`${inputClass} pr-10`}
          placeholder="Current password"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          title={show ? "Hide passwords" : "Show passwords"}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <input type={type} value={form.next} onChange={update("next")} autoComplete="new-password" className={inputClass} placeholder="New password" />
      <input type={type} value={form.confirm} onChange={update("confirm")} autoComplete="new-password" className={inputClass} placeholder="Confirm new password" />
      <ErrorText>{error}</ErrorText>
      <p className="text-xs text-gray-500">
        At least 8 characters, with an uppercase letter, a lowercase letter and a number. Changing it
        signs you out on your other devices.
      </p>
      <button
        type="submit"
        disabled={saving || !form.current || !form.next}
        className="w-full py-2.5 text-sm font-semibold rounded-xl btn-primary disabled:opacity-50"
      >
        {saving ? "Saving..." : "Change password"}
      </button>
    </form>
  );
};

const SettingsModal = ({ onClose }) => {
  const { userData } = useAuth();
  const { name, email } = userData?.user || {};

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="w-full sm:max-w-md max-h-[90dvh] flex flex-col surface-raised rounded-t-3xl sm:rounded-3xl shadow-2xl animate-[pop_0.15s_ease-out]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            title="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] divide-y divide-gray-200/60">
          {/* Signed in as */}
          <div className="flex items-center gap-3 pb-5">
            <div className={`w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-lg font-bold`}>
              {name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="font-semibold text-gray-900 truncate">{name}</p>
              {email && <p className="text-sm text-gray-500 truncate">{email}</p>}
            </div>
          </div>

          <Section title="This chat">
            <MuteSetting />
          </Section>
          <Section title="Display name">
            <NameSetting />
          </Section>
          <Section title="Password">
            <PasswordSetting />
          </Section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

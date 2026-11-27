import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo/jubjub-logo.svg";
import { toast } from "sonner";
import CustomApiService from "../services/CustomApiService";
import { passwordProblem } from "../utils/validation.js";

// Opened from the link in the "reset your password" email: /reset-password?token=...
const ResetPassword = () => {
  const { POST } = CustomApiService();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const problem = passwordProblem(password) || (password !== confirm ? "Passwords must match" : null);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await POST("user/reset-password", {}, {}, { token, password });
      toast.success(response.message || "Password reset. Please sign in.");
      navigate("/signIn", { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't reset your password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-dvh w-screen overflow-y-auto app-bg text-gray-900 flex p-4">
      <div className="w-full max-w-md m-auto">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <img src={logo} alt="" className="w-[52px] h-[52px] rounded-[12px] shadow-lg shadow-violet-500/30" />
          <h1 className="text-2xl font-extrabold tracking-tight">JubJub</h1>
        </div>

        <div className="surface rounded-3xl p-6 lg:p-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Choose a new password</h2>

          {!token ? (
            <p className="text-sm text-gray-600">
              This reset link is incomplete. Open the link from your email again, or{" "}
              <Link to="/signIn" className="text-violet-600 font-medium hover:underline">
                request a new one
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-gray-500 text-sm">
                At least 8 characters, with an uppercase letter, a lowercase letter and a number.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="new-password"
                  className="w-full pl-9 pr-10 py-2.5 text-base sm:text-sm field rounded-xl"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm field rounded-xl"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 text-sm font-semibold rounded-xl btn-primary"
              >
                {saving ? "Saving..." : "Reset password"}
              </button>

              <p className="text-center text-xs text-gray-500">
                <Link to="/signIn" className="text-violet-600 font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

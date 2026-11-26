import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import { Mail, Lock, User, Eye, EyeOff, MessageSquare } from "lucide-react";
import CustomApiServices from "../services/CustomApiService";
import { toast } from "sonner";
import loginImage from "../assets/image/login.webp";

const Login = () => {
  const { login } = useAuth();
  const { POST } = CustomApiServices();
  const navigate = useNavigate();
  const [type, setType] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const schema = useMemo(() => {
    const baseSchema = {
      email: yup
        .string()
        .email("Please enter a valid email address")
        .required("Email address is required"),
      password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/[a-z]/, "Must contain at least one lowercase letter")
        .matches(/\d/, "Must contain at least one number")
        .required("Password is required"),
    };

    if (type === "signup") {
      return yup.object().shape({
        name: yup
          .string()
          .min(2, "Name must be at least 2 characters")
          .max(50, "Name cannot exceed 50 characters")
          .required("Full name is required"),
        ...baseSchema,
        confirmPassword: yup
          .string()
          .oneOf([yup.ref("password"), null], "Passwords must match")
          .required("Please confirm your password"),
      });
    }

    return yup.object().shape(baseSchema);
  }, [type]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const endpoint = type === "login" ? "user/signIn" : "user/signUp";
      const payload =
        type === "login"
          ? { email: data.email, password: data.password }
          : {
              name: data.name,
              email: data.email,
              password: data.password,
            };

      const response = await POST(endpoint, {}, {}, payload);
      if (response.success) {
        localStorage.setItem("token", response.token);
        login(response.data);
        navigate("/chat");
        toast.success(
          response.message ||
            (type === "login" ? "Logged in successfully!" : "Account created successfully!")
        );
      }
    } catch (error) {
      console.error("Authentication Error:", error);
      setError(
        error.response?.data?.message ||
        error.message ||
        "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh w-screen overflow-hidden app-bg text-gray-900">
      <div className="h-full w-full flex flex-col lg:flex-row">
        {/* Left Panel - Full Height Image */}
        <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden">
          <img
            src={loginImage}
            alt="Login Illustration"
            // Lazy images inside a hidden panel aren't downloaded, so phones skip it
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {/* caption over the image */}
          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14 bg-linear-to-t from-black/80 via-black/40 to-transparent">
            <p className="text-3xl xl:text-4xl font-extrabold leading-tight text-white tracking-tight">
              Conversations that <span className="text-blue-400">feel alive.</span>
            </p>
            <p className="mt-3 text-sm text-gray-200 max-w-sm">
              Real-time chat with friends - typing indicators, photos and unread badges on every screen.
            </p>
          </div>
        </div>

        {/* Right Panel - Full Height Form */}
        <div className="lg:w-1/2 h-full overflow-y-auto flex p-4 lg:p-6 xl:p-8">
          <div className="w-full max-w-md m-auto flex flex-col justify-center py-8">
            {/* Brand header */}
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8 lg:px-8">
              <div className="p-3 brand-bg rounded-2xl shadow-lg shadow-violet-500/30">
                <MessageSquare size={28} className="text-white" />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">JubJub</h1>
                <p className="text-gray-500 text-xs">Where friends jub jub</p>
              </div>
            </div>

            <div className="surface rounded-3xl p-6 lg:p-8">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                  {type === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {type === "login"
                    ? "Sign in to pick up where you left off"
                    : "Join JubJub and start chatting with friends"}
                </p>
              </div>

              {/* Authentication Tabs */}
              <div className="flex mb-6 bg-white/40 border border-white/60 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    setType("login");
                    reset();
                    setError("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    type === "login"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("signup");
                    reset();
                    setError("");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    type === "signup"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {type === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        {...register("name")}
                        className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm field rounded-xl"
                        placeholder="John Smith"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Mail className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm field rounded-xl"
                      placeholder="Enter your Email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full pl-9 pr-10 py-2.5 text-base sm:text-sm field rounded-xl"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {type === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="password"
                        {...register("confirmPassword")}
                        className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm field rounded-xl"
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                )}

                {type === "signup" && (
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      {...register("acceptTerms")}
                      className="mt-0.5 h-3.5 w-3.5 accent-blue-600 rounded"
                    />
                    <label className="text-xs text-gray-500">
                      I agree to the{" "}
                      <a href="#" className="text-violet-600 hover:text-violet-600 font-medium">
                        Terms
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-violet-600 hover:text-violet-600 font-medium">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                )}

                {type === "login" && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-3.5 w-3.5 accent-blue-600 rounded"
                      />
                      <label htmlFor="remember" className="ml-1.5 text-xs text-gray-500">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="text-xs text-violet-600 hover:text-violet-600 font-medium">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm font-semibold rounded-xl btn-primary"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {type === "login" ? "Signing In..." : "Creating Account..."}
                    </div>
                  ) : (
                    type === "login" ? "Sign In" : "Create Account"
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-4 border-t border-white/60">
                <p className="text-center text-xs text-gray-500">
                  {type === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setType("signup")}
                        className="text-violet-600 hover:text-violet-600 font-medium"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setType("login")}
                        className="text-violet-600 hover:text-violet-600 font-medium"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

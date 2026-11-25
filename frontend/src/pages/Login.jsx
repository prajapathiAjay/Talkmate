import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { Mail, Lock, User, Eye, EyeOff, MessageSquare } from "lucide-react";
import CustomApiServices from "../services/CustomApiService";
import { toast } from "sonner";
import loginImage from "../assets/image/login.png";

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
    <div className="h-screen w-screen overflow-hidden ">
      <div className="h-full w-full flex flex-col lg:flex-row">
        {/* Left Panel - Full Height Image */}
        <div className="hidden lg:block lg:w-1/2 h-full relative overflow-hidden">
          <img
            src={loginImage}
            alt="Login Illustration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0  flex items-center justify-center" />
        </div>

        {/* Right Panel - Full Height Form */}
        <div className="lg:w-1/2 h-full flex items-center justify-center p-4 lg:p-6 xl:p-8 bg-white">
          <div className="w-full max-w-md h-full flex flex-col justify-center py-8">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="p-3 bg-linear-to-br from-blue-500 to-cyan-400 rounded-xl shadow">
                <MessageSquare size={28} className="text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">TalkMate</h1>
                <p className="text-slate-600 text-xs">Professional Communication</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 lg:p-8">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {type === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-slate-600 text-sm">
                  {type === "login"
                    ? "Sign in to your professional workspace"
                    : "Start your team collaboration journey"}
                </p>
              </div>

              {/* Authentication Tabs */}
              <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setType("login");
                    reset();
                    setError("");
                  }}
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    type === "login"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
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
                  className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    type === "signup"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {type === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        {...register("name")}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        {...register("confirmPassword")}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-0.5 h-3.5 w-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-xs text-slate-600">
                      I agree to the{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Terms
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
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
                        className="h-3.5 w-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="remember" className="ml-1.5 text-xs text-slate-600">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 text-sm font-semibold rounded-lg transition-all ${
                    loading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow hover:shadow-md active:scale-[0.98]"
                  }`}
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
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-center text-xs text-slate-500">
                  {type === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setType("signup")}
                        className="text-blue-600 hover:text-blue-700 font-medium"
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
                        className="text-blue-600 hover:text-blue-700 font-medium"
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

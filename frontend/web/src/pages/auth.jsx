import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../state/UserContext";
import { authService } from "../services/authService";
import { FiArrowRight, FiUser, FiLock } from "react-icons/fi";
import OnboardingWizard from "./OnboardingWizard";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();

  const initialMode = location.pathname.toLowerCase().includes("register")
    ? "register"
    : "login";

  const [mode, setMode] = useState(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isLogin = mode === "login";

  const handleModeChange = (m) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!identifier.trim() || !password) {
      setError("Please enter username/email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(identifier.trim(), password);
      // Store token if present
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }
      const me = await authService.getMe();
      setUser(me);

      const from = location.state?.from?.pathname || "/home";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const responseData = err?.response?.data;
      let msg = "Network or backend error.";

      if (!err.response) {
        msg = "Unable to connect to the server. Please ensure the backend is running.";
      } else if (responseData) {
        if (responseData.code === 'EMAIL_NOT_VERIFIED') {
          msg = responseData.message || "Your email is not verified. Please check your inbox.";
        } else {
          msg = responseData.message || "Login failed. Please check your credentials.";
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-surface-900 dark:text-surface-100 overflow-hidden">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-surface-900 items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-80" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        {/* Animated Blobs */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"
        />

        <div className="relative z-10 p-12 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-dark p-10 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <img src="/ilai-logo.svg" alt="Ilai Logo" className="w-24 h-24 drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-display font-bold text-white mb-4 leading-tight tracking-tight">
              Ilai
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed font-light">
              Interactive Learning & AI. <br />
              <span className="text-indigo-400 font-medium">Empower your mind.</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 bg-surface-50 dark:bg-background -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Toggle (Only show if in Login mode or if user wants to switch back) */}
          <div className="flex p-1 bg-surface-100 dark:bg-surface-800 rounded-xl mx-auto max-w-[240px] mb-8">
            <button
              onClick={() => handleModeChange("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? "bg-white dark:bg-surface-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                }`}
            >
              Login
            </button>
            <button
              onClick={() => handleModeChange("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? "bg-white dark:bg-surface-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                }`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-surface-500 dark:text-surface-400">
                    Enter your details to access your workspace.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <a
                    href="http://localhost:8081/oauth2/authorization/google"
                    className="flex items-center justify-center w-full py-3 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-surface-700 dark:text-surface-200 font-medium"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
                    Sign in with Google
                  </a>
                  <a
                    href="http://localhost:8081/oauth2/authorization/microsoft-entra-id"
                    className="flex items-center justify-center w-full py-3 px-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors text-surface-700 dark:text-surface-200 font-medium"
                  >
                    <img src="https://www.svgrepo.com/show/452062/microsoft.svg" alt="Microsoft" className="w-5 h-5 mr-3" />
                    Sign in with Microsoft
                  </a>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200 dark:border-surface-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface-50 dark:bg-background text-surface-500">Or continue with</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 text-sm border border-red-100 dark:border-red-800">
                      {error}
                    </div>
                  )}
                  {info && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-200 text-sm border border-emerald-100 dark:border-emerald-800">
                      {info}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                        <FiUser />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Username or Email"
                        className="block w-full pl-10 pr-3 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800/50 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                        <FiLock />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="block w-full pl-10 pr-3 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800/50 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium text-base"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        Sign In
                        <FiArrowRight className="ml-2" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <OnboardingWizard onLoginClick={() => setMode('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
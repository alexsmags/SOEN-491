import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/Auth/AuthLayout";
import SocialButtons from "../components/Auth/SocialButtons";
import axios from "axios";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL ?? "http://localhost:5173";

const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email || !pw) {
      setErr("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // 1) Get CSRF token from your Auth.js server
      const { data: csrf } = await api.get("/auth/csrf");

      // 2) Auth.js credentials (JSON mode, no auto-redirect)
      const form = new URLSearchParams();
      form.set("csrfToken", csrf.csrfToken);
      form.set("email", email.trim().toLowerCase());
      form.set("password", pw);
      form.set("callbackUrl", `${CLIENT_URL}/`);
      form.set("redirect", "false");

      const resp = await api.post("/auth/callback/credentials?json=true", form, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        validateStatus: () => true,
        maxRedirects: 0,
      });

      const ok = resp.status < 400 && resp.data?.ok === true && !resp.data?.error;

      if (!ok) {
        // Friendly mapping for common Auth.js errors
        const code = resp.data?.error || "CredentialsSignin";
        if (code === "CredentialsSignin") {
          setErr("Invalid email or password. Please try again.");
        } else if (code === "CallbackRouteError") {
          setErr("Sign-in could not be completed. Please try again.");
        } else {
          setErr("Sign-in failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      window.location.assign(`${CLIENT_URL}/`);
    } catch (e: any) {
      try {
        const me = await api.get("/api/me");
        if (me.status === 200 && me.data?.user) {
          window.location.assign(`${CLIENT_URL}/`);
          return;
        }
      } catch {
      }

      setErr(e?.message ?? "Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  async function onOAuth(provider: "google" | "github" | "twitter" | "linkedin") {
    setErr(null);
    setLoading(true);
    try {
      const url = new URL(`/auth/signin/${provider}`, SERVER_URL);
      url.searchParams.set("callbackUrl", `${CLIENT_URL}/`);
      window.location.href = url.toString(); 
    } catch (e: any) {
      setErr(e?.message ?? `Could not continue with ${provider}.`);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to generate, edit, and manage AI-powered captions."
    >
      {/* Error banner */}
      {err && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onEmailLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm text-white/80">Email</label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20 disabled:opacity-60"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-white/80">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
              disabled={loading}
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 pr-12 text-sm md:text-base outline-none focus:border-white/20 disabled:opacity-60"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="accent-[#364881]" disabled={loading} />
            <span className="text-white/80">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-[#8ea2ff] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 md:h-12 rounded-xl border border-white/15 shadow-sm transition duration-200 ease-in-out disabled:opacity-60
                     hover:bg-[#4459a0] hover:shadow-md hover:border-white/25"
          style={{ backgroundColor: "#364881" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <hr className="border-white/10" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#0C0F14] px-2 text-xs text-white/50">
            or
          </span>
        </div>
        <div className="mt-4">
          <SocialButtons onOAuth={onOAuth} />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-white/70">
        New to CaptoPic?{" "}
        <Link to="/signup" className="text-[#8ea2ff] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

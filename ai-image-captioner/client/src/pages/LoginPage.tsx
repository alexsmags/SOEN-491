import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/Auth/AuthLayout";
import SocialButtons from "../components/Auth/SocialButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || "/upload";

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (!email || !pw) throw new Error("Please enter your email and password.");
      await new Promise((r) => setTimeout(r, 800));
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      setErr(e.message ?? "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onOAuth(provider: "google" | "github" | "twitter" | "linkedin") {
    setErr(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      setErr(e.message ?? `Could not continue with ${provider}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to generate, edit, and manage AI-powered captions."
    >
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
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20"
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
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 pr-12 text-sm md:text-base outline-none focus:border-white/20"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {err && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">
            {err}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="accent-[#364881]" />
            <span className="text-white/80">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-[#8ea2ff] hover:underline">Forgot password?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 md:h-12 rounded-xl border border-white/15 shadow-sm disabled:opacity-60"
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

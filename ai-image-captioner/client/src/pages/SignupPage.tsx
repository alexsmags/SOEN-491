import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import AuthLayout from "../components/Auth/AuthLayout";
import SocialButtons from "../components/Auth/SocialButtons";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  const navigate = useNavigate();

  async function onEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!agree) return setErr("Please accept the Terms and Privacy Policy.");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      navigate("/upload", { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-up failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onOAuth(provider: "google" | "github" | "twitter" | "linkedin") {
    setErr(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      navigate("/upload", { replace: true });
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : `Could not continue with ${provider}.`;
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join CaptoPic and unleash perfect AI-powered captions."
    >
      <form onSubmit={onEmailSignup} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm text-white/80">Name</label>
          <div className="relative">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20"
              placeholder="Your name"
              autoComplete="name"
            />
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
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

        <div className="space-y-1.5">
          <label htmlFor="password2" className="text-sm text-white/80">Confirm Password</label>
          <div className="relative">
            <input
              id="password2"
              type={showPw ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20"
              placeholder="Repeat password"
              autoComplete="new-password"
              minLength={8}
            />
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        {err && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">
            {err}
          </p>
        )}

        <label className="mt-2 inline-flex items-center gap-2 text-xs text-white/80 cursor-pointer">
          <input
            type="checkbox"
            className="accent-[#364881]"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          I agree to the{" "}
          <Link to="/terms" className="text-[#8ea2ff] hover:underline">Terms</Link> and{" "}
          <Link to="/privacy" className="text-[#8ea2ff] hover:underline">Privacy Policy</Link>.
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 md:h-12 rounded-xl border border-white/15 shadow-sm disabled:opacity-60"
          style={{ backgroundColor: "#364881" }}
        >
          {loading ? "Creating account…" : "Create account"}
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
        Already have an account?{" "}
        <Link to="/login" className="text-[#8ea2ff] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

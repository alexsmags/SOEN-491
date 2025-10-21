import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle2 } from "lucide-react";
import AuthLayout from "../components/Auth/AuthLayout";
import SocialButtons from "../components/Auth/SocialButtons";
import axios from "axios";

type Provider = "google" | "github" | "twitter" | "linkedin";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL ?? "http://localhost:5173";

const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  async function onEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!agree) return setErr("Please accept the Terms and Privacy Policy.");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      await api.post("/api/signup", {
        name: name.trim(),
        email: cleanEmail,
        password: pw,
      });

      const { data: csrf } = await api.get("/auth/csrf");

      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = `${SERVER_URL}/auth/callback/credentials`;
      formEl.style.display = "none";

      const add = (k: string, v: string) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        formEl.appendChild(input);
      };

      add("csrfToken", csrf.csrfToken);
      add("email", cleanEmail);
      add("password", pw);
      add("callbackUrl", `${CLIENT_URL}/`);

      document.body.appendChild(formEl);
      setOk("Account created! Signing you in…");
      formEl.submit();
    } catch (e: any) {
      const code = e?.response?.data?.error;
      if (code === "email_in_use") setErr("That email is already registered. Try signing in instead.");
      else if (code === "invalid_input") setErr("Please check your details and try again.");
      else setErr(e?.message ?? "Sign-up failed. Please try again.");
      setLoading(false);
    }
  }

  function onOAuth(provider: Provider) {
    setErr(null);
    setOk(null);
    setLoading(true);
    const url = new URL(`/auth/signin/${provider}`, SERVER_URL);
    url.searchParams.set("callbackUrl", `${CLIENT_URL}/upload`);
    window.location.href = url.toString();
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join CaptoPic and unleash perfect AI-powered captions.">
      {ok && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300 text-sm">
          <CheckCircle2 size={16} />
          <span>{ok}</span>
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
          {err}
        </div>
      )}

      <form onSubmit={onEmailSignup} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm text-white/80">Name</label>
          <div className="relative">
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading}
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20 disabled:opacity-60"
              placeholder="Your name" autoComplete="name" />
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm text-white/80">Email</label>
          <div className="relative">
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20 disabled:opacity-60"
              placeholder="you@example.com" autoComplete="email" />
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-white/80">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required disabled={loading}
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 pr-12 text-sm md:text-base outline-none focus:border-white/20 disabled:opacity-60"
              placeholder="At least 8 characters" autoComplete="new-password" minLength={8} />
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} disabled={loading}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password2" className="text-sm text-white/80">Confirm Password</label>
          <div className="relative">
            <input id="password2" type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} required disabled={loading}
              className="w-full h-11 md:h-12 rounded-xl bg-white/5 border border-white/10 px-11 text-sm md:text-base outline-none focus:border-white/20 disabled:opacity-60"
              placeholder="Repeat password" autoComplete="new-password" minLength={8} />
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        <label className="mt-2 inline-flex items-center gap-2 text-xs text-white/80 cursor-pointer">
          <input type="checkbox" className="accent-[#364881]" checked={agree} onChange={(e) => setAgree(e.target.checked)} disabled={loading} />
          I agree to the{" "}
          <Link to="/terms" className="text-[#8ea2ff] hover:underline">Terms</Link> and{" "}
          <Link to="/privacy" className="text-[#8ea2ff] hover:underline">Privacy Policy</Link>.
        </label>

        <button type="submit" disabled={loading} className="w-full h-11 md:h-12 rounded-xl border border-white/15 shadow-sm disabled:opacity-60"
          style={{ backgroundColor: "#364881" }}>
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
        <Link to="/login" className="text-[#8ea2ff] hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
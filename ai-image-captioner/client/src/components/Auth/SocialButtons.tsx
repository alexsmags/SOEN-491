import { FaGoogle, FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

type Provider = "google" | "github" | "twitter" | "linkedin";
type Props = {
  onOAuth: (provider: Provider) => void;
  label?: string;
};

const base =
  "w-full inline-flex items-center justify-center gap-2 h-11 md:h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm md:text-base";

export default function SocialButtons({ onOAuth, label = "Continue with" }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button className={base} onClick={() => onOAuth("google")} aria-label="Continue with Google">
        <FaGoogle /> {label} Google
      </button>
      <button className={base} onClick={() => onOAuth("github")} aria-label="Continue with GitHub">
        <FaGithub /> {label} GitHub
      </button>
      <button className={base} onClick={() => onOAuth("twitter")} aria-label="Continue with X/Twitter">
        <FaTwitter /> {label} Twitter
      </button>
      <button className={base} onClick={() => onOAuth("linkedin")} aria-label="Continue with LinkedIn">
        <FaLinkedin /> {label} LinkedIn
      </button>
    </div>
  );
}

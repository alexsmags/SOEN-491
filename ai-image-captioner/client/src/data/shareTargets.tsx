import {
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaRedditAlien,
  FaTelegramPlane,
  FaEnvelope,
  FaWhatsapp,
} from "react-icons/fa";

export type SharePayload = {
  url: string;
  text?: string;
  hashtags?: string[];
  image?: string;
};

export type ShareTarget = {
  id:
    | "system"
    | "twitter"
    | "facebook"
    | "linkedin"
    | "reddit"
    | "telegram"
    | "whatsapp"
    | "email";
  label: string;
  Icon: React.ComponentType;
  bg: string;
  fg: string; 
};

export const SHARE_TARGETS: ShareTarget[] = [
  { id: "system",  label: "System",   Icon: FaShareIcon,   bg: "#3A3D45", fg: "#FFFFFF" },
  { id: "twitter", label: "X",        Icon: FaTwitter,    bg: "#000000", fg: "#FFFFFF" },
  { id: "facebook",label: "Facebook", Icon: FaFacebookF,   bg: "#1877F2", fg: "#FFFFFF" },
  { id: "linkedin",label: "LinkedIn", Icon: FaLinkedinIn,  bg: "#0A66C2", fg: "#FFFFFF" },
  { id: "telegram",label: "Telegram", Icon: FaTelegramPlane,bg: "#229ED9", fg: "#FFFFFF" },
  { id: "whatsapp",label: "WhatsApp", Icon: FaWhatsapp,    bg: "#25D366", fg: "#0B1C10" },
  { id: "email",   label: "Email",    Icon: FaEnvelope,    bg: "#6C7A91", fg: "#FFFFFF" },
  { id: "reddit",  label: "Reddit",   Icon: FaRedditAlien, bg: "#FF4500", fg: "#1A1A1A" },
];

function FaShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className="opacity-95">
      <path
        fill="currentColor"
        d="M18 16a3 3 0 0 0-2.356 1.154L8.91 13.91a3.1 3.1 0 0 0 0-3.82l6.734-3.245A3 3 0 1 0 15 5a3 3 0 0 0 .09.722L8.356 8.967a3 3 0 1 0 0 6.066l6.734 3.245A3 3 0 1 0 18 16Z"
      />
    </svg>
  );
}

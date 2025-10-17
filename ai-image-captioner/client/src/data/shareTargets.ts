import ShareSVG from "../icons/ShareSVG";
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
  { id: "system",  label: "System",   Icon: ShareSVG,       bg: "#3A3D45", fg: "#FFFFFF" },
  { id: "twitter", label: "X",        Icon: FaTwitter,      bg: "#000000", fg: "#FFFFFF" },
  { id: "facebook",label: "Facebook", Icon: FaFacebookF,    bg: "#1877F2", fg: "#FFFFFF" },
  { id: "linkedin",label: "LinkedIn", Icon: FaLinkedinIn,   bg: "#0A66C2", fg: "#FFFFFF" },
  { id: "telegram",label: "Telegram", Icon: FaTelegramPlane,bg: "#229ED9", fg: "#FFFFFF" },
  { id: "whatsapp",label: "WhatsApp", Icon: FaWhatsapp,     bg: "#25D366", fg: "#0B1C10" },
  { id: "email",   label: "Email",    Icon: FaEnvelope,     bg: "#6C7A91", fg: "#FFFFFF" },
  { id: "reddit",  label: "Reddit",   Icon: FaRedditAlien,  bg: "#FF4500", fg: "#1A1A1A" },
];

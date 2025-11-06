import ShareSVG from "../icons/ShareSVG";

export type SharePayload = {
  url: string;
  text?: string;
  hashtags?: string[];
  image?: string;
  imageUrl?: string | null;
};

export type ShareTarget = {
  id:
    | "system"
  label: string;
  Icon: React.ComponentType;
  bg: string;
  fg: string;
};

export const SHARE_TARGETS: ShareTarget[] = [
  { id: "system",  label: "System Share", Icon: ShareSVG,        bg: "#3A3D45", fg: "#FFFFFF" }
];

export type MediaItem = {
  id: string;
  imageUrl: string;
  caption?: string | null;
  createdAt?: string;

  fontFamily?: string | null;
  fontSize?: number | null;
  textColor?: string | null;
  align?: "left" | "center" | "right" | string | null;
  showBg?: boolean | null;
  bgColor?: string | null;
  bgOpacity?: number | null;
  posX?: number | null;
  posY?: number | null;
};

import type { } from "react"; // keeps TS happy with verbatimModuleSyntax

// Reusable item type for the workspace
export type WorkspaceItem = {
  id: string;
  title: string;     // the pill/tag
  date: string;      // ISO or label
  imageUrl: string;
  caption: string;
};

// Demo data (replace with your real data)
export const ITEMS: WorkspaceItem[] = [
  {
    id: "1",
    title: "Serene",
    date: "2024-03-10",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
    caption:
      "A tranquil walk through nature’s embrace. Perfect for a mindful post.",
  },
  {
    id: "2",
    title: "Dynamic",
    date: "2024-03-12",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
    caption:
      "City lights, endless possibilities. The urban jungle energy.",
  },
  {
    id: "3",
    title: "Cozy",
    date: "2024-03-15",
    imageUrl:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1200&auto=format&fit=crop",
    caption:
      "Morning rituals and artistic sips. Fueling creativity one cup at a time.",
  },
  {
    id: "4",
    title: "Aspirational",
    date: "2024-03-18",
    imageUrl:
      "https://images.unsplash.com/photo-1445307806294-bff7f67ff225?q=80&w=1200&auto=format&fit=crop",
    caption:
      "Beyond the peaks, a world of wonder. #AdventureAwaits",
  },
  {
    id: "5",
    title: "Intellectual",
    date: "2024-03-20",
    imageUrl:
      "https://images.unsplash.com/photo-1445307806294-bff7f67ff225?q=80&w=1200&auto=format&fit=crop",
    caption:
      "Lost in the pages of timeless stories. Learning and growing.",
  },
  {
    id: "6",
    title: "Romantic",
    date: "2024-03-22",
    imageUrl:
      "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?q=80&w=1200&auto=format&fit=crop",
    caption:
      "Where the sky kisses the sea. A perfect end to a beautiful day.",
  },
  {
    id: "7",
    title: "Inviting",
    date: "2024-03-25",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    caption:
      "Sweet moments and delightful treats. Indulge your senses with me.",
  },
  {
    id: "8",
    title: "Artistic",
    date: "2024-03-28",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    caption:
      "Unleashing the inner artist. Every brushstroke tells a story.",
  },
];

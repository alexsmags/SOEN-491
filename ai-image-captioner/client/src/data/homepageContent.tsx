import { Zap, Palette, MoveUpRight, Share2, Boxes, Images } from "lucide-react";
import type { ReactNode } from "react";

export interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  avatarSrc?: string;
}

export const FEATURES: Feature[] = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Caption Generation",
    desc: "Leverage advanced AI to create compelling captions in moments, saving you valuable time and effort.",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Customizable Tone & Style",
    desc: "Tailor captions to match your brand voice, choosing from casual, formal, humorous, or professional tones.",
  },
  {
    icon: <MoveUpRight className="w-6 h-6" />,
    title: "Live Editor & Placement",
    desc: "Refine and style your captions with a drag-and-drop editor, ensuring perfect visual integration with your images.",
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "Seamless Social Sharing",
    desc: "Directly share your captioned creations to all major social media platforms right from the app.",
  },
  {
    icon: <Boxes className="w-6 h-6" />,
    title: "Dedicated Product Mode",
    desc: "Generate SEO-optimized captions for your product listings, highlighting key features and boosting sales.",
  },
  {
    icon: <Images className="w-6 h-6" />,
    title: "Personalized Content Gallery",
    desc: "Organize and revisit all your generated and edited captions in one intuitive, easy-to-manage workspace.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "AI Caption Generator has revolutionized how I approach social media. The captions are spot-on, and the editor is incredibly user-friendly. My engagement has skyrocketed!",
    name: "Sarah J.",
    title: "Social Media Manager",
  },
  {
    quote:
      "As an e-commerce business owner, the Product Mode is a game-changer. It helps me craft compelling descriptions that drive sales without spending hours writing.",
    name: "Mark T.",
    title: "E-commerce Entrepreneur",
  },
];

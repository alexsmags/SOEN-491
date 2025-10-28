import { FaTwitter, FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[70] bg-[#1e2128] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/70">
          © {new Date().getFullYear()} CaptoPic. All rights reserved.
        </p>
        <div className="flex gap-6 text-xl">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3b477e] transition">
            <FaTwitter />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3b477e] transition">
            <FaGithub />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3b477e] transition">
            <FaLinkedin />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3b477e] transition">
            <FaInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
}

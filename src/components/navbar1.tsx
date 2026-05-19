import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="container flex justify-between items-center px-4 sm:px-6 py-3">
        
        {/* Logo */}
        <h1 className="text-lg sm:text-xl font-bold text-emerald-400">
          PeerLearn
        </h1>
      <div className="container flex justify-between items-center py-4">

        <Link to="/">
  <Logo />
</Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-6 text-sm text-emerald-200">
          <a href="#features" className="hover:text-yellow-400 transition">Features</a>
          <a href="#faq" className="hover:text-yellow-400 transition">FAQ</a>
          <a href="#demo" className="hover:text-yellow-400 transition">Demo</a>
          <Link to="/signup">
            <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:scale-105 transition">
              Join
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-emerald-200 p-2 rounded-lg border border-white/10 bg-white/5"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col gap-4 px-6 py-5 md:hidden">
          <a href="#features" className="text-emerald-200 hover:text-yellow-400">Features</a>
          <a href="#faq" className="text-emerald-200 hover:text-yellow-400">FAQ</a>
          <a href="#demo" className="text-emerald-200 hover:text-yellow-400">Demo</a>
          <Link to="/signup">
            <button className="w-full bg-yellow-400 text-black px-4 py-3 rounded-lg hover:scale-105 transition">
              Join
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}

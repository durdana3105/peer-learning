import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0 text-lg font-bold text-emerald-400">
          PeerLearn
        </Link>

        <div className="hidden items-center gap-6 text-sm text-emerald-200 md:flex">
          <a href="#features" className="transition hover:text-yellow-400">
            Features
          </a>
          <a href="#faq" className="transition hover:text-yellow-400">
            FAQ
          </a>
          <a href="#demo" className="transition hover:text-yellow-400">
            Demo
          </a>
          <Link to="/login" className="transition hover:text-yellow-400">
            Login
          </Link>
          <Link to="/signup">
            <button className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-black transition hover:scale-105">
              Get Started
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            to="/login"
            className="text-sm font-medium text-emerald-200 transition hover:text-white"
          >
            Login
          </Link>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-emerald-200 transition active:scale-95"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t border-white/10 bg-black/90 px-4 py-4 backdrop-blur-xl md:hidden">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center rounded-xl bg-white/5 px-4 text-sm font-medium text-emerald-200 transition hover:bg-white/10 hover:text-white"
          >
            Features
          </a>
          <a
            href="#faq"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center rounded-xl bg-white/5 px-4 text-sm font-medium text-emerald-200 transition hover:bg-white/10 hover:text-white"
          >
            FAQ
          </a>
          <a
            href="#demo"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center rounded-xl bg-white/5 px-4 text-sm font-medium text-emerald-200 transition hover:bg-white/10 hover:text-white"
          >
            Demo
          </a>
          <div className="mt-1 flex flex-col gap-2">
            <Link to="/login" onClick={() => setOpen(false)}>
              <button className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10">
                Login
              </button>
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)}>
              <button className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-yellow-400 text-sm font-semibold text-black transition hover:bg-yellow-300">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

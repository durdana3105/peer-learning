// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { Menu, X } from "lucide-react";
// import Logo from "@/components/Logo";

// export default function Navbar() {
//   const [open, setOpen] = useState(false);

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
//       <div className="container flex justify-between items-center px-4 sm:px-6 py-3">
        
//         {/* Logo */}
//         <Link to="/" className="text-lg sm:text-xl font-bold text-emerald-400">
//           PeerLearn
//         </Link>
//       </div>
      

//         {/* Desktop Links */}
//         <div className="hidden md:flex gap-6 text-sm text-emerald-200">
//           <a href="#features" className="hover:text-yellow-400 transition">Features</a>
//           <a href="#faq" className="hover:text-yellow-400 transition">FAQ</a>
//           <a href="#demo" className="hover:text-yellow-400 transition">Demo</a>
//           <Link to="/signup">
//             <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:scale-105 transition">
//               Join
//             </button>
//           </Link>
//         </div>

//         {/* Mobile Menu Button */}
//         <button
//           className="md:hidden text-emerald-200 p-2 rounded-lg border border-white/10 bg-white/5"
//           onClick={() => setOpen(!open)}
//         >
//           {open ? <X /> : <Menu />}
//         </button>
//       </div>

//       {/* Mobile Dropdown */}
//       {open && (
//         <div className="absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col gap-4 px-6 py-5 md:hidden">
//           <a href="#features" className="text-emerald-200 hover:text-yellow-400">Features</a>
//           <a href="#faq" className="text-emerald-200 hover:text-yellow-400">FAQ</a>
//           <a href="#demo" className="text-emerald-200 hover:text-yellow-400">Demo</a>
//           <Link to="/signup">
//             <button className="w-full bg-yellow-400 text-black px-4 py-3 rounded-lg hover:scale-105 transition">
//               Join
//             </button>
//           </Link>
//         </div>
//       )}
//     </nav>
//   );
// }

import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3">

        {/* Logo */}
        <Link to="/" className="text-lg font-bold text-emerald-400 shrink-0">
          PeerLearn
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-emerald-200">
          <a href="#features" className="hover:text-yellow-400 transition">Features</a>
          <a href="#faq" className="hover:text-yellow-400 transition">FAQ</a>
          <a href="#demo" className="hover:text-yellow-400 transition">Demo</a>
          <Link to="/login" className="hover:text-yellow-400 transition">Login</Link>
          <Link to="/signup">
            <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:scale-105 transition">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile: Login link + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            to="/login"
            className="text-sm font-medium text-emerald-200 hover:text-white transition"
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

      {/* Mobile Dropdown */}
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

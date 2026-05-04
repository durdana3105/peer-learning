import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
      <div className="container flex justify-between items-center py-4">

        {/* Logo */}
        <h1 className="text-xl font-bold text-emerald-400">
          PeerLearn
        </h1>

        {/* Links */}
        <div className="flex gap-6 text-sm text-emerald-200">

          <a href="#features" className="hover:text-yellow-400 transition">
            Features
          </a>

          <a href="#faq" className="hover:text-yellow-400 transition">
            FAQ
          </a>

          <a href="#demo" className="hover:text-yellow-400 transition">
            Demo
          </a>

          <Link to="/signup">
            <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:scale-105 transition">
              Join
            </button>
          </Link>

        </div>
      </div>
    </nav>
  );
}
const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo.png"
        alt="Peer Learning Logo"
        className="h-16 w-16 object-contain drop-shadow-lg"
      />

      <div className="flex flex-col leading-none">
        <span className="text-2xl font-extrabold tracking-tight text-white">
          Peer
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Learning
          </span>
        </span>

        <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">
          Learn • Connect • Grow
        </span>
      </div>
    </div>
  );
};

export default Logo;
import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = () => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050816] overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Glow */}
        <motion.div
          className="absolute h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        {/* Logo */}
        <motion.img
  src="/logo.png"
  alt="PeerLearning Logo"
  initial={{
    scale: 0,
    opacity: 0,
  }}
  animate={{
    scale: 1,
    opacity: 1,
  }}
  transition={{
    duration: 1,
    ease: "easeOut",
  }}
  className="h-44 w-44 object-contain"
/>

        {/* Text */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.8,
            duration: 0.8,
          }}
          className="absolute mt-64 text-6xl font-black tracking-tight"
        >
          <span className="text-white">Peer</span>
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            Learning
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1.3,
          }}
          className="absolute mt-[360px] tracking-[0.5em] uppercase text-cyan-300 text-xs"
        >
          Learn • Connect • Grow
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
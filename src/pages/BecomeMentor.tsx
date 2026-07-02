import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import {
  GraduationCap,
  Trophy,
  Users,
  Briefcase,
} from "lucide-react";

import MentorForm from "@/components/mentor/MentorForm";

const benefits = [
  {
    icon: Trophy,
    title: "Build Reputation",
    desc: "Gain mentor badges and recognition.",
  },
  {
    icon: Briefcase,
    title: "Improve Resume",
    desc: "Teaching experience boosts your profile.",
  },
  {
    icon: Users,
    title: "Help Students",
    desc: "Guide juniors in coding and projects.",
  },
  {
    icon: GraduationCap,
    title: "Grow Together",
    desc: "Become part of a strong student community.",
  },
];

export default function BecomeMentor() {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#071127] to-[#020B1F] px-6 py-20 text-white">
      {/* Back Button */}
      
<div className="mb-2">
  <Link
    to="/"
    className="absolute top-6 left-6 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 pr-4 pb-1-5 text-md font-medium text-black transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
  >
    ← Back
  </Link>
</div>
      {/* Glow */}
      <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute right-10 top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-cyan-300 backdrop-blur-xl">
            <GraduationCap size={18} />
            Become a PeerLearn Mentor
          </div>

          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Share Your Knowledge.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Guide Juniors.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300/70">
            Become a verified mentor and help students through
            live sessions, doubt solving, mock interviews,
            and project guidance.
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_50px_rgba(34,211,238,0.18)]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                <b.icon />
              </div>

              <h3 className="text-2xl font-bold">
                {b.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-300/70">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <div className="mt-24">
          <MentorForm />
        </div>
      </div>
    </div>
  );
}
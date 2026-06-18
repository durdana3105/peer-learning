import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Database, Lock, Globe, Users, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Glow Effects */}
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-blue-600/20 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[140px]" />

      <div className="relative z-10 px-6 py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-2 text-cyan-300 backdrop-blur-md">
            <Shield size={16} />
            Privacy & Data Protection
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight md:text-7xl">
            Your Privacy,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              Our Responsibility
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            PeerLearn is committed to protecting your personal information and
            maintaining transparency about how your data is collected, used,
            and secured while you learn, collaborate, and grow with our
            community.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="rounded-2xl border border-cyan-500/20 bg-white/5 px-5 py-3 text-sm text-cyan-300 backdrop-blur-md">
              Last Updated: June 2026
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-14 max-w-5xl rounded-[32px] border border-cyan-500/20 bg-white/[0.04] p-8 shadow-[0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-xl md:p-14"
        >
          {/* Quick Navigation */}
          <div className="mb-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-5 text-lg font-semibold text-cyan-300">
              Quick Navigation
            </h3>

            <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <a href="#information" className="hover:text-cyan-300 transition">
                Information We Collect
              </a>
              <a href="#usage" className="hover:text-cyan-300 transition">
                How We Use Information
              </a>
              <a href="#sharing" className="hover:text-cyan-300 transition">
                Data Sharing
              </a>
              <a href="#cookies" className="hover:text-cyan-300 transition">
                Cookies & Tracking
              </a>
              <a href="#security" className="hover:text-cyan-300 transition">
                Data Security
              </a>
              <a href="#rights" className="hover:text-cyan-300 transition">
                User Rights
              </a>
            </div>
          </div>

          {/* Intro */}
          <div className="rounded-3xl border border-cyan-500/10 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 p-6">
            <p className="leading-8 text-slate-300">
              This Privacy Policy explains how PeerLearn collects, uses,
              stores, and protects your information when you access our
              platform, participate in learning communities, connect with
              mentors, or use any of our services. By using PeerLearn, you
              agree to the practices described in this policy.
            </p>
          </div>

          <Section
            id="information"
            icon={<Database size={20} />}
            title="1. Information We Collect"
          >
            We collect information that you provide directly when creating an
            account, updating your profile, participating in communities, or
            communicating with mentors and peers. This may include your name,
            email address, profile details, learning interests, and account
            preferences. We may also collect usage data such as learning
            activity, XP earned, sessions attended, device information, IP
            address, and system logs.
          </Section>

          <Section
            id="usage"
            icon={<Users size={20} />}
            title="2. How We Use Your Information"
          >
            We use your information to deliver and improve our services,
            personalize learning experiences, recommend relevant mentors and
            communities, monitor engagement, provide support, enhance platform
            security, and develop new features that improve the overall
            PeerLearn experience.
          </Section>

          <Section
            icon={<FileText size={20} />}
            title="3. Legal Basis for Processing (GDPR)"
          >
            If you are located within the European Economic Area (EEA), we
            process your information based on consent, contractual necessity,
            legal obligations, and legitimate business interests such as
            platform improvement, fraud prevention, and service security.
          </Section>

          <Section
            id="sharing"
            icon={<Globe size={20} />}
            title="4. Data Sharing & Disclosure"
          >
            PeerLearn does not sell your personal data. We may share limited
            information with mentors, peers, moderators, analytics providers,
            cloud infrastructure partners, and legal authorities when required
            by law or necessary for platform functionality and safety.
          </Section>

          <Section
            icon={<Users size={20} />}
            title="5. Third-Party Services"
          >
            We may integrate trusted third-party providers for authentication,
            analytics, cloud hosting, notifications, and payment processing.
            These providers only access information necessary to perform their
            services and are required to protect your data.
          </Section>

          <Section
            id="cookies"
            icon={<Database size={20} />}
            title="6. Cookies & Tracking Technologies"
          >
            We use cookies and similar technologies to remember preferences,
            maintain secure sessions, understand platform usage, and improve
            performance. You may control cookie settings through your browser
            or through our cookie preference tools where available. For more
            details, visit our{" "}
            <Link
              to="/cookies-policy"
              className="font-medium text-cyan-400 hover:text-cyan-300"
            >
              Cookies Policy
            </Link>
            .
          </Section>

          <Section
            icon={<FileText size={20} />}
            title="7. Data Retention"
          >
            We retain personal information only for as long as necessary to
            provide services, comply with legal obligations, resolve disputes,
            maintain records, and enforce platform policies. Users may request
            account deletion or data removal subject to applicable laws.
          </Section>

          <Section
            id="security"
            icon={<Lock size={20} />}
            title="8. Data Security"
          >
            We employ industry-standard safeguards including encryption,
            authentication controls, secure infrastructure, monitoring systems,
            and access restrictions. While we continuously improve our security
            practices, no digital platform can guarantee complete protection
            against all threats.
          </Section>

          <Section
            id="rights"
            icon={<Shield size={20} />}
            title="9. User Rights"
          >
            Depending on your jurisdiction, you may have rights to access,
            update, correct, export, restrict, or delete your personal data.
            You may also object to certain processing activities or withdraw
            previously provided consent.
          </Section>

          <Section
            icon={<Users size={20} />}
            title="10. Children's Privacy"
          >
            PeerLearn is not intended for children under the minimum age
            required by applicable laws. We do not knowingly collect personal
            information from children without appropriate parental or guardian
            consent.
          </Section>

          <Section
            icon={<Globe size={20} />}
            title="11. International Data Transfers"
          >
            Your information may be processed and stored in countries outside
            your place of residence. Where such transfers occur, we implement
            appropriate safeguards to ensure your data remains protected.
          </Section>

          <Section
            icon={<FileText size={20} />}
            title="12. Changes to This Policy"
          >
            We may update this Privacy Policy periodically to reflect legal,
            technical, or operational changes. Any updates will be posted on
            this page with a revised effective date.
          </Section>

          <Section
            icon={<Users size={20} />}
            title="13. Contact Us"
          >
            If you have questions, concerns, or requests related to this
            Privacy Policy or your personal information, please contact us at
            support@peerlearn.com.
          </Section>

          {/* Footer Actions */}
          <div className="mt-14 flex flex-col items-center justify-center gap-4 border-t border-white/10 pt-10 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            >
              ← Back to Home
            </Link>

            <Link
              to="/cookies-policy"
              className="rounded-xl border border-cyan-500/20 bg-white/5 px-7 py-3 font-medium text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
            >
              View Cookies Policy
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
  icon,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mt-10 border-b border-white/5 pb-8 last:border-none"
    >
      <h2 className="flex items-center gap-3 text-xl font-bold text-cyan-300">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
          {icon}
        </span>
        {title}
      </h2>

      <p className="mt-4 leading-8 text-slate-300">{children}</p>
    </section>
  );
}
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#071127] to-[#020B1F] text-white px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl"
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <p className="mt-6 text-slate-300 leading-7">
          This Privacy Policy explains how PeerLearn collects, uses, stores, and
          protects your information when you use our platform. By using
          PeerLearn, you agree to the practices described below.
        </p>

        <Section title="1. Information We Collect">
          We collect information you provide directly, such as name, email
          address, profile details, and account preferences. We also collect
          usage data such as sessions attended, XP earned, community
          interactions, device information, and log data.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your data to provide and improve our services, personalize
          learning experiences, recommend mentors and peers, track progress,
          enable community features, and ensure platform safety and integrity.
        </Section>

        <Section title="3. Legal Basis for Processing (GDPR)">
          If you are in the EEA, we process your data based on consent,
          contractual necessity, legal obligations, and legitimate interests
          such as improving and securing our platform.
        </Section>

        <Section title="4. Data Sharing & Disclosure">
          We do not sell your personal data. We may share limited information
          with mentors, peers, or service providers strictly for platform
          functionality, moderation, analytics, and compliance with legal
          obligations.
        </Section>

        <Section title="5. Third-Party Services">
          We may use third-party services for authentication, analytics, cloud
          hosting, and payments. These providers only access data necessary to
          perform their functions and are obligated to protect it.
        </Section>

        <Section title="6. Cookies & Tracking Technologies">
          We use cookies and similar technologies to remember user preferences,
          analyze traffic, and improve user experience. You may disable cookies
          in your browser settings.
        </Section>

        <Section title="7. Data Retention">
          We retain your data only as long as necessary to provide services,
          comply with legal obligations, resolve disputes, and enforce
          agreements. You may request deletion of your data at any time.
        </Section>

        <Section title="8. Data Security">
          We implement industry-standard security measures including encryption,
          access controls, and monitoring systems. However, no system is
          completely secure, and we cannot guarantee absolute protection.
        </Section>

        <Section title="9. User Rights">
          You have the right to access, update, correct, or delete your personal
          data. You may also object to processing or request data portability
          where applicable.
        </Section>

        <Section title="10. Children’s Privacy">
          PeerLearn is not intended for children under 13 (or applicable minimum
          age in your country). We do not knowingly collect data from minors
          without parental consent.
        </Section>

        <Section title="11. International Data Transfers">
          Your data may be transferred and processed in countries outside your
          residence. We ensure appropriate safeguards are in place for such
          transfers.
        </Section>

        <Section title="12. Changes to This Policy">
          We may update this Privacy Policy periodically. Changes will be posted
          on this page with an updated effective date.
        </Section>

        <Section title="13. Contact Us">
          If you have any questions about this Privacy Policy, please contact us
          at support@peerlearn.com.
        </Section>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-block rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-black hover:scale-105 transition"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-cyan-300">{title}</h2>
      <p className="mt-2 text-slate-300 leading-7">{children}</p>
    </div>
  );
}

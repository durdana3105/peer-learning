import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { useCookieConsent } from "@/contexts/CookieConsentContext";

export default function CookiesPolicy() {
  const { openPreferences } = useCookieConsent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#071127] to-[#020B1F] px-6 py-20 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl"
      >
        <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-black text-transparent">
          Cookies Policy
        </h1>

        <p className="mt-6 leading-7 text-slate-300">
          This Cookies Policy explains what cookies and similar technologies PeerLearn
          uses, why we use them, and how you can manage your preferences. For broader
          privacy practices, see our{" "}
          <Link
            to="/privacy-policy"
            className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <Section title="1. Introduction to Cookies">
          Cookies are small text files stored on your device when you visit a website.
          Similar technologies such as local storage may also be used to remember
          settings and improve your experience. PeerLearn uses these technologies to
          keep the platform secure, remember your preferences, and understand how our
          services are used.
        </Section>

        <Section title="2. Essential Cookies">
          Essential cookies are required for PeerLearn to function and cannot be
          disabled through our consent banner. These include authentication session
          cookies (such as the secure <code className="text-cyan-200">access_token</code>{" "}
          cookie used for backend API access) and UI state cookies (such as{" "}
          <code className="text-cyan-200">sidebar:state</code>, which remembers sidebar
          visibility for up to 7 days). Without these cookies, core features such as
          signing in and navigating the platform may not work correctly.
        </Section>

        <Section title="3. Analytics Cookies">
          Analytics cookies help us measure traffic, understand feature usage, and
          improve PeerLearn. We do not currently deploy third-party analytics cookies.
          If we introduce analytics tools in the future, they will only be activated
          when you grant analytics consent through our cookie banner.
        </Section>

        <Section title="4. Functional Cookies">
          Functional cookies and local storage entries remember choices that enhance
          your experience. On PeerLearn, these may include your selected theme (
          <code className="text-cyan-200">app-theme</code>), learner/mentor mode (
          <code className="text-cyan-200">peerlearn_mode</code>), and cached streak
          data used to display progress quickly. These preferences are stored locally
          and can be declined through the cookie banner if you prefer a minimal setup.
        </Section>

        <Section title="5. Marketing Cookies">
          Marketing cookies are used to deliver personalized advertising or measure ad
          campaign performance. PeerLearn does not currently use marketing cookies. If
          this changes, we will update this policy and request your consent before
          enabling them.
        </Section>

        <Section title="6. Cookie Retention Duration">
          <ul className="mt-2 list-disc space-y-2 pl-5 leading-7 text-slate-300">
            <li>
              <strong className="text-white">Essential:</strong> session cookies expire
              when you close your browser; sidebar state may persist for up to 7 days.
            </li>
            <li>
              <strong className="text-white">Analytics:</strong> not currently active;
              future analytics cookies would typically persist from 24 hours to 13 months
              depending on the provider.
            </li>
            <li>
              <strong className="text-white">Functional:</strong> stored until you clear
              browser data or change your consent preferences.
            </li>
            <li>
              <strong className="text-white">Marketing:</strong> not currently used.
            </li>
          </ul>
        </Section>

        <Section title="7. Managing or Deleting Cookies">
          You can manage cookie preferences at any time using our cookie banner. To
          reopen it, use{" "}
          <button
            type="button"
            onClick={openPreferences}
            className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            Cookie Settings
          </button>{" "}
          from the site footer or click the button below. You can also delete cookies
          through your browser settings. Note that removing essential cookies may affect
          login and core functionality.
        </Section>

        <Section title="8. Contact Us">
          If you have questions about this Cookies Policy or how we handle your data,
          contact us at{" "}
          <a
            href="mailto:support@peerlearn.com"
            className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            support@peerlearn.com
          </a>
          .
        </Section>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/"
            className="inline-block rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-black transition hover:scale-105"
          >
            Back to Home
          </Link>
          <button
            type="button"
            onClick={openPreferences}
            className="inline-block rounded-xl border border-cyan-400/40 px-6 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
          >
            Cookie Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-cyan-300">{title}</h2>
      <div className="mt-2 leading-7 text-slate-300">{children}</div>
    </div>
  );
}

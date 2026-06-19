import React from "react";
import { Link } from "react-router-dom";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block px-5 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium">
            Legal Information
          </span>

          <h1 className="mt-6 text-5xl md:text-6xl font-bold">
            Terms &
            <span className="text-cyan-400"> Conditions</span>
          </h1>

          <p className="mt-6 text-gray-400 max-w-2xl mx-auto">
            Please read these Terms and Conditions carefully before using
            PeerLearn. By accessing or using our platform, you agree to be
            bound by these terms.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Last Updated: June 2026
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-12 space-y-10">

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing PeerLearn, you agree to comply with and be bound by
              these Terms and Conditions. If you do not agree with any portion
              of these terms, please discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              2. Use of the Platform
            </h2>
            <p className="text-gray-300 leading-relaxed">
              PeerLearn is designed to facilitate peer learning, mentorship,
              collaboration, and educational engagement. Users must use the
              platform responsibly and in accordance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Users are responsible for maintaining the confidentiality of their
              account credentials and for all activities conducted through their
              accounts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              4. Community Guidelines
            </h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Respect all members of the community.</li>
              <li>No harassment, bullying, or hate speech.</li>
              <li>No spam, misleading information, or fraudulent activity.</li>
              <li>Maintain academic integrity and ethical conduct.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-gray-300 leading-relaxed">
              All platform content, branding, logos, and software remain the
              property of PeerLearn or its licensors. Unauthorized use,
              reproduction, or distribution is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-gray-300 leading-relaxed">
              PeerLearn is provided on an "as-is" basis. We are not liable for
              any indirect, incidental, or consequential damages resulting from
              the use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              7. Termination
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate access to the
              platform if users violate these Terms and Conditions or engage in
              harmful activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              8. Changes to Terms
            </h2>
            <p className="text-gray-300 leading-relaxed">
              PeerLearn may update these Terms and Conditions at any time.
              Continued use of the platform after modifications constitutes
              acceptance of the revised terms.
            </p>
          </section>

          <section>
  <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
    9. Mentorship Interactions
  </h2>
  <p className="text-gray-300 leading-relaxed">
    PeerLearn facilitates connections between learners and mentors. Users are
    expected to interact respectfully, professionally, and constructively
    during mentorship sessions. Mentors should provide guidance based on their
    experience and knowledge, while learners are responsible for their own
    decisions and actions. PeerLearn does not guarantee specific outcomes from
    mentorship interactions and is not responsible for advice shared between
    users.
  </p>
</section>

<section>
  <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
    10. User-Generated Content
  </h2>
  <p className="text-gray-300 leading-relaxed">
    Users may create, upload, or share content including messages, resources,
    project submissions, portfolio content, reviews, and community posts. Users
    retain ownership of their original content but grant PeerLearn a
    non-exclusive, worldwide license to display, store, and distribute such
    content as necessary to operate and improve the platform. Users are solely
    responsible for ensuring that their content complies with applicable laws
    and does not infringe on the rights of others.
  </p>
</section>

<section>
  <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
    11. Privacy and Data Protection
  </h2>
  <p className="text-gray-300 leading-relaxed">
    PeerLearn values user privacy and handles personal information in
    accordance with our Privacy Policy. By using the platform, you acknowledge
    and agree to the collection, use, and processing of information as
    described in our Privacy Policy.
  </p>

  <p className="mt-4 text-gray-300">
    For more information, please review our{" "}
    <Link
      to="/privacy-policy"
      className="text-cyan-400 hover:text-cyan-300 hover:underline"
    >
      Privacy Policy
    </Link>.
  </p>
</section>
          
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions regarding these Terms and Conditions,
              please contact our support team at support@peerlearn.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

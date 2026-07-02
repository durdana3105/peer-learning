import React from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Shield,
  AlertTriangle,
  GitPullRequest,
  MessageSquare,
  BookOpen,
  Lightbulb,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Project Guidelines
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Your central guide to contributing, participating, and collaborating
          in the Peer Learning project.
        </p>
      </div>

      <div className="space-y-16">
        {/* 1. Project Overview */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-semibold">Project Overview</h2>
          </div>
          <p className="text-lg leading-relaxed">
            Peer Learning is an open-source platform designed to facilitate
            collaborative learning and knowledge sharing among students,
            developers, and enthusiasts. We believe in building a respectful,
            inclusive, and productive learning environment.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            This Guidelines page serves as the single source of truth for all
            project policies and expectations.
          </p>
        </section>

        {/* 2. Getting Started */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-8 h-8 text-amber-600" />
            <h2 className="text-3xl font-semibold">Getting Started</h2>
          </div>
          <p className="mb-4">
            New to the project? Here's how to get involved:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              Read the{" "}
              <Link
                href="https://github.com/durdana3105/peer-learning"
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                README
              </Link>
            </li>
            <li>
              Set up the development environment following the repository
              instructions
            </li>
            <li>
              Familiarize yourself with our{" "}
              <Link
                href="#code-of-conduct"
                className="text-blue-600 hover:underline"
              >
                Code of Conduct
              </Link>
            </li>
            <li>Explore open issues and discussions on GitHub</li>
          </ul>
        </section>

        {/* 3. Contribution Guidelines */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <GitPullRequest className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-semibold">Contribution Guidelines</h2>
          </div>
          <p className="mb-4">
            We welcome contributions of all kinds — code, documentation, bug
            reports, feature ideas, and more.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
            <p className="font-medium mb-3">Standard Contribution Flow:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Fork the repository</li>
              <li>Clone your fork locally</li>
              <li>Create a feature/fix branch</li>
              <li>Make your changes</li>
              <li>Commit with clear messages</li>
              <li>Push and open a Pull Request</li>
            </ol>
          </div>
          <Link
            href="https://github.com/durdana3105/peer-learning/blob/main/CONTRIBUTING.md"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
            target="_blank"
          >
            Read Full Contributing Guidelines →
          </Link>
        </section>

        {/* 4. Code of Conduct */}
        <section id="code-of-conduct">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-semibold">Code of Conduct</h2>
          </div>
          <p className="mb-4">
            We are committed to creating a welcoming, respectful, and inclusive
            environment for everyone.
          </p>
          <div className="prose dark:prose-in-dark text-sm">
            <p>
              <strong>Expected Behavior:</strong> Be respectful, use inclusive
              language, accept feedback gracefully.
            </p>
            <p>
              <strong>Unacceptable Behavior:</strong> Harassment,
              discrimination, offensive language, personal attacks.
            </p>
          </div>
          <Link
            href="https://github.com/durdana3105/peer-learning/blob/main/CODE_OF_CONDUCT.md"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium mt-4"
            target="_blank"
          >
            Read Full Code of Conduct →
          </Link>
        </section>

        {/* 5. Security & Responsible Disclosure */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-semibold">
              Security &amp; Responsible Disclosure
            </h2>
          </div>
          <p>
            Security is taken seriously. If you discover a vulnerability, please
            report it privately to the maintainers rather than opening a public
            issue.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            (A dedicated SECURITY.md will be added soon. For now, please contact
            maintainers directly via GitHub.)
          </p>
        </section>

        {/* 6. Reporting Issues and Feature Requests */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <h2 className="text-3xl font-semibold">
              Reporting Issues and Feature Requests
            </h2>
          </div>
          <p>
            Found a bug? Have a feature idea? Please open an issue with a clear
            title, description, and reproduction steps (if applicable).
          </p>
          <Link
            href="https://github.com/durdana3105/peer-learning/issues"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium mt-4"
            target="_blank"
          >
            Open a New Issue →
          </Link>
        </section>

        {/* 7. Pull Request Expectations */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <GitPullRequest className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-semibold">
              Pull Request Expectations
            </h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Keep PRs focused on a single change</li>
            <li>Use clear, descriptive commit messages</li>
            <li>Ensure all tests pass</li>
            <li>Update documentation when needed</li>
            <li>Follow existing code style and project structure</li>
            <li>Be responsive to review comments</li>
            <li>Link related issues in the PR description</li>
          </ul>
        </section>

        {/* 8. Community Resources */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-8 h-8 text-rose-600" />
            <h2 className="text-3xl font-semibold">Community Resources</h2>
          </div>
          <p>
            We encourage open and respectful communication. Feel free to ask
            questions, share ideas, and help others in the community.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            More communication channels (Discord, discussions, etc.) will be
            added as the community grows.
          </p>
        </section>
      </div>

      <div className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-500">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}{" "}
        • This page is part of the official project documentation.
      </div>
    </div>
  );
}

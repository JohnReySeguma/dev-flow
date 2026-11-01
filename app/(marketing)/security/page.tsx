import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Trust"
      title="Security"
      updated="November 1, 2026"
      summary="With no backend there is very little to attack, but the interface is still built the way a production app would be. Here's what is real and what is simulated."
      sections={[
        {
          id: "architecture",
          title: "Architecture",
          body: (
            <ul>
              <li>Pages are statically prerendered by Next.js and served as files.</li>
              <li>All demo state lives in memory and localStorage on your device; no API receives it.</li>
              <li>The footer contact form is the only network request carrying your input; it posts to FormSubmit, which emails the author.</li>
              <li>No third-party scripts are loaded at runtime.</li>
            </ul>
          ),
        },
        {
          id: "simulated",
          title: "What is simulated",
          body: (
            <>
              <p>
                <strong>Authentication</strong>, <strong>OAuth</strong>, <strong>Live Sync</strong> and <strong>GitHub
                links</strong> are UI demonstrations. Signing in does not create a session and logging out does not revoke
                one.
              </p>
              <p>
                <strong>Personal access tokens</strong> on the profile page are generated with the Web Crypto API and shown
                once, mirroring real PAT flows, but they authenticate nothing.
              </p>
            </>
          ),
        },
        {
          id: "practices",
          title: "Frontend practices",
          body: (
            <ul>
              <li>Secrets are revealed once and cleared from the screen when you navigate away.</li>
              <li>Destructive actions (revoking tokens, deleting projects) require explicit confirmation.</li>
              <li>External links open with <code className="font-mono text-zinc-300">rel=&quot;noreferrer&quot;</code>.</li>
              <li>User-entered text is rendered as text by React, never injected as HTML.</li>
            </ul>
          ),
        },
        {
          id: "reporting",
          title: "Reporting an issue",
          body: <p>Spotted a bug or a vulnerability in the code? Please reach out through the “Get in touch” form in the footer.</p>,
        },
      ]}
    />
  );
}

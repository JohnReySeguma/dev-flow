import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="November 1, 2026"
      summary="DevFlow is a portfolio project that runs in your browser. There is no backend, no account database and no analytics. The only data that ever leaves your device is what you choose to send through the contact form."
      sections={[
        {
          id: "what-we-collect",
          title: "What we collect",
          body: (
            <>
              <p>
                <strong>The demo itself collects nothing.</strong> The sign-in and sign-up forms validate input locally and
                then open the demo workspace; the email and password you type are never transmitted or stored.
              </p>
              <p>The “Continue with GitHub/Google” buttons are simulated and do not contact those providers.</p>
              <p>
                <strong>Contact form.</strong> If you submit the “Get in touch” form in the footer, the email address and
                message you enter are sent to the project author by email, relayed through{" "}
                <a href="https://formsubmit.co" target="_blank" rel="noreferrer" className="text-zinc-200 underline underline-offset-2">
                  FormSubmit
                </a>
                . They are used only to reply to you.
              </p>
            </>
          ),
        },
        {
          id: "local-storage",
          title: "Data stored in your browser",
          body: (
            <>
              <p>
                Projects, sprints and issues you create are saved to your browser&apos;s <strong>localStorage</strong> under the
                key <code className="font-mono text-zinc-300">devflow:tracker:v1</code> so the demo survives a reload.
              </p>
              <ul>
                <li>It is readable only by this site, in this browser.</li>
                <li>Clear it any time from Workspace settings → Reset demo data, or by clearing site data.</li>
              </ul>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies & tracking",
          body: <p>DevFlow sets no cookies and loads no third-party trackers, ads or analytics scripts.</p>,
        },
        {
          id: "hosting",
          title: "Hosting",
          body: (
            <p>
              Like any website, the host serving these files may keep standard access logs (IP address, user agent,
              requested path) for operational purposes. Those logs are governed by the host&apos;s own privacy policy.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: <p>Questions about this project, or want your message deleted? Use the “Get in touch” form in the footer.</p>,
        },
      ]}
    />
  );
}

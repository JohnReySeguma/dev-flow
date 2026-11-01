import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      updated="November 1, 2026"
      summary="Short version: DevFlow is a demonstration, not a service. Use it to explore the interface; don't rely on it to store real work."
      sections={[
        {
          id: "the-demo",
          title: "What DevFlow is",
          body: (
            <p>
              DevFlow is a frontend portfolio project showcasing a sprint-based issue tracker. All projects, people,
              issues and pull-request references in the demo workspace are fictional sample data.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <ul>
              <li>Feel free to create, edit and delete anything in the demo workspace.</li>
              <li>Don&apos;t enter real credentials, secrets or personal data — nothing is protected by a server.</li>
              <li>Don&apos;t attempt to disrupt the site or its hosting.</li>
            </ul>
          ),
        },
        {
          id: "no-warranty",
          title: "No warranty",
          body: (
            <p>
              The site is provided <strong>as is</strong>, without warranties of any kind. Data in your browser may be lost
              when you clear site data, switch browsers, or when the demo&apos;s storage format changes.
            </p>
          ),
        },
        {
          id: "ip",
          title: "Code & content",
          body: (
            <p>
              The DevFlow name, logo and interface design belong to the project author. Third-party names such as GitHub,
              Google and Okta appear only to illustrate integrations and remain the property of their owners.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes",
          body: <p>These terms may change as the project evolves. The date at the top shows the latest revision.</p>,
        },
      ]}
    />
  );
}

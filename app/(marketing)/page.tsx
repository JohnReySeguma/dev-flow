import { Features } from "@/components/marketing/features";
import { GitHubIntegration } from "@/components/marketing/github-integration";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { TeamFeatures } from "@/components/marketing/team-features";
import { TechStack } from "@/components/marketing/tech-stack";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <GitHubIntegration />
      <TeamFeatures />
      <TechStack />
    </>
  );
}

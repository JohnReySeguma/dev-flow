/**
 * Author links shown in the marketing footer. Replace the placeholder
 * profiles with your own before publishing the portfolio.
 */
export const SOCIAL_LINKS = {
  github: "https://github.com/your-handle",
  linkedin: "https://www.linkedin.com/in/your-handle",
  instagram: "https://www.instagram.com/your-handle",
  x: "https://x.com/your-handle",
} as const;

/** Where footer contact-form submissions are delivered. */
export const CONTACT_EMAIL = "johnreycseguma@gmail.com";

/**
 * FormSubmit relays form posts to an inbox without a backend or API key.
 * The very first submission triggers a one-time activation email to
 * CONTACT_EMAIL; messages are delivered once that link is confirmed.
 */
export const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

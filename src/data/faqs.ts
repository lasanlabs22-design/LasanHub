import { Role } from "./roles";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  /** Which roles see this. Omit for everyone. */
  roles?: Role[];
};

export const faqs: Faq[] = [
  /* ---------- Getting started ---------- */
  {
    id: "q1",
    question: "How long does approval take?",
    answer:
      "Usually a day or two. A person on our team reads every profile — nothing is approved automatically. You'll get a notification here the moment it's done.",
  },
  {
    id: "q2",
    question: "Why was my profile rejected?",
    answer:
      "We'll have left a reason on your Home screen. Most often it's something small — a handle that doesn't match the name, or missing details. Fix it, save, and it comes back to us.",
  },
  {
    id: "q3",
    question: "Does it cost anything to join?",
    answer:
      "No. Joining is free and stays free. We take our margin from what the client pays, not from you.",
  },
  {
    id: "q4",
    question: "Why does editing my profile send it back for review?",
    answer:
      "Because businesses see your details as verified. If a rate or a service could change quietly after approval, that word would mean nothing. A re-check is usually quick.",
  },

  /* ---------- Work ---------- */
  {
    id: "q5",
    question: "How do I get work?",
    answer:
      "When a business asks for what you offer, our team sends you the job. It appears in your Work tab and you'll get a notification. You accept or decline.",
  },
  {
    id: "q6",
    question: "What happens if I decline a job?",
    answer:
      "Nothing bad. We just ask why, so we can place it with someone else quickly. Declining doesn't count against you — we'd rather know than have work accepted that can't be delivered.",
  },
  {
    id: "q7",
    question: "Why can I only see the client's first name?",
    answer:
      "We handle the client relationship, so everything goes through our team. If you need to know more about the job, message us and we'll find out.",
  },
  {
    id: "q8",
    question: "When do I mark a job complete?",
    answer:
      "Once the work is actually done. We let the client know and check they're happy. If anything is outstanding, we'll call you rather than leave it hanging.",
  },

  /* ---------- Money ---------- */
  {
    id: "q9",
    question: "How and when do I get paid?",
    answer:
      "Our team agrees the amount with you before the job starts, and pays after the work is completed and the client is satisfied. Message us about any specific payment.",
  },
  {
    id: "q10",
    question: "Can I change my rate?",
    answer:
      "Yes, any time. Edit your profile and update it. It goes back for a quick review, then the new rate applies to future work.",
    roles: ["influencer"],
  },
  {
    id: "q11",
    question: "What should I put in my rate card?",
    answer:
      "Rough pricing for the things you do most — a line each is plenty. It helps our team quote faster, which means more work reaching you.",
    roles: ["vendor", "freelancer"],
  },

  /* ---------- Role-specific ---------- */
  {
    id: "q12",
    question: "Do I need a GST number?",
    answer:
      "Yes, for vendors. We work with registered businesses so invoicing is clean on both sides.",
    roles: ["vendor"],
  },
  {
    id: "q13",
    question: "What counts as a portfolio link?",
    answer:
      "Anything that shows your work — Behance, a Google Drive folder, your Instagram, your own site. A Drive link is completely fine.",
    roles: ["freelancer"],
  },
  {
    id: "q14",
    question: "Do you check my Instagram?",
    answer:
      "Yes. We look at the handle you gave us and check it matches the name and following you've entered. It's the main thing we verify.",
    roles: ["influencer"],
  },

  /* ---------- Account ---------- */
  {
    id: "q15",
    question: "How do I pause or leave?",
    answer:
      "Message our team and we'll pause your profile so no new work comes your way. Ask us to delete it and everything goes within 30 days.",
  },
  {
    id: "q16",
    question: "I've changed my phone number",
    answer:
      "Message us before you lose access to the old one. Your account is tied to your verified number, so we need to move it across for you.",
  },
];

/** Only the questions that apply to this partner */
export function faqsFor(role: Role): Faq[] {
  return faqs.filter((f) => !f.roles || f.roles.includes(role));
}

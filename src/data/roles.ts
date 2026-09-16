export type Role = "influencer" | "vendor" | "freelancer";

export const ROLES: {
  key: Role;
  label: string;
  tagline: string;
  icon: string;
  accent: string;
}[] = [
  {
    key: "influencer",
    label: "Influencer",
    tagline: "Instagram, YouTube, city pages",
    icon: "account-star-outline",
    accent: "#C13584",
  },
  {
    key: "vendor",
    label: "Vendor",
    tagline: "Hoardings, print, events, field teams",
    icon: "storefront-outline",
    accent: "#0EA97A",
  },
  {
    key: "freelancer",
    label: "Freelancer",
    tagline: "Design, video, writing, development",
    icon: "laptop",
    accent: "#3A86FF",
  },
];

/**
 * These strings must match Lasan Mart's offline marketing labels
 * character for character. A request for "Hoardings" is matched
 * against vendors who ticked "Hoardings" — so this is a shared
 * vocabulary between the two apps, not a free choice.
 *
 * If you change a label in Lasan Mart's homeCategories.ts, change it
 * here too, and migrate any vendor rows holding the old wording.
 */
export const VENDOR_SERVICES = [
  "Hoardings",
  "Outdoor Ads",
  "LED Boards",
  "Transit Ads",
  "Print Media",
  "Event Marketing",
  "Local Engagement",
  "Direct Marketing",
  "Vehicle Branding",
  "Traditional Media",
  "Field Sales",
  "Telecalling",
  "Display Boards",
  "Exhibitions",
  "Corporate Events",
];

/** What a freelancer can offer */
export const FREELANCER_SKILLS = [
  "Photography",
  "Videography",
  "Video Editing",
  "Digital Marketing",
];

/** For creators — what they post about */
export const CREATOR_CATEGORIES = [
  "Fashion",
  "Food",
  "Fitness",
  "Beauty",
  "Travel",
  "Comedy",
  "Tech",
  "Lifestyle",
  "City page",
  "Anchor",
  "Dance",
  "Other",
];

export const roleMeta = (role: Role) =>
  ROLES.find((r) => r.key === role) || ROLES[0];

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

/** What a vendor can offer. Mirrors the offline services in Lasan Mart. */
export const VENDOR_SERVICES = [
  "Outdoor Ads",
  "Hoardings",
  "Event Marketing",
  "Print Media",
  "Vehicle Branding",
  "Corporate & B2B Events",
  "Field Sales",
  "Display Boards",
];

/** What a freelancer can offer */
export const FREELANCER_SKILLS = [
  "Graphic Design",
  "Video Editing",
  "Photography",
  "Videography",
  "Content Writing",
  "Social Media",
  "Web Development",
  "App Development",
  "SEO",
  "Animation",
  "Voice Over",
  "Illustration",
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

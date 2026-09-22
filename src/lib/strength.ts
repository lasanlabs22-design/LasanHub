import { CreatorProfile } from "../api/client";
import { colors } from "../theme/colors";

type Item = { key: string; label: string; done: boolean };

/**
 * How complete a profile is, weighted by what our team actually needs
 * to place work with this person. Deliberately different per role —
 * a vendor without a rate card is far less useful than one without a bio.
 */
export function profileStrength(p: CreatorProfile): {
  percent: number;
  items: Item[];
  missing: Item[];
} {
  const shared: Item[] = [
    { key: "name", label: "Your name", done: !!p.name?.trim() },
    { key: "photo", label: "Profile photo", done: !!p.photo_url },
    { key: "email", label: "Email address", done: !!p.email },
    { key: "city", label: "City", done: !!p.city },
    { key: "bio", label: "A short description", done: !!p.bio?.trim() },
  ];

  const byRole: Record<CreatorProfile["role"], Item[]> = {
    influencer: [
      {
        key: "instagram",
        label: "Instagram handle",
        done: !!p.instagram_id,
      },
      { key: "category", label: "What you post about", done: !!p.category },
      { key: "followers", label: "Follower count", done: !!p.followers },
      {
        key: "rate",
        label: "Rate per post",
        done: !!p.rate_per_post && p.rate_per_post > 0,
      },
    ],
    vendor: [
      { key: "company", label: "Company name", done: !!p.company_name },
      { key: "gst", label: "GST number", done: !!p.gst_number },
      {
        key: "services",
        label: "Services you offer",
        done: !!p.services?.length || !!p.other_service,
      },
      { key: "rateCard", label: "Rate card", done: !!p.rate_card?.trim() },
    ],
    freelancer: [
      { key: "skills", label: "Your skills", done: !!p.skills?.length },
      { key: "portfolio", label: "Portfolio link", done: !!p.portfolio_url },
      {
        key: "instagram",
        label: "Instagram handle",
        done: !!p.instagram_id,
      },
      { key: "rateCard", label: "Rate card", done: !!p.rate_card?.trim() },
    ],
  };

  const items = [...shared, ...(byRole[p.role] || byRole.influencer)];
  const done = items.filter((i) => i.done).length;

  return {
    percent: Math.round((done / items.length) * 100),
    items,
    missing: items.filter((i) => !i.done),
  };
}

/**
 * Plain language for how complete it is. `color` is for the bar and
 * icon; `textColor` is the darker shade that stays readable as text.
 */
export function strengthLabel(percent: number): {
  label: string;
  color: string;
  textColor: string;
} {
  if (percent === 100)
    return {
      label: "Complete",
      color: colors.success,
      textColor: colors.successText,
    };
  if (percent >= 75)
    return {
      label: "Strong",
      color: colors.success,
      textColor: colors.successText,
    };
  if (percent >= 50)
    return {
      label: "Getting there",
      color: colors.warning,
      textColor: colors.warningText,
    };
  return { label: "Needs work", color: colors.danger, textColor: colors.danger };
}

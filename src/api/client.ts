import { getAuthToken } from "../lib/auth";

const API_URL = "https://lasanmartapihono-production-a721.up.railway.app";
const TIMEOUT_MS = 15000;

export type CreatorStatus = "pending" | "approved" | "rejected" | "paused";

export type CreatorProfile = {
  id: string;
  phone: string;
  role: "influencer" | "vendor" | "freelancer";
  name: string;
  email: string | null;
  photo_url: string | null;
  instagram_id: string | null;
  followers: string | null;
  category: string | null;
  city: string | null;
  bio: string | null;
  rate_per_post: number | null;
  company_name: string | null;
  gst_number: string | null;
  services: string[] | null;
  other_service: string | null;
  portfolio_url: string | null;
  skills: string[] | null;
  rate_card: string | null;
  status: CreatorStatus;
  review_note: string | null;
  created_at: string;
};

export type CreatorRequest = {
  id: string;
  type: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token = await getAuthToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(data?.error || "Something went wrong.");
    }

    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    console.log("Network error:", err?.message);
    throw new ApiError("Couldn't reach our servers. Check your connection.");
  } finally {
    clearTimeout(timer);
  }
}

/** Their profile, or null if they haven't made one yet */
export async function fetchMyProfile(): Promise<CreatorProfile | null> {
  const data = await request("/influencers/me");
  return data.influencer || null;
}

export async function saveProfile(payload: {
  role: string;
  name: string;
  email?: string;
  photoUrl?: string;
  city?: string;
  bio?: string;
  instagramId?: string;
  followers?: string;
  category?: string;
  ratePerPost?: number;
  companyName?: string;
  gstNumber?: string;
  services?: string[];
  otherService?: string;
  portfolioUrl?: string;
  skills?: string[];
  rateCard?: string;
}): Promise<void> {
  await request("/influencers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyRequests(): Promise<CreatorRequest[]> {
  const data = await request("/influencers/requests");
  return data.requests || [];
}

export async function sendRequest(payload: {
  type: string;
  subject?: string;
  message: string;
}): Promise<void> {
  await request("/influencers/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type AssignedJob = {
  id: string;
  status:
    | "offered"
    | "accepted"
    | "declined"
    | "in_progress"
    | "completed"
    | "withdrawn";
  brief: string | null;
  decline_reason: string | null;
  partner_note: string | null;
  assigned_at: string;
  responded_at: string | null;
  completed_at: string | null;
  type: string;
  title: string | null;
  description: string | null;
  details: Record<string, any> | null;
  city: string | null;
  customer_name: string;
};

/** Work offered to this partner */
export async function fetchMyWork(): Promise<AssignedJob[]> {
  const data = await request("/influencers/work");
  return data.jobs || [];
}

/** Accept, decline, start or finish a job */
export async function updateJob(
  id: string,
  payload: { status: string; reason?: string; note?: string },
): Promise<void> {
  await request(`/influencers/work/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

const CLOUDINARY_CLOUD = "tpd2optn";
const CLOUDINARY_PRESET = "lasan_reels";

/**
 * Uploads a photo and returns a public URL.
 *
 * Gallery images are local file paths — they exist on one phone only,
 * so the console can't display them. Uploading gives a URL that works
 * everywhere.
 */
export async function uploadPhoto(uri: string): Promise<string> {
  // Already a web URL — Google sign-in photos come through like this
  if (uri.startsWith("http")) return uri;

  const form = new FormData();

  form.append("file", {
    uri,
    type: "image/jpeg",
    name: "profile.jpg",
  } as any);

  form.append("upload_preset", CLOUDINARY_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: "POST", body: form },
    );

    const data = await res.json();

    if (!data?.secure_url) {
      throw new ApiError("Could not upload the photo.");
    }

    return data.secure_url;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Could not upload the photo. Check your connection.");
  }
}

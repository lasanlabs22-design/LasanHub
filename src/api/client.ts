import { getAuthToken } from "../lib/auth";
import { devLog } from "../lib/log";
import { API_URL, CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from "../config";
import type { Role } from "../data/roles";

const TIMEOUT_MS = 15000;

export type CreatorStatus = "pending" | "approved" | "rejected" | "paused";

export type CreatorProfile = {
  id: string;
  phone: string;
  role: Role;
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
  /** HTTP status, or 0 when the server couldn't be reached */
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Called when the server rejects our token even after a fresh one —
 * the account was disabled or the session revoked. AuthContext signs
 * the person out rather than leaving them on empty screens.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function send(path: string, options: RequestInit, forceRefresh: boolean) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token = await getAuthToken(forceRefresh);

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(path: string, options: RequestInit = {}) {
  let res: Response;

  try {
    res = await send(path, options, false);

    // An expired token is normal — get a fresh one and try once more
    if (res.status === 401) {
      res = await send(path, options, true);
    }
  } catch (err: any) {
    devLog("Network error:", err?.message);
    throw new ApiError("Couldn't reach our servers. Check your connection.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    throw new ApiError(data?.error || "Something went wrong.", res.status);
  }

  return data;
}

/** Their profile, or null if they haven't made one yet. Throws if the server can't be reached. */
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

export type JobStatus =
  | "offered"
  | "accepted"
  | "declined"
  | "in_progress"
  | "completed"
  | "withdrawn";

export type AssignedJob = {
  id: string;
  status: JobStatus;
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
  payload: {
    status: "accepted" | "declined" | "in_progress" | "completed";
    reason?: string;
    note?: string;
  },
): Promise<void> {
  await request(`/influencers/work/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Uploads a photo and returns a public URL.
 *
 * XMLHttpRequest rather than fetch — React Native's fetch can't send
 * a file URI in FormData.
 */
export function uploadPhoto(uri: string): Promise<string> {
  // Already a web URL — Google sign-in photos arrive like this
  if (uri.startsWith("http")) return Promise.resolve(uri);

  return new Promise((resolve, reject) => {
    const form = new FormData();

    form.append("file", {
      uri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);

    form.append("upload_preset", CLOUDINARY_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.timeout = 60000;

    const fail = (message = "Could not upload the photo.") =>
      reject(new ApiError(message));

    xhr.onload = () => {
      if (xhr.status !== 200) {
        devLog("Cloudinary rejected the photo:", xhr.responseText);
        fail();
        return;
      }

      try {
        const data = JSON.parse(xhr.responseText);
        if (data?.secure_url) resolve(data.secure_url);
        else fail();
      } catch {
        fail();
      }
    };

    xhr.onerror = () =>
      fail("Could not upload the photo. Check your connection.");
    xhr.ontimeout = () =>
      fail("The upload took too long. Check your connection.");

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    );
    xhr.send(form);
  });
}

export type PartnerNotification = {
  id: string;
  assignment_id: string | null;
  type: "work" | "profile";
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/** Everything this partner has been told */
export async function fetchNotifications(): Promise<{
  notifications: PartnerNotification[];
  unread: number;
}> {
  const data = await request("/influencers/notifications");
  return {
    notifications: data.notifications || [],
    unread: data.unread || 0,
  };
}

/** Just the badge number. Never throws — a failed badge isn't worth an error. */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const data = await request("/influencers/notifications/count");
    return data.unread || 0;
  } catch {
    return 0;
  }
}

/** Mark one read, or all of them if no id is given */
export async function markNotificationsRead(id?: string): Promise<void> {
  try {
    await request("/influencers/notifications/read", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  } catch {
    // Not worth surfacing
  }
}

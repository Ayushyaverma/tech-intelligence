"use server";

import { readCollection, updateCollection } from "@/lib/store";

export interface NewsletterState {
  status: "idle" | "success" | "error";
  message: string;
}

// Pragmatic check (local@domain.tld); real verification happens via the email provider later.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter sign-up (used with useActionState in the footer form).
 * Stores subscribers in data/subscribers.json, de-duplicated by email.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Honeypot: real visitors never fill the hidden "company" field. Pretend success to bots.
  if (formData.get("company")) {
    return { status: "success", message: "Thanks — you're on the list." };
  }

  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  try {
    if (!readCollection("settings").newsletterEnabled) {
      return { status: "error", message: "Sign-ups are paused right now. Please check back soon." };
    }

    let alreadySubscribed = false;
    updateCollection("subscribers", (list) => {
      if (list.some((s) => s.email === email)) {
        alreadySubscribed = true;
        return list;
      }
      return [...list, { email, createdAt: new Date().toISOString() }];
    });

    return alreadySubscribed
      ? { status: "success", message: "You're already subscribed — see you on Sunday." }
      : { status: "success", message: "You're in. The next issue lands Sunday morning." };
  } catch (error) {
    console.error("[newsletter] failed to save subscriber", error);
    return { status: "error", message: "Something went wrong on our side. Please try again in a moment." };
  }
}

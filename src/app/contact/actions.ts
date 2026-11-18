"use server";

import { randomUUID } from "node:crypto";
import { CONTACT_TOPICS } from "@/components/editorial/contact-topics";
import { updateCollection } from "@/lib/store";

export interface ContactState {
  status: "idle" | "success" | "error";
  message: string;
  /** field-level errors */
  errors?: Partial<Record<"name" | "email" | "topic" | "message", string>>;
  /** echo of submitted values so the form keeps them after an error */
  values?: { name: string; email: string; topic: string; message: string };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(formData: FormData, key: string, max: number) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Contact form handler. Messages are stored in data/messages.json and shown in Admin → Inbox. */
export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot for bots.
  if (formData.get("website")) return { status: "success", message: "Thanks — we'll be in touch." };

  const values = {
    name: field(formData, "name", 120),
    email: field(formData, "email", 254).toLowerCase(),
    topic: field(formData, "topic", 60),
    message: field(formData, "message", 4000),
  };

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2) errors.name = "Please tell us your name.";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "Please enter a valid email address.";
  if (!(CONTACT_TOPICS as readonly string[]).includes(values.topic)) errors.topic = "Please choose a topic.";
  if (values.message.length < 10) errors.message = "Please write a little more (at least 10 characters).";
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", errors, values };
  }

  try {
    updateCollection("messages", (list) => [
      ...list,
      { id: `m_${randomUUID()}`, ...values, createdAt: new Date().toISOString() },
    ]);
    return { status: "success", message: "Thanks for getting in touch. We usually reply within two working days." };
  } catch (error) {
    console.error("[contact] failed to save message", error);
    return { status: "error", message: "Something went wrong on our side. Please try again shortly.", values };
  }
}

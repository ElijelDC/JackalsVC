import nodemailer from "nodemailer";
import { CONTACT_EMAIL } from "@/lib/contact";
import type { z } from "zod";
import type { contactSchema } from "@/lib/validations";

type ContactFormData = z.infer<typeof contactSchema>;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendContactEmail(data: ContactFormData) {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.info("[contact form]", { to: CONTACT_EMAIL, ...data });
      return;
    }
    throw new Error("Email delivery is not configured");
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: CONTACT_EMAIL,
    replyTo: data.email,
    subject: `[Jackals VC] ${data.subject}`,
    text: [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      "",
      data.message,
    ].join("\n"),
    html: [
      `<p><strong>Name:</strong> ${data.name}</p>`,
      `<p><strong>Email:</strong> ${data.email}</p>`,
      `<p><strong>Subject:</strong> ${data.subject}</p>`,
      `<p>${data.message.replace(/\n/g, "<br>")}</p>`,
    ].join(""),
  });
}

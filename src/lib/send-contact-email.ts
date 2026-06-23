import { getMailFromAddress, getMailTransporter } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/contact";
import type { z } from "zod";
import type { contactSchema } from "@/lib/validations";

type ContactFormData = z.infer<typeof contactSchema>;

function getTransporter() {
  return getMailTransporter();
}

export async function sendContactEmail(data: ContactFormData) {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error("Email delivery is not configured");
  }

  await transporter.sendMail({
    from: getMailFromAddress() ?? process.env.SMTP_USER,
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

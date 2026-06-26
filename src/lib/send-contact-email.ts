import { requireMailTransporter } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/contact";
import type { z } from "zod";
import type { contactSchema } from "@/lib/validations";

type ContactFormData = z.infer<typeof contactSchema>;

export async function sendContactEmail(data: ContactFormData) {
  const { transporter, from } = requireMailTransporter();

  await transporter.sendMail({
    from,
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

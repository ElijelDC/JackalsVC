"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiPost } from "@/lib/client-api";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await apiPost<{ success: boolean }>(
      "/api/contact",
      { name, email, subject, message },
      "Failed to send message",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Thanks — your message has been sent. We'll get back to you soon.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SuccessBanner message={success} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
          placeholder="Training, events, general questions..."
        />
      </div>
      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={6}
          placeholder="How can we help?"
        />
      </div>

      <FormError message={error} />

      <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}

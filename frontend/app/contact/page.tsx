"use client";

import { useState } from "react";
import { submitContactForm } from "@/lib/api";
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold text-[#444] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-[#666666] py-[10px] px-3 text-[13px] bg-[#555555] text-white placeholder-[#999999] outline-none focus:ring-2 focus:ring-[#468284]/30 focus:border-[#468284] transition-all";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General inquiry");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitContactForm({ name: name.trim(), email: email.trim(), subject, message: message.trim() });
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("General inquiry");
      setMessage("");
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-medium text-[#777] hover:text-[#1A1A1A] transition-colors mb-2"
      >
        <ArrowLeft size={13} /> Back
      </button>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#468284]/10 inline-flex items-center justify-center text-[#468284]">
          <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
        </div>
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-black tracking-tight text-[#1A1A1A]">Contact</h1>
          <p className="text-[11px] sm:text-[12px] text-[#777]">Get in touch with the ROMHAVEN team</p>
        </div>
      </div>

      {success ? (
        <div className="border border-[#468284]/30 bg-[#468284]/5 p-6 text-center">
          <CheckCircle size={32} className="mx-auto text-[#468284] mb-3" />
          <div className="text-[16px] font-bold text-[#1A1A1A]">Message Sent!</div>
          <p className="text-[13px] text-[#777] mt-1">We&rsquo;ll get back to you as soon as possible.</p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 text-[13px] text-[#468284] hover:text-[#4fb38c] font-semibold transition-colors"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 border border-red-800/30 bg-red-900/10 px-3 py-2 text-[12px] text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <Field label="Name">
            <input className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Subject">
            <select className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option>General inquiry</option>
              <option>DMCA request</option>
              <option>Bug report</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Message">
            <textarea rows={5} className={inputClass} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#468284] hover:bg-[#4fb38c] text-white font-bold text-[13px] transition-all shadow-[0_4px_16px_rgba(70,130,132,0.3)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}

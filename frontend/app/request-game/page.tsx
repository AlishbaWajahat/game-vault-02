"use client";

import { useEffect, useState } from "react";
import { fetchPlatforms, fetchCategories, submitContentRequest } from "@/lib/api";
import type { Platform, Category } from "@/lib/types";
import { Gamepad2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

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

export default function RequestGame() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("Any");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchPlatforms(), fetchCategories()])
      .then(([p, c]) => {
        setPlatforms(p);
        setCategories(c);
        if (p.length > 0) setPlatform(p[0].name);
        if (c.length > 0) setGenre(c[0].name);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitContentRequest({
        title: title.trim(),
        platform: platform || "PC",
      });
      setSuccess(true);
      setTitle("");
      setNotes("");
      setFormat("Any");
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="max-w-[560px] mx-auto">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-medium text-[#777] hover:text-[#1A1A1A] transition-colors mb-2"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#468284]/10 inline-flex items-center justify-center text-[#468284]">
            <Gamepad2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <div>
            <h1 className="text-[22px] sm:text-[28px] font-black tracking-tight text-[#1A1A1A]">Submit a Request</h1>
            <p className="text-[11px] sm:text-[12px] text-[#777]">Tell us what to add next. Most requests are reviewed within 48 hours.</p>
          </div>
        </div>

        {success ? (
          <div className="border border-[#468284]/30 bg-[#468284]/5 p-6 text-center">
            <CheckCircle size={32} className="mx-auto text-[#468284] mb-3" />
            <div className="text-[16px] font-bold text-[#1A1A1A]">Request Submitted!</div>
            <p className="text-[13px] text-[#777] mt-1">We&rsquo;ll review your request and add it if possible.</p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 text-[13px] text-[#468284] hover:text-[#4fb38c] font-semibold transition-colors"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 border border-red-800/30 bg-red-900/10 px-3 py-2 text-[12px] text-red-400">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <Field label="Title">
              <input className={inputClass} placeholder="e.g. Silent Hill 2, Photoshop 2025..." value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Platform">
              <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {platforms.map((p) => (
                  <option key={p.slug} value={p.name}>{p.name}</option>
                ))}
                {platforms.length === 0 && <option>Loading...</option>}
              </select>
            </Field>
            <Field label="Genre">
              <select className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {categories.length === 0 && <option>Loading...</option>}
              </select>
            </Field>
            <Field label="Preferred ROM Format">
              <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value)}>
                <option>Any</option>
                <option>.NSP</option>
                <option>.XCI</option>
                <option>.NSZ</option>
                <option>.ISO</option>
                <option>REPACK</option>
                <option>GOG</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea rows={4} className={inputClass} placeholder="Additional details, region, version..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#468284] hover:bg-[#4fb38c] text-white font-bold text-[13px] transition-all shadow-[0_4px_16px_rgba(70,130,132,0.3)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { createEvent } from "@/lib/actions";
import { TAGS } from "@/lib/constants";
import { useState } from "react";

export default function NewEventPage() {
  const [hasCatering, setHasCatering] = useState(false);
  const [hasRoom, setHasRoom] = useState(true);
  const [hasFlyer, setHasFlyer] = useState(false);
  const [hasSpeaker, setHasSpeaker] = useState(false);
  const [format, setFormat] = useState<"in_person" | "virtual" | "hybrid">("in_person");
  const [loading, setLoading] = useState(false);

  const needsRoom = format !== "virtual";

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Create New Event</h1>

      <form
        action={async (formData) => {
          setLoading(true);
          await createEvent(formData);
        }}
        className="space-y-8"
      >
        {/* ── Basic Info ── */}
        <section className="card p-6">
          <h2 className="section-title mb-4">Event Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Event Title *</label>
              <input name="title" className="input" placeholder="e.g. Climate Policy Brown Bag" required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" className="input" rows={3} placeholder="Brief description of the event..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date *</label>
                <input name="date" type="date" className="input" required />
              </div>
              <div>
                <label className="label">Time</label>
                <input name="time" className="input" placeholder="12:00 PM - 1:30 PM" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Semester</label>
                <input name="semester" className="input" placeholder="e.g. Spring 2026" />
              </div>
              <div>
                <label className="label">Event Budget ($)</label>
                <input name="budgetAmount" type="number" step="0.01" className="input" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="label">Tags</label>
              <div className="flex gap-3">
                {TAGS.map((tag) => (
                  <label key={tag} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="tags" value={tag} className="rounded" />
                    {tag.charAt(0) + tag.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Event Format ── */}
        <section className="card p-6">
          <h2 className="section-title mb-4">Event Format</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="format"
                value="in_person"
                checked={format === "in_person"}
                onChange={() => setFormat("in_person")}
                className="text-yale-blue"
              />
              <div>
                <div className="text-sm font-medium">🏫 In-Person</div>
                <div className="text-xs text-gray-500">Physical location only</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="format"
                value="virtual"
                checked={format === "virtual"}
                onChange={() => { setFormat("virtual"); setHasRoom(false); }}
                className="text-yale-blue"
              />
              <div>
                <div className="text-sm font-medium">💻 Virtual</div>
                <div className="text-xs text-gray-500">Fully online, no physical room needed</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="format"
                value="hybrid"
                checked={format === "hybrid"}
                onChange={() => { setFormat("hybrid"); setHasRoom(true); }}
                className="text-yale-blue"
              />
              <div>
                <div className="text-sm font-medium">🔀 Hybrid</div>
                <div className="text-xs text-gray-500">Both in-person and virtual attendance</div>
              </div>
            </label>

            {format !== "virtual" && (
              <div className="pt-2">
                <label className="label">Location</label>
                <input name="location" className="input" placeholder="e.g. Kroon Hall Room 321" />
              </div>
            )}

            {(format === "virtual" || format === "hybrid") && (
              <div className="pt-2">
                <label className="label">Virtual Meeting Link</label>
                <input name="virtualLink" type="url" className="input" placeholder="https://yale.zoom.us/j/..." />
              </div>
            )}
          </div>
        </section>

        {/* ── Speaker ── */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Speaker</h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hasSpeaker}
                onChange={(e) => setHasSpeaker(e.target.checked)}
                className="rounded"
              />
              Add a speaker
            </label>
          </div>

          {hasSpeaker && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Speaker Name</label>
                  <input name="speakerName" className="input" placeholder="Dr. Jane Smith" />
                </div>
                <div>
                  <label className="label">Organization</label>
                  <input name="speakerOrg" className="input" placeholder="NRDC" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input name="speakerEmail" type="email" className="input" placeholder="jane@org.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="speakerPhone" type="tel" className="input" placeholder="(202) 555-0123" />
                </div>
              </div>

              {/* Point of Contact */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Point of Contact (e.g. speaker&apos;s assistant)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input name="pocName" className="input" placeholder="Lisa Chen" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input name="pocEmail" type="email" className="input" placeholder="lchen@org.com" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input name="pocPhone" type="tel" className="input" placeholder="(202) 555-0199" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Workflow Toggles ── */}
        <section className="card p-6">
          <h2 className="section-title mb-4">Workflows</h2>
          <p className="text-sm text-gray-500 mb-4">
            Toggle the workflows you need for this event. You can always add them later.
          </p>

          {/* Catering */}
          <div className="border rounded-lg p-4 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={hasCatering}
                onChange={(e) => setHasCatering(e.target.checked)}
                className="rounded"
              />
              🍽️ Catering
            </label>
            <input type="hidden" name="hasCatering" value={hasCatering.toString()} />

            {hasCatering && (
              <div className="mt-4 pl-6 space-y-3 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Vendor</label>
                    <input name="cateringVendor" className="input" placeholder="e.g. Bon Appetit" />
                  </div>
                  <div>
                    <label className="label">Estimated Cost</label>
                    <input name="cateringCost" type="number" step="0.01" className="input" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="label">ezCater Link</label>
                  <input name="ezCaterLink" type="url" className="input" placeholder="https://www.ezcater.com/order/..." />
                </div>
                <div>
                  <label className="label">Menu Details</label>
                  <textarea name="cateringMenu" className="input" rows={2} placeholder="Sandwiches, salads, drinks..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Dietary Notes</label>
                    <input name="cateringDietary" className="input" placeholder="Vegetarian options, GF..." />
                  </div>
                  <div>
                    <label className="label">Expected Headcount</label>
                    <input name="cateringHeadcount" type="number" className="input" placeholder="30" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Room Reservation */}
          {needsRoom && (
            <div className="border rounded-lg p-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRoom}
                  onChange={(e) => setHasRoom(e.target.checked)}
                  className="rounded"
                />
                🏫 Room Reservation
              </label>
              <input type="hidden" name="hasRoom" value={hasRoom.toString()} />

              {hasRoom && (
                <div className="mt-4 pl-6 border-l-2 border-gray-200">
                  <label className="label">Preferred Room</label>
                  <input name="roomName" className="input" placeholder="e.g. Kroon 321, Burke Aud." />
                </div>
              )}
            </div>
          )}

          {/* Flyer */}
          <div className="border rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={hasFlyer}
                onChange={(e) => setHasFlyer(e.target.checked)}
                className="rounded"
              />
              📰 Flyer / Marketing
            </label>
            <input type="hidden" name="hasFlyer" value={hasFlyer.toString()} />
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating…" : "Create Event"}
          </button>
          <a href="/events" className="btn-secondary">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

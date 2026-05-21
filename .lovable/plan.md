# Apartment Handover Tracker — Build Plan

A mobile-first, photo-forward app for a homeowner and contractor to track every defect from an apartment handover protocol to verified completion. Built in the **Construction Practicalist** direction: zinc-neutral surfaces, white cards with thin rings, restrained status colors (red=critical, amber=in-progress, emerald=done/agreed), Inter typography, generous breathing room.

This first build is the full UI shell with realistic mock data so the flow feels real end-to-end. Backend (auth, PDF import, real photo upload, push reminders) is deliberately deferred — UI first, then we layer Cloud once the flow is approved.

## Design tokens

Copied verbatim from the chosen direction into `src/styles.css`:
- Surface: zinc-100 background, zinc-50 cards, white sub-cards with `ring-1 ring-black/5`
- Primary action: zinc-900 / white text
- Status: red-700 critical, amber-500 in-progress, emerald-600 agreed/fixed, blue-500 waiting
- Radius: 24px screen frames, 16px cards, 12px chips/buttons
- Type: Inter 400/500/600

## App shell

A persistent **phone frame** centered on the page (max-w ~420px, 24px rounded, ring) with a fixed bottom tab bar:
- Home · Defects · Suppliers · Timeline · Reports

Plus a floating **Add Defect** action. All screens render inside the frame so it always feels like a mobile app, even on desktop preview.

## Routes

```
/                    Dashboard (home)
/defects             Defect list + filters
/defects/$id         Defect detail
/defects/new         Add defect form
/suppliers           Supplier directory grouped by trade
/suppliers/$id       Supplier detail with related defects
/timeline            Shared timeline (scheduled / overdue / completed)
/reports             Reports & export
```

Each route gets its own `head()` with distinct title + description.

## Screens

1. **Dashboard** — "Apartment 402 Handover" header, 2×2 stat tiles (Open, Critical, Awaiting Me, Completed this week), big "Import Protocol PDF" + "Add Defect" buttons, Responsibility breakdown list (Contractor / Owner / Supplier with counts), Next Scheduled Fixes preview.

2. **Defect List** — Sticky header with filter chips (All / Critical / Needs Action / Contractor / Supplier / Room). Photo-left cards with room label, critical chip, title, trade, status dot + label. Sorted critical-first.

3. **Defect Detail** — Back header, before/after photo pair, Agreement Status banner (locked / waiting contractor / waiting owner / disputed), info grid (room, trade, priority, due date, owner, protocol ref), description, comments thread, activity timeline, sticky footer with Accept Fix / Request Rework / Contact Supplier / Assign actions.

4. **Add Defect** — Stepped form: photo capture, room picker, category, description, priority, suggested owner, due date, optional supplier link. Save as draft or submit.

5. **Supplier Directory** — Grouped by trade (Doors, Entrance Door, Aluminum/Windows, Kitchen, Sanitary, AC, Solar, MMAD). Each supplier card: name, domain, related-defect count, Call / Email buttons.

6. **Supplier Detail** — Contact actions + list of linked defects + "Create supplier task" button.

7. **Timeline** — Sectioned list: Today, This Week, Overdue (red), Recently Completed.

8. **Reports** — Preview cards for each report bundle (Open by priority, Contractor-owned, Owner-owned, Supplier-needed, Overdue, Completed). Buttons: Export PDF, Share to WhatsApp (mailto/wa.me link for now).

## Mock data

A single `src/data/mock.ts` with ~12 defects spanning rooms (Entrance, Living Room, Kitchen, Master Bedroom, Bath 1, Balcony) and trades, plus ~6 suppliers. Used everywhere so counts on Dashboard match list contents. Stored in-memory via a small Zustand store so Add Defect / Accept Fix actions feel live within a session.

## What's deferred (call out for next round)

- Lovable Cloud (auth + DB persistence + storage for photos)
- Real PDF import / AI extraction (UI placeholder only)
- Push notifications
- Real PDF/WhatsApp export
- RTL/Hebrew toggle (structure will be RTL-safe — logical properties — but no translation layer yet)

## Technical notes

- TanStack Start file-based routes under `src/routes/`
- Components in `src/components/` (PhoneFrame, BottomTabBar, DefectCard, StatusChip, PriorityChip, OwnerChip, AgreementBanner, etc.)
- Image placeholders rendered via `generate_image` per the chosen direction's `data-lov-image-placeholder` blocks (defect photos saved to `src/assets/`)
- All colors via semantic Tailwind classes — no inline hex

# Mostly Just Storage Studio — launch site

This is a simple static website for mostlyjuststorage.studio.

## What is included
- `index.html` — public website
- `styles.css` — visual design
- `app.js` — public event rendering
- `events.js` — default event data
- `admin.html` — draft admin/event editor
- `admin.js` — temporary local admin logic
- `thanks.html` — booking form success page

## Important
The admin page is only a draft/local editor. It is not a secure production backend because static websites expose their JavaScript. Use it for drafting events, then connect a real backend later.

Temporary admin password: `storage`
Change it in `admin.js`.

## Quick launch options
1. Upload the folder to Netlify, Vercel, GitHub Pages, or your web host.
2. Point `mostlyjuststorage.studio` to the host.
3. Replace placeholder email, Instagram, phone, and address details.
4. Replace the default events in `events.js`.
5. Replace the pricing if needed.

## Form note
The booking form uses Netlify form attributes. It will collect submissions automatically only when hosted on Netlify with forms enabled. On other hosts, connect the form to your own endpoint or replace it with a mailto/booking link.

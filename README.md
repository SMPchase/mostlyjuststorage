# Mostly Just Storage

Public website for [mostlyjuststorage.studio](https://mostlyjuststorage.studio/), deployed from `main` with GitHub Pages.

## How it works

- The public site is plain HTML, CSS, and JavaScript in this repository.
- Published events, rates, location copy, and booking availability load from the Saint Jules API.
- Booking requests are validated and stored in the private Saint Jules database. No contact details are stored in the visitor's browser.
- Studio management lives at [studio.saintjules.org](https://studio.saintjules.org/) behind Cloudflare Access. Open **Mostly Just Storage** there to manage events, inquiries, and public settings.

The public API is hosted at `https://room.saintjules.org/api/mjs`. Owner-only routes stay on the Access-protected Studio host.

## Local preview

Any static server works. For example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`. The production API only permits the production website origins, so the local preview intentionally shows its calendar fallback and cannot submit real bookings.

## Verification

```sh
node --test tests/*.test.mjs
```

The checks guard the public/private boundary, form wiring, required metadata, and removal of the old browser-only admin system.

## Publishing

Push an approved change to `main`. GitHub Pages serves the repository root using the domain in `CNAME`.

Do not add admin passwords, API secrets, or booking data to this repository. The public site needs no secret keys.

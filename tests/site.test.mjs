import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("the public page is wired to the real API without a public admin", async () => {
  const [html, script] = await Promise.all([read("index.html"), read("assets/site.js")]);
  assert.match(script, /https:\/\/room\.saintjules\.org/);
  assert.match(script, /\/api\/mjs\/bookings/);
  assert.match(script, /response\.ok/);
  assert.doesNotMatch(`${html}\n${script}`, /localStorage|adminPassword|data-netlify/i);
  assert.doesNotMatch(html, /id=["']admin["']/i);
});

test("booking fields are typed, separated, and honestly described", async () => {
  const html = await read("index.html");
  for (const field of ["name", "email", "phone", "sessionType", "preferredDate", "preferredTime", "message", "website"]) {
    assert.match(html, new RegExp(`name=["']${field}["']`));
  }
  assert.match(html, /type="email"/);
  assert.match(html, /type="date"/);
  assert.match(html, /method="post"/);
  assert.match(html, /This is a request, not an automatic reservation/);
});

test("site metadata, navigation, accessibility, and fallback pages are present", async () => {
  const [html, css, notFound, robots, sitemap] = await Promise.all([
    read("index.html"),
    read("assets/site.css"),
    read("404.html"),
    read("robots.txt"),
    read("sitemap.xml"),
  ]);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /class="mobile-nav"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--pink:\s*#f53e8e/);
  assert.match(css, /--yellow:\s*#f4e74d/);
  assert.match(notFound, /404 \/ wrong closet/);
  assert.match(robots, /Sitemap:/);
  assert.match(sitemap, /mostlyjuststorage\.studio/);
});

test("event rendering uses text nodes and rejects unsafe links", async () => {
  const script = await read("assets/site.js");
  assert.match(script, /textContent/);
  assert.doesNotMatch(script, /innerHTML/);
  assert.match(script, /parsed\.protocol !== "https:"/);
  assert.match(script, /event\.status === "cancelled"/);
  assert.match(script, /event\.date >= easternToday\(\)/);
});

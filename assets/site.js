(() => {
  "use strict";

  const API_ROOT = "https://room.saintjules.org";
  const DEFAULT_EMAIL = "booking@mostlyjuststorage.studio";
  const DEFAULT_INSTAGRAM = "https://www.instagram.com/mostlyjuststorage";
  const eventList = document.querySelector("#event-list");
  const eventStatus = document.querySelector("#event-status");
  const bookingForm = document.querySelector("#booking-form");
  const bookingStatus = document.querySelector("#booking-status");

  function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function cleanText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function money(value, fallback) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return fallback;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }

  function easternToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function eventDateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Date TBA";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Date TBA";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function timeLabel(value) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "";
    const [hour, minute] = value.split(":").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: minute ? "2-digit" : undefined,
    }).format(new Date(2000, 0, 1, hour, minute));
  }

  function eventTimeLabel(event) {
    const start = timeLabel(cleanText(event.startTime));
    const end = timeLabel(cleanText(event.endTime));
    if (!start) return "Time TBA";
    return end ? `${start}–${end} ET` : `${start} ET`;
  }

  function safeActionUrl(value) {
    const candidate = cleanText(value);
    if (!candidate) return null;
    try {
      const parsed = new URL(candidate, window.location.origin);
      if (parsed.protocol !== "https:" && parsed.origin !== window.location.origin) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function normalizeEvent(value) {
    const event = asRecord(value);
    const action = asRecord(event.action);
    const status = cleanText(event.status, "published");
    return {
      id: cleanText(event.id),
      title: cleanText(event.title, "Untitled event"),
      type: cleanText(event.type, "Event"),
      description: cleanText(event.description),
      date: cleanText(event.date),
      startTime: cleanText(event.startTime),
      endTime: cleanText(event.endTime),
      location: cleanText(event.location, "Mostly Just Storage"),
      status: status === "cancelled" ? "cancelled" : "published",
      actionLabel: cleanText(action.label, "Details"),
      actionUrl: cleanText(action.url),
    };
  }

  function renderEvents(values) {
    if (!eventList || !eventStatus) return;
    const events = Array.isArray(values)
      ? values.map(normalizeEvent).filter((event) => event.date >= easternToday())
      : [];
    events.sort((left, right) =>
      `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`),
    );
    eventList.replaceChildren();

    if (!events.length) {
      eventStatus.hidden = false;
      eventStatus.textContent = "No public dates are on the board right now. New events will appear here when they’re confirmed.";
      return;
    }

    eventStatus.hidden = true;
    for (const event of events) {
      const card = element("article", "event-card");
      if (event.status === "cancelled") card.classList.add("is-cancelled");

      const date = element("time", "event-date", eventDateLabel(event.date));
      date.dateTime = event.date;
      card.append(date);

      const body = element("div", "event-body");
      body.append(element("p", "event-type", event.type));
      body.append(element("h3", "", event.title));
      if (event.description) body.append(element("p", "event-description", event.description));
      card.append(body);

      const meta = element("div", "event-meta");
      if (event.status === "cancelled") {
        meta.append(element("span", "event-badge", "Cancelled"));
      }
      meta.append(element("p", "", eventTimeLabel(event)));
      meta.append(element("p", "", event.location));
      const url = event.status === "cancelled" ? null : safeActionUrl(event.actionUrl);
      if (url) {
        const action = element("a", "event-action", `${event.actionLabel} →`);
        action.href = url.href;
        if (url.origin !== window.location.origin) {
          action.target = "_blank";
          action.rel = "noopener";
        }
        meta.append(action);
      }
      card.append(meta);
      eventList.append(card);
    }

    const structuredEvents = events
      .filter((event) => event.status !== "cancelled")
      .map((event) => ({
        "@type": "Event",
        name: event.title,
        startDate: `${event.date}${event.startTime ? `T${event.startTime}:00` : ""}`,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.location,
          address: { "@type": "PostalAddress", addressLocality: "Havre de Grace", addressRegion: "MD" },
        },
        description: event.description || undefined,
        url: safeActionUrl(event.actionUrl)?.href || "https://mostlyjuststorage.studio/#events",
      }));
    if (structuredEvents.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": structuredEvents,
      });
      document.head.append(script);
    }
  }

  function applySettings(value) {
    const settings = asRecord(value);
    const roomRate = money(settings.roomRate, "$35");
    const assistedRate = money(settings.assistedRate, "$75");
    const location = cleanText(settings.location, "Havre de Grace, Maryland");
    const email = cleanText(settings.contactEmail, DEFAULT_EMAIL);
    const instagram = safeActionUrl(cleanText(settings.instagramUrl, DEFAULT_INSTAGRAM));

    document.querySelectorAll("[data-room-rate]").forEach((node) => {
      node.textContent = roomRate;
    });
    document.querySelectorAll("[data-assisted-rate]").forEach((node) => {
      node.textContent = assistedRate;
    });
    document.querySelectorAll("[data-location]").forEach((node) => {
      node.textContent = location;
    });
    document.querySelectorAll("[data-contact-email]").forEach((node) => {
      node.textContent = email;
      node.href = `mailto:${encodeURIComponent(email)}`;
    });
    if (instagram) {
      document.querySelectorAll("[data-instagram]").forEach((node) => {
        node.href = instagram.href;
      });
    }
    const availability = document.querySelector("[data-availability]");
    if (availability) {
      availability.textContent = cleanText(
        settings.availabilityNote,
        "Booking studio sessions by request.",
      );
    }

    if (settings.bookingOpen === false && bookingForm && bookingStatus) {
      bookingForm.querySelectorAll("input, select, textarea, button").forEach((control) => {
        control.disabled = true;
      });
      bookingStatus.className = "form-status is-error";
      bookingStatus.textContent = cleanText(
        settings.availabilityNote,
        "Booking requests are paused right now. Please email the studio.",
      );
    }
  }

  async function loadPublicData() {
    try {
      const response = await fetch(`${API_ROOT}/api/mjs`, {
        headers: { Accept: "application/json" },
        credentials: "omit",
      });
      const payload = await response.json();
      if (!response.ok || payload.ok !== true) throw new Error("Calendar request failed");
      applySettings(payload.settings);
      renderEvents(payload.events);
    } catch {
      if (eventStatus) {
        eventStatus.hidden = false;
        eventStatus.textContent = "The live calendar couldn’t load. Check Instagram for current dates, or try again in a moment.";
      }
    }
  }

  function apiErrorMessage(payload, fallback) {
    const body = asRecord(payload);
    const error = asRecord(body.error);
    return cleanText(error.message) || cleanText(body.message) || fallback;
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!bookingForm || !bookingStatus) return;
    if (!bookingForm.reportValidity()) return;

    const submitButton = bookingForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    bookingForm.setAttribute("aria-busy", "true");
    bookingStatus.className = "form-status";
    bookingStatus.textContent = "Sending your request…";

    const formData = new FormData(bookingForm);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch(`${API_ROOT}/api/mjs/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "omit",
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(apiErrorMessage(body, "The request couldn’t be sent. Please try again."));
      }
      bookingForm.reset();
      bookingStatus.className = "form-status is-success";
      bookingStatus.textContent = cleanText(
        body.message,
        "Your request is in. The studio will reply by email.",
      );
      bookingStatus.focus?.();
    } catch (error) {
      bookingStatus.className = "form-status is-error";
      bookingStatus.replaceChildren();
      bookingStatus.append(
        document.createTextNode(
          `${error instanceof Error ? error.message : "The request couldn’t be sent."} `,
        ),
      );
      const email = document.querySelector("[data-contact-email]")?.textContent || DEFAULT_EMAIL;
      const fallback = element("a", "", "Email the studio instead.");
      fallback.href = `mailto:${encodeURIComponent(email)}`;
      bookingStatus.append(fallback);
    } finally {
      bookingForm.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
    }
  }

  const dateInput = bookingForm?.querySelector('input[name="preferredDate"]');
  if (dateInput) dateInput.min = easternToday();
  bookingForm?.addEventListener("submit", submitBooking);
  document.querySelectorAll(".mobile-nav nav a").forEach((link) => {
    link.addEventListener("click", () => link.closest("details")?.removeAttribute("open"));
  });

  void loadPublicData();
})();

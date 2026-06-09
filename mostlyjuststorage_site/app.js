function getEvents() {
  const local = localStorage.getItem('mjs_events');
  if (local) {
    try { return JSON.parse(local); } catch (error) { console.warn(error); }
  }
  return window.DEFAULT_EVENTS || [];
}

function formatEventDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function renderEvents(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const events = getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
  target.innerHTML = '';

  if (!events.length) {
    target.innerHTML = '<article class="event-card"><p>No public events are listed yet. Check back soon or ask about booking the room.</p></article>';
    return;
  }

  for (const event of events) {
    const article = document.createElement('article');
    article.className = 'event-card';
    const link = event.link ? `<a class="text-link" href="${event.link}">RSVP / details →</a>` : '<span class="muted">Details soon</span>';
    article.innerHTML = `
      <div class="event-date"><strong>${formatEventDate(event.date)}</strong><span>${event.time || 'TBA'}</span></div>
      <div class="event-copy">
        <p class="event-type">${event.type || 'Event'}</p>
        <h3>${event.title}</h3>
        <p>${event.description}</p>
        ${link}
      </div>
    `;
    target.appendChild(article);
  }
}

document.getElementById('year')?.append(new Date().getFullYear());
renderEvents('events-list');

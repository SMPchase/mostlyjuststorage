const TEMP_PASSWORD = 'storage';

const loginCard = document.getElementById('login-card');
const editorCard = document.getElementById('editor-card');
const loginButton = document.getElementById('login-button');
const passwordInput = document.getElementById('admin-password');
const eventForm = document.getElementById('event-form');
const adminEvents = document.getElementById('admin-events');
const downloadButton = document.getElementById('download-json');
const clearButton = document.getElementById('clear-events');

function readEvents() {
  const local = localStorage.getItem('mjs_events');
  if (local) {
    try { return JSON.parse(local); } catch (error) { console.warn(error); }
  }
  return window.DEFAULT_EVENTS || [];
}

function saveEvents(events) {
  localStorage.setItem('mjs_events', JSON.stringify(events, null, 2));
  renderAdminEvents();
}

function renderAdminEvents() {
  const events = readEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
  adminEvents.innerHTML = '';
  for (const event of events) {
    const item = document.createElement('article');
    item.className = 'event-card';
    item.innerHTML = `
      <div class="event-date"><strong>${event.date}</strong><span>${event.time}</span></div>
      <div class="event-copy">
        <p class="event-type">${event.type || 'Event'}</p>
        <h3>${event.title}</h3>
        <p>${event.description}</p>
      </div>
    `;
    adminEvents.appendChild(item);
  }
}

loginButton?.addEventListener('click', () => {
  if (passwordInput.value === TEMP_PASSWORD) {
    loginCard.classList.add('hidden');
    editorCard.classList.remove('hidden');
    renderAdminEvents();
  } else {
    alert('Wrong password.');
  }
});

passwordInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loginButton.click();
});

eventForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const newEvent = {
    title: document.getElementById('event-title').value.trim(),
    date: document.getElementById('event-date').value,
    time: document.getElementById('event-time').value.trim(),
    type: document.getElementById('event-type').value.trim(),
    description: document.getElementById('event-description').value.trim(),
    link: document.getElementById('event-link').value.trim()
  };
  const events = readEvents();
  events.push(newEvent);
  saveEvents(events);
  eventForm.reset();
});

downloadButton?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(readEvents(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'events.json';
  link.click();
  URL.revokeObjectURL(url);
});

clearButton?.addEventListener('click', () => {
  if (confirm('Clear draft events from this browser?')) {
    localStorage.removeItem('mjs_events');
    renderAdminEvents();
  }
});

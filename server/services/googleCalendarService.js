const { google } = require('googleapis');
const GmailToken = require('../models/GmailToken');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) return null;
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function isConfigured() {
  return !!getOAuthClient();
}

function authUrl(state) {
  const client = getOAuthClient();
  if (!client) return null;
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
}

async function exchangeCode(code) {
  const client = getOAuthClient();
  if (!client) throw new Error('Google OAuth not configured');
  const { tokens } = await client.getToken(code);
  return tokens;
}

async function clientForUser(userId) {
  const client = getOAuthClient();
  if (!client) return null;
  const tok = await GmailToken.findOne({ user: userId });
  if (!tok) return null;
  client.setCredentials({
    access_token: tok.accessToken,
    refresh_token: tok.refreshToken,
    expiry_date: tok.expiresAt ? new Date(tok.expiresAt).getTime() : undefined,
    scope: tok.scope,
    token_type: tok.tokenType,
  });
  // Persist refreshed tokens back to Mongo
  client.on('tokens', async (next) => {
    try {
      const update = {};
      if (next.access_token) update.accessToken = next.access_token;
      if (next.refresh_token) update.refreshToken = next.refresh_token;
      if (next.expiry_date) update.expiresAt = new Date(next.expiry_date);
      if (next.scope) update.scope = next.scope;
      if (Object.keys(update).length) {
        await GmailToken.updateOne({ user: userId }, update);
      }
    } catch (e) { console.error('token refresh save:', e.message); }
  });
  return client;
}

async function listUpcomingEvents(userId, { maxResults = 25 } = {}) {
  const auth = await clientForUser(userId);
  if (!auth) return null;
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items || [];
}

// Create an event on the organizer's calendar with a Google Meet link.
// Returns { eventId, htmlLink, meetUrl } or throws on failure.
async function createEventWithMeet(organizerUserId, {
  summary, description, startTime, durationMinutes = 60, attendees = [],
}) {
  const auth = await clientForUser(organizerUserId);
  if (!auth) throw new Error('Organizer has not linked Google Calendar');
  const calendar = google.calendar({ version: 'v3', auth });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: attendees.filter(Boolean).map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `istudent-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetUrl = res.data.hangoutLink
    || res.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri
    || null;

  return { eventId: res.data.id, htmlLink: res.data.htmlLink, meetUrl };
}

async function deleteEvent(userId, eventId) {
  const auth = await clientForUser(userId);
  if (!auth) return;
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' });
  } catch (e) {
    console.error('calendar delete:', e.message);
  }
}

module.exports = {
  SCOPES,
  isConfigured,
  authUrl,
  exchangeCode,
  listUpcomingEvents,
  createEventWithMeet,
  deleteEvent,
};

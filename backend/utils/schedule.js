export function weekday(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return '';
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return '';
  return parsed.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}
export function validateSession(body) {
  if (!weekday(body.date)) return 'A valid session date is required';
  if (![body.startTime, body.endTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || ''))) return 'Valid start and end times are required';
  if (body.endTime <= body.startTime) return 'End time must be after start time';
  return null;
}

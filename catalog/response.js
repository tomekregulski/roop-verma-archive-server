// Explicit catalog metadata DTOs, including nested relation/management results.
// Unknown future fields are omitted so storage locators cannot leak by default.
const fields = {
  track: 'id trackId tapeId ragaId primaryArtistId plays alap jor jhalla slowGat mediumGat fastGat accompanied notes audioQuality mediaTypeId public',
  artist: 'id name', category: 'id name', location: 'id name', mediaType: 'id name',
  event: 'id eventName date locationId categoryId notes',
  tape: 'id tapeId eventId', raga: 'id name alternateSpelling time rasa',
};
const relations = {
  track: { tape: 'tape', raga: 'raga', mediaType: 'mediaType', primaryArtist: 'artist' },
  artist: { primaryTracks: 'track' }, category: { events: 'event' }, location: { events: 'event' },
  mediaType: { tracks: 'track' }, event: { location: 'location', category: 'category', tapes: 'tape' },
  tape: { event: 'event', tracks: 'track' }, raga: { tracks: 'track' },
};
function project(model, value) {
  if (Array.isArray(value)) return value.map(row => project(model, row));
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const key of fields[model].split(' ')) {
    if (Object.hasOwn(value, key) && (value[key] === null || ['string', 'number', 'boolean'].includes(typeof value[key]))) result[key] = value[key];
  }
  for (const [key, related] of Object.entries(relations[model])) {
    if (Object.hasOwn(value, key)) result[key] = project(related, value[key]);
  }
  return result;
}
const models = { track: 'track', artist: 'artist', category: 'category', location: 'location',
  'media-type': 'mediaType', event: 'event', tape: 'tape', raga: 'raga' };
function catalogResponse(req, res, next) {
  const segments = req.path.split('/').filter(Boolean);
  // Express routes are case-insensitive by default; projection must match them.
  const resource = segments[0]?.toLowerCase();
  const operation = segments[1]?.toLowerCase();
  const model = models[resource];
  const issuance = resource === 'track' && req.method === 'POST' && segments.length === 4 && segments[2].toLowerCase() === 'playback-access';
  const telemetry = resource === 'track' && req.method === 'POST' && segments.length === 3 && operation === 'track-play';
  if (model && !telemetry && !issuance) {
    res.set('Cache-Control', 'no-store');
    const json = res.json;
    res.json = function (body) {
      if (res.statusCode < 400) body = body && Object.hasOwn(body, 'data')
        ? { data: project(model, body.data) } : project(model, body);
      return json.call(this, body);
    };
  }
  next();
}
module.exports = { project, catalogResponse };

// Tracks event timestamps per user to detect spam.
// userId -> { eventName -> [timestamps] }
const eventLog = new Map();

const LIMITS = {
  send_message: { max: 10, windowMs: 10000 },  // 10 messages per 10 seconds
  send_dm: { max: 10, windowMs: 10000 },
  typing_start: { max: 20, windowMs: 10000 },
};

function isRateLimited(userId, eventName) {
  const limit = LIMITS[eventName];
  if (!limit) return false; // no limit configured for this event, allow it

  const key = userId + ':' + eventName;
  const now = Date.now();

  if (!eventLog.has(key)) {
    eventLog.set(key, []);
  }

  const timestamps = eventLog.get(key);

  // Drop timestamps outside the current window
  const cutoff = now - limit.windowMs;
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift();
  }

  if (timestamps.length >= limit.max) {
    return true; // rate limited
  }

  timestamps.push(now);
  return false;
}

function clearUser(userId) {
  for (const key of eventLog.keys()) {
    if (key.startsWith(userId + ':')) {
      eventLog.delete(key);
    }
  }
}

module.exports = { isRateLimited, clearUser };
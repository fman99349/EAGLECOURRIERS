// Excludes ambiguous chars (0/O, 1/I) for human-readable IDs
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(len = 4) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return s;
}

function generateOrderNumber() {
  return `EGL-${randomSegment()}-${randomSegment()}`;
}

module.exports = { generateOrderNumber };
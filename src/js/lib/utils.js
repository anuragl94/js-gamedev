export function choose(...array) {
  return Math.floor(Math.random() * array.length);
}

export function random(min, max, realNumbers = false) {
  if (realNumbers) {
    return min + Math.random() * (max - min);
  }
  return min + Math.floor(Math.random() * (max - min));
}

export function checkOverlap(d1bounds, d2bounds) {
  return (
    d1bounds.x < d2bounds.x + d2bounds.width &&
    d1bounds.x + d1bounds.width > d2bounds.x &&
    d1bounds.y < d2bounds.y + d2bounds.height &&
    d1bounds.height + d1bounds.y > d2bounds.y
  );
}
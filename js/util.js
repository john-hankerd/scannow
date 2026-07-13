export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function isMinorFromBirthdate(birthdate) {
  const dob = new Date(birthdate + 'T00:00:00');
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return { age, isMinor: age < 18 };
}

export function randomToken(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

export function connectionIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

export function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Builds an absolute URL for another page in this app, correctly handling
// being served from a subpath (e.g. 40thfloor.com/scannow/) as well as
// the app's own root domain. Do not use window.location.origin alone for
// this — it never includes the subpath.
export function appUrl(path) {
  const base = window.location.pathname.replace(/[^/]*$/, '');
  return window.location.origin + base + path;
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Renders an avatar as an HTML string: the person's photo if they have one,
// otherwise their initials. photoUrl is always a data: URI we generated
// ourselves via resizeImageToDataUrl (base64 only, no quotes/parens), so
// it's safe to interpolate directly into an src attribute.
export function avatarHtml(photoUrl, firstName, sizeClass = '', extraStyle = '') {
  const cls = sizeClass ? `avatar ${sizeClass}` : 'avatar';
  const style = extraStyle ? ` style="${extraStyle}"` : '';
  if (photoUrl) return `<div class="${cls}"${style}><img src="${photoUrl}" alt=""></div>`;
  return `<div class="${cls}"${style}>${initials(firstName)}</div>`;
}

// Reads an image file, center-crops it to a square, and downsizes it to a
// small JPEG data URL — small enough to store directly on the user's
// Firestore profile doc (well under the 1MB document limit) without needing
// Firebase Storage set up.
export function resizeImageToDataUrl(file, maxSize = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

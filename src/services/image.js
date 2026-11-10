// Photos are resized and compressed IN THE BROWSER, then stored as a base64 JPEG
// string inside the catch's Firestore document. This avoids Firebase Storage (which
// can require a billing plan on new projects). Firestore documents max out at 1 MiB,
// so we aim for <= ~350 KB of base64.
//
// Switching to Firebase Storage later (optional, needs Blaze plan for new projects):
//   1. Enable Storage in the console and add storage.rules allowing
//      users/{uid}/** only for request.auth.uid == uid.
//   2. Here, upload the Blob from canvas.toBlob() with uploadBytes(ref(storage,
//      `users/${uid}/catches/${id}.jpg`), blob), then getDownloadURL().
//   3. Save `photoUrl` on the catch instead of `photo`, and show <img src={photoUrl}>.
const MAX_DIM = 800;
const TARGET_CHARS = 350_000;

export async function compressImage(file) {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > TARGET_CHARS && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > 900_000) throw new Error('Photo is too large even after compression. Try another photo.');
  return { dataUrl, width: w, height: h, kb: Math.round(dataUrl.length / 1024) };
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      // Respects the phone camera's rotation (EXIF orientation).
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* fall through (e.g. HEIC on some browsers) */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image. Try a JPEG or PNG.'));
    img.src = URL.createObjectURL(file);
  });
}

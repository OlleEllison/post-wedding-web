# Allow shared photo deletion and scalable downloads

## Changes
- Make every photo returned by the protected guest API selectable for deletion.
- Update the protected delete action so any guest with a valid signed wedding-site session can remove a photo and its stored file, rather than limiting deletion to the original uploader.
- Keep deletion available only through the existing “Ta bort bilder” bulk-selection mode; do not restore delete controls directly on images or in the lightbox.
- Replace the 300-image ZIP rejection with bounded sequential ZIP parts. All selected photos will be downloaded, while each archive is kept to a safe size so large galleries do not exhaust browser memory. Small selections still produce one ZIP; large selections may produce numbered ZIP files.
- Report progress and partial fetch failures clearly instead of silently producing an incomplete archive.
- Restore the standard Vite `/src/main.tsx` entry and remove the currently referenced stale compiled assets so the next publish includes these changes.

## Technical details
- Keep table and storage access locked behind the existing signed-session edge function.
- Remove uploader ownership checks only for photo deletion; memory deletion ownership remains unchanged.
- Build and release each ZIP part before fetching the next part to bound peak browser memory.
- Deploy the updated guest-content function, then verify the app build and the delete/download UI flow.

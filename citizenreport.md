Act as a senior full-stack developer. Update my Next.js (App Router) BlueWaste System `/citizen/report` page with the following flow:

FEATURE FLOW:
When the user opens `/citizen/report`, immediately show options to:
- Take a photo (camera access)
- Upload an image

After image selection:
1. Show image preview
2. Automatically get user's location using GPS (navigator.geolocation)
3. Display the location on a map (use Leaflet)
4. Allow user to confirm or adjust location

Then show a report form with:
- Image preview
- Detected/selected waste type (manual or AI-ready)
- Location (auto-filled from GPS)
- Optional description

Add a submit button to save the report.

REQUIREMENTS:
- Mobile-friendly camera support
- Real-time location detection
- Interactive map display
- Clean, modern UI (Tailwind CSS)
- Proper loading states (getting location, uploading image)
- Error handling (location denied, upload issues)

OUTPUT:
Provide complete updated `/citizen/report` page with UI, logic, and integration for image capture, GPS location, and map display.
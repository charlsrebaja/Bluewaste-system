Act as a senior full-stack developer. Enhance my existing BlueWaste System built with Next.js (App Router) by implementing an AI-powered waste detection feature with the following requirements:

FEATURE OVERVIEW:
Implement a flow where a citizen can upload an image of waste, and the system uses AI to detect and classify the waste type (Recyclable, Non-recyclable, Organic).

TECH STACK:
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Next.js API Routes / Server Actions
- AI Integration: Google Cloud Vision API (for image labeling)

CORE FUNCTIONALITY:

1. IMAGE UPLOAD UI:
- Create a clean, responsive upload component/page (/report-waste)
- Allow:
  - File upload
  - Camera capture (mobile-friendly)
- Show image preview before submission
- Add a submit button: “Analyze Waste”

2. API ROUTE (AI PROCESSING):
- Create an API route: /api/analyze-waste
- Accept POST request with image file
- Convert image to base64
- Send request to Google Cloud Vision API for label detection
- Extract relevant labels (e.g., plastic, bottle, food, metal)

3. CLASSIFICATION LOGIC:
- Map AI labels into waste categories:
  - Plastic, bottle, can → Recyclable
  - Food, leaves → Organic
  - Mixed/unknown → Non-recyclable
- Return:
  {
    detectedObject: string,
    wasteType: "Recyclable" | "Non-recyclable" | "Organic",
    confidence: number
  }

4. RESULT DISPLAY UI:
- Show:
  - Uploaded image
  - Detected object
  - Waste classification
  - Confidence score
- Use badges/colors for categories:
  - Green → Recyclable
  - Yellow → Organic
  - Red → Non-recyclable

5. DATABASE INTEGRATION:
- Save record after detection:
  - image URL (store locally or cloud e.g. Cloudinary)
  - detected object
  - waste type
  - timestamp
  - optional location (if available)
- Create a model/schema: WasteReport

6. OPTIONAL ENHANCEMENTS:
- Add loading state (“Analyzing image…”)
- Error handling (invalid image / API failure)
- Add geolocation (navigator.geolocation)
- Add history page (/my-reports)

7. CODE REQUIREMENTS:
- Use clean modular structure
- Use async/await properly
- Include comments for clarity
- Follow Next.js best practices (App Router, server actions if needed)

8. SECURITY:
- Validate file type and size
- Protect API key using environment variables

OUTPUT:
- Provide full working code:
  - Upload UI component
  - API route
  - Classification helper function
  - Database model/schema
- Ensure everything is production-ready and easy to integrate into an existing Next.js project

GOAL:
The system should allow citizens to upload waste images, automatically detect the waste type using AI, classify it, display the result, and store it for environmental monitoring.
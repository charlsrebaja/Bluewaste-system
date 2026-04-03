Enhance my existing FastAPI + YOLOv8 detection API by adding a decision-making system for a BlueWaste image processing application.

Current behavior:

* The API accepts an uploaded image
* Runs YOLOv8 detection using Ultralytics
* Returns detected objects with class, confidence, and bounding box

Required improvements:

1. Define a list of waste-related classes:
   Example:
   WASTE_CLASSES = ["bottle", "cup"]

2. Modify the detection loop to:

   * Count only objects that belong to WASTE_CLASSES
   * Apply a confidence threshold (e.g., confidence > 0.5)

3. Add a variable:
   waste_count = total number of detected waste objects

4. Implement decision logic:

   * If waste_count > 0 → status = "DIRTY"
   * Else → status = "CLEAN"

5. Optionally add stricter logic:

   * If waste_count >= 2 → status = "DIRTY"
   * Else → status = "CLEAN"

6. Update the API response to include:

   * waste_count
   * status

Expected JSON response format:
{
"detections": [...],
"count": total detections,
"waste_count": number of waste objects only,
"status": "DIRTY" or "CLEAN"
}

7. Ensure the logic does NOT remove existing functionality, only enhances it.

8. Keep the code clean, readable, and production-ready.

Goal:

* If the image contains waste → mark as DIRTY (ready for saving as report)
* If the image is clean → mark as CLEAN (do not save)

Using the API response with a "status" field ("DIRTY" or "CLEAN"), implement frontend logic:

* If status === "DIRTY":
  Automatically save the report (send to database)
* If status === "CLEAN":
  Show message: "No waste detected. Report not saved."

Ensure clean UI feedback and error handling.


This enhancement will allow the BlueWaste application to automatically classify images as DIRTY or CLEAN based on the presence of waste, improving the efficiency of waste reporting and management.
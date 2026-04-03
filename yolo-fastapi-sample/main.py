from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import cv2

app = FastAPI(title="BlueWaste YOLO API", version="1.0.0")

# Restrict this in production to your Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")

WASTE_CLASSES = {"bottle", "cup"}
WASTE_CONFIDENCE_THRESHOLD = 0.5
# Set to 2 for stricter DIRTY classification.
DIRTY_MIN_WASTE_COUNT = 1


def _to_xywh_normalized(xyxy, width: int, height: int):
    x1, y1, x2, y2 = xyxy
    box_width = max(0.0, x2 - x1)
    box_height = max(0.0, y2 - y1)
    return {
        "x": float(x1 / width),
        "y": float(y1 / height),
        "width": float(box_width / width),
        "height": float(box_height / height),
        "normalized": True,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    data = await image.read()
    np_arr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    height, width = frame.shape[:2]
    results = model.predict(source=frame, conf=0.25, verbose=False)

    detections = []
    waste_count = 0
    if len(results) > 0:
        r = results[0]
        names = r.names
        for box in r.boxes:
            cls_idx = int(box.cls.item())
            class_name = names.get(cls_idx, str(cls_idx))
            confidence = float(box.conf.item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            bbox = _to_xywh_normalized((x1, y1, x2, y2), width, height)
            normalized_class_name = str(class_name).lower()
            is_waste = (
                normalized_class_name in WASTE_CLASSES
                and confidence > WASTE_CONFIDENCE_THRESHOLD
            )
            if is_waste:
                waste_count += 1
            detections.append(
                {
                    "class": class_name,
                    "confidence": confidence,
                    "bbox": bbox,
                    "is_waste": is_waste,
                }
            )

    status = "DIRTY" if waste_count >= DIRTY_MIN_WASTE_COUNT else "CLEAN"

    return {
        "detections": detections,
        "count": len(detections),
        "waste_count": waste_count,
        "status": status,
    }

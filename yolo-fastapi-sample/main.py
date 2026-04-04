from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from threading import Lock
from typing import Any, Optional

app = FastAPI(title="BlueWaste YOLO API", version="1.0.0")

# Restrict this in production to your Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: Optional[Any] = None
_model_lock = Lock()

# Restrict inference to known waste-relevant COCO classes to avoid noisy labels
# like "teddy bear" on cluttered scenes.
WASTE_CLASSES = {"bottle", "cup", "wine glass"}
WASTE_CONFIDENCE_THRESHOLD = 0.2
# Set to 2 for stricter DIRTY classification.
DIRTY_MIN_WASTE_COUNT = 1


def _normalize_label(value: Any) -> str:
    return str(value).strip().lower()


def _get_waste_class_ids(model: Any) -> list[int]:
    names = model.names
    if isinstance(names, list):
        label_map = {idx: label for idx, label in enumerate(names)}
    else:
        label_map = names

    return [
        int(class_idx)
        for class_idx, class_name in label_map.items()
        if _normalize_label(class_name) in WASTE_CLASSES
    ]


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


def _get_model() -> Any:
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from ultralytics import YOLO

                _model = YOLO("yolov8n.pt")
    return _model


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    try:
        import cv2
        import numpy as np

        if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=400, detail="Unsupported image type")

        data = await image.read()
        np_arr = np.frombuffer(data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        height, width = frame.shape[:2]
        model = _get_model()
        waste_class_ids = _get_waste_class_ids(model)
        if not waste_class_ids:
            raise HTTPException(status_code=500, detail="No waste classes configured")

        results = model.predict(
            source=frame,
            conf=WASTE_CONFIDENCE_THRESHOLD,
            classes=waste_class_ids,
            verbose=False,
        )

        detections = []
        if len(results) > 0:
            r = results[0]
            names = r.names
            for box in r.boxes:
                cls_idx = int(box.cls.item())
                class_name = names.get(cls_idx, str(cls_idx))
                confidence = float(box.conf.item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = _to_xywh_normalized((x1, y1, x2, y2), width, height)
                detections.append(
                    {
                        "class": class_name,
                        "confidence": confidence,
                        "bbox": bbox,
                        "is_waste": True,
                    }
                )

        waste_count = len(detections)
        status = "DIRTY" if waste_count >= DIRTY_MIN_WASTE_COUNT else "CLEAN"

        return {
            "detections": detections,
            "count": len(detections),
            "waste_count": waste_count,
            "status": status,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

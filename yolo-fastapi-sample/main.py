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

WASTE_CLASS_PROFILES = {
    "bottle": {
        "material": "plastic",
        "waste_category": "RECYCLABLE",
        "shape_hint": "cylindrical",
    },
    "cup": {
        "material": "plastic",
        "waste_category": "RECYCLABLE",
        "shape_hint": "open_top",
    },
    "wine glass": {
        "material": "glass",
        "waste_category": "RECYCLABLE",
        "shape_hint": "stemmed",
    },
    "can": {
        "material": "metal",
        "waste_category": "RECYCLABLE",
        "shape_hint": "cylindrical",
    },
    "paper": {
        "material": "paper",
        "waste_category": "RECYCLABLE",
        "shape_hint": "flat",
    },
    "cardboard": {
        "material": "paper",
        "waste_category": "RECYCLABLE",
        "shape_hint": "box_like",
    },
    "book": {
        "material": "paper",
        "waste_category": "RECYCLABLE",
        "shape_hint": "rectangular",
    },
    "banana": {
        "material": "organic",
        "waste_category": "ORGANIC",
        "shape_hint": "curved",
    },
    "apple": {
        "material": "organic",
        "waste_category": "ORGANIC",
        "shape_hint": "round",
    },
    "orange": {
        "material": "organic",
        "waste_category": "ORGANIC",
        "shape_hint": "round",
    },
    "broccoli": {
        "material": "organic",
        "waste_category": "ORGANIC",
        "shape_hint": "clustered",
    },
    "carrot": {
        "material": "organic",
        "waste_category": "ORGANIC",
        "shape_hint": "elongated",
    },
}
WASTE_CLASSES = set(WASTE_CLASS_PROFILES.keys())
WASTE_CONFIDENCE_THRESHOLD = 0.35
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


def _enhance_frame(frame):
    import cv2

    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    enhanced_lab = cv2.merge((l_channel, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    return cv2.bilateralFilter(enhanced_bgr, 5, 40, 40)


def _analyze_image_quality(frame):
    import cv2
    import numpy as np

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))

    blur_score = min(1.0, blur_var / 180.0)
    exposure_score = max(0.0, 1.0 - (abs(brightness - 128.0) / 128.0))
    quality_score = round((0.65 * blur_score) + (0.35 * exposure_score), 4)

    is_unclear = blur_var < 85.0 or brightness < 35.0 or brightness > 235.0

    return {
        "blur_variance": round(blur_var, 2),
        "brightness": round(brightness, 2),
        "quality_score": quality_score,
        "is_unclear": bool(is_unclear),
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

        quality = _analyze_image_quality(frame)
        enhanced_frame = _enhance_frame(frame)

        height, width = frame.shape[:2]
        model = _get_model()
        results = model.predict(source=enhanced_frame, conf=0.2, verbose=False)

        detections = []
        waste_count = 0
        confidence_penalty = 0.12 if quality["is_unclear"] else 0.0
        if len(results) > 0:
            r = results[0]
            names = r.names
            for box in r.boxes:
                cls_idx = int(box.cls.item())
                class_name = names.get(cls_idx, str(cls_idx))
                confidence_raw = float(box.conf.item())
                confidence = max(0.0, confidence_raw - confidence_penalty)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = _to_xywh_normalized((x1, y1, x2, y2), width, height)
                normalized_class_name = str(class_name).lower()
                profile = WASTE_CLASS_PROFILES.get(normalized_class_name)
                is_waste = (
                    normalized_class_name in WASTE_CLASSES
                    and confidence > WASTE_CONFIDENCE_THRESHOLD
                )
                if is_waste:
                    waste_count += 1
                detections.append(
                    {
                        "label": class_name,
                        "class": class_name,
                        "confidence": round(confidence, 4),
                        "confidence_raw": round(confidence_raw, 4),
                        "bbox": bbox,
                        "is_waste": is_waste,
                        "material": profile["material"] if profile else None,
                        "waste_category": profile["waste_category"] if profile else None,
                        "shape_hint": profile["shape_hint"] if profile else None,
                    }
                )

        status = "DIRTY" if waste_count >= DIRTY_MIN_WASTE_COUNT else "CLEAN"
        if waste_count > 0:
            overall_confidence = max(
                [d["confidence"] for d in detections if d["is_waste"]],
                default=0.0,
            )
        else:
            overall_confidence = 0.15 if quality["is_unclear"] else 0.0

        return {
            "detections": detections,
            "count": len(detections),
            "waste_count": waste_count,
            "status": status,
            "overall_confidence": round(overall_confidence, 4),
            "image_quality": quality,
            "unclear_image": quality["is_unclear"],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

export type WasteTypeCode = "RECYCLABLE" | "NON_RECYCLABLE" | "ORGANIC";

export interface DetectionBox {
  className: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  normalized: boolean;
  isWaste?: boolean;
  material?: string;
  wasteCategory?: string;
  shapeHint?: string;
}

export interface ClassificationResult {
  detectedObject: string;
  wasteTypeCode: WasteTypeCode;
  wasteType: "Recyclable" | "Non-recyclable" | "Organic";
  confidence: number;
  labels: string[];
  detections: DetectionBox[];
}

const RECYCLABLE_KEYWORDS = [
  "plastic",
  "bottle",
  "can",
  "metal",
  "aluminum",
  "glass",
  "paper",
  "cardboard",
  "carton",
  "container",
];

const ORGANIC_KEYWORDS = [
  "food",
  "fruit",
  "vegetable",
  "leaf",
  "leaves",
  "plant",
  "compost",
  "organic",
  "garden waste",
];

const WASTE_CLASS_KEYWORDS = [
  "bottle",
  "cup",
  "glass",
  "can",
  "paper",
  "cardboard",
  "carton",
  "book",
  "banana",
  "apple",
  "orange",
  "broccoli",
  "carrot",
];

const MIN_WASTE_CONFIDENCE = 0.3;

const HUMAN_LABELS: Record<WasteTypeCode, ClassificationResult["wasteType"]> = {
  RECYCLABLE: "Recyclable",
  NON_RECYCLABLE: "Non-recyclable",
  ORGANIC: "Organic",
};

function labelMatches(label: string, keywords: string[]) {
  return keywords.some((keyword) => label.includes(keyword));
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function toLabel(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.toLowerCase().trim();
}

function pickArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;

  const directKeys = [
    "detections",
    "predictions",
    "results",
    "objects",
    "items",
  ];
  for (const key of directKeys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  const nested = payload?.data;
  for (const key of directKeys) {
    if (Array.isArray(nested?.[key])) {
      return nested[key];
    }
  }

  return [];
}

function parseBoxFromArray(raw: unknown[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  if (raw.length < 4) {
    return null;
  }

  const a = toNumber(raw[0]);
  const b = toNumber(raw[1]);
  const c = toNumber(raw[2]);
  const d = toNumber(raw[3]);

  if (a === null || b === null || c === null || d === null) {
    return null;
  }

  if (c > a && d > b) {
    return {
      x: a,
      y: b,
      width: c - a,
      height: d - b,
    };
  }

  return {
    x: a,
    y: b,
    width: c,
    height: d,
  };
}

function parseBoxFromObject(raw: Record<string, unknown>): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  const x1 = toNumber(raw.x1 ?? raw.xmin ?? raw.left ?? raw.x);
  const y1 = toNumber(raw.y1 ?? raw.ymin ?? raw.top ?? raw.y);
  const x2 = toNumber(raw.x2 ?? raw.xmax ?? raw.right);
  const y2 = toNumber(raw.y2 ?? raw.ymax ?? raw.bottom);

  if (x1 === null || y1 === null) {
    return null;
  }

  if (x2 !== null && y2 !== null && x2 > x1 && y2 > y1) {
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
    };
  }

  const width = toNumber(raw.width ?? raw.w);
  const height = toNumber(raw.height ?? raw.h);

  if (width === null || height === null) {
    return null;
  }

  return {
    x: x1,
    y: y1,
    width,
    height,
  };
}

function parseDetection(entry: any): DetectionBox | null {
  const className = toLabel(
    entry?.class_name ??
      entry?.class ??
      entry?.label ??
      entry?.name ??
      entry?.detectedObject,
  );

  const confidence =
    toNumber(entry?.confidence ?? entry?.score ?? entry?.probability) ?? 0;

  let box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  const rawBox =
    entry?.bbox ?? entry?.box ?? entry?.bounding_box ?? entry?.bounds ?? null;

  if (Array.isArray(rawBox)) {
    box = parseBoxFromArray(rawBox);
  } else if (rawBox && typeof rawBox === "object") {
    box = parseBoxFromObject(rawBox as Record<string, unknown>);
  } else if (Array.isArray(entry?.xyxy)) {
    box = parseBoxFromArray(entry.xyxy);
  }

  if (!className || !box) {
    return null;
  }

  if (box.width <= 0 || box.height <= 0) {
    return null;
  }

  const normalized =
    box.x <= 1 && box.y <= 1 && box.width <= 1 && box.height <= 1;

  const explicitIsWaste =
    typeof entry?.is_waste === "boolean"
      ? entry.is_waste
      : typeof entry?.isWaste === "boolean"
        ? entry.isWaste
        : undefined;

  const material =
    typeof entry?.material === "string" ? toLabel(entry.material) : undefined;
  const wasteCategory =
    typeof entry?.waste_category === "string"
      ? toLabel(entry.waste_category)
      : typeof entry?.wasteCategory === "string"
        ? toLabel(entry.wasteCategory)
        : undefined;
  const shapeHint =
    typeof entry?.shape_hint === "string"
      ? toLabel(entry.shape_hint)
      : typeof entry?.shapeHint === "string"
        ? toLabel(entry.shapeHint)
        : undefined;

  return {
    className,
    confidence,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    normalized,
    isWaste: explicitIsWaste,
    material,
    wasteCategory,
    shapeHint,
  };
}

function isWasteLikeLabel(label: string) {
  return WASTE_CLASS_KEYWORDS.some((keyword) => label.includes(keyword));
}

function inferWasteType(
  detections: DetectionBox[],
  labels: string[],
): WasteTypeCode {
  const hasOrganicFromCategory = detections.some(
    (detection) => detection.wasteCategory === "organic",
  );
  if (hasOrganicFromCategory) return "ORGANIC";

  const hasRecyclableFromCategory = detections.some(
    (detection) => detection.wasteCategory === "recyclable",
  );
  if (hasRecyclableFromCategory) return "RECYCLABLE";

  const hasRecyclableFromMaterial = detections.some((detection) =>
    ["plastic", "glass", "metal", "paper", "cardboard"].includes(
      detection.material || "",
    ),
  );
  if (hasRecyclableFromMaterial) return "RECYCLABLE";

  const hasOrganic = labels.some((label) =>
    labelMatches(label, ORGANIC_KEYWORDS),
  );
  if (hasOrganic) return "ORGANIC";

  const hasRecyclable = labels.some((label) =>
    labelMatches(label, RECYCLABLE_KEYWORDS),
  );
  if (hasRecyclable) return "RECYCLABLE";

  return "NON_RECYCLABLE";
}

export function classifyYoloPayload(payload: unknown): ClassificationResult {
  const allDetections = pickArray(payload)
    .map(parseDetection)
    .filter((item): item is DetectionBox => !!item)
    .sort((a, b) => b.confidence - a.confidence);

  const wasteDetections = allDetections.filter((detection) => {
    const explicitWaste = detection.isWaste === true;
    const heuristicWaste = isWasteLikeLabel(detection.className);
    return (
      (explicitWaste || heuristicWaste) &&
      detection.confidence >= MIN_WASTE_CONFIDENCE
    );
  });

  if (wasteDetections.length === 0) {
    const unclearImage = Boolean(
      (payload as any)?.unclear_image ||
      (payload as any)?.image_quality?.is_unclear,
    );
    return {
      detectedObject: unclearImage ? "unclear_image" : "no_waste_detected",
      wasteTypeCode: "NON_RECYCLABLE",
      wasteType: HUMAN_LABELS.NON_RECYCLABLE,
      confidence: unclearImage ? 0.15 : 0,
      labels: [],
      detections: [],
    };
  }

  const labels = Array.from(
    new Set(wasteDetections.map((detection) => detection.className)),
  );
  const top = wasteDetections[0];
  const wasteTypeCode = inferWasteType(wasteDetections, labels);
  const apiOverallConfidence = toNumber((payload as any)?.overall_confidence);
  const confidence = apiOverallConfidence ?? top.confidence;

  return {
    detectedObject: top.className,
    wasteTypeCode,
    wasteType: HUMAN_LABELS[wasteTypeCode],
    confidence: Number(confidence.toFixed(4)),
    labels,
    detections: wasteDetections,
  };
}

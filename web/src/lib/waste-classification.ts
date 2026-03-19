export type WasteTypeCode = "RECYCLABLE" | "NON_RECYCLABLE" | "ORGANIC";

export interface VisionLabel {
  description?: string;
  score?: number;
}

export interface ClassificationResult {
  detectedObject: string;
  wasteTypeCode: WasteTypeCode;
  wasteType: "Recyclable" | "Non-recyclable" | "Organic";
  confidence: number;
  labels: string[];
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

const HUMAN_LABELS: Record<WasteTypeCode, ClassificationResult["wasteType"]> = {
  RECYCLABLE: "Recyclable",
  NON_RECYCLABLE: "Non-recyclable",
  ORGANIC: "Organic",
};

function labelMatches(label: string, keywords: string[]) {
  return keywords.some((keyword) => label.includes(keyword));
}

export function classifyWasteLabels(
  labels: VisionLabel[],
): ClassificationResult {
  const normalized = labels
    .map((label) => ({
      description: (label.description || "").toLowerCase().trim(),
      score: Number(label.score || 0),
    }))
    .filter((label) => label.description.length > 0)
    .sort((a, b) => b.score - a.score);

  if (normalized.length === 0) {
    return {
      detectedObject: "Unknown",
      wasteTypeCode: "NON_RECYCLABLE",
      wasteType: HUMAN_LABELS.NON_RECYCLABLE,
      confidence: 0,
      labels: [],
    };
  }

  const topLabel = normalized[0];
  const recyclable = normalized.find((label) =>
    labelMatches(label.description, RECYCLABLE_KEYWORDS),
  );
  const organic = normalized.find((label) =>
    labelMatches(label.description, ORGANIC_KEYWORDS),
  );

  let wasteTypeCode: WasteTypeCode = "NON_RECYCLABLE";
  let matchedLabel = topLabel;

  if (recyclable) {
    wasteTypeCode = "RECYCLABLE";
    matchedLabel = recyclable;
  } else if (organic) {
    wasteTypeCode = "ORGANIC";
    matchedLabel = organic;
  }

  return {
    detectedObject: matchedLabel.description,
    wasteTypeCode,
    wasteType: HUMAN_LABELS[wasteTypeCode],
    confidence: Number(matchedLabel.score.toFixed(4)),
    labels: normalized.map((label) => label.description),
  };
}

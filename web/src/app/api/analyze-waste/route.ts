import { NextRequest, NextResponse } from "next/server";
import { classifyYoloPayload } from "@/lib/waste-classification";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

type DecisionStatus = "DIRTY" | "CLEAN";

function toNumberOrUndefined(
  value: FormDataEntryValue | null,
): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

function normalizeBaseApiUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function toJsonError(status: number, message: string, details?: string) {
  return NextResponse.json(
    {
      message,
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function safeParseJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

function normalizeDecisionStatus(value: unknown): DecisionStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "DIRTY" || normalized === "CLEAN") {
    return normalized;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const yoloApiUrl = process.env.YOLO_API_URL;
    const rawApiBase =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api";

    if (!yoloApiUrl) {
      return toJsonError(
        500,
        "YOLO API URL is not configured",
        "Set YOLO_API_URL in web/.env.local and restart the web server.",
      );
    }

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return toJsonError(401, "Unauthorized request");
    }

    const apiBaseUrl = normalizeBaseApiUrl(rawApiBase);
    const formData = await request.formData();

    const image = formData.get("image");
    if (!(image instanceof File)) {
      return toJsonError(400, "Image file is required");
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return toJsonError(400, "Unsupported image type. Use JPG, PNG, or WEBP.");
    }

    if (image.size > MAX_FILE_SIZE_BYTES) {
      return toJsonError(400, "Image must be 8MB or smaller");
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const yoloBody = new FormData();
    yoloBody.append(
      "image",
      new Blob([imageBuffer], { type: image.type }),
      image.name,
    );

    const yoloResponse = await fetch(yoloApiUrl, {
      method: "POST",
      body: yoloBody,
    });

    const yoloText = await yoloResponse.text();
    const yoloJson = safeParseJson(yoloText);

    if (!yoloResponse.ok) {
      const yoloMessage =
        (yoloJson as any)?.message ||
        (yoloJson as any)?.error ||
        (typeof yoloText === "string" && yoloText.length > 0
          ? yoloText
          : "Unknown YOLO API error");

      return toJsonError(
        502,
        `YOLO API request failed: ${yoloMessage}`,
        "Check if the YOLO service is reachable and CORS is configured.",
      );
    }

    const classification = classifyYoloPayload(yoloJson);
    const rawCount =
      toNonNegativeInt((yoloJson as any)?.count) ??
      classification.detections.length;
    const wasteCount =
      toNonNegativeInt((yoloJson as any)?.waste_count) ??
      classification.detections.length;
    const status: DecisionStatus =
      normalizeDecisionStatus((yoloJson as any)?.status) ??
      (wasteCount > 0 ? "DIRTY" : "CLEAN");

    const saveIfDirtyEntry = formData.get("saveIfDirty");
    const saveIfDirty =
      typeof saveIfDirtyEntry === "string" &&
      saveIfDirtyEntry.trim().toLowerCase() === "true";

    let uploadedImageUrl: string | null = null;
    let savedReport: unknown = null;

    if (saveIfDirty && status === "DIRTY") {
      const uploadBody = new FormData();
      uploadBody.append(
        "image",
        new Blob([imageBuffer], { type: image.type }),
        image.name,
      );

      const uploadResponse = await fetch(`${apiBaseUrl}/upload`, {
        method: "POST",
        headers: { Authorization: authorization },
        body: uploadBody,
      });

      if (!uploadResponse.ok) {
        return toJsonError(502, "Failed to upload image");
      }

      const uploadedImage = await uploadResponse.json();
      uploadedImageUrl = uploadedImage.url;

      const latitude = toNumberOrUndefined(formData.get("latitude"));
      const longitude = toNumberOrUndefined(formData.get("longitude"));
      const addressValue = formData.get("address");
      const address =
        typeof addressValue === "string" && addressValue.trim().length > 0
          ? addressValue.trim()
          : undefined;

      const saveResponse = await fetch(`${apiBaseUrl}/waste-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify({
          imageUrl: uploadedImage.url,
          detectedObject: classification.detectedObject,
          wasteType: classification.wasteTypeCode,
          confidence: classification.confidence,
          labels: classification.labels,
          latitude,
          longitude,
          address,
        }),
      });

      if (!saveResponse.ok) {
        return toJsonError(502, "Failed to save waste report");
      }

      savedReport = await saveResponse.json();
    }

    return NextResponse.json({
      detectedObject: classification.detectedObject,
      wasteType: classification.wasteType,
      wasteTypeCode: classification.wasteTypeCode,
      confidence: classification.confidence,
      status,
      waste_count: wasteCount,
      count: rawCount,
      imageUrl: uploadedImageUrl,
      labels: classification.labels,
      detections: classification.detections,
      report: savedReport,
    });
  } catch {
    return toJsonError(500, "Unexpected error while analyzing image");
  }
}

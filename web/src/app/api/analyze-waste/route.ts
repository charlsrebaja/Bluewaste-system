import { NextRequest, NextResponse } from "next/server";
import { classifyWasteLabels } from "@/lib/waste-classification";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

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

export async function POST(request: NextRequest) {
  try {
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    const rawApiBase =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api";

    if (!visionApiKey) {
      return NextResponse.json(
        { error: "Google Vision API key is not configured" },
        { status: 500 },
      );
    }

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized request" },
        { status: 401 },
      );
    }

    const apiBaseUrl = normalizeBaseApiUrl(rawApiBase);
    const formData = await request.formData();

    const image = formData.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPG, PNG, or WEBP." },
        { status: 400 },
      );
    }

    if (image.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image must be 8MB or smaller" },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "LABEL_DETECTION", maxResults: 15 }],
            },
          ],
        }),
      },
    );

    if (!visionResponse.ok) {
      return NextResponse.json(
        { error: "Google Vision API request failed" },
        { status: 502 },
      );
    }

    const visionJson = await visionResponse.json();
    const labels = visionJson?.responses?.[0]?.labelAnnotations || [];

    const classification = classifyWasteLabels(labels);

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
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 502 },
      );
    }

    const uploadedImage = await uploadResponse.json();

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
      return NextResponse.json(
        { error: "Failed to save waste report" },
        { status: 502 },
      );
    }

    const savedReport = await saveResponse.json();

    return NextResponse.json({
      detectedObject: classification.detectedObject,
      wasteType: classification.wasteType,
      wasteTypeCode: classification.wasteTypeCode,
      confidence: classification.confidence,
      imageUrl: uploadedImage.url,
      labels: classification.labels,
      report: savedReport,
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected error while analyzing image" },
      { status: 500 },
    );
  }
}

"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateReport, useUploadReportImages } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Barangay, WASTE_CATEGORY_LABELS, WasteCategory } from "@/types";
import { useRouter } from "next/navigation";

const LocationPickerMap = dynamic(
  () => import("@/components/map/LocationPicker"),
  { ssr: false },
);

const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000),
  category: z.string().min(1, "Select a category"),
  barangayId: z.string().optional(),
  address: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function SubmitReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createReport = useCreateReport();
  const uploadImages = useUploadReportImages();

  const { data: barangays = [] } = useQuery<Barangay[]>({
    queryKey: ["barangays"],
    queryFn: async () => {
      const { data } = await api.get("/barangays");
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { isAnonymous: false },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!location) {
      setLocationError("Please set your location first");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const report = await createReport.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category as WasteCategory,
        latitude: location.lat,
        longitude: location.lng,
        address: data.address,
        barangayId: data.barangayId || undefined,
        isAnonymous: data.isAnonymous,
      });

      if (files.length > 0 && report?.id) {
        await uploadImages.mutateAsync({
          reportId: report.id,
          files,
          type: "REPORT",
        });
      }

      router.push("/citizen/my-reports");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-800">
        Submit Waste Report
      </h1>
      <p className="mb-6 text-gray-500">
        Help keep Panabo City clean by reporting waste issues.
      </p>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step >= s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm ${step >= s ? "text-gray-800" : "text-gray-400"}`}
            >
              {s === 1 ? "Details" : s === 2 ? "Location" : "Photos"}
            </span>
            {s < 3 && (
              <div
                className={`h-0.5 w-8 ${step > s ? "bg-blue-600" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the waste issue..."
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Waste Category *</Label>
              <select
                id="category"
                className="w-full rounded-md border px-3 py-2 text-sm"
                {...register("category")}
              >
                <option value="">Select category...</option>
                {Object.entries(WASTE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="barangayId">Barangay</Label>
              <select
                id="barangayId"
                className="w-full rounded-md border px-3 py-2 text-sm"
                {...register("barangayId")}
              >
                <option value="">Select barangay (optional)...</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="address">Address / Landmark</Label>
              <Input
                id="address"
                placeholder="Nearby landmark or address"
                {...register("address")}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                title="Submit this report anonymously"
                {...register("isAnonymous")}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Submit anonymously</span>
            </label>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>
                Next: Location &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Set Location
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Click anywhere on the map to pin the waste location, or use GPS
                to auto-detect your position.
              </p>
            </div>

            <LocationPickerMap
              value={location}
              onChange={(loc) => {
                setLocation(loc);
                setLocationError("");
              }}
            />

            {locationError && (
              <p className="flex items-center gap-1 text-sm text-red-500">
                <span>⚠</span> {locationError}
              </p>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                &larr; Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!location) {
                    setLocationError(
                      "Please pin the waste location on the map.",
                    );
                    return;
                  }
                  setStep(3);
                }}
              >
                Next: Photos &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Photos & Submit */}
        {step === 3 && (
          <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Add Photos (Optional)</h2>
            <p className="text-sm text-gray-500">
              Upload up to 5 photos of the waste issue.
            </p>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                title="Upload report photos"
                className="hidden"
                onChange={handleFileChange}
              />
              {files.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 Add Photos ({files.length}/5)
                </Button>
              )}
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((preview, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-lg border"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
              >
                &larr; Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

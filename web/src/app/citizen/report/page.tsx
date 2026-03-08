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
import {
  FileText,
  MapPin,
  Camera,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Loader2,
  Info,
} from "lucide-react";

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

const STEPS = [
  { id: 1, label: "Report Details", icon: FileText },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Photos", icon: Camera },
];

const CATEGORY_COLORS: Record<string, string> = {
  SOLID_WASTE: "bg-gray-100 text-gray-700",
  HAZARDOUS: "bg-red-100 text-red-700",
  LIQUID: "bg-blue-100 text-blue-700",
  RECYCLABLE: "bg-green-100 text-green-700",
  ORGANIC: "bg-amber-100 text-amber-700",
  ELECTRONIC: "bg-purple-100 text-purple-700",
  OTHER: "bg-slate-100 text-slate-700",
};

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
  const [dragOver, setDragOver] = useState(false);
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

  const addFiles = (incoming: FileList | File[]) => {
    const newFiles = Array.from(incoming).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-gray-50 pb-16">
      {/* Page Header */}
      <div className="bg-white border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Submit a Waste Report
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Help keep Panabo City clean — fill out the form below to report a
            waste issue.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex-1 flex items-center min-w-0">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                        isDone
                          ? "bg-primary border-primary text-white"
                          : isActive
                            ? "bg-white border-primary text-primary shadow-sm"
                            : "bg-white border-gray-200 text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />
                      ) : (
                        <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      )}
                    </div>
                    <span
                      className={`mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        isActive
                          ? "text-primary"
                          : isDone
                            ? "text-gray-600"
                            : "text-gray-400"
                      }`}
                    >
                      {s.label.split(" ")[0]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-0.5 sm:mx-1 mb-4 sm:mb-5 rounded transition-all ${
                        step > s.id ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── Step 1: Report Details ── */}
          {step === 1 && (
            <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50/60 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Report Details
                </h2>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="title"
                    className="text-sm font-medium text-gray-700"
                  >
                    Report Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Illegal dumping near public market"
                    className={`h-10 ${errors.title ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    {...register("title")}
                  />
                  {errors.title ? (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" /> {errors.title.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">5–100 characters</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the waste, its approximate size, any smell, or other relevant details..."
                    rows={4}
                    className={`resize-none ${errors.description ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    {...register("description")}
                  />
                  {errors.description ? (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" />{" "}
                      {errors.description.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Minimum 20 characters
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="category"
                    className="text-sm font-medium text-gray-700"
                  >
                    Waste Category <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="category"
                    title="Select waste category"
                    className={`w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.category ? "border-red-400" : "border-input"
                    }`}
                    {...register("category")}
                  >
                    <option value="">Select a category...</option>
                    {Object.entries(WASTE_CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" />{" "}
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Barangay */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="barangayId"
                    className="text-sm font-medium text-gray-700"
                  >
                    Barangay
                  </Label>
                  <select
                    id="barangayId"
                    title="Select barangay"
                    className="w-full rounded-md border border-input px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                    {...register("barangayId")}
                  >
                    <option value="">Select barangay (optional)</option>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Address / Landmark
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g. Near Panabo Public Market, beside the basketball court"
                    {...register("address")}
                  />
                  <p className="text-xs text-gray-400">
                    Help the field team find the location faster
                  </p>
                </div>

                {/* Anonymous */}
                <label className="flex items-center gap-3 py-3 px-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    title="Submit this report anonymously"
                    {...register("isAnonymous")}
                    className="w-4 h-4 rounded border-gray-300 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Submit anonymously
                    </p>
                    <p className="text-xs text-gray-400">
                      Your name will not be shown on this report
                    </p>
                  </div>
                </label>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="gap-2"
                  >
                    Next: Set Location <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50/60 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Pin the Location
                </h2>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
                {/* Instruction banner */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Click on the map</strong> to pin the exact waste
                    location, or use the <strong>GPS button</strong> to
                    auto-detect your current position. You can also drag the pin
                    to adjust.
                  </span>
                </div>

                {/* Map */}
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <LocationPickerMap
                    value={location}
                    onChange={(loc) => {
                      setLocation(loc);
                      setLocationError("");
                    }}
                  />
                </div>

                {/* Coordinate display */}
                {location && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Location pinned:{" "}
                      <strong>
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </strong>
                    </span>
                  </div>
                )}

                {locationError && (
                  <p className="flex items-center gap-1.5 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4" /> {locationError}
                  </p>
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
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
                    className="gap-2"
                  >
                    Next: Add Photos <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Photos & Submit ── */}
          {step === 3 && (
            <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50/60 flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary flex-shrink-0" />
                <h2 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Add Photos
                </h2>
                <span className="ml-auto text-xs text-gray-400">
                  {files.length}/5 photos
                </span>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
                <p className="text-xs sm:text-sm text-gray-500">
                  Upload up to 5 photos of the waste issue to help the cleanup
                  team better assess the situation.
                </p>

                {/* Drop Zone */}
                {files.length < 5 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 sm:gap-3 border-2 border-dashed rounded-lg sm:rounded-xl py-6 sm:py-10 cursor-pointer transition-all ${
                      dragOver
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                    </div>
                    <div className="text-center px-2">
                      <p className="text-sm font-medium text-gray-700">
                        Drag & drop photos here
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        or click to browse — JPG, PNG, WEBP supported
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  title="Upload report photos"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Preview Grid */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {previews.map((preview, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group shadow-sm"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          title="Remove photo"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {files.length < 5 && (
                      <button
                        type="button"
                        title="Add more photos"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Error */}
                {submitError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {submitError}
                  </div>
                )}

                {/* Summary Recap */}
                <div className="bg-gray-50 border rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">
                    Report Summary
                  </p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Report details filled</span>
                    {location ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>
                          Location pinned: {location.lat.toFixed(4)},{" "}
                          {location.lng.toFixed(4)}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                        <span className="text-amber-600">Location not set</span>
                      </>
                    )}
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 ${files.length > 0 ? "text-green-500" : "text-gray-300"}`}
                    />
                    <span className={files.length > 0 ? "" : "text-gray-400"}>
                      {files.length > 0
                        ? `${files.length} photo${files.length > 1 ? "s" : ""} attached`
                        : "No photos (optional)"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white px-8 font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

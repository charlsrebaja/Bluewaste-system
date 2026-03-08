"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMapData } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import {
  ReportStatus,
  WasteCategory,
  WASTE_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
  MapReport,
} from "@/types";
import { Layers, MapPin, X, ChevronRight } from "lucide-react";

const WasteMap = dynamic(() => import("@/components/map/WasteMap"), {
  ssr: false,
});

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  CRITICAL: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
  HIGH: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  MEDIUM: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  LOW: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

const STATUS_PILL_LIST: Array<{
  value: ReportStatus | "";
  label: string;
}> = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "CLEANUP_SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLEANED", label: "Cleaned" },
  { value: "REJECTED", label: "Rejected" },
];

export default function MapPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<WasteCategory | "">("");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);

  const { data: reports = [], isLoading } = useMapData({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [reports]);

  const handleReportClick = useCallback(
    (report: MapReport) => {
      setSelectedReport(report);
      if (mapInstance) {
        mapInstance.setView([report.latitude, report.longitude], 16, {
          animate: true,
        });
      }
    },
    [mapInstance],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50">
      {/* ── Top toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-white px-5 py-3 shadow-sm">
        <h1 className="mr-2 text-base font-bold text-gray-900">
          Smart Waste Map
        </h1>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_PILL_LIST.map(({ value, label }) => {
            const isActive = statusFilter === value;
            const count = value ? statusCounts[value] : reports.length;
            return (
              <button
                key={value || "all"}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                  isActive
                    ? `text-white border-transparent shadow-sm ${value ? `bg-st-${value}` : "bg-gray-500"}`
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {value && (
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      isActive ? "bg-white/70" : `bg-st-${value}`
                    }`}
                  />
                )}
                {label}
                {count !== undefined && (
                  <span
                    className={`ml-0.5 ${isActive ? "text-white/75" : "text-gray-400"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Category filter */}
          <select
            title="Filter by waste category"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as WasteCategory | "")
            }
          >
            <option value="">All Categories</option>
            {Object.entries(WASTE_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Heatmap toggle */}
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            <Layers className="h-3.5 w-3.5" />
            Heatmap
          </Button>
        </div>
      </div>

      {/* ── Map area + slide-in panel ── */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* Map */}
        <div className="relative flex-1 min-h-0">
          {isLoading ? (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                <span className="text-sm">Loading map data…</span>
              </div>
            </div>
          ) : (
            <WasteMap
              reports={reports}
              showHeatmap={showHeatmap}
              onReportClick={handleReportClick}
              onMapReady={setMapInstance}
            />
          )}

          {/* Heatmap intensity legend */}
          {showHeatmap && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-xl border border-gray-100 bg-white/96 px-4 py-2.5 shadow-lg backdrop-blur-sm">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">
                Report Density
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Low</span>
                <div className="heatmap-gradient-bar" />
                <span className="text-[10px] text-gray-500">High</span>
              </div>
              <p className="mt-1 text-[9px] text-gray-400 text-center">
                Weighted by report priority
              </p>
            </div>
          )}

          {/* Clickable legend */}
          <div className="absolute bottom-6 left-4 z-[1000] rounded-xl border border-gray-100 bg-white/96 p-3 shadow-lg backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Waste Category
            </p>
            <div className="space-y-1.5">
              {Object.entries(WASTE_CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  title={`Filter by ${label}`}
                  onClick={() =>
                    setCategoryFilter(
                      categoryFilter === key ? "" : (key as WasteCategory),
                    )
                  }
                  className={`flex w-full items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors text-left ${
                    categoryFilter === key ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full bg-cat-${key}`}
                  />
                  <span className="text-xs text-gray-700">{label}</span>
                  {categoryFilter === key && (
                    <X className="ml-auto h-3 w-3 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Marker size legend */}
          <div className="absolute bottom-6 right-4 z-[1000] rounded-xl border border-gray-100 bg-white/96 p-3 shadow-lg backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Priority
            </p>
            {(
              [
                { label: "Critical", textCls: "text-red-500 font-semibold" },
                { label: "High", textCls: "text-orange-500 font-semibold" },
                { label: "Medium", textCls: "text-yellow-500 font-semibold" },
                { label: "Low", textCls: "text-gray-500" },
              ] as const
            ).map(({ label, textCls }) => (
              <div key={label} className="mb-1.5 flex items-center gap-2">
                <div
                  className={`flex-shrink-0 rounded-full border-2 border-white shadow priority-dot-${label.toUpperCase()}`}
                />
                <span className={`text-xs ${textCls}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Slide-in report detail panel ── */}
        <div
          className={`flex w-72 flex-shrink-0 flex-col border-l bg-white shadow-xl transition-all duration-300 ${
            selectedReport
              ? "translate-x-0"
              : "translate-x-full absolute right-0 top-0 bottom-0"
          }`}
        >
          {selectedReport && (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-bold text-gray-800">
                  Report Details
                </span>
                <button
                  aria-label="Close report details"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedReport.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedReport.images[0].imageUrl}
                  alt="Waste report"
                  className="h-40 w-full object-cover"
                />
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Category + Priority */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold text-white bg-cat-${selectedReport.category}`}
                  >
                    {
                      (WASTE_CATEGORY_LABELS as Record<string, string>)[
                        selectedReport.category
                      ]
                    }
                  </span>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-bold ${PRIORITY_STYLES[selectedReport.priority]?.bg} ${PRIORITY_STYLES[selectedReport.priority]?.text} ${PRIORITY_STYLES[selectedReport.priority]?.border}`}
                  >
                    {selectedReport.priority}
                  </span>
                </div>

                {/* Title & location */}
                <div>
                  <h3 className="text-sm font-bold leading-snug text-gray-900">
                    {selectedReport.title}
                  </h3>
                  {selectedReport.barangay && (
                    <p className="mt-1 text-xs font-semibold text-gray-600">
                      Brgy. {selectedReport.barangay.name}
                    </p>
                  )}
                  {selectedReport.address && (
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-gray-500">
                      <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      {selectedReport.address}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold bg-tint-${selectedReport.status} text-st-${selectedReport.status}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-st-${selectedReport.status}`}
                    />
                    {
                      (REPORT_STATUS_LABELS as Record<string, string>)[
                        selectedReport.status
                      ]
                    }
                  </span>
                </div>

                {/* Reported at */}
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Reported
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Coordinates */}
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Coordinates
                  </p>
                  <p className="font-mono text-xs text-gray-500">
                    {selectedReport.latitude.toFixed(5)},{" "}
                    {selectedReport.longitude.toFixed(5)}
                  </p>
                </div>

                <a
                  href={`/dashboard/reports`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  View All Reports
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type WasteCategory =
  | "SOLID_WASTE"
  | "HAZARDOUS"
  | "LIQUID"
  | "RECYCLABLE"
  | "ORGANIC"
  | "ELECTRONIC"
  | "OTHER";
export type ReportStatus =
  | "PENDING"
  | "VERIFIED"
  | "CLEANUP_SCHEDULED"
  | "IN_PROGRESS"
  | "CLEANED"
  | "REJECTED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: WasteCategory;
  status: ReportStatus;
  priority: Priority;
  latitude: number;
  longitude: number;
  address?: string;
  isAnonymous: boolean;
  reporter?: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  barangay?: { id: string; name: string };
  images: { id: string; imageUrl: string; type: string }[];
  statusHistory?: {
    id: string;
    previousStatus?: ReportStatus;
    newStatus: ReportStatus;
    notes?: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  reportId?: string;
  createdAt: string;
}

export const WASTE_CATEGORY_LABELS: Record<WasteCategory, string> = {
  SOLID_WASTE: "Solid Waste",
  HAZARDOUS: "Hazardous",
  LIQUID: "Liquid Waste",
  RECYCLABLE: "Recyclable",
  ORGANIC: "Organic",
  ELECTRONIC: "Electronic",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  CLEANUP_SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  CLEANED: "Cleaned",
  REJECTED: "Rejected",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "#f59e0b",
  VERIFIED: "#3b82f6",
  CLEANUP_SCHEDULED: "#8b5cf6",
  IN_PROGRESS: "#f97316",
  CLEANED: "#22c55e",
  REJECTED: "#ef4444",
};

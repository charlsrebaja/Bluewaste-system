import { cn } from "@/lib/utils";
import { ReportStatus, REPORT_STATUS_LABELS, STATUS_COLORS } from "@/types";

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors: Record<ReportStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERIFIED: "bg-blue-100 text-blue-800 border-blue-200",
    CLEANUP_SCHEDULED: "bg-purple-100 text-purple-800 border-purple-200",
    IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200",
    CLEANED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colors[status],
        className,
      )}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}

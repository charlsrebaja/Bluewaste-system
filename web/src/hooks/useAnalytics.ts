import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  AnalyticsOverview,
  TrendData,
  CategoryData,
  BarangayStats,
} from "@/types";

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/overview");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsTrends(
  period: "daily" | "weekly" | "monthly" = "daily",
  days: number = 30,
) {
  return useQuery<TrendData[]>({
    queryKey: ["analytics", "trends", period, days],
    queryFn: async () => {
      const { data } = await api.get(
        `/analytics/trends?period=${period}&days=${days}`,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsCategories() {
  return useQuery<CategoryData[]>({
    queryKey: ["analytics", "categories"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/categories");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsBarangays() {
  return useQuery<BarangayStats[]>({
    queryKey: ["analytics", "barangays"],
    queryFn: async () => {
      const { data } = await api.get("/analytics/barangays");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

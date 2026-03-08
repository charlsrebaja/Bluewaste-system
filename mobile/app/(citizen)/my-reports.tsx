import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import {
  Report,
  STATUS_LABELS,
  STATUS_COLORS,
  WASTE_CATEGORY_LABELS,
  ReportStatus,
} from "../../types";

export default function MyReportsScreen() {
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-reports", page, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (status) params.append("status", status);
      const { data } = await api.get(
        `/reports/my-reports?${params.toString()}`,
      );
      return data;
    },
  });

  const reports: Report[] = data?.data || [];

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[item.status] + "20" },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}
          >
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {WASTE_CATEGORY_LABELS[item.category]}
        </Text>
        {item.barangay && (
          <Text style={styles.metaText}>· Brgy. {item.barangay.name}</Text>
        )}
        <Text style={styles.metaText}>
          · {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {item.images.length > 0 && (
        <Text style={styles.imageCount}>
          📷 {item.images.length} photo{item.images.length > 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );

  const filters: { label: string; value: ReportStatus | "" }[] = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Cleaned", value: "CLEANED" },
  ];

  return (
    <View style={styles.container}>
      <ScrollableFilters
        filters={filters}
        selected={status}
        onSelect={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? "Loading..." : "No reports found"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ScrollableFilters({
  filters,
  selected,
  onSelect,
}: {
  filters: { label: string; value: string }[];
  selected: string;
  onSelect: (v: any) => void;
}) {
  return (
    <View style={styles.filterRow}>
      {filters.map((f) => (
        <TouchableOpacity
          key={f.value}
          style={[
            styles.filterChip,
            selected === f.value && styles.filterSelected,
          ]}
          onPress={() => onSelect(f.value)}
        >
          <Text
            style={[
              styles.filterText,
              selected === f.value && styles.filterTextSelected,
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  filterRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  filterSelected: { backgroundColor: "#1d4ed8" },
  filterText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  filterTextSelected: { color: "#fff" },
  list: { padding: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  desc: { fontSize: 13, color: "#64748b", lineHeight: 18, marginBottom: 6 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metaText: { fontSize: 12, color: "#94a3b8" },
  imageCount: { fontSize: 12, color: "#64748b", marginTop: 6 },
  empty: { flex: 1, paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#94a3b8" },
});

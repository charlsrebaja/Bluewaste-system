import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import {
  Report,
  STATUS_LABELS,
  STATUS_COLORS,
  WASTE_CATEGORY_LABELS,
  ReportStatus,
} from "../../types";
import { useRouter } from "expo-router";

export default function TasksScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["assigned-reports"],
    queryFn: async () => {
      const { data } = await api.get("/reports/assigned");
      return data;
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ReportStatus;
      notes?: string;
    }) => {
      const { data } = await api.put(`/reports/${id}/status`, {
        status,
        notes,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assigned-reports"] });
      Alert.alert("Success", "Status updated");
    },
    onError: (err: any) =>
      Alert.alert("Error", err?.response?.data?.message || "Update failed"),
  });

  const handleStatusAction = (report: Report, newStatus: ReportStatus) => {
    Alert.alert(
      "Update Status",
      `Mark "${report.title}" as ${STATUS_LABELS[newStatus]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            updateStatus.mutate({ id: report.id, status: newStatus }),
        },
      ],
    );
  };

  const handleUploadCleanup = async (reportId: string) => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;

    try {
      const formData = new FormData();
      formData.append("images", {
        uri: result.assets[0].uri,
        type: "image/jpeg",
        name: "cleanup_photo.jpg",
      } as any);
      formData.append("type", "CLEANUP");
      await api.post(`/reports/${reportId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({ queryKey: ["assigned-reports"] });
      Alert.alert("Success", "Cleanup photo uploaded");
    } catch {
      Alert.alert("Error", "Upload failed");
    }
  };

  const reports: Report[] = data?.data || [];

  const getActions = (report: Report) => {
    const actions: { label: string; status: ReportStatus; color: string }[] =
      [];
    switch (report.status) {
      case "VERIFIED":
      case "CLEANUP_SCHEDULED":
        actions.push({
          label: "Start Work",
          status: "IN_PROGRESS",
          color: "#f97316",
        });
        break;
      case "IN_PROGRESS":
        actions.push({
          label: "Mark Cleaned",
          status: "CLEANED",
          color: "#22c55e",
        });
        break;
    }
    return actions;
  };

  const renderTask = ({ item }: { item: Report }) => {
    const actions = getActions(item);
    const expanded = activeReport === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setActiveReport(expanded ? null : item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta}>
              {WASTE_CATEGORY_LABELS[item.category]} ·{" "}
              {item.barangay?.name ? `Brgy. ${item.barangay.name}` : ""}
            </Text>
          </View>
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

        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.location}>
              📍{" "}
              {item.address ||
                `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
            </Text>

            {item.images.length > 0 && (
              <View style={styles.imagesRow}>
                {item.images.slice(0, 3).map((img) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.imageUrl }}
                    style={styles.thumb}
                  />
                ))}
              </View>
            )}

            <View style={styles.actions}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.status}
                  style={[styles.actionBtn, { backgroundColor: a.color }]}
                  onPress={() => handleStatusAction(item, a.status)}
                >
                  <Text style={styles.actionText}>{a.label}</Text>
                </TouchableOpacity>
              ))}
              {item.status === "IN_PROGRESS" && (
                <TouchableOpacity
                  style={styles.photoUploadBtn}
                  onPress={() => handleUploadCleanup(item.id)}
                >
                  <Text style={styles.photoUploadText}>📷 Upload Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSub}>
            {reports.length} assigned report{reports.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/");
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>
              {isLoading ? "Loading tasks..." : "No assigned tasks"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1d4ed8",
    paddingTop: 48,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#bfdbfe", marginTop: 2 },
  logoutText: { color: "#bfdbfe", fontSize: 13, fontWeight: "600" },
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
    alignItems: "flex-start",
  },
  title: { fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  meta: { fontSize: 12, color: "#94a3b8" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  desc: { fontSize: 13, color: "#475569", lineHeight: 19, marginBottom: 8 },
  location: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  imagesRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  thumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f1f5f9" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  photoUploadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  photoUploadText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  empty: { paddingVertical: 80, alignItems: "center" },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#94a3b8" },
});

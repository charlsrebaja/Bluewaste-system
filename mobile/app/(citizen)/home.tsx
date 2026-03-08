import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import { STATUS_LABELS, STATUS_COLORS, Report } from "../../types";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: reportsData } = useQuery({
    queryKey: ["my-reports-summary"],
    queryFn: async () => {
      const { data } = await api.get("/reports/my-reports?limit=5");
      return data;
    },
  });

  const reports: Report[] = reportsData?.data || [];
  const total = reportsData?.pagination?.total || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Welcome */}
      <View style={styles.welcome}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName}! 👋</Text>
          <Text style={styles.subGreeting}>Help keep Panabo City clean</Text>
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

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#eff6ff" }]}
            onPress={() => router.push("/(citizen)/report")}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>Submit Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#f0fdf4" }]}
            onPress={() => router.push("/(citizen)/my-reports")}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>My Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#fef3c7" }]}
            onPress={() => router.push("/(citizen)/map")}
          >
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionLabel}>View Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: "#fce7f3" }]}
            onPress={() => router.push("/(citizen)/notifications")}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabel}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <Text style={styles.totalBadge}>{total} total</Text>
        </View>
        {reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No reports yet</Text>
            <TouchableOpacity onPress={() => router.push("/(citizen)/report")}>
              <Text style={styles.emptyLink}>Submit your first report</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reports.map((r) => (
            <View key={r.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle} numberOfLines={1}>
                  {r.title}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[r.status] + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: STATUS_COLORS[r.status] },
                    ]}
                  >
                    {STATUS_LABELS[r.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportMeta}>
                {r.barangay?.name ? `Brgy. ${r.barangay.name} · ` : ""}
                {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  welcome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#1d4ed8",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 14, color: "#bfdbfe", marginTop: 2 },
  logoutText: { color: "#bfdbfe", fontSize: 13, fontWeight: "600" },
  section: { padding: 16, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  totalBadge: {
    fontSize: 13,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    gap: 6,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  reportMeta: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: { color: "#94a3b8", fontSize: 14 },
  emptyLink: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});

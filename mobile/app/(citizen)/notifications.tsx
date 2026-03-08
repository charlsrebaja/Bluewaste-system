import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Notification } from "../../types";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data;
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications: Notification[] = data?.data || [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const icons: Record<string, string> = {
    NEW_REPORT: "📋",
    STATUS_CHANGE: "🔄",
    ASSIGNMENT: "👷",
    SYSTEM: "⚙️",
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => !item.isRead && markRead.mutate(item.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icons[item.type] || "🔔"}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleBold]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {unread > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadCount}>{unread} unread</Text>
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? "Loading..." : "No notifications"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  unreadCount: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  markAll: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },
  list: { padding: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  cardUnread: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  icon: { fontSize: 24, marginTop: 2 },
  content: { flex: 1 },
  title: { fontSize: 14, color: "#334155" },
  titleBold: { fontWeight: "700", color: "#1e293b" },
  message: { fontSize: 13, color: "#64748b", marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 14 },
});

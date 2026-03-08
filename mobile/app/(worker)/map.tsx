import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import MapView, { Marker, Callout } from "react-native-maps";
import api from "../../lib/api";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  WASTE_CATEGORY_LABELS,
} from "../../types";

export default function WorkerMapScreen() {
  const { data: reports = [] } = useQuery({
    queryKey: ["assigned-map"],
    queryFn: async () => {
      const { data } = await api.get("/reports/assigned");
      return data?.data || [];
    },
    refetchInterval: 30000,
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 7.3132,
          longitude: 125.6844,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {reports.map((r: any) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            pinColor={
              STATUS_COLORS[r.status as keyof typeof STATUS_COLORS] || "#6b7280"
            }
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{r.title}</Text>
                <Text style={styles.calloutStatus}>
                  {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS]} ·{" "}
                  {
                    WASTE_CATEGORY_LABELS[
                      r.category as keyof typeof WASTE_CATEGORY_LABELS
                    ]
                  }
                </Text>
                {r.address && (
                  <Text style={styles.calloutAddr}>{r.address}</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{reports.length} assigned</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  callout: { minWidth: 150, padding: 4 },
  calloutTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  calloutStatus: { fontSize: 12, color: "#64748b", marginTop: 2 },
  calloutAddr: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  badge: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#475569" },
});

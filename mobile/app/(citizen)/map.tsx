import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import MapView, { Marker, Callout } from "react-native-maps";
import api from "../../lib/api";
import { STATUS_COLORS, WASTE_CATEGORY_LABELS } from "../../types";

interface MapReport {
  id: string;
  title: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  address?: string;
  barangay?: { name: string };
}

export default function MapScreen() {
  const { data: reports = [] } = useQuery<MapReport[]>({
    queryKey: ["map-reports"],
    queryFn: async () => {
      const { data } = await api.get("/reports/map");
      return data;
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
        {reports.map((r) => (
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
                <Text style={styles.calloutMeta}>
                  {
                    WASTE_CATEGORY_LABELS[
                      r.category as keyof typeof WASTE_CATEGORY_LABELS
                    ]
                  }
                </Text>
                {r.barangay && (
                  <Text style={styles.calloutMeta}>
                    Brgy. {r.barangay.name}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{reports.length} reports</Text>
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
  calloutMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
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

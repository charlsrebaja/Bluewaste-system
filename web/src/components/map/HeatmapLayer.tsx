"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { HeatmapPoint } from "@/types";

// leaflet.heat is loaded via CDN or module side-effect
declare global {
  interface L_Static {
    heatLayer(
      latlngs: [number, number, number][],
      options?: Record<string, unknown>,
    ): L.Layer;
  }
}

interface HeatmapLayerProps {
  map: L.Map | null;
  data: HeatmapPoint[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
}

export default function HeatmapLayer({
  map,
  data,
  radius = 25,
  blur = 15,
  maxZoom = 17,
}: HeatmapLayerProps) {
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map || !data.length) return;

    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const heatData: [number, number, number][] = data.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    // Use L.heatLayer if available
    if (typeof (L as any).heatLayer === "function") {
      layerRef.current = (L as any)
        .heatLayer(heatData, { radius, blur, maxZoom })
        .addTo(map);
    }

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, data, radius, blur, maxZoom]);

  return null;
}

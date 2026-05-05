import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import type { Feature } from "@/lib/mpData";
import { CATEGORY_CONFIG } from "@/lib/mpData";

const MP_REGION = {
  latitude: 23.0,
  longitude: 78.5,
  latitudeDelta: 6.5,
  longitudeDelta: 6.5,
};

const PIN_COLORS: Record<string, string> = {
  river:    "blue",
  mountain: "violet",
  city:     "orange",
  wildlife: "green",
  dam:      "cyan",
};

type Props = {
  filtered: Feature[];
  onSelect: (f: Feature) => void;
};

export default function MPMapView({ filtered, onSelect }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={MP_REGION}
        showsCompass
        showsScale
        showsMyLocationButton={false}
      >
        {filtered.map((f) => (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.lat, longitude: f.lng }}
            pinColor={PIN_COLORS[f.category] ?? "red"}
            onPress={() => onSelect(f)}
            title={f.hindi}
            description={f.brief.slice(0, 60)}
          />
        ))}
      </MapView>

      {/* Legend overlay */}
      <View style={styles.legend}>
        {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
          <View key={cat} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.legendText}>{cfg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    position: "absolute",
    bottom: 100,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    padding: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#1a202c", fontFamily: "Inter_500Medium" },
});

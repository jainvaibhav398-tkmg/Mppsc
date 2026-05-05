import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { Feature } from "@/lib/mpData";
import { CATEGORY_CONFIG } from "@/lib/mpData";
import { useColors } from "@/hooks/useColors";

type Props = {
  filtered: Feature[];
  onSelect: (f: Feature) => void;
};

export default function MPMapView({ filtered, onSelect }: Props) {
  const colors = useColors();

  return (
    <FlatList
      data={filtered}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const cfg = CATEGORY_CONFIG[item.category];
        return (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.icon, { backgroundColor: cfg.color + "18" }]}>
              <Feather name={cfg.icon as any} size={20} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.hindi}</Text>
              <Text style={[styles.brief, { color: colors.mutedForeground }]} numberOfLines={2}>
                {item.brief}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="search" size={36} color="#e2e8f0" />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>कोई result नहीं मिला</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 8, paddingBottom: 120 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  brief: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 12 },
});

import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { MP_FEATURES, CATEGORY_CONFIG, type Feature, type FeatureCategory } from "@/lib/mpData";
import { useColors } from "@/hooks/useColors";
import MPMapView from "@/components/MPMapView";

type Filter = "all" | FeatureCategory;

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Feature | null>(null);
  const [aiInfo, setAiInfo] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = MP_FEATURES.filter((f) => {
    const matchCat = filter === "all" || f.category === filter;
    const matchSearch =
      !search ||
      f.hindi.includes(search) ||
      f.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelect = async (feature: Feature) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(feature);
    setAiInfo("");
    setModalVisible(true);
  };

  const handleGenerateAI = async () => {
    if (!selected) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoading(true);
    try {
      const prompt = `MPPSC परीक्षा के लिए "${selected.hindi}" (${selected.name}) के बारे में 150 शब्दों में हिंदी में बताएं। महत्वपूर्ण तथ्य, परीक्षा में आने वाले points और previous year questions शामिल करें।`;
      const info = await api.gemini.askQuestion(prompt);
      setAiInfo(info || "कोई जानकारी नहीं मिली।");
    } catch {
      setAiInfo("AI जानकारी लोड नहीं हो सकी। Internet check करें।");
    } finally {
      setAiLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingBottom: 14,
      paddingHorizontal: 16,
    },
    headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 2 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 10,
      marginTop: 10,
      paddingHorizontal: 10,
      height: 38,
      gap: 8,
    },
    searchInput: { flex: 1, color: "#fff", fontFamily: "Inter_400Regular", fontSize: 14 },
    filtersRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
    },
    chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    mapHint: {
      position: "absolute",
      top: 12,
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 10,
      pointerEvents: "none",
    },
    mapHintText: {
      backgroundColor: "rgba(0,0,0,0.55)",
      color: "#fff",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
      maxHeight: "72%",
    },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
    modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    modalSub: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    catBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      marginTop: 10,
    },
    catText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    briefText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 22, marginTop: 12 },
    aiBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      marginTop: 14,
    },
    aiBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
    aiBox: {
      marginTop: 14,
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    aiText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 22 },
    closeBtn: {
      position: "absolute",
      top: 20,
      right: 20,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>MP भूगोल Map</Text>
        <Text style={s.headerSub}>{MP_FEATURES.length} features • Tap करके AI info पाएं</Text>
        <View style={s.searchBar}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            placeholder="खोजें..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <View style={s.filtersRow}>
          {[["all", "सभी"] as const, ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => [k, v.label] as const)].map(([key, label]) => {
            const active = filter === key;
            const color = key !== "all" ? CATEGORY_CONFIG[key as FeatureCategory]?.color : colors.primary;
            const cnt = key === "all" ? MP_FEATURES.length : MP_FEATURES.filter((f) => f.category === key).length;
            return (
              <TouchableOpacity
                key={key}
                style={[s.chip, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => { setFilter(key as Filter); Haptics.selectionAsync(); }}
              >
                <Text style={[s.chipText, active && { color: "#fff" }]}>{label} {cnt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Map area */}
      <View style={{ flex: 1, position: "relative" }}>
        {Platform.OS !== "web" && (
          <View style={s.mapHint} pointerEvents="none">
            <Text style={s.mapHintText}>Marker tap करें → AI जानकारी पाएं</Text>
          </View>
        )}
        <MPMapView filtered={filtered} onSelect={handleSelect} />
      </View>

      {/* Feature Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1}>
            <ScrollView style={s.modalCard} showsVerticalScrollIndicator={false} bounces={false}>
              <View style={s.handle} />
              <TouchableOpacity style={s.closeBtn} onPress={() => setModalVisible(false)}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>

              {selected && (() => {
                const cfg = CATEGORY_CONFIG[selected.category];
                return (
                  <>
                    <Text style={s.modalTitle}>{selected.hindi}</Text>
                    <Text style={s.modalSub}>{selected.name}</Text>
                    <View style={[s.catBadge, { backgroundColor: cfg.color + "15" }]}>
                      <Feather name={cfg.icon as any} size={13} color={cfg.color} />
                      <Text style={[s.catText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={s.briefText}>{selected.brief}</Text>
                    <TouchableOpacity
                      style={[s.aiBtn, aiLoading && { opacity: 0.7 }]}
                      onPress={handleGenerateAI}
                      disabled={aiLoading}
                      activeOpacity={0.85}
                    >
                      {aiLoading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="cpu" size={16} color="#fff" />}
                      <Text style={s.aiBtnText}>
                        {aiLoading ? "AI generate कर रहा है..." : "MPPSC Notes Generate करें"}
                      </Text>
                    </TouchableOpacity>
                    {aiInfo ? (
                      <View style={s.aiBox}>
                        <Text style={s.aiText}>{aiInfo}</Text>
                      </View>
                    ) : null}
                    <View style={{ height: 20 }} />
                  </>
                );
              })()}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

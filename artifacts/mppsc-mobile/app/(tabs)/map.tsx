import React, { lazy, Suspense, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useColors } from "@/hooks/useColors";

type Category = "all" | "river" | "mountain" | "city" | "wildlife" | "dam";

type Feature = {
  id: string;
  name: string;
  hindi: string;
  category: Exclude<Category, "all">;
  lat: number;
  lng: number;
  brief: string;
};

export const MP_FEATURES: Feature[] = [
  { id: "narmada",    name: "Narmada River",    hindi: "नर्मदा नदी",           category: "river",    lat: 22.5,  lng: 76.5,  brief: "MP की जीवन रेखा, अमरकंटक से निकलती है। 1312 km लंबी।" },
  { id: "chambal",    name: "Chambal River",    hindi: "चम्बल नदी",            category: "river",    lat: 25.2,  lng: 77.8,  brief: "यमुना की सहायक, MP-राजस्थान सीमा पर बहती है।" },
  { id: "betwa",      name: "Betwa River",      hindi: "बेतवा नदी",            category: "river",    lat: 24.5,  lng: 78.0,  brief: "यमुना में मिलने वाली MP की प्रमुख नदी।" },
  { id: "tapti",      name: "Tapti River",      hindi: "ताप्ती नदी",           category: "river",    lat: 21.5,  lng: 76.2,  brief: "पश्चिम की ओर बहने वाली नदी, बेतूल जिले से।" },
  { id: "ken",        name: "Ken River",        hindi: "केन नदी",              category: "river",    lat: 24.8,  lng: 80.0,  brief: "पन्ना से निकलकर यमुना में मिलती है।" },
  { id: "wainganga",  name: "Wainganga River",  hindi: "वैनगंगा नदी",         category: "river",    lat: 21.8,  lng: 80.2,  brief: "गोदावरी की सहायक, मध्यप्रदेश-महाराष्ट्र सीमा।" },
  { id: "sone",       name: "Son River",        hindi: "सोन नदी",              category: "river",    lat: 23.0,  lng: 81.0,  brief: "अमरकंटक से निकलकर गंगा में मिलती है।" },
  { id: "vindhya",    name: "Vindhya Range",    hindi: "विंध्याचल",            category: "mountain", lat: 24.5,  lng: 77.5,  brief: "उत्तर MP में फैली पर्वत श्रृंखला, गंगा-नर्मदा जल विभाजन।" },
  { id: "satpura",    name: "Satpura Range",    hindi: "सतपुड़ा पर्वत",       category: "mountain", lat: 22.5,  lng: 78.5,  brief: "'सात पहाड़' — MP की प्रमुख पर्वत श्रृंखला।" },
  { id: "amarkantak", name: "Amarkantak",       hindi: "अमरकंटक",              category: "mountain", lat: 22.67, lng: 81.77, brief: "नर्मदा, सोन और जोहिला तीनों नदियों का उद्गम।" },
  { id: "pachmarhi",  name: "Pachmarhi",        hindi: "पचमढ़ी",               category: "mountain", lat: 22.47, lng: 78.43, brief: "MP का एकमात्र हिल स्टेशन, Satpura में 1067 मी.।" },
  { id: "dhupgarh",   name: "Dhupgarh",         hindi: "धूपगढ़",               category: "mountain", lat: 22.48, lng: 78.37, brief: "MP की सबसे ऊँची चोटी — 1352 मीटर।" },
  { id: "bhopal",     name: "Bhopal",           hindi: "भोपाल",               category: "city",     lat: 23.26, lng: 77.41, brief: "मध्यप्रदेश की राजधानी, झीलों का शहर।" },
  { id: "indore",     name: "Indore",           hindi: "इंदौर",                category: "city",     lat: 22.72, lng: 75.86, brief: "व्यापारिक नगरी, अहिल्याबाई होल्कर की राजधानी।" },
  { id: "gwalior",    name: "Gwalior",          hindi: "ग्वालियर",             category: "city",     lat: 26.22, lng: 78.18, brief: "किला नगरी, सिंधिया राजवंश, संगीत का केंद्र।" },
  { id: "jabalpur",   name: "Jabalpur",         hindi: "जबलपुर",               category: "city",     lat: 23.18, lng: 79.99, brief: "संगमरमर नगरी, भेड़ाघाट-धुआंधार जलप्रपात।" },
  { id: "ujjain",     name: "Ujjain",           hindi: "उज्जैन",               category: "city",     lat: 23.18, lng: 75.79, brief: "महाकाल नगरी, सिंहस्थ कुंभ मेला।" },
  { id: "sanchi",     name: "Sanchi",           hindi: "सांची",                category: "city",     lat: 23.48, lng: 77.74, brief: "UNESCO विश्व धरोहर — बौद्ध स्तूप।" },
  { id: "kanha",      name: "Kanha NP",         hindi: "कान्हा राष्ट्रीय उद्यान", category: "wildlife", lat: 22.27, lng: 80.61, brief: "बाघ अभयारण्य, बारासिंघा का एकमात्र घर।" },
  { id: "bandhavgarh",name: "Bandhavgarh NP",   hindi: "बांधवगढ़",              category: "wildlife", lat: 23.72, lng: 81.05, brief: "बाघों का सर्वाधिक घनत्व, उमरिया जिला।" },
  { id: "pench",      name: "Pench NP",         hindi: "पेंच",                 category: "wildlife", lat: 21.75, lng: 79.27, brief: "मोगली की भूमि, MP-महाराष्ट्र सीमा।" },
  { id: "panna",      name: "Panna NP",         hindi: "पन्ना",                category: "wildlife", lat: 24.75, lng: 80.0,  brief: "हीरे की खान + बाघ अभयारण्य, केन नदी किनारे।" },
  { id: "indira_sagar",name: "Indira Sagar Dam", hindi: "इंदिरा सागर बाँध",    category: "dam",      lat: 22.45, lng: 76.45, brief: "MP का सबसे बड़ा बाँध, खंडवा जिला, नर्मदा पर।" },
  { id: "gandhi_sagar",name: "Gandhi Sagar Dam", hindi: "गांधी सागर बाँध",    category: "dam",      lat: 24.72, lng: 75.52, brief: "चम्बल नदी पर, राजस्थान सीमा पर।" },
  { id: "tawa",       name: "Tawa Dam",         hindi: "तवा बाँध",             category: "dam",      lat: 22.55, lng: 78.22, brief: "होशंगाबाद, तवा नदी पर, सिंचाई परियोजना।" },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  river:    { label: "नदियाँ",    color: "#2563eb", icon: "droplet" },
  mountain: { label: "पर्वत",    color: "#7c3aed", icon: "triangle" },
  city:     { label: "नगर",      color: "#d97706", icon: "map-pin" },
  wildlife: { label: "वन्यजीव", color: "#16a34a", icon: "feather" },
  dam:      { label: "बाँध",     color: "#0891b2", icon: "layers" },
};

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<Category>("all");
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
      const prompt = `MPPSC परीक्षा के लिए "${selected.hindi}" (${selected.name}) के बारे में 150 शब्दों में हिंदी में बताएं। महत्वपूर्ण तथ्य, exam points और पिछले वर्षों में आए प्रश्न शामिल करें।`;
      const info = await api.gemini.askQuestion(prompt);
      setAiInfo(info);
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
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 10,
      marginTop: 10,
      paddingHorizontal: 10,
      gap: 8,
    },
    searchInput: { flex: 1, height: 36, color: "#fff", fontFamily: "Inter_400Regular", fontSize: 14 },
    filtersWrap: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    filters: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    filterBtn: {
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, backgroundColor: colors.muted,
      borderWidth: 1, borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    filterTextActive: { color: "#fff" },
    countBar: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    countText: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      marginHorizontal: 12,
      marginBottom: 8,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    catDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    itemName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    itemBrief: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 3, lineHeight: 18 },
    itemCatBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginTop: 4,
    },
    itemCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
      maxHeight: "75%",
    },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    catChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 10,
    },
    catChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    briefText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 22, marginTop: 12 },
    aiBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 13,
      marginTop: 16,
    },
    aiBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
    aiResult: {
      marginTop: 14,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 14,
    },
    aiResultText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 22 },
    closeBtn: {
      position: "absolute",
      top: 20,
      right: 20,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 80 },
  });

  const FeatureModal = () => {
    if (!selected) return null;
    const cfg = CATEGORY_CONFIG[selected.category];
    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1}>
            <ScrollView style={s.modalCard} showsVerticalScrollIndicator={false}>
              <View style={s.modalHandle} />
              <TouchableOpacity style={s.closeBtn} onPress={() => setModalVisible(false)}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              <Text style={s.modalTitle}>{selected.hindi}</Text>
              <Text style={s.modalSub}>{selected.name}</Text>

              <View style={[s.catChip, { backgroundColor: cfg.color + "15" }]}>
                <Feather name={cfg.icon as any} size={13} color={cfg.color} />
                <Text style={[s.catChipText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>

              <Text style={s.briefText}>{selected.brief}</Text>

              <TouchableOpacity
                style={[s.aiBtn, aiLoading && { opacity: 0.7 }]}
                onPress={handleGenerateAI}
                disabled={aiLoading}
                activeOpacity={0.85}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Feather name="cpu" size={16} color="#fff" />
                )}
                <Text style={s.aiBtnText}>
                  {aiLoading ? "AI generate कर रहा है..." : "AI से विस्तृत जानकारी लें"}
                </Text>
              </TouchableOpacity>

              {aiInfo ? (
                <View style={s.aiResult}>
                  <Text style={s.aiResultText}>{aiInfo}</Text>
                </View>
              ) : null}
              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>MP भूगोल Explorer</Text>
        <Text style={s.headerSub}>नदियाँ • पर्वत • नगर • वन्यजीव • बाँध</Text>
        <View style={s.searchBar}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            placeholder="खोजें..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={s.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          <TouchableOpacity
            style={[s.filterBtn, filter === "all" && s.filterBtnActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[s.filterText, filter === "all" && s.filterTextActive]}>सभी ({MP_FEATURES.length})</Text>
          </TouchableOpacity>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const cnt = MP_FEATURES.filter((f) => f.category === key).length;
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.filterBtn, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                onPress={() => setFilter(key as Category)}
              >
                <Text style={[s.filterText, active && { color: "#fff" }]}>
                  {cfg.label} ({cnt})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = CATEGORY_CONFIG[item.category];
          return (
            <TouchableOpacity style={s.listItem} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <View style={[s.catDot, { backgroundColor: cfg.color + "18" }]}>
                <Feather name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.hindi}</Text>
                <Text style={s.itemBrief} numberOfLines={2}>{item.brief}</Text>
                <View style={[s.itemCatBadge, { backgroundColor: cfg.color + "15" }]}>
                  <Text style={[s.itemCatText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Feather name="search" size={36} color={colors.border} />
            <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular" }}>
              "{search}" नहीं मिला
            </Text>
          </View>
        }
      />

      <FeatureModal />
    </View>
  );
}

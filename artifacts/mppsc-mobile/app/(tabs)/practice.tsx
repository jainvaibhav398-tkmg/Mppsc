import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { useQuiz } from "@/context/QuizContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = ["MP History", "MP Geography", "Indian Polity"];
const COUNTS = [5, 10, 20];

export default function PracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startQuiz } = useQuiz();

  const [subject, setSubject] = useState("MP History");
  const [count, setCount] = useState(10);
  const [focusWeak, setFocusWeak] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const data = await api.sessions.create({
        subject,
        questionCount: count,
        focusWeakTopics: focusWeak,
      });
      startQuiz(data.session, data.questions, "practice");
      router.push("/quiz");
    } catch {
      alert("Session शुरू नहीं हो सका। दोबारा try करें।");
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
    content: { padding: 16, gap: 20 },
    section: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionLabel: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    option: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.muted,
    },
    optionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "15",
    },
    optionText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    optionTextActive: { color: colors.primary },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    toggleSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2, maxWidth: "80%" },
    startBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
      marginTop: 4,
    },
    startBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
    note: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 8,
    },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 80 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Practice Session</Text>
        <Text style={s.headerSub}>अपना test configure करें</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Subject */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Subject चुनें</Text>
          <View style={s.optionRow}>
            {SUBJECTS.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[s.option, subject === sub && s.optionActive]}
                onPress={() => { setSubject(sub); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Text style={[s.optionText, subject === sub && s.optionTextActive]}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Count */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Questions की संख्या</Text>
          <View style={s.optionRow}>
            {COUNTS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.option, count === c && s.optionActive, { minWidth: 70, alignItems: "center" }]}
                onPress={() => { setCount(c); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Text style={[s.optionText, count === c && s.optionTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Focus Weak */}
        <View style={s.section}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Weak Topics पर Focus</Text>
              <Text style={s.toggleSub}>उन topics से questions जहाँ गलतियाँ हुई हैं</Text>
            </View>
            <Switch
              value={focusWeak}
              onValueChange={(v) => { setFocusWeak(v); Haptics.selectionAsync(); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Start */}
        <TouchableOpacity
          style={[s.startBtn, loading && { opacity: 0.7 }]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="play" size={20} color="#fff" />
          )}
          <Text style={s.startBtnText}>
            {loading ? "Questions Generate हो रहे हैं..." : "Practice शुरू करें"}
          </Text>
        </TouchableOpacity>
        {loading && (
          <Text style={s.note}>पहली बार 15-30 seconds लग सकते हैं</Text>
        )}

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuiz } from "@/context/QuizContext";
import { useColors } from "@/hooks/useColors";

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { result, sessionType, resetQuiz } = useQuiz();

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetQuiz();
    router.replace("/(tabs)");
  };

  const handlePracticeAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetQuiz();
    router.replace("/(tabs)/practice");
  };

  if (!result) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          कोई result नहीं मिला।
        </Text>
        <TouchableOpacity onPress={handleHome} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Home जाएं</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const score = Math.round(result.score);
  const scoreColor =
    score >= 70 ? colors.success : score >= 40 ? "#d69e2e" : colors.destructive;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: {
      padding: 24,
      paddingTop: Platform.OS === "web" ? 80 : insets.top + 24,
      alignItems: "center",
      gap: 20,
    },
    trophy: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: scoreColor + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: -12,
    },
    scoreCard: {
      width: "100%",
      backgroundColor: scoreColor + "15",
      borderRadius: colors.radius,
      padding: 24,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: scoreColor + "40",
    },
    scoreNum: {
      fontSize: 56,
      fontFamily: "Inter_700Bold",
      color: scoreColor,
    },
    scoreLabel: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: scoreColor,
      marginTop: -4,
    },
    statsRow: { flexDirection: "row", gap: 12, width: "100%" },
    statBox: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    weakCard: {
      width: "100%",
      backgroundColor: colors.destructive + "08",
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.destructive + "30",
    },
    weakTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.destructive,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    weakTitleText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.destructive },
    weakItem: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, paddingVertical: 3 },
    btnRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
    btn: {
      flex: 1,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    primaryBtn: { backgroundColor: colors.primary },
    outlineBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
    primaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
    outlineBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 16 },
  });

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.trophy}>
          <Feather
            name={score >= 70 ? "award" : score >= 40 ? "target" : "refresh-cw"}
            size={36}
            color={scoreColor}
          />
        </View>

        <Text style={s.title}>
          {score >= 70 ? "शानदार!" : score >= 40 ? "अच्छा प्रयास!" : "और Practice करें!"}
        </Text>
        <Text style={s.subtitle}>
          {sessionType === "daily" ? "Daily Test Complete" : "Practice Session Complete"}
        </Text>

        <View style={s.scoreCard}>
          <Text style={s.scoreNum}>{score}%</Text>
          <Text style={s.scoreLabel}>Score</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: colors.success }]}>{result.correctCount}</Text>
            <Text style={s.statLabel}>सही</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: colors.destructive }]}>{result.wrongCount}</Text>
            <Text style={s.statLabel}>गलत</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: colors.primary }]}>
              {result.correctCount + result.wrongCount}
            </Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
        </View>

        {result.wrongTopics.length > 0 && (
          <View style={s.weakCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s.weakTitleText}>Revise करें</Text>
            </View>
            {result.wrongTopics.slice(0, 6).map((t, i) => (
              <Text key={i} style={s.weakItem}>• {t}</Text>
            ))}
          </View>
        )}

        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, s.outlineBtn]} onPress={handlePracticeAgain} activeOpacity={0.8}>
            <Feather name="repeat" size={16} color={colors.foreground} />
            <Text style={s.outlineBtnText}>फिर Practice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.primaryBtn]} onPress={handleHome} activeOpacity={0.8}>
            <Feather name="home" size={16} color="#fff" />
            <Text style={s.primaryBtnText}>Home</Text>
          </TouchableOpacity>
        </View>

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

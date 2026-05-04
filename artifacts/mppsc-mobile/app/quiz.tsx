import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { api } from "@/lib/api";
import { useQuiz } from "@/context/QuizContext";
import { useColors } from "@/hooks/useColors";

const OPTIONS = ["A", "B", "C", "D"] as const;

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, questions, sessionType, setResult } = useQuiz();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<{ questionId: number; selectedOption: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!session || questions.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          कोई question नहीं मिला।
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>← वापस जाएं</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (opt: string) => {
    if (selected === opt) return;
    setSelected(opt);
    Haptics.selectionAsync();
  };

  const handleNext = async () => {
    if (!selected) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newAnswers = [...answers, { questionId: question.id, selectedOption: selected }];
    setAnswers(newAnswers);

    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setSelected("");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.sessions.submit(session.id, newAnswers);
      setResult(result);
      router.replace("/result");
    } catch {
      alert("Submit नहीं हो सका। Internet check करें।");
    } finally {
      setSubmitting(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingBottom: 16,
      paddingHorizontal: 20,
    },
    topBarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    backBtn: { padding: 4 },
    topLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)" },
    counter: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)" },
    progressBg: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 },
    progressFill: { height: 4, backgroundColor: "#fff", borderRadius: 2 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
    },
    chipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.primary },
    questionText: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      lineHeight: 26,
      marginBottom: 20,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    optionBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    optionBadgeSelected: { backgroundColor: colors.primary },
    optionBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.mutedForeground },
    optionBadgeTextSelected: { color: "#fff" },
    optionText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, flex: 1, lineHeight: 20 },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 16,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16,
    },
    nextBtn: {
      backgroundColor: selected ? colors.primary : colors.muted,
      borderRadius: 12,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    nextBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: selected ? "#fff" : colors.mutedForeground,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View style={s.topBarRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <Text style={s.topLabel}>{sessionType === "daily" ? "Daily Test" : session.subject}</Text>
          <Text style={s.counter}>{currentIndex + 1}/{questions.length}</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.chips}>
          <View style={s.chip}>
            <Text style={s.chipText}>{question.topic}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipText}>{question.subject}</Text>
          </View>
          <View style={[s.chip, { backgroundColor: question.difficulty === "easy" ? "#dcfce7" : question.difficulty === "hard" ? "#fee2e2" : "#fef3c7" }]}>
            <Text style={[s.chipText, { color: question.difficulty === "easy" ? "#16a34a" : question.difficulty === "hard" ? "#dc2626" : "#d97706" }]}>
              {question.difficulty}
            </Text>
          </View>
        </View>

        <Text style={s.questionText}>{question.questionText}</Text>

        {OPTIONS.map((opt) => {
          const optKey = `option${opt}` as keyof typeof question;
          return (
            <TouchableOpacity
              key={opt}
              style={[s.option, selected === opt && s.optionSelected]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.7}
            >
              <View style={[s.optionBadge, selected === opt && s.optionBadgeSelected]}>
                <Text style={[s.optionBadgeText, selected === opt && s.optionBadgeTextSelected]}>{opt}</Text>
              </View>
              <Text style={s.optionText}>{question[optKey] as string}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.nextBtn, (!selected || submitting) && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={!selected || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={s.nextBtnText}>{isLast ? "Submit करें" : "अगला Question"}</Text>
              {!submitting && <Feather name={isLast ? "check" : "arrow-right"} size={18} color={selected ? "#fff" : colors.mutedForeground} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

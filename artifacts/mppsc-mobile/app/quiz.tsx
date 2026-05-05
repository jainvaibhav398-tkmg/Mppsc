import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
  const { session, questions, sessionType, timerPerQuestion, setResult } = useQuiz();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<{ questionId: number; selectedOption: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerBarAnim = useRef(new Animated.Value(1)).current;

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Start timer when question changes
  useEffect(() => {
    if (!timerPerQuestion || timerPerQuestion <= 0) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(timerPerQuestion);
    timerBarAnim.setValue(1);
    Animated.timing(timerBarAnim, {
      toValue: 0,
      duration: timerPerQuestion * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-skip
          handleAutoSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  const handleAutoSkip = () => {
    const optKey = `option${OPTIONS[0]}` as keyof typeof question;
    const autoAnswer = { questionId: question.id, selectedOption: OPTIONS[0] };
    const newAnswers = [...answers, autoAnswer];
    setAnswers(newAnswers);
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setSelected("");
    } else {
      submitAnswers(newAnswers);
    }
  };

  const handleSelect = async (opt: string) => {
    if (selected) return;
    setSelected(opt);
    Haptics.selectionAsync();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNext = async () => {
    if (!selected && !timerPerQuestion) return;
    const chosenOpt = selected || OPTIONS[0];
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newAnswers = [...answers, { questionId: question.id, selectedOption: chosenOpt }];
    setAnswers(newAnswers);
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setSelected("");
    } else {
      await submitAnswers(newAnswers);
    }
  };

  const submitAnswers = async (ans: { questionId: number; selectedOption: string }[]) => {
    if (!session) return;
    setSubmitting(true);
    try {
      const result = await api.sessions.submit(session.id, ans);
      setResult(result);
      router.replace("/result");
    } catch {
      alert("Submit नहीं हो सका। Internet check करें।");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session || questions.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>कोई question नहीं मिला।</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>← वापस जाएं</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timerColor = timeLeft !== null && timeLeft <= 10 ? colors.destructive : colors.primary;
  const canNext = selected !== "" || (timerPerQuestion > 0 && timeLeft === 0);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 10,
      paddingBottom: 0,
      paddingHorizontal: 16,
    },
    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    counterPill: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    counterText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
    subjectLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium" },
    timerPill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      minWidth: 52,
      alignItems: "center",
    },
    timerText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    progressBg: { height: 3, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 0 },
    progressFill: { height: 3, backgroundColor: "#fff" },
    timerBar: { height: 3, backgroundColor: colors.destructive + "80" },
    timerBarFill: { height: 3 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 110 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    chipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
    questionText: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      lineHeight: 27,
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
    optBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    optBadgeSelected: { backgroundColor: colors.primary },
    optBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.mutedForeground },
    optBadgeTextSel: { color: "#fff" },
    optText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, flex: 1, lineHeight: 21 },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 16,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 14,
    },
    nextBtn: {
      borderRadius: 12,
      paddingVertical: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <View style={s.topRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <Text style={s.subjectLabel}>{sessionType === "daily" ? "Daily Test" : session.subject}</Text>
          <View style={s.counterPill}>
            <Text style={s.counterText}>{currentIndex + 1}/{questions.length}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>

        {/* Timer bar */}
        {timerPerQuestion > 0 && timeLeft !== null && (
          <Animated.View
            style={[
              s.timerBarFill,
              {
                width: timerBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }) as any,
                backgroundColor: timerColor,
                height: 3,
              },
            ]}
          />
        )}
      </View>

      {/* Timer display */}
      {timerPerQuestion > 0 && timeLeft !== null && (
        <View style={{ alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 10 }}>
          <View style={[s.timerPill, { backgroundColor: timerColor + "18" }]}>
            <Text style={[s.timerText, { color: timerColor }]}>{timeLeft}s</Text>
          </View>
        </View>
      )}

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.chips}>
          <View style={[s.chip, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[s.chipText, { color: colors.primary }]}>{question.topic}</Text>
          </View>
          <View style={[s.chip, {
            backgroundColor: question.difficulty === "easy" ? "#dcfce7" : question.difficulty === "hard" ? "#fee2e2" : "#fef3c7"
          }]}>
            <Text style={[s.chipText, {
              color: question.difficulty === "easy" ? "#16a34a" : question.difficulty === "hard" ? "#dc2626" : "#d97706"
            }]}>
              {question.difficulty}
            </Text>
          </View>
        </View>

        <Text style={s.questionText}>{question.questionText}</Text>

        {OPTIONS.map((opt) => {
          const text = question[`option${opt}` as keyof typeof question] as string;
          return (
            <TouchableOpacity
              key={opt}
              style={[s.option, selected === opt && s.optionSelected]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.7}
            >
              <View style={[s.optBadge, selected === opt && s.optBadgeSelected]}>
                <Text style={[s.optBadgeText, selected === opt && s.optBadgeTextSel]}>{opt}</Text>
              </View>
              <Text style={s.optText}>{text}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[
            s.nextBtn,
            { backgroundColor: canNext ? colors.primary : colors.muted },
            (!canNext || submitting) && { opacity: 0.7 },
          ]}
          onPress={handleNext}
          disabled={!canNext || submitting}
          activeOpacity={0.85}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : null}
          <Text style={[s.nextBtnText, { color: canNext ? "#fff" : colors.mutedForeground }]}>
            {submitting ? "Submit हो रहा है..." : isLast ? "Submit करें" : "अगला Question →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

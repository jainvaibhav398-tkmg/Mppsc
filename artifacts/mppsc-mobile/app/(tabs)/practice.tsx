import React, { useEffect, useState } from "react";
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
import { localDb, type LocalMeta } from "@/lib/localDb";
import { useQuiz } from "@/context/QuizContext";
import { useColors } from "@/hooks/useColors";

const SUBJECTS = ["MP History", "MP Geography", "Indian Polity"];
const COUNTS = [5, 10, 20];
const TIMERS = [
  { label: "Off", value: 0 },
  { label: "30s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "90s", value: 90 },
  { label: "2 min", value: 120 },
];

export default function PracticeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startQuiz } = useQuiz();

  const [subject, setSubject] = useState("MP History");
  const [count, setCount] = useState(10);
  const [focusWeak, setFocusWeak] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [localMeta, setLocalMeta] = useState<LocalMeta | null>(null);
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    localDb.getMeta().then(setLocalMeta);
  }, []);

  const handleDownload = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDownloading(true);
    try {
      for (const sub of SUBJECTS) {
        const data = await api.sessions.create({ subject: sub, questionCount: 20, focusWeakTopics: false });
        await localDb.save(data.questions);
      }
      const meta = await localDb.getMeta();
      setLocalMeta(meta);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      alert("Download failed. Internet check करें।");
    } finally {
      setDownloading(false);
    }
  };

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (useLocal && localMeta && localMeta.count > 0) {
        const questions = await localDb.loadForSession(subject, count, focusWeak);
        if (questions.length === 0) {
          alert("Local में इस subject के questions नहीं हैं। पहले Download करें।");
          setLoading(false);
          return;
        }
        const data = await api.sessions.create({ subject, questionCount: count, focusWeakTopics: focusWeak });
        startQuiz(data.session, questions, "practice", timerSec);
      } else {
        const data = await api.sessions.create({ subject, questionCount: count, focusWeakTopics: focusWeak });
        startQuiz(data.session, data.questions, "practice", timerSec);
      }
      router.push("/quiz");
    } catch {
      alert("Session शुरू नहीं हो सका। दोबारा try करें।");
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingBottom: 18,
      paddingHorizontal: 16,
    },
    headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 2 },
    content: { padding: 16, gap: 14 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    cardLabel: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    opt: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.muted,
    },
    optActive: { borderColor: colors.primary, backgroundColor: colors.primary + "12" },
    optText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    optTextActive: { color: colors.primary, fontFamily: "Inter_600SemiBold" },
    toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    toggleLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    toggleSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, maxWidth: "75%" },
    downloadCard: {
      backgroundColor: colors.primary + "08",
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary + "25",
    },
    downloadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    downloadTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    downloadSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    downloadBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    downloadBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
    startBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    startBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
    note: { fontSize: 12, color: colors.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular", marginTop: 6 },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 80 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Practice Session</Text>
        <Text style={s.headerSub}>MCQ practice configure करें</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Subject */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Subject</Text>
          <View style={s.optionRow}>
            {SUBJECTS.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[s.opt, subject === sub && s.optActive]}
                onPress={() => { setSubject(sub); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Text style={[s.optText, subject === sub && s.optTextActive]}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Count */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Questions की संख्या</Text>
          <View style={s.optionRow}>
            {COUNTS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.opt, count === c && s.optActive, { minWidth: 64, alignItems: "center" }]}
                onPress={() => { setCount(c); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Text style={[s.optText, count === c && s.optTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timer */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Timer per Question</Text>
          <View style={s.optionRow}>
            {TIMERS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[s.opt, timerSec === t.value && s.optActive]}
                onPress={() => { setTimerSec(t.value); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Text style={[s.optText, timerSec === t.value && s.optTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Focus Weak */}
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Weak Topics Focus</Text>
              <Text style={s.toggleSub}>गलत हुए topics से questions पहले आएंगे</Text>
            </View>
            <Switch
              value={focusWeak}
              onValueChange={(v) => { setFocusWeak(v); Haptics.selectionAsync(); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Local DB */}
        <View style={s.downloadCard}>
          <View style={s.downloadRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={s.downloadTitle}>Offline Questions</Text>
              <Text style={s.downloadSub}>
                {localMeta
                  ? `${localMeta.count} questions downloaded — ${new Date(localMeta.downloadedAt).toLocaleDateString("hi-IN")}`
                  : "Questions download करें — offline भी use करें"}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.downloadBtn, downloading && { opacity: 0.6 }]}
              onPress={handleDownload}
              disabled={downloading}
              activeOpacity={0.8}
            >
              {downloading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="download" size={14} color="#fff" />}
              <Text style={s.downloadBtnText}>{downloading ? "..." : localMeta ? "Refresh" : "Download"}</Text>
            </TouchableOpacity>
          </View>
          {localMeta && localMeta.count > 0 && (
            <View style={[s.toggleRow, { marginTop: 12 }]}>
              <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>Local Questions Use करें</Text>
              <Switch
                value={useLocal}
                onValueChange={setUseLocal}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          )}
        </View>

        {/* Start */}
        <TouchableOpacity
          style={[s.startBtn, loading && { opacity: 0.7 }]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="play" size={20} color="#fff" />}
          <Text style={s.startBtnText}>
            {loading ? "Generate हो रहे हैं..." : "Practice शुरू करें"}
          </Text>
        </TouchableOpacity>
        {loading && <Text style={s.note}>पहली बार 15-30 sec लग सकते हैं</Text>}
        {timerSec > 0 && !loading && (
          <Text style={s.note}>⏱ हर question के लिए {timerSec}s का timer</Text>
        )}

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

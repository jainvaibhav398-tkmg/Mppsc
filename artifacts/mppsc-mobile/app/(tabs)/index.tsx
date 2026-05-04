import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useQuiz } from "@/context/QuizContext";
import { useColors } from "@/hooks/useColors";

function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startQuiz } = useQuiz();
  const [startingDaily, setStartingDaily] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: api.stats.overview,
  });

  const { data: daily, refetch: refetchDaily } = useQuery({
    queryKey: ["daily-today"],
    queryFn: api.dailyTest.today,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: api.sessions.list,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchDaily()]);
    setRefreshing(false);
  }, [refetchStats, refetchDaily]);

  const handleStartDaily = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStartingDaily(true);
    try {
      const data = await api.dailyTest.start();
      if (data.alreadyCompleted || !data.questions.length) {
        alert("आज का Daily Test पहले से complete हो चुका है!");
        return;
      }
      startQuiz(data.session, data.questions, "daily");
      router.push("/quiz");
    } catch {
      alert("Daily Test शुरू नहीं हो सका। Internet connection check करें।");
    } finally {
      setStartingDaily(false);
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
    headerTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: "#ffffff",
    },
    headerSub: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.7)",
      marginTop: 2,
    },
    content: { padding: 16, gap: 16 },
    dailyCard: {
      backgroundColor: daily?.completed ? "#f0fdf4" : colors.card,
      borderRadius: colors.radius,
      padding: 20,
      borderWidth: daily?.completed ? 1.5 : 1,
      borderColor: daily?.completed ? "#86efac" : colors.border,
    },
    dailyCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    dailyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: daily?.completed ? "#dcfce7" : colors.primary + "15",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    dailyBadgeText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: daily?.completed ? "#16a34a" : colors.primary,
    },
    dailyTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 4,
    },
    dailyDate: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginBottom: 16,
    },
    dailyStats: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    dailyStat: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
    },
    dailyStatNum: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    dailyStatLabel: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    startBtn: {
      backgroundColor: daily?.completed ? "#16a34a" : colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    startBtnText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#ffffff",
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 12,
    },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    statCard: {
      flex: 1,
      minWidth: "44%",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNum: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 4,
    },
    sessionRow: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    sessionSubject: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    sessionDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    sessionScore: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.primary },
    emptyText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 80 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>MPPSC परीक्षा तैयारी</Text>
        <Text style={s.headerSub}>आज की तारीख: {getTodayIST()}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Test Card */}
        <View style={s.dailyCard}>
          <View style={s.dailyCardHeader}>
            <Text style={s.dailyTitle}>Daily Test</Text>
            <View style={s.dailyBadge}>
              <Feather
                name={daily?.completed ? "check-circle" : "calendar"}
                size={13}
                color={daily?.completed ? "#16a34a" : colors.primary}
              />
              <Text style={s.dailyBadgeText}>
                {daily?.completed ? "Complete" : "Pending"}
              </Text>
            </View>
          </View>
          <Text style={s.dailyDate}>{getTodayIST()} का test</Text>

          <View style={s.dailyStats}>
            <View style={s.dailyStat}>
              <Text style={s.dailyStatNum}>100</Text>
              <Text style={s.dailyStatLabel}>Questions</Text>
            </View>
            <View style={s.dailyStat}>
              <Text style={s.dailyStatNum}>2</Text>
              <Text style={s.dailyStatLabel}>Subjects</Text>
            </View>
            <View style={s.dailyStat}>
              <Text style={s.dailyStatNum}>{stats?.streak ?? 0}</Text>
              <Text style={s.dailyStatLabel}>Day Streak</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.startBtn, (startingDaily || daily?.completed) && { opacity: daily?.completed ? 1 : 0.7 }]}
            onPress={daily?.completed ? undefined : handleStartDaily}
            disabled={startingDaily}
            activeOpacity={0.8}
          >
            {startingDaily ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name={daily?.completed ? "check" : "play"} size={18} color="#fff" />
            )}
            <Text style={s.startBtnText}>
              {startingDaily
                ? "Questions Generate हो रहे हैं..."
                : daily?.completed
                ? "आज का Test Complete!"
                : "आज का Test शुरू करें"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View>
            <Text style={s.sectionTitle}>आपकी Progress</Text>
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <Text style={s.statNum}>{stats.totalQuestions}</Text>
                <Text style={s.statLabel}>Questions Solved</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statNum}>{stats.averageScore.toFixed(0)}%</Text>
                <Text style={s.statLabel}>Avg Score</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statNum}>{stats.totalCorrect}</Text>
                <Text style={s.statLabel}>Correct</Text>
              </View>
              <View style={s.statCard}>
                <Text style={[s.statNum, { color: colors.destructive }]}>{stats.weakTopicsCount}</Text>
                <Text style={s.statLabel}>Weak Topics</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Recent Sessions</Text>
            {sessions.slice(0, 5).map((session) => (
              <View key={session.id} style={s.sessionRow}>
                <View>
                  <Text style={s.sessionSubject}>{session.subject}</Text>
                  <Text style={s.sessionDate}>
                    {new Date(session.createdAt).toLocaleDateString("hi-IN")}
                  </Text>
                </View>
                <Text style={s.sessionScore}>{Math.round(session.score)}%</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

import React, { useCallback, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: api.stats.overview,
  });

  const { data: topics, refetch: refetchTopics } = useQuery({
    queryKey: ["stats-topics"],
    queryFn: api.stats.topics,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchTopics()]);
    setRefreshing(false);
  }, [refetchStats, refetchTopics]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
    content: { padding: 16, gap: 20 },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 12,
    },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    statCard: {
      flex: 1,
      minWidth: "44%",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "flex-start",
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    statNum: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.foreground },
    statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    topicCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.destructive + "40",
      backgroundColor: colors.destructive + "08",
      marginBottom: 8,
    },
    topicRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    topicName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 },
    topicSubject: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    topicAccuracy: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.destructive },
    topicAttempts: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2, textAlign: "right" },
    barWrap: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 8 },
    bar: { height: 4, borderRadius: 2 },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 8, textAlign: "center" },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 80 },
  });

  const StatIcon = ({ name, color }: { name: string; color: string }) => (
    <View style={[s.statIcon, { backgroundColor: color + "20" }]}>
      <Feather name={name as any} size={18} color={color} />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Progress & Stats</Text>
        <Text style={s.headerSub}>अपनी performance देखें</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {stats && (
          <View>
            <Text style={s.sectionTitle}>Overall Performance</Text>
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <StatIcon name="book-open" color={colors.primary} />
                <Text style={s.statNum}>{stats.totalQuestions}</Text>
                <Text style={s.statLabel}>Questions Attempted</Text>
              </View>
              <View style={s.statCard}>
                <StatIcon name="trending-up" color={colors.accent} />
                <Text style={s.statNum}>{stats.averageScore.toFixed(1)}%</Text>
                <Text style={s.statLabel}>Average Score</Text>
              </View>
              <View style={s.statCard}>
                <StatIcon name="check-circle" color={colors.success} />
                <Text style={[s.statNum, { color: colors.success }]}>{stats.totalCorrect}</Text>
                <Text style={s.statLabel}>Correct Answers</Text>
              </View>
              <View style={s.statCard}>
                <StatIcon name="x-circle" color={colors.destructive} />
                <Text style={[s.statNum, { color: colors.destructive }]}>{stats.totalWrong}</Text>
                <Text style={s.statLabel}>Wrong Answers</Text>
              </View>
              <View style={s.statCard}>
                <StatIcon name="layers" color="#e67e22" />
                <Text style={s.statNum}>{stats.totalSessions}</Text>
                <Text style={s.statLabel}>Total Sessions</Text>
              </View>
              <View style={s.statCard}>
                <StatIcon name="zap" color="#8b5cf6" />
                <Text style={[s.statNum, { color: "#8b5cf6" }]}>{stats.streak}</Text>
                <Text style={s.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weak Topics */}
        <View>
          <Text style={s.sectionTitle}>Weak Topics — Revise करें</Text>
          {topics && topics.length > 0 ? (
            topics.slice(0, 10).map((t, i) => {
              const pct = Math.round(t.accuracy * 100);
              return (
                <View key={i} style={s.topicCard}>
                  <View style={s.topicRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.topicName}>{t.topic}</Text>
                      <Text style={s.topicSubject}>{t.subject}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={s.topicAccuracy}>{pct}%</Text>
                      <Text style={s.topicAttempts}>{t.correctCount}/{t.totalAttempts} सही</Text>
                    </View>
                  </View>
                  <View style={s.barWrap}>
                    <View
                      style={[
                        s.bar,
                        {
                          width: `${pct}%` as any,
                          backgroundColor: pct < 40 ? colors.destructive : pct < 70 ? "#d69e2e" : colors.success,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyCard}>
              <Feather name="check-circle" size={32} color={colors.success} />
              <Text style={s.emptyText}>
                अभी कोई weak topics नहीं हैं।{"\n"}Practice करते रहें!
              </Text>
            </View>
          )}
        </View>

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

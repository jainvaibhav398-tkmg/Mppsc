import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  requestNotificationPermissions,
  scheduleTimetableNotifications,
  cancelAllNotifications,
} from "@/lib/notifications";
import { useColors } from "@/hooks/useColors";

const DAYS = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"];
const DAY_FULL = ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"];
const SLOTS = ["🌅 सुबह\n6–10", "☀️ दोपहर\n12–4", "🌙 शाम\n6–10"] as const;
const SLOT_KEYS = ["morning", "afternoon", "evening"] as const;
type SlotKey = typeof SLOT_KEYS[number];

const SUBJECTS = [
  "MP History", "MP Geography", "Indian Polity", "Economy",
  "Science", "GK", "Current Affairs", "Revision", "Break",
];
const SUBJECT_COLORS: Record<string, string> = {
  "MP History":     "#dc2626",
  "MP Geography":   "#2563eb",
  "Indian Polity":  "#7c3aed",
  "Economy":        "#d97706",
  "Science":        "#0891b2",
  "GK":             "#16a34a",
  "Current Affairs":"#db2777",
  "Revision":       "#f59e0b",
  "Break":          "#94a3b8",
};

type SlotData = { subject: string; topic: string };
type DayEntry = Partial<Record<SlotKey, SlotData>>;
type Timetable = Record<string, DayEntry>;

type CompletionSlot = { completedAt: string } | null;
type DayCompletion = Partial<Record<SlotKey, CompletionSlot>>;
type CompletionData = Record<string, DayCompletion>; // key = "YYYY-WW"

const TT_KEY = "mppsc_timetable_v2";
const COMP_KEY = "mppsc_completion_v2";
const NOTIF_KEY = "mppsc_notifications_enabled";

const EMPTY_SLOT: SlotData = { subject: "", topic: "" };

function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function todayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function TimetableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [timetable, setTimetable] = useState<Timetable>({});
  const [completion, setCompletion] = useState<CompletionData>({});
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(false);
  const [editDay, setEditDay] = useState(0);
  const [editSlot, setEditSlot] = useState<SlotKey>("morning");
  const [editSubject, setEditSubject] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const today = todayDayIndex();
  const weekKey = getWeekKey();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(TT_KEY),
      AsyncStorage.getItem(COMP_KEY),
      AsyncStorage.getItem(NOTIF_KEY),
    ]).then(([ttRaw, compRaw, notifRaw]) => {
      if (ttRaw) setTimetable(JSON.parse(ttRaw));
      if (compRaw) setCompletion(JSON.parse(compRaw));
      if (notifRaw) setNotifEnabled(JSON.parse(notifRaw) === true);
    });
  }, []);

  const saveTimetable = async (data: Timetable) => {
    setTimetable(data);
    await AsyncStorage.setItem(TT_KEY, JSON.stringify(data));
    if (notifEnabled) await scheduleTimetableNotifications(data);
  };

  const saveCompletion = async (data: CompletionData) => {
    setCompletion(data);
    await AsyncStorage.setItem(COMP_KEY, JSON.stringify(data));
  };

  const getSlot = (day: number, slot: SlotKey): SlotData => timetable[day]?.[slot] ?? EMPTY_SLOT;
  const isCompleted = (day: number, slot: SlotKey): boolean => !!completion[weekKey]?.[day]?.[slot];

  const toggleComplete = async (day: number, slot: SlotKey) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const slotData = getSlot(day, slot);
    if (!slotData.subject) return;
    const current = completion[weekKey]?.[day]?.[slot];
    const updated: CompletionData = { ...completion };
    if (!updated[weekKey]) updated[weekKey] = {};
    if (!updated[weekKey][day]) updated[weekKey][day] = {};
    updated[weekKey][day][slot] = current ? null : { completedAt: new Date().toISOString() };
    await saveCompletion(updated);
    if (!current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permission Required", "Settings में Notifications enable करें।");
        return;
      }
      await scheduleTimetableNotifications(timetable);
    } else {
      await cancelAllNotifications();
    }
    setNotifEnabled(enabled);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(enabled));
    Haptics.selectionAsync();
  };

  const openEdit = (day: number, slot: SlotKey) => {
    const cur = getSlot(day, slot);
    setEditDay(day);
    setEditSlot(slot);
    setEditSubject(cur.subject);
    setEditTopic(cur.topic);
    setEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveEdit = async () => {
    const updated: Timetable = {
      ...timetable,
      [editDay]: { ...(timetable[editDay] ?? {}), [editSlot]: { subject: editSubject, topic: editTopic } },
    };
    await saveTimetable(updated);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditModal(false);
  };

  const clearSlot = async () => {
    const updated: Timetable = {
      ...timetable,
      [editDay]: { ...(timetable[editDay] ?? {}), [editSlot]: EMPTY_SLOT },
    };
    await saveTimetable(updated);
    setEditModal(false);
  };

  // Analysis data
  const analysisData = () => {
    const weekData = completion[weekKey] ?? {};
    let total = 0, done = 0;
    const subjectHours: Record<string, number> = {};
    for (let d = 0; d < 7; d++) {
      for (const sk of SLOT_KEYS) {
        const slot = getSlot(d, sk);
        if (!slot.subject || slot.subject === "Break") continue;
        total++;
        if (weekData[d]?.[sk]) {
          done++;
          subjectHours[slot.subject] = (subjectHours[slot.subject] ?? 0) + 4;
        }
      }
    }
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0, subjectHours };
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingBottom: 14,
      paddingHorizontal: 16,
    },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 2 },
    headerBtns: { flexDirection: "row", gap: 10 },
    headerBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifycontent: "center",
      justifyContent: "center",
    },
    notifRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(255,255,255,0.12)",
      marginTop: 10,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    notifLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
    scroll: { flex: 1 },
    section: { padding: 14 },
    sectionTitle: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      marginBottom: 10,
    },
    todayCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    slotRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    slotDone: { backgroundColor: "#f0fdf4" },
    slotTime: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, width: 50, textAlign: "center" },
    slotSubject: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, flex: 1 },
    slotTopic: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    slotEmpty: { fontSize: 14, color: colors.border, fontFamily: "Inter_400Regular", flex: 1 },
    checkBox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
    gridWrap: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gridHeader: { flexDirection: "row", marginBottom: 6 },
    gridHeaderCell: { flex: 1, fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textAlign: "center" },
    gridHeaderToday: { color: colors.primary },
    gridRow: { flexDirection: "row", marginBottom: 4 },
    gridRowLabel: { width: 36, fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "center", paddingTop: 6 },
    gridCell: {
      flex: 1,
      minHeight: 44,
      marginHorizontal: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      padding: 3,
    },
    gridCellFilled: { borderWidth: 0 },
    gridCellToday: { borderColor: colors.primary, borderWidth: 1.5 },
    gridCellDone: { opacity: 0.7 },
    gridCellText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
    gridCellEmpty: { fontSize: 9, color: colors.border },
    gridDoneCheck: { position: "absolute", top: 2, right: 2 },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 90 },
    // Edit Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
    },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
    modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 3 },
    modalSub: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 14 },
    label: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 },
    subGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    subBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border },
    subBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    topicInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      backgroundColor: colors.muted,
      marginBottom: 16,
    },
    btnRow: { flexDirection: "row", gap: 10 },
    saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
    clearBtn: { backgroundColor: colors.destructive + "12", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center" },
    // Analysis Modal
    analysisBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    analysisCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
      maxHeight: "85%",
    },
    analysisTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 16 },
    bigNum: { fontSize: 52, fontFamily: "Inter_700Bold", color: colors.primary, lineHeight: 56 },
    bigLabel: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    subBar: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 10,
    },
    subBarLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, width: 110 },
    subBarBg: { flex: 1, height: 8, backgroundColor: colors.muted, borderRadius: 4 },
    subBarFill: { height: 8, borderRadius: 4 },
    subBarVal: { fontSize: 12, fontFamily: "Inter_700Bold", color: colors.foreground, width: 36, textAlign: "right" },
  });

  const analysis = analysisData();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Study Timetable</Text>
            <Text style={s.headerSub}>इस हफ्ते: {analysis.done}/{analysis.total} slots complete</Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.headerBtn} onPress={() => setAnalysisModal(true)}>
              <Feather name="bar-chart-2" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.notifRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="bell" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={s.notifLabel}>Study Reminders</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: "rgba(255,255,255,0.2)", true: "#fff" }}
            thumbColor={notifEnabled ? colors.primary : "rgba(255,255,255,0.8)"}
          />
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Today's Schedule */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📅 आज — {DAY_FULL[today]}</Text>
          <View style={s.todayCard}>
            {SLOT_KEYS.map((sk, si) => {
              const slotData = getSlot(today, sk);
              const done = isCompleted(today, sk);
              const color = slotData.subject ? SUBJECT_COLORS[slotData.subject] ?? colors.primary : undefined;
              return (
                <View key={sk} style={[s.slotRow, done && s.slotDone, si === SLOT_KEYS.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={s.slotTime}>{SLOTS[si].replace("🌅 ", "").replace("☀️ ", "").replace("🌙 ", "")}</Text>
                  {slotData.subject ? (
                    <View style={{ flex: 1 }}>
                      <Text style={[s.slotSubject, { color: color ?? colors.foreground }, done && { textDecorationLine: "line-through", opacity: 0.6 }]}>
                        {slotData.subject}
                      </Text>
                      {slotData.topic ? <Text style={s.slotTopic}>{slotData.topic}</Text> : null}
                    </View>
                  ) : (
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(today, sk)}>
                      <Text style={s.slotEmpty}>+ Add subject</Text>
                    </TouchableOpacity>
                  )}
                  {slotData.subject ? (
                    <TouchableOpacity
                      style={[s.checkBox, {
                        borderColor: done ? "#16a34a" : colors.border,
                        backgroundColor: done ? "#16a34a" : "transparent",
                      }]}
                      onPress={() => toggleComplete(today, sk)}
                    >
                      {done ? <Feather name="check" size={14} color="#fff" /> : null}
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => openEdit(today, sk)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weekly Grid */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📊 साप्ताहिक Grid</Text>
          <View style={s.gridWrap}>
            <View style={s.gridHeader}>
              <View style={{ width: 36 }} />
              {DAYS.map((d, i) => (
                <Text key={i} style={[s.gridHeaderCell, i === today && s.gridHeaderToday]}>{d}</Text>
              ))}
            </View>
            {SLOT_KEYS.map((sk, si) => (
              <View key={sk} style={s.gridRow}>
                <Text style={s.gridRowLabel}>{["सुबह", "दोपहर", "शाम"][si]}</Text>
                {DAYS.map((_, di) => {
                  const slot = getSlot(di, sk);
                  const done = isCompleted(di, sk);
                  const color = slot.subject ? SUBJECT_COLORS[slot.subject] : undefined;
                  return (
                    <TouchableOpacity
                      key={di}
                      style={[
                        s.gridCell,
                        di === today && s.gridCellToday,
                        slot.subject && s.gridCellFilled,
                        slot.subject && { backgroundColor: color },
                        done && s.gridCellDone,
                      ]}
                      onPress={() => openEdit(di, sk)}
                      activeOpacity={0.7}
                    >
                      {slot.subject ? (
                        <>
                          <Text style={s.gridCellText} numberOfLines={2}>
                            {slot.subject.replace("MP ", "").replace(" Affairs", "").replace("Indian ", "")}
                          </Text>
                          {done && (
                            <View style={s.gridDoneCheck}>
                              <Feather name="check" size={8} color="#fff" />
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={s.gridCellEmpty}>+</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={s.bottomPad} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>{DAY_FULL[editDay]}</Text>
            <Text style={s.modalSub}>{SLOTS[SLOT_KEYS.indexOf(editSlot)]}</Text>
            <Text style={s.label}>Subject</Text>
            <View style={s.subGrid}>
              {SUBJECTS.map((sub) => {
                const col = SUBJECT_COLORS[sub];
                const active = editSubject === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[s.subBtn, active && { backgroundColor: col, borderColor: col }]}
                    onPress={() => { setEditSubject(sub); Haptics.selectionAsync(); }}
                  >
                    <Text style={[s.subBtnText, active && { color: "#fff" }]}>{sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.label}>Topic (Optional)</Text>
            <TextInput
              style={s.topicInput}
              value={editTopic}
              onChangeText={setEditTopic}
              placeholder="जैसे: मुगल साम्राज्य, नर्मदा नदी..."
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={s.btnRow}>
              {getSlot(editDay, editSlot).subject ? (
                <TouchableOpacity style={s.clearBtn} onPress={clearSlot}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[s.saveBtn, !editSubject && { opacity: 0.5 }]}
                onPress={saveEdit}
                disabled={!editSubject}
                activeOpacity={0.85}
              >
                <Text style={s.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Analysis Modal */}
      <Modal visible={analysisModal} transparent animationType="slide" onRequestClose={() => setAnalysisModal(false)}>
        <TouchableOpacity style={s.analysisBg} activeOpacity={1} onPress={() => setAnalysisModal(false)}>
          <TouchableOpacity activeOpacity={1}>
            <ScrollView style={s.analysisCard} showsVerticalScrollIndicator={false}>
              <View style={s.handle} />
              <Text style={s.analysisTitle}>📊 इस हफ्ते की Analysis</Text>

              {/* Big percentage */}
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
                <View>
                  <Text style={s.bigNum}>{analysis.pct}%</Text>
                  <Text style={s.bigLabel}>completion rate</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground }}>{analysis.done}</Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>slots done</Text>
                  <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginTop: 8 }}>{analysis.total - analysis.done}</Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>remaining</Text>
                </View>
              </View>

              {/* Subject breakdown */}
              {Object.keys(analysis.subjectHours).length > 0 && (
                <>
                  <Text style={[s.label, { marginBottom: 14 }]}>Subject-wise Time (est. hours)</Text>
                  {Object.entries(analysis.subjectHours)
                    .sort((a, b) => b[1] - a[1])
                    .map(([sub, hrs]) => {
                      const maxHrs = Math.max(...Object.values(analysis.subjectHours));
                      const color = SUBJECT_COLORS[sub] ?? colors.primary;
                      return (
                        <View key={sub} style={s.subBar}>
                          <Text style={s.subBarLabel} numberOfLines={1}>{sub}</Text>
                          <View style={s.subBarBg}>
                            <View style={[s.subBarFill, { width: `${(hrs / maxHrs) * 100}%` as any, backgroundColor: color }]} />
                          </View>
                          <Text style={s.subBarVal}>{hrs}h</Text>
                        </View>
                      );
                    })}
                </>
              )}

              {analysis.total === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <Feather name="calendar" size={40} color={colors.border} />
                  <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    पहले timetable में subjects add करें{"\n"}फिर complete mark करें
                  </Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

import React, { useEffect, useState } from "react";
import {
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const DAYS = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"];
const DAY_FULL = ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"];
const SLOTS = ["सुबह\n6–10", "दोपहर\n12–4", "शाम\n6–10"];
const SLOT_KEYS = ["morning", "afternoon", "evening"] as const;

const SUBJECTS = ["MP History", "MP Geography", "Indian Polity", "Economy", "Science", "GK", "Current Affairs", "Break", "Revision"];
const SUBJECT_COLORS: Record<string, string> = {
  "MP History":     "#dc2626",
  "MP Geography":   "#2563eb",
  "Indian Polity":  "#7c3aed",
  "Economy":        "#d97706",
  "Science":        "#0891b2",
  "GK":             "#16a34a",
  "Current Affairs":"#db2777",
  "Break":          "#9ca3af",
  "Revision":       "#f59e0b",
};

type SlotData = { subject: string; topic: string };
type DayData = { morning: SlotData; afternoon: SlotData; evening: SlotData };
type Timetable = Record<string, DayData>;

const STORAGE_KEY = "mppsc_timetable_v1";
const EMPTY_SLOT: SlotData = { subject: "", topic: "" };
const EMPTY_DAY: DayData = { morning: EMPTY_SLOT, afternoon: EMPTY_SLOT, evening: EMPTY_SLOT };

const loadTimetable = async (): Promise<Timetable> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Timetable) : {};
};

const saveTimetable = async (data: Timetable) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

function todayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function TimetableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [timetable, setTimetable] = useState<Timetable>({});
  const [editModal, setEditModal] = useState(false);
  const [editDay, setEditDay] = useState(0);
  const [editSlot, setEditSlot] = useState<typeof SLOT_KEYS[number]>("morning");
  const [editSubject, setEditSubject] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const today = todayIndex();

  useEffect(() => {
    loadTimetable().then(setTimetable);
  }, []);

  const getSlot = (day: number, slot: typeof SLOT_KEYS[number]): SlotData => {
    return timetable[day]?.[slot] ?? EMPTY_SLOT;
  };

  const openEdit = (day: number, slot: typeof SLOT_KEYS[number]) => {
    const cur = getSlot(day, slot);
    setEditDay(day);
    setEditSlot(slot);
    setEditSubject(cur.subject);
    setEditTopic(cur.topic);
    setEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveEdit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated: Timetable = {
      ...timetable,
      [editDay]: {
        ...(timetable[editDay] ?? EMPTY_DAY),
        [editSlot]: { subject: editSubject, topic: editTopic },
      },
    };
    setTimetable(updated);
    await saveTimetable(updated);
    setEditModal(false);
  };

  const clearSlot = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated: Timetable = {
      ...timetable,
      [editDay]: {
        ...(timetable[editDay] ?? EMPTY_DAY),
        [editSlot]: EMPTY_SLOT,
      },
    };
    setTimetable(updated);
    await saveTimetable(updated);
    setEditModal(false);
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
    todayCard: {
      margin: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.primary + "40",
    },
    todayLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary, marginBottom: 8, textTransform: "uppercase" },
    todayGrid: { flexDirection: "row", gap: 8 },
    todaySlot: { flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 10, alignItems: "center" },
    todaySlotTime: { fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground, textAlign: "center" },
    todaySlotSubject: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center", marginTop: 4 },
    todaySlotTopic: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 2 },
    table: { margin: 12 },
    tableHeader: { flexDirection: "row", marginBottom: 4 },
    thLabel: { width: 40, fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.mutedForeground, textAlign: "center" },
    thDay: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.foreground, textAlign: "center", paddingVertical: 4 },
    thDayToday: { color: colors.primary },
    row: { flexDirection: "row", marginBottom: 4, alignItems: "center" },
    rowLabel: { width: 40, fontFamily: "Inter_500Medium", fontSize: 9, color: colors.mutedForeground, textAlign: "center", lineHeight: 14 },
    cell: {
      flex: 1,
      minHeight: 50,
      marginHorizontal: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      padding: 4,
    },
    cellToday: { borderColor: colors.primary, borderWidth: 1.5 },
    cellFilled: { borderWidth: 0 },
    cellSubject: { fontSize: 9, fontFamily: "Inter_700Bold", textAlign: "center", color: "#fff" },
    cellTopic: { fontSize: 8, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 1 },
    cellEmpty: { fontSize: 8, color: colors.border, fontFamily: "Inter_400Regular" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
    modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 4 },
    modalSub: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 14 },
    label: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 8, textTransform: "uppercase" },
    subjectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    subjectBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border },
    subjectBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
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
    clearBtn: { backgroundColor: colors.destructive + "15", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center" },
    bottomPad: { height: Platform.OS === "web" ? 34 : insets.bottom + 80 },
  });

  const todaySlots = SLOT_KEYS.map((sk, i) => ({ key: sk, label: SLOTS[i], data: getSlot(today, sk) }));

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Study Timetable</Text>
        <Text style={s.headerSub}>साप्ताहिक अध्ययन योजना • cell tap करके edit करें</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Today's schedule */}
        <View style={s.todayCard}>
          <Text style={s.todayLabel}>📅 आज — {DAY_FULL[today]}</Text>
          <View style={s.todayGrid}>
            {todaySlots.map((sl) => {
              const color = sl.data.subject ? SUBJECT_COLORS[sl.data.subject] ?? colors.primary : colors.border;
              return (
                <TouchableOpacity
                  key={sl.key}
                  style={[s.todaySlot, sl.data.subject && { backgroundColor: color + "20", borderLeftWidth: 3, borderLeftColor: color }]}
                  onPress={() => openEdit(today, sl.key)}
                  activeOpacity={0.7}
                >
                  <Text style={s.todaySlotTime}>{sl.label}</Text>
                  <Text style={[s.todaySlotSubject, { color: sl.data.subject ? color : colors.border }]}>
                    {sl.data.subject || "—"}
                  </Text>
                  {sl.data.topic ? <Text style={s.todaySlotTopic}>{sl.data.topic}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Full week grid */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <View style={{ width: 40 }} />
            {DAYS.map((d, i) => (
              <Text key={i} style={[s.thDay, i === today && s.thDayToday]}>{d}</Text>
            ))}
          </View>

          {/* Rows */}
          {SLOT_KEYS.map((sk, si) => (
            <View key={sk} style={s.row}>
              <Text style={s.rowLabel}>{SLOTS[si]}</Text>
              {DAYS.map((_, di) => {
                const slot = getSlot(di, sk);
                const color = slot.subject ? SUBJECT_COLORS[slot.subject] ?? colors.primary : undefined;
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      s.cell,
                      di === today && s.cellToday,
                      slot.subject && s.cellFilled,
                      slot.subject && { backgroundColor: color },
                    ]}
                    onPress={() => openEdit(di, sk)}
                    activeOpacity={0.7}
                  >
                    {slot.subject ? (
                      <>
                        <Text style={s.cellSubject} numberOfLines={2}>{slot.subject.replace("MP ", "").replace(" Affairs", "")}</Text>
                        {slot.topic ? <Text style={s.cellTopic} numberOfLines={1}>{slot.topic}</Text> : null}
                      </>
                    ) : (
                      <Text style={s.cellEmpty}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={s.bottomPad} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{DAY_FULL[editDay]} — {SLOTS[SLOT_KEYS.indexOf(editSlot)].replace("\n", " ")}</Text>
            <Text style={s.modalSub}>Subject और topic चुनें</Text>

            <Text style={s.label}>Subject</Text>
            <View style={s.subjectGrid}>
              {SUBJECTS.map((sub) => {
                const col = SUBJECT_COLORS[sub];
                const active = editSubject === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[s.subjectBtn, active && { backgroundColor: col, borderColor: col }]}
                    onPress={() => { setEditSubject(sub); Haptics.selectionAsync(); }}
                  >
                    <Text style={[s.subjectBtnText, active && { color: "#fff" }]}>{sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>Topic (optional)</Text>
            <TextInput
              style={s.topicInput}
              value={editTopic}
              onChangeText={setEditTopic}
              placeholder="जैसे: मुगल साम्राज्य, नर्मदा नदी..."
              placeholderTextColor={colors.mutedForeground}
            />

            <View style={s.btnRow}>
              {getSlot(editDay, editSlot).subject ? (
                <TouchableOpacity style={s.clearBtn} onPress={clearSlot} activeOpacity={0.8}>
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
    </View>
  );
}

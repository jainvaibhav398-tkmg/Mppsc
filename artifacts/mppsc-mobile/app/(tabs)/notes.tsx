import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
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

type NoteCategory = "History" | "Geography" | "Polity" | "Economy" | "Science" | "General";

type Note = {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES: NoteCategory[] = ["History", "Geography", "Polity", "Economy", "Science", "General"];
const CAT_COLORS: Record<NoteCategory, string> = {
  History:   "#dc2626",
  Geography: "#2563eb",
  Polity:    "#7c3aed",
  Economy:   "#d97706",
  Science:   "#0891b2",
  General:   "#16a34a",
};

const STORAGE_KEY = "mppsc_notes_v1";

const loadNotes = async (): Promise<Note[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Note[]) : [];
};

const saveNotes = async (notes: Note[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

const makeId = () => Date.now().toString() + Math.random().toString(36).slice(2, 7);

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filterCat, setFilterCat] = useState<NoteCategory | "All">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("History");

  useEffect(() => {
    loadNotes().then(setNotes);
  }, []);

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setCategory("History");
    setModalOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setModalOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveNote = async () => {
    if (!title.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date().toISOString();
    let updated: Note[];
    if (editing) {
      updated = notes.map((n) =>
        n.id === editing.id ? { ...n, title: title.trim(), content: content.trim(), category, updatedAt: now } : n
      );
    } else {
      const newNote: Note = {
        id: makeId(),
        title: title.trim(),
        content: content.trim(),
        category,
        createdAt: now,
        updatedAt: now,
      };
      updated = [newNote, ...notes];
    }
    setNotes(updated);
    await saveNotes(updated);
    setModalOpen(false);
  };

  const deleteNote = useCallback(
    (id: string) => {
      if (Platform.OS === "web") {
        const updated = notes.filter((n) => n.id !== id);
        setNotes(updated);
        saveNotes(updated);
        return;
      }
      Alert.alert("Note Delete करें?", "यह note हमेशा के लिए delete हो जाएगा।", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = notes.filter((n) => n.id !== id);
            setNotes(updated);
            await saveNotes(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]);
    },
    [notes]
  );

  const displayed = filterCat === "All" ? notes : notes.filter((n) => n.category === filterCat);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
      paddingBottom: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    filters: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    filterBtn: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    filterTextActive: { color: "#fff" },
    noteCard: {
      backgroundColor: colors.card,
      marginHorizontal: 12,
      marginBottom: 10,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    noteTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1, marginRight: 8 },
    catBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    catBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
    noteContent: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 8,
      lineHeight: 20,
    },
    noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
    noteDate: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    noteActions: { flexDirection: "row", gap: 12 },
    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
    emptyText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 12, textAlign: "center" },
    fab: {
      position: "absolute",
      bottom: Platform.OS === "web" ? 100 : insets.bottom + 80,
      right: 20,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 16 },
    label: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 6, textTransform: "uppercase" },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      backgroundColor: colors.muted,
      marginBottom: 14,
    },
    catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    catBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    catBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Study Notes</Text>
          <Text style={s.headerSub}>{notes.length} notes</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <FlatList
          horizontal
          data={["All", ...CATEGORIES] as (NoteCategory | "All")[]}
          keyExtractor={(i) => i}
          contentContainerStyle={s.filters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                s.filterBtn,
                filterCat === item && (item === "All" ? s.filterBtnActive : { backgroundColor: CAT_COLORS[item as NoteCategory], borderColor: CAT_COLORS[item as NoteCategory] }),
              ]}
              onPress={() => setFilterCat(item)}
            >
              <Text style={[s.filterText, filterCat === item && s.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {displayed.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="file-text" size={40} color={colors.border} />
          <Text style={s.emptyText}>कोई note नहीं है।{"\n"}+ button से नया note बनाएं।</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 100 }}
          renderItem={({ item }) => (
            <View style={s.noteCard}>
              <View style={s.noteHeader}>
                <Text style={s.noteTitle}>{item.title}</Text>
                <View style={[s.catBadge, { backgroundColor: CAT_COLORS[item.category] }]}>
                  <Text style={s.catBadgeText}>{item.category}</Text>
                </View>
              </View>
              {item.content ? <Text style={s.noteContent} numberOfLines={3}>{item.content}</Text> : null}
              <View style={s.noteFooter}>
                <Text style={s.noteDate}>{new Date(item.updatedAt).toLocaleDateString("hi-IN")}</Text>
                <View style={s.noteActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteNote(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={openNew} activeOpacity={0.85}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modalCard}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{editing ? "Note Edit करें" : "नया Note"}</Text>

            <Text style={s.label}>Title</Text>
            <TextInput
              style={s.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Note का topic..."
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={s.label}>Category</Text>
            <View style={s.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    s.catBtn,
                    category === cat && { backgroundColor: CAT_COLORS[cat], borderColor: CAT_COLORS[cat] },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[s.catBtnText, category === cat && { color: "#fff" }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Content</Text>
            <TextInput
              style={[s.textInput, { height: 100, textAlignVertical: "top" }]}
              value={content}
              onChangeText={setContent}
              placeholder="Notes यहाँ लिखें..."
              placeholderTextColor={colors.mutedForeground}
              multiline
            />

            <TouchableOpacity
              style={[s.saveBtn, !title.trim() && { opacity: 0.5 }]}
              onPress={saveNote}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Text style={s.saveBtnText}>Save Note</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

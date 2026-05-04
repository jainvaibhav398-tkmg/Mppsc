import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

type Message = { id: string; role: "user" | "assistant"; content: string };

const SYSTEM_CONTEXT =
  "You are an expert MPPSC (Madhya Pradesh Public Service Commission) exam tutor. Answer in Hindi or English as the student prefers. Focus on MP History, MP Geography, Indian Polity, and General Knowledge relevant to MPPSC exams.";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [convId, setConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    initConversation();
  }, []);

  const initConversation = async () => {
    try {
      const convs = await api.gemini.conversations();
      if (convs.length > 0) {
        setConvId(convs[0].id);
      } else {
        const newConv = await api.gemini.createConversation("MPPSC Tutor Chat");
        setConvId(newConv.id);
      }
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "नमस्ते! मैं आपका MPPSC AI Tutor हूँ। MP History, MP Geography, Indian Polity या किसी भी MPPSC topic के बारे में पूछें। 📚",
        },
      ]);
    } catch {
      setMessages([
        {
          id: "error",
          role: "assistant",
          content: "AI Tutor से connect नहीं हो पाया। Internet check करें।",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !convId || sending) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    const currentInput = input.trim();
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const reply = await api.gemini.sendMessage(convId, currentInput);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply || "माफ़ करें, कोई response नहीं मिला।",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Error: Response नहीं मिल सका। दोबारा try करें।",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
      paddingBottom: 16,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
    list: { flex: 1, paddingHorizontal: 16 },
    listContent: { paddingTop: 16, paddingBottom: 8 },
    bubbleWrap: { marginBottom: 12 },
    bubble: {
      maxWidth: "80%",
      borderRadius: 16,
      padding: 12,
    },
    userBubble: {
      backgroundColor: colors.primary,
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      backgroundColor: colors.card,
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
    userText: { color: "#fff" },
    aiText: { color: colors.foreground },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 10,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      maxHeight: 100,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: colors.muted },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    typingWrap: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 12,
      alignSelf: "flex-start",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typingText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
  });

  if (loading) {
    return (
      <View style={[s.container, s.loadingWrap]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ marginTop: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          AI Tutor connect हो रहा है...
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Feather name="cpu" size={18} color="#fff" />
        </View>
        <View>
          <Text style={s.headerTitle}>AI Tutor</Text>
          <Text style={s.headerSub}>Powered by Gemini</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          style={s.list}
          contentContainerStyle={s.listContent}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={s.bubbleWrap}>
              <View style={[s.bubble, item.role === "user" ? s.userBubble : s.aiBubble]}>
                <Text style={[s.bubbleText, item.role === "user" ? s.userText : s.aiText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            sending ? (
              <View style={s.typingWrap}>
                <Text style={s.typingText}>AI सोच रहा है...</Text>
              </View>
            ) : null
          }
        />

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="MPPSC से related कुछ भी पूछें..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            editable={!sending}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color={colors.mutedForeground} size="small" />
            ) : (
              <Feather name="send" size={18} color={!input.trim() ? colors.mutedForeground : "#fff"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

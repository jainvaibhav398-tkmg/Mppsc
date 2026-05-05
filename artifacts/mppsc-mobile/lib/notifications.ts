import { Platform } from "react-native";

export type SlotKey = "morning" | "afternoon" | "evening";

const SLOT_TIMES: Record<SlotKey, { hour: number; minute: number; emoji: string; label: string }> = {
  morning:   { hour: 6,  minute: 0, emoji: "🌅", label: "सुबह की पढ़ाई" },
  afternoon: { hour: 12, minute: 0, emoji: "☀️", label: "दोपहर की पढ़ाई" },
  evening:   { hour: 18, minute: 0, emoji: "🌙", label: "शाम की पढ़ाई" },
};

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

type SlotData = { subject: string; topic: string };
type TimetableEntry = Partial<Record<SlotKey, SlotData>>;
type TimetableData = Record<string, TimetableEntry>;

export async function scheduleTimetableNotifications(
  timetable: TimetableData
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();

    const dayIndex = new Date().getDay();
    const todayKey = dayIndex === 0 ? "6" : String(dayIndex - 1);
    const todayData = timetable[todayKey] ?? {};

    for (const [slotKey, times] of Object.entries(SLOT_TIMES)) {
      const slot = todayData[slotKey as SlotKey];
      if (!slot?.subject || slot.subject === "Break") continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${times.emoji} ${times.label}`,
          body: `${slot.subject}${slot.topic ? ` — ${slot.topic}` : ""} पढ़ने का समय है!`,
          sound: true,
          data: { slotKey, dayIndex: todayKey },
        },
        trigger: {
          type: "daily" as any,
          hour: times.hour,
          minute: times.minute,
        } as any,
      });
    }
  } catch (err) {
    console.warn("Notification scheduling failed:", err);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

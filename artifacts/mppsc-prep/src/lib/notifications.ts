const STORAGE_KEY_PREFIX = "mppsc_daily_done_";
const REMINDER_INTERVAL_KEY = "mppsc_reminder_interval";

export function getTodayKey(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

export function markDailyTestDone() {
  localStorage.setItem(STORAGE_KEY_PREFIX + getTodayKey(), "true");
  clearReminders();
}

export function isDailyTestDone(): boolean {
  return localStorage.getItem(STORAGE_KEY_PREFIX + getTodayKey()) === "true";
}

function clearReminders() {
  const id = localStorage.getItem(REMINDER_INTERVAL_KEY);
  if (id) {
    clearInterval(Number(id));
    localStorage.removeItem(REMINDER_INTERVAL_KEY);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showReminder(isUrgent: boolean) {
  if (isDailyTestDone()) {
    clearReminders();
    return;
  }
  if (Notification.permission !== "granted") return;

  new Notification(isUrgent ? "⏰ MPPSC Daily Test याद दिलाना" : "📚 MPPSC Daily Test Reminder", {
    body: isUrgent
      ? "सुबह 8 बज गए! आज का Daily Test (100 Questions) अभी शुरू करें।"
      : "आज का Daily Test अभी तक पूरा नहीं हुआ। 100 Questions solve करें!",
    icon: "/favicon.ico",
    tag: "mppsc-daily-reminder",
    requireInteraction: true,
  });
}

export function scheduleReminders(alreadyCompleted: boolean) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (alreadyCompleted) {
    markDailyTestDone();
    return;
  }
  if (isDailyTestDone()) return;

  clearReminders();

  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const hour = ist.getUTCHours();
  const minute = ist.getUTCMinutes();

  // Calculate ms until 8:00 AM IST
  let msUntil8AM: number;
  if (hour < 8) {
    msUntil8AM = ((8 - hour) * 60 - minute) * 60 * 1000;
  } else if (hour === 8 && minute === 0) {
    msUntil8AM = 0;
  } else {
    // Past 8 AM — schedule for next day 8 AM
    msUntil8AM = ((24 - hour + 8) * 60 - minute) * 60 * 1000;
  }

  // Show immediately at 8 AM
  if (msUntil8AM > 0) {
    setTimeout(() => showReminder(true), msUntil8AM);
  } else if (hour >= 8) {
    // Already past 8 AM today — show now if not done
    showReminder(false);
  }

  // Repeat every hour until test is done
  const intervalId = setInterval(() => {
    if (isDailyTestDone()) {
      clearReminders();
      return;
    }
    showReminder(false);
  }, 60 * 60 * 1000);

  localStorage.setItem(REMINDER_INTERVAL_KEY, String(intervalId));
}

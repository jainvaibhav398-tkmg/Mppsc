import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Question } from "./api";

const QS_KEY = "mppsc_local_qs_v2";
const META_KEY = "mppsc_local_meta_v2";

export type LocalMeta = {
  downloadedAt: string;
  count: number;
  subjects: string[];
};

export const localDb = {
  async getMeta(): Promise<LocalMeta | null> {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      return raw ? (JSON.parse(raw) as LocalMeta) : null;
    } catch {
      return null;
    }
  },

  async save(questions: Question[]): Promise<void> {
    const existing = await localDb.loadAll();
    const map = new Map<number, Question>();
    [...existing, ...questions].forEach((q) => map.set(q.id, q));
    const merged = Array.from(map.values());
    await AsyncStorage.setItem(QS_KEY, JSON.stringify(merged));
    const subjects = [...new Set(merged.map((q) => q.subject))];
    const meta: LocalMeta = {
      downloadedAt: new Date().toISOString(),
      count: merged.length,
      subjects,
    };
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  },

  async loadAll(): Promise<Question[]> {
    try {
      const raw = await AsyncStorage.getItem(QS_KEY);
      return raw ? (JSON.parse(raw) as Question[]) : [];
    } catch {
      return [];
    }
  },

  async loadForSession(
    subject: string,
    count: number,
    focusWeak: boolean
  ): Promise<Question[]> {
    const all = await localDb.loadAll();
    let filtered = subject === "All" ? all : all.filter((q) => q.subject === subject);
    if (focusWeak) {
      filtered = filtered.sort((a, b) => {
        const aR = a.timesAnswered > 0 ? a.timesWrong / a.timesAnswered : 0;
        const bR = b.timesAnswered > 0 ? b.timesWrong / b.timesAnswered : 0;
        return bR - aR;
      });
    } else {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }
    return filtered.slice(0, count);
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QS_KEY);
    await AsyncStorage.removeItem(META_KEY);
  },
};

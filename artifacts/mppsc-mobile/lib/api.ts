const getBase = (): string => {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  return domain ? `https://${domain}` : "http://localhost:80";
};

export type Question = {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
  timesAnswered: number;
  timesWrong: number;
};

export type Session = {
  id: number;
  subject: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  completedAt: string | null;
  createdAt: string;
};

export type DailyStatus = {
  date: string;
  session: Session | null;
  completed: boolean;
  started: boolean;
};

export type StatsOverview = {
  totalQuestions: number;
  totalSessions: number;
  averageScore: number;
  totalCorrect: number;
  totalWrong: number;
  weakTopicsCount: number;
  streak: number;
};

export type TopicStat = {
  topic: string;
  subject: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
};

export type SubmitResult = {
  session: Session;
  wrongTopics: string[];
  correctCount: number;
  wrongCount: number;
  score: number;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  stats: {
    overview: () => apiFetch<StatsOverview>("/api/stats/overview"),
    topics: () => apiFetch<TopicStat[]>("/api/stats/topics"),
  },
  sessions: {
    list: () => apiFetch<Session[]>("/api/sessions"),
    create: (body: { subject: string; questionCount: number; focusWeakTopics: boolean }) =>
      apiFetch<{ session: Session; questions: Question[] }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    submit: (id: number, answers: { questionId: number; selectedOption: string }[]) =>
      apiFetch<SubmitResult>(`/api/sessions/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
  },
  dailyTest: {
    today: () => apiFetch<DailyStatus>("/api/daily-test/today"),
    start: () =>
      apiFetch<{ session: Session; questions: Question[]; alreadyCompleted?: boolean }>(
        "/api/daily-test/start",
        { method: "POST" }
      ),
  },
  gemini: {
    conversations: () =>
      apiFetch<{ id: number; title: string; createdAt: string }[]>("/api/gemini/conversations"),
    createConversation: (title: string) =>
      apiFetch<{ id: number; title: string; createdAt: string }>("/api/gemini/conversations", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    askQuestion: async (question: string): Promise<string> => {
      const conv = await apiFetch<{ id: number; title: string; createdAt: string }>(
        "/api/gemini/conversations",
        { method: "POST", body: JSON.stringify({ title: `ask-${Date.now()}` }) }
      );
      const res = await fetch(`${getBase()}/api/gemini/conversations/${conv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: question }),
      });
      const text = await res.text();
      const chunks = text
        .split("\n\n")
        .filter((c) => c.startsWith("data: ") && !c.includes("[DONE]"))
        .map((c) => {
          try { return (JSON.parse(c.slice(6)) as { text?: string }).text ?? ""; }
          catch { return ""; }
        });
      return chunks.join("");
    },
    sendMessage: async (convId: number, content: string): Promise<string> => {
      const res = await fetch(`${getBase()}/api/gemini/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const text = await res.text();
      const chunks = text
        .split("\n\n")
        .filter((c) => c.startsWith("data: ") && !c.includes("[DONE]"))
        .map((c) => {
          try {
            return (JSON.parse(c.slice(6)) as { text?: string }).text ?? "";
          } catch {
            return "";
          }
        });
      return chunks.join("");
    },
  },
};

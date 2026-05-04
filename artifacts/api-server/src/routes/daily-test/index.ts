import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable, sessionsTable, sessionAnswersTable } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";
import { eq, and, sql, count, inArray } from "drizzle-orm";

const router = Router();

function getTodayDateIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

async function generateBatch(subject: string, batchSize: number): Promise<void> {
  const prompt = `Generate exactly ${batchSize} MPPSC (Madhya Pradesh Public Service Commission) level multiple choice questions about ${subject}.
Cover different topics and difficulty levels. Return a valid JSON array only (no markdown):
[{"questionText":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctOption":"A","explanation":"Brief explanation","subject":"${subject}","topic":"specific topic","difficulty":"medium"}]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
    });

    let rawText = response.text ?? "[]";
    const lastBracket = rawText.lastIndexOf("}");
    if (lastBracket !== -1 && !rawText.trimEnd().endsWith("]")) {
      rawText = rawText.substring(0, lastBracket + 1) + "]";
    }

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    await db.insert(questionsTable).values(
      parsed.map((q: any) => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation || "",
        subject: q.subject || subject,
        topic: q.topic || subject,
        difficulty: q.difficulty || "medium",
      }))
    );
  } catch {
    // silently ignore parse/network errors per batch
  }
}

async function getOrGenerateQuestions(
  subject: string,
  needed: number
): Promise<typeof questionsTable.$inferSelect[]> {
  const [row] = await db
    .select({ count: count() })
    .from(questionsTable)
    .where(eq(questionsTable.subject, subject));

  const existingCount = Number(row?.count ?? 0);

  if (existingCount < needed) {
    // Generate up to 2 batches of 10 to avoid long wait
    const batches = Math.min(2, Math.ceil((needed - existingCount) / 10));
    for (let i = 0; i < batches; i++) {
      await generateBatch(subject, 10);
    }
  }

  return db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.subject, subject))
    .orderBy(sql`RANDOM()`)
    .limit(needed);
}

// GET /api/daily-test/today
router.get("/daily-test/today", async (req, res) => {
  const today = getTodayDateIST();

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.isDaily, true), eq(sessionsTable.dailyDate, today)))
    .limit(1);

  res.json({
    date: today,
    session: session ?? null,
    completed: session ? session.completedAt !== null : false,
    started: !!session,
  });
});

// POST /api/daily-test/start
router.post("/daily-test/start", async (req, res) => {
  const today = getTodayDateIST();

  const [existing] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.isDaily, true), eq(sessionsTable.dailyDate, today)))
    .limit(1);

  if (existing) {
    // Session already started — fetch its questions via session_answers
    const answeredRows = await db
      .select({ questionId: sessionAnswersTable.questionId })
      .from(sessionAnswersTable)
      .where(eq(sessionAnswersTable.sessionId, existing.id));

    const answeredIds = answeredRows.map((r) => r.questionId);

    // We stored which questions were picked in session_answers OR we need to re-fetch from DB
    // Since session_answers only exist after submission, return existing session without questions
    // so frontend can resume from beginning if not submitted yet
    if (existing.completedAt) {
      res.json({ session: existing, questions: [], alreadyCompleted: true });
      return;
    }

    // Re-pick the same random set — not ideal but good enough for resumption
    const historyQs = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.subject, "MP History"))
      .orderBy(sql`RANDOM()`)
      .limit(50);

    const geoQs = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.subject, "MP Geography"))
      .orderBy(sql`RANDOM()`)
      .limit(50);

    const allQs = [...historyQs, ...geoQs].sort(() => Math.random() - 0.5);
    res.json({ session: existing, questions: allQs, alreadyStarted: true });
    return;
  }

  // Generate 50 MP History + 50 MP Geography in parallel
  const [historyQs, geoQs] = await Promise.all([
    getOrGenerateQuestions("MP History", 50),
    getOrGenerateQuestions("MP Geography", 50),
  ]);

  const allQuestions = [...historyQs, ...geoQs].sort(() => Math.random() - 0.5);

  const [session] = await db
    .insert(sessionsTable)
    .values({
      subject: "Daily Test",
      totalQuestions: allQuestions.length,
      correctCount: 0,
      wrongCount: 0,
      score: 0,
      isDaily: true,
      dailyDate: today,
    })
    .returning();

  res.status(201).json({ session, questions: allQuestions });
});

export default router;

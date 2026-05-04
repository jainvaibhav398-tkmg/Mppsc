import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  GenerateQuestionsBody,
  ListQuestionsQueryParams,
} from "@workspace/api-zod";
import { eq, and, sql, gt } from "drizzle-orm";

const router = Router();

router.post("/questions/generate", async (req, res) => {
  const parsed = GenerateQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { subject, topic, count, focusWeakTopics } = parsed.data;
  const safeCount = Math.min(count ?? 10, 20);

  let weakTopicsInfo = "";
  if (focusWeakTopics) {
    const weakTopics = await db
      .select({ topic: questionsTable.topic })
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.subject, subject),
          gt(questionsTable.timesWrong, 0)
        )
      )
      .groupBy(questionsTable.topic)
      .limit(5);
    if (weakTopics.length > 0) {
      weakTopicsInfo = `Focus especially on these weak topics: ${weakTopics.map((t) => t.topic).join(", ")}.`;
    }
  }

  const topicInfo = topic ? `Topic: ${topic}.` : "";

  const prompt = `Generate exactly ${safeCount} MPPSC (Madhya Pradesh Public Service Commission) level multiple choice questions about ${subject}. ${topicInfo} ${weakTopicsInfo}
The questions should test deep knowledge relevant to MPPSC mains and prelims exams.
Return a valid JSON array (no markdown, no extra text) with this exact structure for each question:
[
  {
    "questionText": "...",
    "optionA": "...",
    "optionB": "...",
    "optionC": "...",
    "optionD": "...",
    "correctOption": "A" or "B" or "C" or "D",
    "explanation": "Brief explanation of the correct answer",
    "subject": "${subject}",
    "topic": "specific topic name",
    "difficulty": "easy" or "medium" or "hard"
  }
]`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
  });

  let questions: {
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
  }[] = [];
  try {
    const text = response.text ?? "[]";
    questions = JSON.parse(text);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
    return;
  }

  const inserted = await db
    .insert(questionsTable)
    .values(
      questions.map((q) => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
      }))
    )
    .returning();

  res.json(inserted);
});

router.get("/questions", async (req, res) => {
  const params = ListQuestionsQueryParams.safeParse(req.query);
  const conditions = [];

  if (params.success) {
    if (params.data.topic) {
      conditions.push(eq(questionsTable.topic, params.data.topic));
    }
    if (params.data.subject) {
      conditions.push(eq(questionsTable.subject, params.data.subject));
    }
  }

  const questions =
    conditions.length > 0
      ? await db
          .select()
          .from(questionsTable)
          .where(and(...conditions))
          .limit(100)
      : await db.select().from(questionsTable).limit(100);

  res.json(questions);
});

router.get("/questions/weak", async (req, res) => {
  const weakQuestions = await db
    .select()
    .from(questionsTable)
    .where(gt(questionsTable.timesWrong, 0))
    .orderBy(sql`${questionsTable.timesWrong}::float / NULLIF(${questionsTable.timesAnswered}, 0) DESC`)
    .limit(50);
  res.json(weakQuestions);
});

export default router;

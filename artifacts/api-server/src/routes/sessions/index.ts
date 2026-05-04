import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable, sessionsTable, sessionAnswersTable } from "@workspace/db";
import {
  CreateSessionBody,
  SubmitSessionParams,
  SubmitSessionBody,
} from "@workspace/api-zod";
import { eq, gt, and, sql, inArray } from "drizzle-orm";

const router = Router();

router.get("/sessions", async (req, res) => {
  const sessions = await db
    .select()
    .from(sessionsTable)
    .orderBy(sessionsTable.createdAt)
    .limit(50);
  res.json(sessions);
});

router.post("/sessions", async (req, res) => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { subject, questionCount, focusWeakTopics } = parsed.data;

  let questions;
  if (focusWeakTopics) {
    questions = await db
      .select()
      .from(questionsTable)
      .where(
        and(eq(questionsTable.subject, subject), gt(questionsTable.timesWrong, 0))
      )
      .orderBy(
        sql`${questionsTable.timesWrong}::float / NULLIF(${questionsTable.timesAnswered}, 0) DESC`
      )
      .limit(questionCount);

    if (questions.length < questionCount) {
      const remaining = questionCount - questions.length;
      const existingIds = questions.map((q) => q.id);
      const extra = await db
        .select()
        .from(questionsTable)
        .where(
          existingIds.length > 0
            ? and(
                eq(questionsTable.subject, subject),
                sql`${questionsTable.id} NOT IN (${sql.join(existingIds.map((id) => sql`${id}`), sql`, `)})`
              )
            : eq(questionsTable.subject, subject)
        )
        .limit(remaining);
      questions = [...questions, ...extra];
    }
  } else {
    questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.subject, subject))
      .orderBy(sql`RANDOM()`)
      .limit(questionCount);
  }

  const [session] = await db
    .insert(sessionsTable)
    .values({
      subject,
      totalQuestions: questions.length,
      correctCount: 0,
      wrongCount: 0,
      score: 0,
    })
    .returning();

  res.status(201).json({ ...session, questions });
});

router.post("/sessions/:id/submit", async (req, res) => {
  const params = SubmitSessionParams.safeParse({ id: Number(req.params.id) });
  const body = SubmitSessionBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, params.data.id));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { answers } = body.data;
  const questionIds = answers.map((a) => a.questionId);

  const questions =
    questionIds.length > 0
      ? await db
          .select()
          .from(questionsTable)
          .where(inArray(questionsTable.id, questionIds))
      : [];

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let correctCount = 0;
  let wrongCount = 0;
  const wrongTopics: string[] = [];

  const answerRecords = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    const isCorrect = question
      ? answer.selectedOption === question.correctOption
      : false;

    if (isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
      if (question) wrongTopics.push(question.topic);
    }

    return {
      sessionId: params.data.id,
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect,
    };
  });

  if (answerRecords.length > 0) {
    await db.insert(sessionAnswersTable).values(answerRecords);
  }

  const score =
    answers.length > 0 ? (correctCount / answers.length) * 100 : 0;

  const [updatedSession] = await db
    .update(sessionsTable)
    .set({
      correctCount,
      wrongCount,
      score,
      completedAt: new Date(),
    })
    .where(eq(sessionsTable.id, params.data.id))
    .returning();

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;
    const isCorrect = answer.selectedOption === question.correctOption;
    await db
      .update(questionsTable)
      .set({
        timesAnswered: sql`${questionsTable.timesAnswered} + 1`,
        timesWrong: isCorrect
          ? questionsTable.timesWrong
          : sql`${questionsTable.timesWrong} + 1`,
      })
      .where(eq(questionsTable.id, answer.questionId));
  }

  const uniqueWrongTopics = [...new Set(wrongTopics)];

  res.json({
    session: updatedSession,
    wrongTopics: uniqueWrongTopics,
    correctCount,
    wrongCount,
    score,
  });
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable, sessionsTable } from "@workspace/db";
import { sql, gt, isNotNull } from "drizzle-orm";

const router = Router();

router.get("/stats/overview", async (req, res) => {
  const [questionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questionsTable);

  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessionsTable)
    .where(isNotNull(sessionsTable.completedAt));

  const [scoreStats] = await db
    .select({
      avgScore: sql<number>`COALESCE(avg(score), 0)`,
      totalCorrect: sql<number>`COALESCE(sum(correct_count), 0)::int`,
      totalWrong: sql<number>`COALESCE(sum(wrong_count), 0)::int`,
    })
    .from(sessionsTable)
    .where(isNotNull(sessionsTable.completedAt));

  const [weakTopicsCount] = await db
    .select({ count: sql<number>`count(distinct topic)::int` })
    .from(questionsTable)
    .where(gt(questionsTable.timesWrong, 0));

  res.json({
    totalQuestions: questionCount?.count ?? 0,
    totalSessions: sessionCount?.count ?? 0,
    averageScore: Math.round((scoreStats?.avgScore ?? 0) * 10) / 10,
    totalCorrect: scoreStats?.totalCorrect ?? 0,
    totalWrong: scoreStats?.totalWrong ?? 0,
    weakTopicsCount: weakTopicsCount?.count ?? 0,
    streak: 0,
  });
});

router.get("/stats/topics", async (req, res) => {
  const topicStats = await db
    .select({
      topic: questionsTable.topic,
      subject: questionsTable.subject,
      totalAttempts: sql<number>`sum(${questionsTable.timesAnswered})::int`,
      correctCount: sql<number>`sum(${questionsTable.timesAnswered} - ${questionsTable.timesWrong})::int`,
    })
    .from(questionsTable)
    .groupBy(questionsTable.topic, questionsTable.subject)
    .having(sql`sum(${questionsTable.timesAnswered}) > 0`)
    .orderBy(sql`sum(${questionsTable.timesAnswered}) DESC`)
    .limit(30);

  const result = topicStats.map((t) => ({
    ...t,
    accuracy:
      t.totalAttempts > 0
        ? Math.round((t.correctCount / t.totalAttempts) * 1000) / 10
        : 0,
  }));

  res.json(result);
});

export default router;

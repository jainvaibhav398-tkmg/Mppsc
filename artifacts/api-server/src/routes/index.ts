import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geminiRouter from "./gemini";
import questionsRouter from "./questions";
import sessionsRouter from "./sessions";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geminiRouter);
router.use(questionsRouter);
router.use(sessionsRouter);
router.use(statsRouter);

export default router;

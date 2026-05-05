import React, { createContext, useContext, useState } from "react";
import type { Question, Session, SubmitResult } from "@/lib/api";

type QuizState = {
  session: Session | null;
  questions: Question[];
  sessionType: "practice" | "daily" | null;
  timerPerQuestion: number; // seconds, 0 = no timer
  result: SubmitResult | null;
};

type QuizContextType = QuizState & {
  startQuiz: (
    session: Session,
    questions: Question[],
    type: "practice" | "daily",
    timerPerQuestion?: number
  ) => void;
  setResult: (result: SubmitResult) => void;
  resetQuiz: () => void;
};

const QuizContext = createContext<QuizContextType | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QuizState>({
    session: null,
    questions: [],
    sessionType: null,
    timerPerQuestion: 0,
    result: null,
  });

  const startQuiz = (
    session: Session,
    questions: Question[],
    type: "practice" | "daily",
    timerPerQuestion = 0
  ) => {
    setState({ session, questions, sessionType: type, timerPerQuestion, result: null });
  };

  const setResult = (result: SubmitResult) => {
    setState((s) => ({ ...s, result }));
  };

  const resetQuiz = () => {
    setState({ session: null, questions: [], sessionType: null, timerPerQuestion: 0, result: null });
  };

  return (
    <QuizContext.Provider value={{ ...state, startQuiz, setResult, resetQuiz }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz(): QuizContextType {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

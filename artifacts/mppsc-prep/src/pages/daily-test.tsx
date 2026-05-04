import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSubmitSession } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Bell, BellOff, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import {
  requestNotificationPermission,
  scheduleReminders,
  markDailyTestDone,
  isDailyTestDone,
  getTodayKey,
} from "@/lib/notifications";

type AnswerSubmission = { questionId: number; selectedOption: string };
type Question = {
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
};
type DailyStatus = { date: string; session: any; completed: boolean; started: boolean };
type Phase = "home" | "loading" | "quiz" | "result";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchDailyStatus(): Promise<DailyStatus> {
  const res = await fetch(`${BASE}/api/daily-test/today`);
  return res.json();
}

async function startDailyTest(): Promise<{ session: any; questions: Question[]; alreadyCompleted?: boolean }> {
  const res = await fetch(`${BASE}/api/daily-test/start`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start daily test");
  return res.json();
}

export default function DailyTest() {
  const queryClient = useQueryClient();
  const submitSession = useSubmitSession();

  const [phase, setPhase] = useState<Phase>("home");
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [currentSelection, setCurrentSelection] = useState("");
  const [results, setResults] = useState<any>(null);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== "undefined" ? Notification.permission === "granted" : false
  );
  const [loadingMsg, setLoadingMsg] = useState("Daily Test तैयार हो रहा है...");

  useEffect(() => {
    fetchDailyStatus().then((s) => {
      setStatus(s);
      if (s.completed) markDailyTestDone();
      else scheduleReminders(false);
    });
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted && status) scheduleReminders(status.completed);
  };

  const handleStart = async () => {
    setPhase("loading");
    setLoadingMsg("Daily Test तैयार हो रहा है...");
    const timer = setTimeout(
      () => setLoadingMsg("Gemini AI 100 questions generate कर रहा है... (30-60 seconds)"),
      5000
    );
    try {
      const data = await startDailyTest();
      if (data.alreadyCompleted) {
        setPhase("home");
        setStatus((s) => (s ? { ...s, completed: true } : s));
        return;
      }
      setActiveSession(data.session);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers([]);
      setResults(null);
      setCurrentSelection("");
      setPhase("quiz");
    } catch {
      setPhase("home");
      alert("Daily Test शुरू नहीं हो सका। दोबारा try करें।");
    } finally {
      clearTimeout(timer);
    }
  };

  const handleNext = () => {
    if (!currentSelection) return;
    const newAnswers = [...answers, { questionId: questions[currentIndex].id, selectedOption: currentSelection }];
    setAnswers(newAnswers);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSelection("");
    } else {
      submitSession.mutate(
        { id: activeSession.id, data: { answers: newAnswers } },
        {
          onSuccess: (data) => {
            setResults(data);
            markDailyTestDone();
            queryClient.invalidateQueries();
            setPhase("result");
          },
        }
      );
    }
  };

  // ── Result ─────────────────────────────────────────────────────
  if (phase === "result" && results) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">आज का Daily Test Complete!</CardTitle>
            <CardDescription>बधाई हो! आपने आज के 100 questions पूरे कर लिए।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Score</div>
                <div className="text-3xl font-bold text-primary">{Math.round(results.score ?? 0)}%</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">सही</div>
                <div className="text-3xl font-bold text-green-600">{results.correctCount}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">गलत</div>
                <div className="text-3xl font-bold text-destructive">{results.wrongCount}</div>
              </div>
            </div>
            {results.wrongTopics?.length > 0 && (
              <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  जिन Topics पर ध्यान देना है
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm columns-2">
                  {results.wrongTopics.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center text-sm text-green-800">
              कल सुबह 8 बजे फिर reminder आएगा। रोज़ practice करते रहें!
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 p-6">
            <Button variant="outline" asChild><Link href="/">Dashboard</Link></Button>
            <Button asChild><Link href="/review">Mistakes Review करें</Link></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────
  if (phase === "quiz" && activeSession && questions.length > 0) {
    const question = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;
    const progressPct = (currentIndex / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">📅 Daily Test — {getTodayKey()}</span>
          <span className="text-sm font-medium text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="space-y-1">
          <Progress value={progressPct} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPct)}% complete</span>
            <span>{questions.length - currentIndex - 1} बाकी</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex gap-2 flex-wrap mb-2">
              <span className="px-2 py-1 text-xs font-semibold bg-muted rounded-md text-muted-foreground">{question.topic}</span>
              <span className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">{question.subject}</span>
              <span className="px-2 py-1 text-xs font-semibold bg-secondary/10 text-secondary-foreground border border-secondary/20 rounded-md">{question.difficulty}</span>
            </div>
            <CardTitle className="text-xl leading-relaxed">{question.questionText}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={currentSelection} onValueChange={setCurrentSelection} className="space-y-3">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <div key={opt}>
                  <RadioGroupItem value={opt} id={`opt-${opt}`} className="peer sr-only" />
                  <Label
                    htmlFor={`opt-${opt}`}
                    className="flex items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                      {opt}
                    </span>
                    <span className="text-base">{question[`option${opt}` as keyof Question] as string}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="justify-end border-t bg-muted/20 p-4">
            <Button onClick={handleNext} disabled={!currentSelection || submitSession.isPending} size="lg" className="w-full sm:w-auto">
              {submitSession.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLast ? "Test Submit करें" : "अगला Question"}
              {!submitSession.isPending && !isLast && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">{loadingMsg}</h2>
          <p className="text-muted-foreground text-sm">MP History और MP Geography के 100 MPPSC-level questions तैयार हो रहे हैं।</p>
        </div>
        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // ── Home ───────────────────────────────────────────────────────
  const alreadyCompleted = status?.completed || isDailyTestDone();

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">📅 Daily Test</h2>
        <p className="text-muted-foreground mt-1">हर दिन 100 Questions — MP History + MP Geography (सभी Units)</p>
      </div>

      <Card className={alreadyCompleted ? "border-green-300 bg-green-50" : "border-primary/40"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              आज का Test — {getTodayKey()}
            </CardTitle>
            {alreadyCompleted && (
              <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Complete
              </span>
            )}
          </div>
          <CardDescription>
            {alreadyCompleted
              ? "बधाई हो! आज का Daily Test पूरा हो गया। कल फिर आना।"
              : "100 Questions — 50 MP History + 50 MP Geography"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="font-bold text-xl text-primary">100</div>
              <div className="text-muted-foreground">Total Questions</div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <div className="font-bold text-xl text-primary">2</div>
              <div className="text-muted-foreground">Subjects</div>
            </div>
          </div>
          {!alreadyCompleted ? (
            <Button className="w-full" size="lg" onClick={handleStart}>
              आज का Test शुरू करें
            </Button>
          ) : (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/review">Mistakes Review करें</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {notifGranted ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            सुबह 8 बजे Reminder
          </CardTitle>
          <CardDescription>
            {notifGranted
              ? "Notifications ON — हर दिन 8 AM पर reminder। Test complete होने तक हर घंटे याद दिलाएगा।"
              : "Notifications allow करें ताकि हर सुबह 8 AM पर reminder मिले।"}
          </CardDescription>
        </CardHeader>
        {!notifGranted && (
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleEnableNotifications}>
              <Bell className="w-4 h-4 mr-2" />
              Notifications Enable करें
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">Browser notification permission की ज़रूरत है</p>
          </CardContent>
        )}
      </Card>

      <Card className="bg-muted/40">
        <CardContent className="pt-6 space-y-3 text-sm">
          <h4 className="font-semibold">यह कैसे काम करता है?</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary font-bold">1.</span> हर दिन Gemini AI नए MPPSC-level questions generate करता है</li>
            <li className="flex gap-2"><span className="text-primary font-bold">2.</span> 50 MP History + 50 MP Geography — सभी important units cover होते हैं</li>
            <li className="flex gap-2"><span className="text-primary font-bold">3.</span> सुबह 8 AM reminder — test complete होने तक हर घंटे याद दिलाता है</li>
            <li className="flex gap-2"><span className="text-primary font-bold">4.</span> गलत answers automatic "Review Weakness" में save होते हैं</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useCreateSession, useSubmitSession } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

type AnswerSubmission = {
  questionId: number;
  selectedOption: string;
};

export default function Practice() {
  const queryClient = useQueryClient();
  const createSession = useCreateSession();
  const submitSession = useSubmitSession();

  const [subject, setSubject] = useState<string>("MP History");
  const [questionCount, setQuestionCount] = useState<string>("10");
  const [focusWeak, setFocusWeak] = useState<boolean>(false);

  const [activeSession, setActiveSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerSubmission[]>([]);
  const [currentSelection, setCurrentSelection] = useState<string>("");
  
  const [results, setResults] = useState<any>(null);

  const handleStart = () => {
    createSession.mutate(
      { data: { subject, questionCount: parseInt(questionCount), focusWeakTopics: focusWeak } },
      {
        onSuccess: (data: any) => {
          setActiveSession(data.session);
          setQuestions(data.questions);
          setCurrentIndex(0);
          setAnswers([]);
          setResults(null);
          setCurrentSelection("");
        },
      }
    );
  };

  const handleNext = () => {
    if (!currentSelection) return;
    
    const newAnswers = [
      ...answers,
      { questionId: questions[currentIndex].id, selectedOption: currentSelection }
    ];
    setAnswers(newAnswers);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentSelection("");
    } else {
      // Submit
      submitSession.mutate(
        { data: { answers: newAnswers } },
        {
          onSuccess: (data) => {
            setResults(data);
            queryClient.invalidateQueries(); // invalidate all to refresh dashboard
          }
        }
      );
    }
  };

  if (results) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Session Complete</CardTitle>
            <CardDescription>You've completed the {activeSession?.subject} practice session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Score</div>
                <div className="text-3xl font-bold text-primary">{results.score}%</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Correct</div>
                <div className="text-3xl font-bold text-green-600">{results.correctCount}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Wrong</div>
                <div className="text-3xl font-bold text-destructive">{results.wrongCount}</div>
              </div>
            </div>

            {results.wrongTopics && results.wrongTopics.length > 0 && (
              <div className="mt-8 border rounded-lg p-4 bg-destructive/5 border-destructive/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  Topics to Review
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {results.wrongTopics.map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/50 p-6">
            <Button variant="outline" onClick={() => {
              setActiveSession(null);
              setResults(null);
            }}>
              New Session
            </Button>
            <Button asChild>
              <Link href="/review">Review Mistakes</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (activeSession && questions.length > 0) {
    const question = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>{activeSession.subject}</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <span className="px-2 py-1 text-xs font-semibold bg-muted rounded-md text-muted-foreground">
                {question.topic}
              </span>
              <span className="px-2 py-1 text-xs font-semibold bg-secondary/10 text-secondary-foreground border border-secondary/20 rounded-md">
                {question.difficulty}
              </span>
            </div>
            <CardTitle className="text-xl leading-relaxed">
              {question.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={currentSelection} 
              onValueChange={setCurrentSelection}
              className="space-y-3"
            >
              {['A', 'B', 'C', 'D'].map((opt) => (
                <div key={opt}>
                  <RadioGroupItem value={opt} id={`option-${opt}`} className="peer sr-only" />
                  <Label
                    htmlFor={`option-${opt}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <div className="flex w-full items-center gap-3 text-base">
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                        {opt}
                      </span>
                      {question[`option${opt}` as keyof typeof question]}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="justify-end border-t bg-muted/20 p-4">
            <Button 
              onClick={handleNext} 
              disabled={!currentSelection || submitSession.isPending}
              size="lg"
              className="w-full sm:w-auto"
            >
              {submitSession.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isLast ? 'Submit Session' : 'Next Question'}
              {!submitSession.isPending && !isLast && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Practice Session</h2>
        <p className="text-muted-foreground mt-1">Configure your mock test parameters.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MP History">MP History</SelectItem>
                <SelectItem value="MP Geography">MP Geography</SelectItem>
                <SelectItem value="Indian Polity">Indian Polity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Number of Questions</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger>
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Focus on Weak Topics</Label>
              <p className="text-sm text-muted-foreground">
                Prioritize questions from topics you've struggled with recently.
              </p>
            </div>
            <Switch checked={focusWeak} onCheckedChange={setFocusWeak} />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t p-6">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleStart}
            disabled={createSession.isPending}
          >
            {createSession.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Practice
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

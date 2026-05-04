import { useListWeakQuestions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function Review() {
  const { data: weakQuestions, isLoading } = useListWeakQuestions();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Review Weakness</h2>
        <p className="text-muted-foreground mt-1">Questions you've gotten wrong most frequently.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : weakQuestions && weakQuestions.length > 0 ? (
        <div className="space-y-6">
          {weakQuestions.map((q) => (
            <Card key={q.id} className="border-l-4 border-l-destructive">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 text-xs font-semibold bg-muted rounded-md text-muted-foreground">
                        {q.subject}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                        {q.topic}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-medium leading-relaxed">
                      {q.questionText}
                    </CardTitle>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-bold text-destructive flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {q.timesWrong} wrong
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      out of {q.timesAnswered} attempts
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const isCorrect = q.correctOption === opt;
                    return (
                      <div 
                        key={opt} 
                        className={`p-3 rounded-md border flex items-start gap-3 ${
                          isCorrect 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50' 
                            : 'bg-card border-border'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {opt}
                        </span>
                        <span className={isCorrect ? 'font-medium text-green-900 dark:text-green-100' : ''}>
                          {q[`option${opt}` as keyof typeof q]}
                        </span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-primary text-sm flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> Explanation
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {q.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border rounded-lg bg-card text-muted-foreground">
          <CheckCircle2 className="mx-auto h-12 w-12 mb-4 text-green-500 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">No weak questions</h3>
          <p>You haven't gotten any questions wrong yet. Keep up the good work!</p>
        </div>
      )}
    </div>
  );
}

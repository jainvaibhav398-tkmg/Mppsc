import { useState } from "react";
import { useListQuestions, useGenerateQuestions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Wand2, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Questions() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState<string>("all");
  
  const { data: questions, isLoading } = useListQuestions({ 
    query: { queryKey: ["questions", subject] }, 
    request: subject !== "all" ? { subject } : undefined 
  } as any);

  const generateQs = useGenerateQuestions();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    generateQs.mutate(
      { data: { subject: subject === "all" ? "MP History" : subject, count: 5 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["questions"] });
          setIsGenerating(false);
        },
        onError: () => setIsGenerating(false)
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Question Bank</h2>
          <p className="text-muted-foreground mt-1">Browse all available MCQs.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="MP History">MP History</SelectItem>
              <SelectItem value="MP Geography">MP Geography</SelectItem>
              <SelectItem value="Indian Polity">Indian Polity</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Generate More
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : questions && questions.length > 0 ? (
        <div className="grid gap-4">
          {questions.map((q) => (
            <Card key={q.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 border-b bg-card">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary">{q.subject}</Badge>
                    <Badge variant="outline">{q.topic}</Badge>
                  </div>
                  <h3 className="text-lg font-medium">{q.questionText}</h3>
                </div>
                <div className="p-5 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div key={opt} className={`flex items-start gap-2 ${q.correctOption === opt ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        <span className="w-5 shrink-0">{opt}.</span>
                        <span>{q[`option${opt}` as keyof typeof q]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border rounded-lg">
          <p className="text-muted-foreground mb-4">No questions found for this subject.</p>
          <Button onClick={handleGenerate} disabled={isGenerating} variant="outline">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate AI Questions"}
          </Button>
        </div>
      )}
    </div>
  );
}

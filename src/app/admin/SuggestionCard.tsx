import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Cog } from "lucide-react";
import type { SuggestStationAssignmentsOutput } from "@/ai/flows/suggest-station-assignments";

type Suggestion = SuggestionStationAssignmentsOutput['suggestions'][0];

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const getBadgeVariant = (assignment: string) => {
    switch(assignment) {
        case 'All-in-one': return 'default';
        case 'Closed': return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">{suggestion.stationType}</CardTitle>
                <CardDescription>Suggested Assignment</CardDescription>
            </div>
            <Badge variant={getBadgeVariant(suggestion.assignment)}>{suggestion.assignment}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-1">
                <Lightbulb className="h-4 w-4 text-primary" />
                Reason
            </h4>
            <p className="text-sm text-muted-foreground pl-6">{suggestion.reason}</p>
        </div>
        <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-1">
                <Cog className="h-4 w-4 text-primary" />
                Actions to Take
            </h4>
            <ul className="text-sm text-muted-foreground list-disc pl-10 space-y-1">
                {suggestion.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                ))}
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}

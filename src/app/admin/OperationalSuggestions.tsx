'use client';

import { useState, useMemo, useCallback } from 'react';
import { suggestStationAssignments, SuggestStationAssignmentsInput, SuggestStationAssignmentsOutput } from '@/ai/flows/suggest-station-assignments';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import type { Ticket, Station } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Workflow, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


export function OperationalSuggestions() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const ticketsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'tickets') : null), [firestore]);
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsCollectionRef);

  const stationsCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'stations') : null), [firestore]);
  const { data: stations, isLoading: isLoadingStations } = useCollection<Station>(stationsCollectionRef);

  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestStationAssignmentsOutput | null>(null);

  const flowInput = useMemo<SuggestStationAssignmentsInput | null>(() => {
    if (!tickets || !stations) return null;

    const waitingTickets = tickets.filter(t => t.status === 'waiting');
    const openStations = stations.filter(s => s.status === 'open');
    
    // The AI flow is specific to these services, so we calculate based on them.
    const registrarId = 'registrar';
    const paymentId = 'payment';
    const certificateId = 'certificate';

    const registrationQueueLength = waitingTickets.filter(t => t.type === registrarId).length;
    const paymentQueueLength = waitingTickets.filter(t => t.type === paymentId).length;
    const certificateQueueLength = waitingTickets.filter(t => t.type === certificateId).length;

    const availableRegistrationStations = openStations.filter(s => s.serviceIds?.includes(registrarId)).length;
    const availablePaymentStations = openStations.filter(s => s.serviceIds?.includes(paymentId)).length;
    const availableCertificateStations = openStations.filter(s => s.serviceIds?.includes(certificateId)).length;

    return {
      registrationQueueLength,
      paymentQueueLength,
      certificateQueueLength,
      availableRegistrationStations,
      availablePaymentStations,
      availableCertificateStations
    };
  }, [tickets, stations]);

  const handleGetSuggestions = useCallback(async () => {
    if (!flowInput) {
      toast({
        variant: 'destructive',
        title: 'Cannot get suggestions',
        description: 'Data is not yet available. Please wait a moment and try again.'
      });
      return;
    }
    setIsLoadingSuggestions(true);
    setSuggestions(null);
    try {
      const result = await suggestStationAssignments(flowInput);
      setSuggestions(result);
    } catch (error: any) {
      console.error("AI suggestion flow failed:", error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: error.message || 'An unexpected error occurred while generating suggestions.'
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [flowInput, toast]);

  const isLoading = isLoadingTickets || isLoadingStations;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-primary" />
            AI Operational Suggestions
        </CardTitle>
        <CardDescription>
          Get AI-powered recommendations to optimize station assignments based on current queue lengths and available staff.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingSuggestions && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Analyzing queue data and generating suggestions...</p>
            <p className="text-sm">This may take a moment.</p>
          </div>
        )}
        {suggestions && (
          <div className="space-y-4">
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Overall Strategy</AlertTitle>
                <AlertDescription>
                 {suggestions.overallSummary}
                </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.suggestions.map((suggestion, index) => (
              <Card key={index} className="bg-background">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Workflow className="h-5 w-5 text-muted-foreground" />
                        {suggestion.stationType}: {suggestion.assignment}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><span className="font-semibold">Reason:</span> {suggestion.reason}</p>
                  <div>
                    <p className="font-semibold">Actions:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {suggestion.actions.map((action, i) => (
                            <li key={i}>{action}</li>
                        ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button onClick={handleGetSuggestions} disabled={isLoading || isLoadingSuggestions}>
          {isLoadingSuggestions ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
            </>
          ) : (
            <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Generate Suggestions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

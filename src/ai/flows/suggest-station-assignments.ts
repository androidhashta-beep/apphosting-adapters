'use server';
/**
 * @fileOverview This file contains a Genkit flow for suggesting optimal station assignments.
 *
 * - suggestStationAssignments - A function that handles the station assignment suggestion process.
 * - SuggestStationAssignmentsInput - The input type for the suggestStationAssignments function.
 * - SuggestStationAssignmentsOutput - The return type for the suggestStationAssignments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStationAssignmentsInputSchema = z.object({
  counterQueueLength: z
    .number()
    .int()
    .min(0)
    .describe('The current number of students waiting for counter services.'),
  cashierQueueLength: z
    .number()
    .int()
    .min(0)
    .describe('The current number of students waiting for cashier services.'),
  certificateQueueLength: z
    .number()
    .int()
    .min(0)
    .describe('The current number of students waiting for certificate claiming.'),
  availableCounters: z
    .number()
    .int()
    .min(0)
    .describe('The number of available staff/stations for counter services.'),
  availableCashiers: z
    .number()
    .int()
    .min(0)
    .describe('The number of available staff/stations for cashier services.'),
  availableCertificateStations: z
    .number()
    .int()
    .min(0)
    .describe(
      'The number of available staff/stations for certificate claiming.'
    ),
});
export type SuggestStationAssignmentsInput = z.infer<
  typeof SuggestStationAssignmentsInputSchema
>;

const SuggestStationAssignmentsOutputSchema = z.object({
  suggestions: z
    .array(
      z.object({
        stationType: z
          .enum(['Counter', 'Cashier', 'Combined', 'Certificate'])
          .describe(
            "The type of station being suggested for assignment (e.g., 'Counter', 'Cashier', 'Combined', 'Certificate')."
          ),
        assignment: z
          .enum(['Regular', 'All-in-one', 'Closed', 'Cashier-only', 'Counter-only', 'Certificate-only'])
          .describe(
            "The suggested assignment for the station (e.g., 'Regular', 'All-in-one', 'Closed'). 'All-in-one' means handling both counter and cashier services. 'Cashier-only' or 'Counter-only' is for a combined station that temporarily focuses on one type of service."
          ),
        reason: z
          .string()
          .describe('A brief explanation for the suggested assignment.'),
        actions: z
          .array(z.string())
          .describe('Specific administrative actions to implement the suggestion.'),
      })
    )
    .describe('An array of optimal station assignment suggestions.'),
  overallSummary: z
    .string()
    .describe('An overall summary of the recommended strategy for station assignments.'),
});
export type SuggestStationAssignmentsOutput = z.infer<
  typeof SuggestStationAssignmentsOutputSchema
>;

export async function suggestStationAssignments(
  input: SuggestStationAssignmentsInput
): Promise<SuggestStationAssignmentsOutput> {
  return suggestStationAssignmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStationAssignmentsPrompt',
  input: {schema: SuggestStationAssignmentsInputSchema},
  output: {schema: SuggestStationAssignmentsOutputSchema},
  prompt: `You are an expert operations manager for a school's seafaring training center, specializing in optimizing student flow through queue management.

Based on the current real-time queue lengths and available staff, suggest optimal station assignments to efficiently manage student flow and reduce waiting times. Consider options such as:
-   Designating specific counters as 'All-in-one' (handling counter, cashier, and certificate services).
-   Combining roles if appropriate.
-   Closing stations if they are not needed.

Current Queue Status:
-   Counter Queue Length: {{{counterQueueLength}}}
-   Cashier Queue Length: {{{cashierQueueLength}}}
-   Certificate Queue Length: {{{certificateQueueLength}}}

Available Staff/Stations:
-   Available Counters: {{{availableCounters}}}
-   Available Cashiers: {{{availableCashiers}}}
-   Available Certificate Stations: {{{availableCertificateStations}}}

Provide actionable suggestions, including a reason and specific actions to take. Ensure the output strictly adheres to the provided JSON schema.
`,
});

const suggestStationAssignmentsFlow = ai.defineFlow(
  {
    name: 'suggestStationAssignmentsFlow',
    inputSchema: SuggestStationAssignmentsInputSchema,
    outputSchema: SuggestStationAssignmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

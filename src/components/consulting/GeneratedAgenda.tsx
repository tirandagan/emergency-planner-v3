'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, DollarSign } from 'lucide-react';

interface GeneratedAgendaProps {
  /** AI-generated agenda in markdown format */
  agenda: string;
  /** Estimated session duration in minutes */
  durationMinutes: number;
  /** Hourly rate for the consulting service */
  hourlyRate: number;
  /** Callback when user clicks "Book Consultation" */
  onBookConsultation: () => void;
  /** Optional callback when user wants to regenerate agenda */
  onRegenerateAgenda?: () => void;
  /** Loading state for booking action */
  isBooking?: boolean;
}

export function GeneratedAgenda({
  agenda,
  durationMinutes,
  hourlyRate,
  onBookConsultation,
  onRegenerateAgenda,
  isBooking = false,
}: GeneratedAgendaProps): React.JSX.Element {
  // Calculate total estimated cost based on duration and hourly rate
  const estimatedCost = (durationMinutes / 60) * hourlyRate;

  // Format currency with proper US dollar formatting
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format duration in a human-readable way
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session details card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Your Personalized Session Agenda</CardTitle>
              <CardDescription className="text-base mt-2">
                Based on your responses, we've created a customized agenda for your consulting
                session
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              AI Generated
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-lg font-semibold">{formatDuration(durationMinutes)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Estimated Cost</p>
                <p className="text-lg font-semibold">{formatCurrency(estimatedCost)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Hourly Rate</p>
                <p className="text-lg font-semibold">{formatCurrency(hourlyRate)}/hr</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Markdown agenda content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-foreground mb-3 mt-6 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-foreground mb-2 mt-5 border-b pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold text-foreground mb-2 mt-3">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-base text-muted-foreground mb-3 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-3 text-base text-muted-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-3 text-base text-muted-foreground">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="ml-2 text-base">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
              }}
            >
              {agenda}
            </ReactMarkdown>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          {onRegenerateAgenda && (
            <Button
              type="button"
              variant="outline"
              onClick={onRegenerateAgenda}
              disabled={isBooking}
            >
              Regenerate Agenda
            </Button>
          )}

          <Button
            type="button"
            onClick={onBookConsultation}
            disabled={isBooking}
            size="lg"
            className="sm:ml-auto"
          >
            {isBooking ? 'Processing...' : 'Book Consultation'}
          </Button>
        </CardFooter>
      </Card>

      {/* Value proposition */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>What happens next:</strong> You'll be redirected to schedule your
            consultation at a time that works for you. Your personalized agenda will be shared
            with your consultant ahead of time to ensure a productive session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

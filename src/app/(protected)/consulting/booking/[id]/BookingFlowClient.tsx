'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { IntakeQuestionnaire, GeneratedAgenda } from '@/components/consulting';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { ConsultingService } from '@/db/schema/consulting';
import { createConsultingBooking, generateAgendaForBooking } from '@/app/actions/consulting';
import { buildCalendlyUrl } from '@/lib/calendly';
import { toast } from 'sonner';

type BookingStep = 'intro' | 'questionnaire' | 'agenda' | 'redirecting';

interface BookingFlowClientProps {
  service: ConsultingService;
  hourlyRate: number;
  calendlyUrl: string;
}

export function BookingFlowClient({
  service,
  hourlyRate,
  calendlyUrl,
}: BookingFlowClientProps): React.JSX.Element {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>('intro');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [agendaData, setAgendaData] = useState<{
    agenda: string;
    duration: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = (): void => {
    setCurrentStep('questionnaire');
  };

  const handleQuestionnaireComplete = async (
    responses: Record<string, string>
  ): Promise<void> => {
    setIsLoading(true);

    try {
      // Create booking with intake responses
      const result = await createConsultingBooking({
        consultingServiceId: service.id,
        intakeResponses: responses,
      });

      if (!result.success || !result.bookingId) {
        throw new Error(result.error || 'Failed to create booking');
      }

      setBookingId(result.bookingId);

      // Generate AI agenda
      const agendaResult = await generateAgendaForBooking(result.bookingId);

      if (!agendaResult.success || !agendaResult.agenda) {
        throw new Error(agendaResult.error || 'Failed to generate agenda');
      }

      setAgendaData({
        agenda: agendaResult.agenda,
        duration: agendaResult.estimatedDuration || 60,
      });

      setCurrentStep('agenda');
    } catch (error) {
      console.error('Error in booking flow:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to process booking. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookConsultation = (): void => {
    if (!agendaData) return;

    setIsLoading(true);
    setCurrentStep('redirecting');

    // Build Calendly URL with pre-populated data
    const calendlyUrlWithParams = buildCalendlyUrl({
      baseUrl: calendlyUrl,
      userName: '', // Will be filled by Calendly from user session
      userEmail: '', // Will be filled by Calendly from user session
      agendaSummary: agendaData.agenda,
    });

    // Redirect to Calendly
    window.location.href = calendlyUrlWithParams;
  };

  const handleRegenerateAgenda = async (): Promise<void> => {
    if (!bookingId) return;

    setIsLoading(true);

    try {
      const agendaResult = await generateAgendaForBooking(bookingId);

      if (!agendaResult.success || !agendaResult.agenda) {
        throw new Error(agendaResult.error || 'Failed to regenerate agenda');
      }

      setAgendaData({
        agenda: agendaResult.agenda,
        duration: agendaResult.estimatedDuration || 60,
      });

      toast.success('Agenda regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating agenda:', error);
      toast.error('Failed to regenerate agenda. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (): void => {
    router.push('/consulting');
  };

  // Intro step: Show service description with "I'm interested" button
  if (currentStep === 'intro') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          ← Back to Services
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">{service.name}</CardTitle>
            <CardDescription className="text-lg mt-2">{service.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="prose prose-slate dark:prose-invert max-w-none [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:space-y-2 [&>p]:mb-4">
              <ReactMarkdown
                components={{
                  ul: ({ children }) => <ul className="list-disc ml-6 space-y-2 my-4">{children}</ul>,
                  li: ({ children }) => <li className="text-base leading-relaxed">{children}</li>,
                  p: ({ children }) => <p className="text-base leading-relaxed mb-4">{children}</p>,
                }}
              >
                {service.genericDescription}
              </ReactMarkdown>
            </div>

            {service.targetScenarios && service.targetScenarios.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Relevant for:</p>
                <div className="flex flex-wrap gap-2">
                  {service.targetScenarios.map((scenario) => (
                    <span
                      key={scenario}
                      className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-full capitalize"
                    >
                      {scenario.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button onClick={handleGetStarted} size="lg" className="w-full group">
              I'm Interested
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Questionnaire step
  if (currentStep === 'questionnaire') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setCurrentStep('intro')} className="mb-4">
          ← Back
        </Button>

        <IntakeQuestionnaire
          service={service}
          onComplete={handleQuestionnaireComplete}
          onCancel={() => setCurrentStep('intro')}
        />

        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-lg font-medium">Generating your personalized agenda...</p>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Agenda step
  if (currentStep === 'agenda' && agendaData) {
    return (
      <div className="space-y-6">
        <GeneratedAgenda
          agenda={agendaData.agenda}
          durationMinutes={agendaData.duration}
          hourlyRate={hourlyRate}
          onBookConsultation={handleBookConsultation}
          onRegenerateAgenda={handleRegenerateAgenda}
          isBooking={isLoading}
        />
      </div>
    );
  }

  // Redirecting step
  if (currentStep === 'redirecting') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <h2 className="text-2xl font-bold">Redirecting to Calendly...</h2>
            <p className="text-muted-foreground">
              You'll be redirected to schedule your consultation in a moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <div>Loading...</div>;
}

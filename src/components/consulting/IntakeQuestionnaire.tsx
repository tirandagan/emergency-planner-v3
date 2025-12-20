'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ConsultingService } from '@/db/schema/consulting';

/**
 * Question configuration types
 * Supports textarea (free-text) and select (dropdown) question types
 */
interface BaseQuestion {
  question: string;
  placeholder?: string;
}

interface TextareaQuestion extends BaseQuestion {
  type: 'textarea';
  maxLength?: number;
}

interface SelectQuestion extends BaseQuestion {
  type: 'select';
  options: string[];
}

export type QuestionConfig = TextareaQuestion | SelectQuestion;

interface IntakeQuestionnaireProps {
  service: ConsultingService;
  /** Callback when questionnaire is completed with all responses */
  onComplete: (responses: Record<string, string>) => void;
  /** Optional callback for cancel action */
  onCancel?: () => void;
}

export function IntakeQuestionnaire({
  service,
  onComplete,
  onCancel,
}: IntakeQuestionnaireProps): React.JSX.Element {
  const questions = service.qualifyingQuestions as QuestionConfig[];
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  const currentQuestion = questions[currentStep];
  const currentResponse = responses[currentQuestion.question] || '';
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastStep = currentStep === questions.length - 1;

  const validateCurrentResponse = (): boolean => {
    if (!currentResponse || currentResponse.trim() === '') {
      setErrors({ ...errors, [currentStep]: 'Please provide an answer to continue' });
      return false;
    }

    if (currentQuestion.type === 'textarea' && currentQuestion.maxLength) {
      if (currentResponse.length > currentQuestion.maxLength) {
        setErrors({
          ...errors,
          [currentStep]: `Response must be ${currentQuestion.maxLength} characters or less`,
        });
        return false;
      }
    }

    // Clear error if validation passes
    const newErrors = { ...errors };
    delete newErrors[currentStep];
    setErrors(newErrors);
    return true;
  };

  const handleNext = (): void => {
    if (!validateCurrentResponse()) return;

    if (isLastStep) {
      onComplete(responses);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleResponseChange = (value: string): void => {
    setResponses({
      ...responses,
      [currentQuestion.question]: value,
    });

    // Clear error when user starts typing
    if (errors[currentStep]) {
      const newErrors = { ...errors };
      delete newErrors[currentStep];
      setErrors(newErrors);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Tell us about your needs</CardTitle>
        <CardDescription className="text-base">
          Help us understand your emergency preparedness goals so we can create a personalized
          session agenda.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {currentStep + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current question */}
        <div className="space-y-4 min-h-[300px]">
          <div className="space-y-2">
            <Label htmlFor="response" className="text-lg font-medium">
              {currentQuestion.question}
            </Label>

            {currentQuestion.type === 'textarea' && (
              <div className="space-y-1">
                <Textarea
                  id="response"
                  value={currentResponse}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  placeholder={currentQuestion.placeholder || 'Type your answer here...'}
                  className="min-h-[150px] text-base resize-none"
                  maxLength={currentQuestion.maxLength}
                  autoFocus
                />
                {currentQuestion.maxLength && (
                  <p className="text-xs text-muted-foreground text-right">
                    {currentResponse.length} / {currentQuestion.maxLength} characters
                  </p>
                )}
              </div>
            )}

            {currentQuestion.type === 'select' && (
              <Select value={currentResponse} onValueChange={handleResponseChange}>
                <SelectTrigger id="response" className="text-base">
                  <SelectValue placeholder={currentQuestion.placeholder || 'Select an option...'} />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options.map((option) => (
                    <SelectItem key={option} value={option} className="text-base">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Error message */}
          {errors[currentStep] && (
            <p className="text-sm text-destructive">{errors[currentStep]}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 0 && onCancel ? onCancel : handleBack}
          disabled={currentStep === 0 && !onCancel}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Button type="button" onClick={handleNext} size="lg">
          {isLastStep ? 'Generate Agenda' : 'Next'}
          {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </CardFooter>
    </Card>
  );
}

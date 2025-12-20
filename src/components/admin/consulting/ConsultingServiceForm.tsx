'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { createConsultingService, updateConsultingService } from '@/app/actions/consulting';
import type { ConsultingService } from '@/db/schema';

interface QuestionField {
  question: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}

interface ConsultingServiceFormProps {
  service?: ConsultingService;
  bundles?: Array<{ id: string; name: string }>;
}

export function ConsultingServiceForm({
  service,
  bundles = [],
}: ConsultingServiceFormProps): JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [genericDescription, setGenericDescription] = useState(
    service?.genericDescription || ''
  );
  const [isGeneric, setIsGeneric] = useState(service?.isGeneric ?? true);
  const [bundleId, setBundleId] = useState<string>(service?.bundleId || '');
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [displayOrder, setDisplayOrder] = useState(service?.displayOrder || 0);

  // Questions management
  const initialQuestions: QuestionField[] = service?.qualifyingQuestions
    ? (service.qualifyingQuestions as QuestionField[])
    : [
        {
          question: 'What would you like to discuss during your consulting session?',
          type: 'textarea',
          placeholder: 'Example: I want to organize my supplies, improve my evacuation plan, etc.',
        },
        {
          question: 'What is your current preparedness level?',
          type: 'select',
          options: [
            'None - Just getting started',
            'Basic - Have some supplies',
            'Intermediate - Have plan and supplies',
            'Advanced - Comprehensive preparedness',
          ],
        },
        {
          question: 'What outcome are you hoping for from this consulting session?',
          type: 'textarea',
          placeholder: 'Example: I want a clear action plan, confidence in my preparedness, etc.',
        },
      ];

  const [questions, setQuestions] = useState<QuestionField[]>(initialQuestions);

  const addQuestion = (): void => {
    setQuestions([
      ...questions,
      {
        question: '',
        type: 'text',
        placeholder: '',
      },
    ]);
  };

  const removeQuestion = (index: number): void => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionField, value: string): void => {
    const updated = [...questions];
    if (field === 'options') {
      updated[index] = {
        ...updated[index],
        options: value.split('\n').filter((opt) => opt.trim()),
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        name,
        description,
        genericDescription,
        qualifyingQuestions: questions,
        isGeneric,
        bundleId: bundleId || null,
        isActive,
        displayOrder,
      };

      if (service?.id) {
        await updateConsultingService(service.id, data);
      } else {
        await createConsultingService(data);
      }

      router.push('/admin/consulting');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{service ? 'Edit' : 'Create'} Consulting Service</CardTitle>
          <CardDescription>
            Configure a consulting service offering for users to discover and book
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Emergency Preparedness Consulting"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Get personalized expert guidance on your emergency preparedness journey"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genericDescription">Generic Description *</Label>
              <Textarea
                id="genericDescription"
                value={genericDescription}
                onChange={(e) => setGenericDescription(e.target.value)}
                placeholder="Detailed description shown before users start the intake questionnaire..."
                rows={8}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This description is shown to users before they click "I'm interested"
              </p>
            </div>
          </div>

          {/* Qualifying Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Qualifying Questions ({questions.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((q, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}`}>Question Text</Label>
                    <Input
                      id={`question-${index}`}
                      value={q.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="What would you like to discuss?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`type-${index}`}>Input Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(value) =>
                        updateQuestion(index, 'type', value as QuestionField['type'])
                      }
                    >
                      <SelectTrigger id={`type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="select">Dropdown Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(q.type === 'text' || q.type === 'textarea') && (
                    <div className="space-y-2">
                      <Label htmlFor={`placeholder-${index}`}>Placeholder</Label>
                      <Input
                        id={`placeholder-${index}`}
                        value={q.placeholder || ''}
                        onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                        placeholder="Example: I want to..."
                      />
                    </div>
                  )}

                  {q.type === 'select' && (
                    <div className="space-y-2">
                      <Label htmlFor={`options-${index}`}>Options (one per line)</Label>
                      <Textarea
                        id={`options-${index}`}
                        value={q.options?.join('\n') || ''}
                        onChange={(e) => updateQuestion(index, 'options', e.target.value)}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={4}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Generic Service</Label>
                <p className="text-xs text-muted-foreground">
                  Available to all users regardless of bundle or scenario
                </p>
              </div>
              <Switch isSelected={isGeneric} onChange={setIsGeneric} />
            </div>

            {!isGeneric && bundles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bundleId">Associated Bundle</Label>
                <Select value={bundleId} onValueChange={setBundleId}>
                  <SelectTrigger id="bundleId">
                    <SelectValue placeholder="Select a bundle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bundles.map((bundle) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Only active services are shown to users
                </p>
              </div>
              <Switch isSelected={isActive} onChange={setIsActive} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the list
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/consulting')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

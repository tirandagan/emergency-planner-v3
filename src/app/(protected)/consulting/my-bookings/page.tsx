import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserConsultingBookings } from '@/lib/consulting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const metadata: Metadata = {
  title: 'My Consulting Bookings | Emergency Preparedness',
  description: 'View your consulting booking history and session details',
};

export default async function MyBookingsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const bookings = await getUserConsultingBookings(user.id);

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'cancelled':
      case 'no_show':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: string | null): string => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Consulting Bookings</h1>
        <p className="text-muted-foreground mt-2">
          View your consultation history and session details
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">No Bookings Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't booked any consulting sessions yet. Browse our available services to
                get started with expert guidance.
              </p>
              <Link href="/consulting">
                <Button size="lg" className="mt-4">
                  Browse Consulting Services
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map(({ booking, service }) => {
            if (!service) return null as React.ReactNode;

            return (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{service.name}</CardTitle>
                      <CardDescription className="mt-2">{service.description}</CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
                      {booking.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Booking metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <>
                      {booking.scheduledAt ? (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Scheduled</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(booking.scheduledAt)}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {booking.estimatedDurationMinutes ? (
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Duration</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.estimatedDurationMinutes} minutes
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {booking.totalEstimatedCost ? (
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Estimated Cost</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(booking.totalEstimatedCost)}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </>
                  </div>

                  {/* Intake responses */}
                  {booking.intakeResponses && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3">Your Responses</h3>
                        <div className="space-y-3">
                          {Object.entries(booking.intakeResponses as Record<string, unknown>).map(
                            ([question, answer]) => (
                              <div key={question} className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                  {question}
                                </p>
                                <p className="text-base">{String(answer)}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Generated agenda */}
                  {booking.generatedAgenda && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3">Session Agenda</h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
                          <ReactMarkdown>{booking.generatedAgenda || ''}</ReactMarkdown>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Admin notes (if any) */}
                  {booking.adminNotes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Consultant Notes</h3>
                        <p className="text-sm text-muted-foreground">{booking.adminNotes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

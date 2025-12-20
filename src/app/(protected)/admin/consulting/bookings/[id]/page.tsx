import type { JSX } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getConsultingBookingById } from '@/lib/consulting';
import ReactMarkdown from 'react-markdown';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch booking details
  const result = await getConsultingBookingById(id);

  if (!result) {
    notFound();
  }

  const { booking, service, user: bookingUser } = result;
  const responses = booking.intakeResponses as Record<string, string>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/consulting" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Consulting Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
        <p className="text-muted-foreground mt-2">
          Review intake responses and generated agenda for this consultation
        </p>
      </div>

      <div className="grid gap-6">
        {/* Booking Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Overview</CardTitle>
            <CardDescription>Basic information about this consultation booking</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User</p>
                <p className="text-base font-medium">
                  {bookingUser?.fullName || 'Unknown User'}
                </p>
                <p className="text-sm text-muted-foreground">{bookingUser?.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Service</p>
                <p className="text-base font-medium">{service?.name || 'Deleted Service'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : booking.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base">
                  {new Date(booking.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {booking.estimatedDurationMinutes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estimated Duration
                  </p>
                  <p className="text-base">{booking.estimatedDurationMinutes} minutes</p>
                </div>
              )}

              {booking.hourlyRateAtBooking && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rate</p>
                  <p className="text-base">${booking.hourlyRateAtBooking}/hour</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Intake Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Intake Questionnaire Responses</CardTitle>
            <CardDescription>Client's responses to pre-consultation questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(responses).map(([question, answer], index) => (
              <div key={index} className="border-l-2 border-primary pl-4">
                <p className="font-medium text-sm text-muted-foreground mb-2">{question}</p>
                <p className="text-base whitespace-pre-wrap">{answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Generated Agenda */}
        {booking.generatedAgenda && (
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Session Agenda</CardTitle>
              <CardDescription>
                Personalized agenda created{' '}
                {booking.agendaGeneratedAt &&
                  new Date(booking.agendaGeneratedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{booking.generatedAgenda}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Notes */}
        {booking.adminNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>Internal notes about this consultation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{booking.adminNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

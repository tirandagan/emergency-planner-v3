import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'My Consulting Bookings | Emergency Preparedness',
  description: 'View your consulting booking history and session details',
};

export default async function MyBookingsPage(): Promise<React.JSX.Element> {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Consulting Bookings</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your consulting booking history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>
            The consulting bookings page is currently being updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">
              This feature is temporarily unavailable while we improve the experience.
            </p>
            <Link href="/consulting">
              <Button>Browse Consulting Services</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

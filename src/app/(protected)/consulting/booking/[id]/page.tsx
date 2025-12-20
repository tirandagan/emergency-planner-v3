import { notFound, redirect } from 'next/navigation';
import { getConsultingServiceById, getSystemSettingByKey } from '@/lib/consulting';
import { BookingFlowClient } from './BookingFlowClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const service = await getConsultingServiceById(id);

  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return {
    title: `Book ${service.name} | Consulting`,
    description: service.description,
  };
}

export default async function BookingPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { id } = await params;

  // Fetch service details
  const service = await getConsultingServiceById(id);

  if (!service) {
    notFound();
  }

  if (!service.isActive) {
    redirect('/consulting');
  }

  // Fetch system settings for pricing and Calendly integration
  const hourlyRateSetting = await getSystemSettingByKey('consulting_hourly_rate');
  const calendlyUrlSetting = await getSystemSettingByKey('consulting_calendly_url');

  const hourlyRate = hourlyRateSetting ? parseFloat(hourlyRateSetting) : 150;
  const calendlyUrl = calendlyUrlSetting || '';

  if (!calendlyUrl) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Consulting Temporarily Unavailable</h1>
          <p className="text-muted-foreground">
            We're currently setting up our scheduling system. Please check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BookingFlowClient
        service={service}
        hourlyRate={hourlyRate}
        calendlyUrl={calendlyUrl}
      />
    </div>
  );
}

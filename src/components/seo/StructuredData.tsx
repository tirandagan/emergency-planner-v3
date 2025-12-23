/**
 * Structured Data (JSON-LD) Components for SEO
 *
 * These components generate JSON-LD structured data for Google Rich Results.
 * Learn more: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

import Script from 'next/script';

interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    contactType: string;
    email: string;
  };
  founders?: Array<{
    name: string;
    type: string;
  }>;
}

interface ServiceSchema {
  name: string;
  description: string;
  provider: string;
  serviceType: string;
  areaServed: string;
  url: string;
}

interface FAQSchema {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Organization Structured Data
 * Use on homepage and about page for company information
 */
export function OrganizationStructuredData({
  name,
  url,
  logo,
  description,
  sameAs = [],
  contactPoint,
  founders,
}: OrganizationSchema): React.JSX.Element {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
    ...(contactPoint && { contactPoint }),
    ...(founders && { founder: founders }),
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Service Structured Data
 * Use on consulting page and service-specific pages
 */
export function ServiceStructuredData({
  name,
  description,
  provider,
  serviceType,
  areaServed,
  url,
}: ServiceSchema): React.JSX.Element {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
    },
    serviceType,
    areaServed,
    url,
  };

  return (
    <Script
      id="service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * FAQ Structured Data
 * Use on pages with FAQ sections for rich search results
 */
export function FAQStructuredData({ questions }: FAQSchema): React.JSX.Element {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Product Structured Data
 * Use on store page and individual product pages
 */
interface ProductSchema {
  name: string;
  description: string;
  image: string;
  brand: string;
  offers: {
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
}

export function ProductStructuredData({
  name,
  description,
  image,
  brand,
  offers,
}: ProductSchema): React.JSX.Element {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      ...offers,
    },
  };

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * WebSite Structured Data with SearchAction
 * Use on homepage for site-wide search functionality
 */
export function WebsiteStructuredData({
  name,
  url,
}: {
  name: string;
  url: string;
}): React.JSX.Element {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * BreadcrumbList Structured Data
 * Use on all pages to show navigation hierarchy
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({
  items,
}: {
  items: BreadcrumbItem[];
}): React.JSX.Element {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

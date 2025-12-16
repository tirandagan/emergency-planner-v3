"use client";

import dynamic from 'next/dynamic';

export const ResponsiveContainer = dynamic(
    () => import('recharts').then((mod) => mod.ResponsiveContainer),
    { ssr: false }
);

export const BarChart = dynamic(
    () => import('recharts').then((mod) => mod.BarChart),
    { ssr: false }
);

export const Bar = dynamic(
    () => import('recharts').then((mod) => mod.Bar),
    { ssr: false }
);

export const XAxis = dynamic(
    () => import('recharts').then((mod) => mod.XAxis),
    { ssr: false }
);

export const YAxis = dynamic(
    () => import('recharts').then((mod) => mod.YAxis),
    { ssr: false }
);

export const Tooltip = dynamic(
    () => import('recharts').then((mod) => mod.Tooltip),
    { ssr: false }
);

export const RadarChart = dynamic(
    () => import('recharts').then((mod) => mod.RadarChart),
    { ssr: false }
);

export const PolarGrid = dynamic(
    () => import('recharts').then((mod) => mod.PolarGrid),
    { ssr: false }
);

export const PolarAngleAxis = dynamic(
    () => import('recharts').then((mod) => mod.PolarAngleAxis),
    { ssr: false }
);

export const PolarRadiusAxis = dynamic(
    () => import('recharts').then((mod) => mod.PolarRadiusAxis),
    { ssr: false }
);

export const Radar = dynamic(
    () => import('recharts').then((mod) => mod.Radar),
    { ssr: false }
);

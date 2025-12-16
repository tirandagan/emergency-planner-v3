import { Suspense } from 'react';
import Planner from '@/components/Planner';

export default function PlannerPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-gray-400">Loading planner...</div>}>
            <Planner />
        </Suspense>
    );
}

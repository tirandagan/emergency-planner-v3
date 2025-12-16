'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Shield,
  CheckCircle2,
  FileText,
  Award,
  ArrowRight,
} from 'lucide-react';

export function ResearchModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="w-4 h-4" strokeWidth={2} />
          Learn More About Our Research
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={2} />
            Our Research Methodology
          </DialogTitle>
          <DialogDescription>
            How we developed our preparedness framework
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Expert Literature */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-foreground">Expert Literature Review</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              We studied dozens of leading publications on emergency preparedness, survival strategy,
              and disaster response. Our research includes works from recognized preparedness experts,
              government emergency management guidelines, and military field manuals. Each source was
              evaluated for practical applicability to civilian family preparedness.
            </p>
          </div>

          {/* Emergency Leaders */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-foreground">Emergency Management Consultation</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              We consulted with emergency management professionals at city, state, and federal levels.
              These conversations provided invaluable insights into:
            </p>
            <ul className="text-sm text-muted-foreground pl-12 space-y-1.5 mt-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Real-world response protocols and priorities during major disasters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Common gaps in civilian preparedness they observe repeatedly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Timeline realities for government assistance during wide-scale emergencies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Critical items most families overlook in their planning</span>
              </li>
            </ul>
          </div>

          {/* Professional Veterans */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-foreground">Law Enforcement & Military Veterans</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              Our approach was refined through discussions with veterans from law enforcement, military,
              and three-letter agencies. These professionals provided tactical nuances and field-tested
              insights that go beyond theoretical preparedness:
            </p>
            <ul className="text-sm text-muted-foreground pl-12 space-y-1.5 mt-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Operational security considerations for family preparedness</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Equipment reliability under stress and adverse conditions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Communication and coordination strategies during infrastructure failure</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                <span>Situational awareness and threat assessment fundamentals</span>
              </li>
            </ul>
          </div>

          {/* Testing Validation */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-foreground">Personal Testing & Validation</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-12">
              <strong className="text-foreground">We don&rsquo;t recommend anything we haven&rsquo;t personally tested.</strong>
            </p>
            <p className="text-sm text-muted-foreground pl-12">
              Every product in our bundles has been purchased, set up, and used by our team. We&rsquo;ve
              tested water purification systems, practiced with emergency communication devices, and
              lived with the gear we recommend. These aren&rsquo;t affiliate products we&rsquo;ve never
              touched—they&rsquo;re the exact same solutions we&rsquo;ve implemented for our own families.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

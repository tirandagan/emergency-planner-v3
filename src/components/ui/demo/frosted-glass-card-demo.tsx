"use client";

import { FrostedGlassCard, InteractiveFrostedTestimonial } from "@/components/ui/interactive-frosted-glass-card";
import { Layers } from "lucide-react";

export default function FrostedGlassCardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        {/* Generic Frosted Glass Card */}
        <FrostedGlassCard className="w-full max-w-md rounded-3xl p-8 text-white shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Glassmorphism UI</h2>
              <p className="text-indigo-300">A New Design Trend</p>
            </div>
          </div>
          <p className="text-gray-300 leading-relaxed">
            This card uses the glassmorphism effect to create a sense of depth and transparency. 
            The 3D tilt and dynamic glare are powered by JavaScript to create a futuristic and 
            engaging user experience.
          </p>
        </FrostedGlassCard>

        {/* Testimonial Card */}
        <InteractiveFrostedTestimonial
          avatarSrc="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
          name="Sarah Johnson"
          handle="@sarahprep"
          text="This platform helped my family create a comprehensive emergency plan in minutes. We feel so much more prepared now!"
          delay=""
        />
      </div>
    </div>
  );
}



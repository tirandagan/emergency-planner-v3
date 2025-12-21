"use client";

import { Component } from "@/components/ui/vapour-text-effect";
import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text-effect";

const VapourTextDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col gap-12 justify-center items-center p-8">
      {/* Original Demo Component */}
      <div className="w-full max-w-4xl">
        <h2 className="text-white text-2xl mb-4 text-center">Original Demo</h2>
        <Component />
      </div>

      {/* Custom BePrepared Example */}
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-xl rounded-3xl p-12">
        <h2 className="text-white text-2xl mb-8 text-center">BePrepared Welcome</h2>
        <div className="h-24 w-full">
          <VaporizeTextCycle
            texts={["Welcome to", "BePrepared", "Emergency Planner"]}
            font={{
              fontFamily: "Inter, sans-serif",
              fontSize: "56px",
              fontWeight: 600
            }}
            color="rgb(255,255, 255)"
            spread={4}
            density={7}
            animation={{
              vaporizeDuration: 2.5,
              fadeInDuration: 1.2,
              waitDuration: 1.5
            }}
            direction="left-to-right"
            alignment="center"
            tag={Tag.H1}
          />
        </div>
      </div>

      {/* Compact Version */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8">
        <h2 className="text-slate-900 text-xl mb-4 text-center">Sign In Page Version</h2>
        <div className="h-16 w-full">
          <VaporizeTextCycle
            texts={["Welcome to", "BePrepared", "Emergency Planner"]}
            font={{
              fontFamily: "inherit",
              fontSize: "40px",
              fontWeight: 600
            }}
            color="rgb(0, 0, 0)"
            spread={4}
            density={7}
            animation={{
              vaporizeDuration: 2.5,
              fadeInDuration: 1.2,
              waitDuration: 1.5
            }}
            direction="left-to-right"
            alignment="left"
            tag={Tag.H1}
          />
        </div>
      </div>
    </div>
  );
};

export { VapourTextDemo };


import React from 'react';
import { ArrowRight, Recycle } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onJoinClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onExploreClick, onJoinClick }) => {
  return (
    <section id="hero" className="w-full relative overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-white py-16 sm:py-24">
      {/* Background Decorative Blob */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-50/60 blur-3xl" />
      <div className="absolute -left-12 top-1/3 -z-10 h-[300px] w-[300px] rounded-full bg-teal-50/40 blur-3xl" />

      <div className="w-full px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Heading and Details */}
          <div className="flex flex-col justify-center lg:col-span-7">
            {/* Small Badge */}
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-sm">
              <Recycle className="h-3 w-3 animate-spin [animation-duration:8s]" />
              <span>Connecting the Circular Economy</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl lg:leading-[1.1]">
              Transform Textile <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Waste Into Value
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              Buy, sell and recycle textile waste through Sri Lanka's textile waste marketplace. 
              Connecting manufacturers, recyclers, and entrepreneurs for a sustainable future.
            </p>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={onExploreClick}
                className="group flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 duration-200 shadow-md hover:shadow-lg"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button
                onClick={onJoinClick}
                className="rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 duration-200"
              >
                Join Platform
              </button>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative h-[320px] w-full max-w-[460px] overflow-hidden rounded-2xl bg-zinc-100 shadow-[0_20px_50px_rgba(16,185,129,0.12)] sm:h-[400px]">
              <img
                src="/hero_textile.png"
                alt="TexCycle AI Circular Economy Diagram"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {/* Subtle overlay overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>
            {/* Soft decorative badge underneath */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur-md hidden sm:block">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Circular Path</p>
              <p className="text-sm font-bold text-zinc-900 mt-1">100% Recyclable Trace</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;

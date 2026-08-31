import React from 'react';
import { ShieldCheck, Leaf, Users, Landmark, CheckCircle } from 'lucide-react';

const Features: React.FC = () => {
  const points = [
    'Eco-friendly Materials Marketplace',
    'Streamlined Circularity Steps',
    'Industrial Grade Materials Tracking',
  ];

  const features = [
    {
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
      title: 'Verified Materials',
      description: 'Every listing undergoes screening for material composition, cleanliness standards, and volume verification.'
    },
    {
      icon: <Leaf className="h-5 w-5 text-emerald-600" />,
      title: 'Sustainable Trading',
      description: 'Log and track environmental savings metrics like carbon reduction, water saved, and waste diversion rate.'
    },
    {
      icon: <Users className="h-5 w-5 text-emerald-600" />,
      title: 'Trusted Community',
      description: 'Direct connections between verified fabric manufacturers, recycling plants, designers, and artisans.'
    },
    {
      icon: <Landmark className="h-5 w-5 text-emerald-600" />,
      title: 'Value Marketplace',
      description: 'Turn textile waste overheads into auxiliary revenue streams, and source raw materials at reduced cost structures.'
    }
  ];

  return (
    <section id="why-choose" className="w-full bg-zinc-50 py-24 border-t border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Heading and benefits */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Why Choose <br />
              TexCycle AI?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              We bridge the gap between waste generators and buyers through a smart, secure, and circular logistics approach. Connecting industrial factories directly to innovative brands.
            </p>
            
            <div className="mt-8 flex flex-col gap-3">
              {points.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span className="text-sm font-semibold text-zinc-700">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Features Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
            {features.map((feat, idx) => (
              <div 
                key={idx}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover-lift"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  {feat.icon}
                </div>
                <h3 className="mt-4 text-sm font-bold text-zinc-950">{feat.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{feat.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;

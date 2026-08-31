import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { value: '10,000kg+', label: 'Waste Recycled' },
    { value: '2,500kg', label: 'CO2 Saved' },
    { value: '500,000L', label: 'Water Conserved' },
    { value: '500+', label: 'Partner Businesses' }
  ];

  return (
    <section className="w-full bg-zinc-950 py-16 text-white">
      <div className="w-full w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-emerald-400">
                {stat.value}
              </span>
              <span className="mt-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;

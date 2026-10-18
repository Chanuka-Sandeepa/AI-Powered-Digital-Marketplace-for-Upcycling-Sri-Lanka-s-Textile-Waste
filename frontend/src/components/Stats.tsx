import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { value: '10,000kg+', label: 'Waste Recycled' },
    { value: '2,500kg', label: 'CO2 Saved' },
    { value: '500,000L', label: 'Water Conserved' },
    { value: '500+', label: 'Partner Businesses' }
  ];

  return (
    <section className="w-full bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 py-16 text-white">
      <div className="w-full w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-2xl font-extrabold tracking-tight text-amber-300 sm:text-3xl lg:text-4xl">
                {stat.value}
              </span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-cyan-100">
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

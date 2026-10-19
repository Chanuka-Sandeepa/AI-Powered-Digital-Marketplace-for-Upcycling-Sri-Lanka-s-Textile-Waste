import React from 'react';

const CircularitySteps: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Create Account',
      description: 'Register as a waste generator (manufacturer) or buyer (recycler, designer, artisan).'
    },
    {
      num: '02',
      title: 'List or Browse',
      description: 'Sellers list excess yarn or cutout fabrics. Buyers search by category, location, or condition.'
    },
    {
      num: '03',
      title: 'Connect',
      description: 'Interact directly on listings to negotiate prices, request fabric samples, or set logs.'
    },
    {
      num: '04',
      title: 'Transact',
      description: 'Finalize agreements, arrange shipment, and log resource offsets automatically.'
    }
  ];

  return <section id="circularity" className="w-full bg-gradient-to-br from-amber-50 via-white to-cyan-50 py-24">
  <div className="w-full px-4 sm:px-6 lg:px-8">

    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 font-sans">
        How it works
      </p>

      <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        Streamlined Circularity
      </h2>

      <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
        Four simple steps to divert textile waste from landfills back into valuable production cycles.
      </p>
    </div>

    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className={`relative flex flex-col items-center rounded-2xl border p-6 text-center transition-colors ${[
            'border-emerald-100 bg-emerald-50/80 hover:bg-emerald-100/70',
            'border-cyan-100 bg-cyan-50/80 hover:bg-cyan-100/70',
            'border-violet-100 bg-violet-50/80 hover:bg-violet-100/70',
            'border-orange-100 bg-orange-50/80 hover:bg-orange-100/70',
          ][idx]}`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white text-xs font-bold shadow-sm ${['text-emerald-700', 'text-cyan-700', 'text-violet-700', 'text-orange-700'][idx]}`}>
            {step.num}
          </div>

          <h3 className="mt-6 text-sm font-bold text-zinc-950">
            {step.title}
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {step.description}
          </p>
        </div>
      ))}
    </div>

  </div>
</section>;
};

export default CircularitySteps;

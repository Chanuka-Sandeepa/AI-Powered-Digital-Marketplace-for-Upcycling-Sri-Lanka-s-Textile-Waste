import React from 'react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      quote: 'The system integrated our garment waste streams immediately, saving us hours of logistics overheads and turning scrap cutouts into a solid auxiliary revenue stream.',
      name: 'Hansani Perera',
      role: 'Sustainability Manager, Hela Apparel',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
    },
    {
      quote: 'Finding clean denim off-cuts for our artisan lifestyle lines used to be a scavenger hunt. TexCycle made the sourcing process transparent, direct, and traceable.',
      name: 'Akash de Silva',
      role: 'Founder, Circular Trends',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    {
      quote: 'This platform is the perfect catalyst for green industrial manufacturing in Sri Lanka. It provides real, verifiable proof-of-impact data for our compliance audits.',
      name: 'Sajith Fernando',
      role: 'CEO, Lanka Eco-Textiles',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80'
    }
  ];

  return (
    <section id="testimonials" className="w-full bg-zinc-50 py-24 border-t border-gray-100">
      <div className="w-full w-full px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Impact stories</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Voices of Change</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Hear from sustainability officers, fashion founders, and entrepreneurs driving circularity.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((test, idx) => (
            <div 
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-gray-155 bg-white p-8 shadow-sm hover:shadow-md hover-lift transition-all"
            >
              <p className="text-sm italic leading-relaxed text-zinc-600">
                "{test.quote}"
              </p>
              
              <div className="mt-8 flex items-center gap-4 border-t border-gray-50 pt-6">
                <img
                  src={test.image}
                  alt={test.name}
                  className="h-10 w-10 rounded-full object-cover border border-gray-100"
                />
                <div>
                  <h4 className="text-xs font-bold text-zinc-950">{test.name}</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;

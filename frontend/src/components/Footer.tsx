import React, { useState } from 'react';
import { Recycle, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="w-full bg-white border-t border-gray-100 py-16 text-zinc-600">
      <div className="w-full w-full px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <Recycle className="h-4.5 w-4.5" />
              </div>
              <span className="font-sans text-lg font-bold tracking-tight text-zinc-900">
                TexCycle <span className="text-emerald-600">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Recycling textile waste through Sri Lanka's leading digital marketplace. Connecting manufacturers, recyclers, and entrepreneurs for a sustainable circular economy.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">Marketplace</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-500">
              <li><a href="#marketplace" className="hover:text-emerald-600 transition-colors">Cotton Materials</a></li>
              <li><a href="#marketplace" className="hover:text-emerald-600 transition-colors">Denim Shreds</a></li>
              <li><a href="#marketplace" className="hover:text-emerald-600 transition-colors">Polyester Rolls</a></li>
              <li><a href="#marketplace" className="hover:text-emerald-600 transition-colors">Waste Collectors</a></li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="flex flex-col gap-3 text-xs text-zinc-500">
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-zinc-300" />
                <span>info@texcycle.ai</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-zinc-300" />
                <span>+94 11 234 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-zinc-300" />
                <span>Colombo 03, Sri Lanka</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Subscribe to Newsletter</h4>
            <p className="text-xs text-zinc-500">Get updates on raw material listings and circular fashion trends.</p>
            
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-sm"
              >
                {subscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright details */}
        <div className="mt-16 border-t border-gray-100 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} TexCycle AI. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

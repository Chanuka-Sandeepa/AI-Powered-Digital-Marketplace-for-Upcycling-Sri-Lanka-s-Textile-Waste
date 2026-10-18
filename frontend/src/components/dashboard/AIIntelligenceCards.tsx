import {
  ArrowRight,
  BarChart3,
  Clock3,
  DollarSign,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIIntelligenceCards = () => {
  const navigate = useNavigate();

  const items = [
    {
      title: 'Price Prediction',
      description: 'AI-assisted textile price estimation',
      icon: <DollarSign size={20} />,
      path: '/price-prediction',
      className: 'bg-sky-50 text-sky-600',
      borderClass: 'border-sky-100 hover:border-sky-200',
    },
    {
      title: 'Buyer Recommendation',
      description: 'Find the most suitable buyer category',
      icon: <Users size={20} />,
      path: '/buyer-recommendation',
      className: 'bg-violet-50 text-violet-600',
      borderClass: 'border-violet-100 hover:border-violet-200',
    },
    {
      title: 'Demand Prediction',
      description: 'Understand expected marketplace demand',
      icon: <BarChart3 size={20} />,
      path: '/demand-prediction',
      className: 'bg-amber-50 text-amber-600',
      borderClass: 'border-amber-100 hover:border-amber-200',
    },
    {
      title: 'Listing Success',
      description: 'Review your marketplace prediction',
      icon: <Sparkles size={20} />,
      path: '/marketplace-analysis',
      className: 'bg-emerald-50 text-emerald-600',
      borderClass: 'border-emerald-100 hover:border-emerald-200',
    },
    {
      title: 'Sales Time',
      description: 'Review predicted selling time',
      icon: <Clock3 size={20} />,
      path: '/marketplace-analysis',
      className: 'bg-rose-50 text-rose-600',
      borderClass: 'border-rose-100 hover:border-rose-200',
    },
    {
      title: 'Market Trend',
      description: 'See increasing, Stable or decreasing trends',
      icon: <TrendingUp size={20} />,
      path: '/marketplace-analysis',
      className: 'bg-cyan-50 text-cyan-600',
      borderClass: 'border-cyan-100 hover:border-cyan-200',
    },
  ];

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-sky-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              AI Marketplace Intelligence
            </h2>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Open each AI module to review the latest prediction for your textile data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/marketplace-analysis')}
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          View all
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => navigate(item.path)}
            className={`rounded-2xl border bg-white/90 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${item.borderClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.className}`}>
                {item.icon}
              </div>
              <ArrowRight size={17} className="text-gray-400" />
            </div>

            <h3 className="font-semibold text-gray-900 mt-4">
              {item.title}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {item.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default AIIntelligenceCards;

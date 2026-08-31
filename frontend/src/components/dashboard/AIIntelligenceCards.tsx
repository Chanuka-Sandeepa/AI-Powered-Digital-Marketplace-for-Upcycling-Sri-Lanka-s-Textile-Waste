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
    },
    {
      title: 'Buyer Recommendation',
      description: 'Find the most suitable buyer category',
      icon: <Users size={20} />,
      path: '/buyer-recommendation',
      className: 'bg-violet-50 text-violet-600',
    },
    {
      title: 'Demand Prediction',
      description: 'Understand expected marketplace demand',
      icon: <BarChart3 size={20} />,
      path: '/demand-prediction',
      className: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Listing Success',
      description: 'Review your marketplace prediction',
      icon: <Sparkles size={20} />,
      path: '/marketplace-analysis',
      className: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Sales Time',
      description: 'Review predicted selling time',
      icon: <Clock3 size={20} />,
      path: '/marketplace-analysis',
      className: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'Market Trend',
      description: 'See increasing, stable or decreasing trends',
      icon: <TrendingUp size={20} />,
      path: '/marketplace-analysis',
      className: 'bg-cyan-50 text-cyan-600',
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
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
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

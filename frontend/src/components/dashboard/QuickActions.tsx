import {
  ArrowRight,
  History,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Upload Textile Waste',
      description: 'Start a new textile analysis',
      icon: <Upload size={19} />,
      path: '/upload-textile-waste',
      primary: true,
    },
    {
      title: 'AI Marketplace Analysis',
      description: 'View all marketplace predictions',
      icon: <Sparkles size={19} />,
      path: '/marketplace-analysis',
      primary: false,
    },
    {
      title: 'Analysis History',
      description: 'Review previous AI analyses',
      icon: <History size={19} />,
      path: '/analysis-history',
      primary: false,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your textile inventory and AI insights
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.path)}
            className={`w-full p-4 rounded-xl text-left flex items-center justify-between gap-3 transition-colors ${
              action.primary
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'border border-gray-200 text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <span>{action.icon}</span>
              <span>
                <span className="block font-medium">{action.title}</span>
                <span
                  className={`block text-xs mt-0.5 ${
                    action.primary ? 'text-sky-100' : 'text-gray-500'
                  }`}
                >
                  {action.description}
                </span>
              </span>
            </span>

            <ArrowRight size={17} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

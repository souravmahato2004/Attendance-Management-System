const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend, 
  subtitle,
}) => {
  const colorClasses = {
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      accent: 'bg-blue-500'
    },
    green: {
      border: 'border-green-500',
      bg: 'bg-green-50',
      icon: 'text-green-600',
      accent: 'bg-green-500'
    },
    red: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      icon: 'text-red-600',
      accent: 'bg-red-500'
    },
    yellow: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      accent: 'bg-yellow-500'
    },
    purple: {
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      accent: 'bg-purple-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <div 
      className={`stat-card ${colors.border} ${colors.bg} animate-fade-in hover:scale-105 transform transition-all duration-300 rounded-full shadow-lg`}
    >
      <div className="flex items-center justify-between ml-1 mr-3 my-1">
        <div className="relative left-12 mt-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-1 mb-1">
              <p className={`text-sm flex items-center ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="mr-1">
                  {trend.positive ? '↗️' : '↘️'}
                </span>
                {trend.value}% {trend.period || 'from last period'}
              </p>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${colors.bg} shadow-lg`}>
          <Icon className={`h-8 w-8 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;

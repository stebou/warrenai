'use client';

export default function KPICards() {
  const kpis = [
    {
      title: "Total Balance",
      value: "€127,485.50",
      change: "+12.5%",
      trend: "up"
    },
    {
      title: "Daily P&L",
      value: "€2,340.75",
      change: "+8.2%",
      trend: "up"
    },
    {
      title: "Active Bots",
      value: "12",
      change: "+2",
      trend: "up"
    },
    {
      title: "Success Rate",
      value: "89.4%",
      change: "+2.1%",
      trend: "up"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="backdrop-blur-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-white/20 p-6 rounded-3xl shadow-2xl hover:shadow-3xl hover:bg-white/10 transition-all duration-500 group"
        >
          {/* Effet de brillance glassmorphique */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
            <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm border ${
              kpi.trend === 'up' 
                ? 'bg-primary/10 text-primary border-primary/30' 
                : 'bg-secondary/10 text-secondary border-secondary/30'
            }`}>
              {kpi.change}
            </span>
          </div>
          
          <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}
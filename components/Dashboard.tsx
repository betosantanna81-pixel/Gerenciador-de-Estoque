import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import StatsCard from './StatsCard';
import { InventoryItem } from '../types';

interface DashboardProps {
  items: InventoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  // Calculate KPI Stats
  const stats = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0; // Value of current inventory

    items.forEach(item => {
      // If entryDate is present, it's an entry (add to stock)
      // If exitDate is present and entryDate is empty, it's an exit (subtract from stock)
      const isEntry = !!item.entryDate;
      const isExit = !!item.exitDate && !item.entryDate;

      if (isEntry) {
        totalStock += item.quantity;
        totalValue += (item.quantity * item.unitCost);
      } else if (isExit) {
        totalStock -= item.quantity;
        totalValue -= (item.quantity * item.unitCost);
      }
    });

    return { totalStock, totalValue };
  }, [items]);

  // Prepare Data for Charts
  
  // Chart 1: Accumulated Balance (Simulated monthly trend)
  const lineData = useMemo(() => {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out'];
    // Mocking logic to distribute items across months for visualization since we only have dates
    return months.map((month, index) => {
      const val = Math.floor(stats.totalStock * ((index + 1) / 12) + (Math.random() * 50));
      return { name: month, value: Math.max(0, val) }; // Ensure no negative stock in simulation
    });
  }, [stats.totalStock]);

  // Chart 2: Product Stock (Top 5 products)
  const barData = useMemo(() => {
    const grouped: Record<string, number> = {};
    items.forEach(item => {
      const isEntry = !!item.entryDate;
      const isExit = !!item.exitDate && !item.entryDate;
      const multiplier = isEntry ? 1 : (isExit ? -1 : 0);
      
      grouped[item.productName] = (grouped[item.productName] || 0) + (item.quantity * multiplier);
    });
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // Top 7
  }, [items]);

  const COLORS = ['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac'];

  return (
    <div className="p-8 bg-green-50/50 min-h-screen">
      <h2 className="text-3xl font-bold text-green-900 mb-8 text-center drop-shadow-sm">
        Planilha de Controle de Estoque
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total em Estoque" value={stats.totalStock.toLocaleString()} />
        <StatsCard title="Valor do Estoque" value={stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} isCurrency />
        {/* Placeholders for removed financial metrics or future use */}
        <StatsCard title="Produtos Ativos" value={barData.length.toString()} />
        <StatsCard title="Movimentações" value={items.length.toString()} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-green-900 rounded-2xl p-6 shadow-xl text-white">
          <h3 className="text-xl font-bold mb-4 text-center">Evolução do Saldo</h3>
          <div className="h-full w-full pb-8">
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#166534" vertical={false} />
                <XAxis dataKey="name" stroke="#a7f3d0" tick={{ fill: '#a7f3d0' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', color: '#064e3b' }}
                  itemStyle={{ color: '#064e3b', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#fff" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#3f2e18', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-green-900 rounded-2xl p-6 shadow-xl text-white flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-center">Saldo por Produto</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={barData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: '#fff', fontSize: 12, fontWeight: 500 }} 
                  width={100}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ color: '#000' }}/>
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
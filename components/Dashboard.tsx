
import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import StatsCard from './StatsCard';
import { InventoryItem } from '../types';
import { Filter } from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const [timeRange, setTimeRange] = useState('30'); // Default 30 days

  // Calculate KPI Stats
  const stats = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0; // Value of current inventory

    items.forEach(item => {
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

  // Chart 1: Accumulated Balance (Real Evolution based on dates)
  const lineData = useMemo(() => {
    // 1. Flatten all movements into a timeline array
    const movements = items
      .filter(i => i.entryDate || i.exitDate)
      .map(i => {
        const isEntry = !!i.entryDate;
        // Use entry date or exit date. Parse correctly assuming YYYY-MM-DD string
        const dateStr = isEntry ? i.entryDate : i.exitDate;
        return {
          date: new Date(dateStr).getTime(),
          change: isEntry ? i.quantity : -i.quantity,
          type: isEntry ? 'entry' : 'exit'
        };
      })
      .sort((a, b) => a.date - b.date); // Sort chronological

    // 2. Determine cutoff timestamp based on filter
    const now = new Date();
    // Set to end of today
    now.setHours(23, 59, 59, 999);
    
    let startTimestamp = 0;
    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(now.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      startTimestamp = startDate.getTime();
    }

    // 3. Calculate running balance
    let currentBalance = 0;
    const chartPoints: { name: string; value: number; timestamp: number }[] = [];

    // Calculate initial balance before the start date
    movements.forEach(move => {
      if (move.date < startTimestamp) {
        currentBalance += move.change;
      }
    });

    // Add initial point at the start of the range
    chartPoints.push({
      name: new Date(startTimestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: Math.max(0, currentBalance),
      timestamp: startTimestamp
    });

    // Process movements within range
    movements.forEach(move => {
      if (move.date >= startTimestamp) {
        currentBalance += move.change;
        chartPoints.push({
          name: new Date(move.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: Math.max(0, currentBalance),
          timestamp: move.date
        });
      }
    });

    // If no movements in range but we have previous balance, ensure line is drawn to today
    if (chartPoints.length === 1 && timeRange !== 'all') {
       chartPoints.push({
          name: 'Hoje',
          value: Math.max(0, currentBalance),
          timestamp: now.getTime()
       });
    }

    return chartPoints;
  }, [items, timeRange]);

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

  // Shades of Yellow/Gold for "Saldo por Produto"
  const COLORS = ['#713f12', '#854d0e', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fef08a'];

  return (
    <div className="p-8 bg-green-50/50 min-h-screen">
      <h2 className="text-3xl font-bold text-green-900 mb-8 text-center drop-shadow-sm">
        Planilha de Controle de Estoque
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard title="Total em Estoque" value={stats.totalStock.toLocaleString()} />
        <StatsCard title="Valor do Estoque" value={stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} isCurrency />
        <StatsCard title="Produtos Ativos" value={barData.length.toString()} />
        <StatsCard title="Movimentações" value={items.length.toString()} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-green-900 rounded-2xl p-6 shadow-xl text-white relative">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-bold">Evolução do Saldo</h3>
             <div className="flex items-center gap-2">
               <Filter size={16} className="text-green-300" />
               <select 
                 value={timeRange} 
                 onChange={(e) => setTimeRange(e.target.value)}
                 className="bg-green-800 text-white text-xs border border-green-700 rounded p-1 outline-none focus:ring-1 focus:ring-green-400"
               >
                 <option value="7">7 Dias</option>
                 <option value="30">30 Dias</option>
                 <option value="90">3 Meses</option>
                 <option value="180">6 Meses</option>
                 <option value="365">1 Ano</option>
                 <option value="all">Todo o Período</option>
               </select>
             </div>
          </div>
          
          <div className="h-full w-full pb-8">
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#166534" vertical={false} />
                <XAxis dataKey="name" stroke="#a7f3d0" tick={{ fill: '#a7f3d0' }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', color: '#064e3b' }}
                  itemStyle={{ color: '#064e3b', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${value.toLocaleString()} Kg`, 'Saldo']}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="value" 
                  stroke="#fff" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#facc15' }}
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

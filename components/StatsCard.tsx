import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  isCurrency?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, isCurrency = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col border-l-8 border-green-900 min-w-[200px] relative overflow-hidden group hover:scale-105 transition-transform duration-300">
      <div className="absolute right-0 top-0 w-16 h-16 bg-green-50 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:bg-green-100 transition-colors"></div>
      <span className="text-green-900 font-bold text-sm uppercase z-10">{title}</span>
      <span className="text-gray-800 font-black text-2xl mt-1 z-10 tracking-tight">
        {isCurrency ? 'R$ ' : ''}{value}
      </span>
    </div>
  );
};

export default StatsCard;
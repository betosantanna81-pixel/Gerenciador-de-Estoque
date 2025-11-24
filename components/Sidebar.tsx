
import React, { useState, useRef } from 'react';
import { LayoutDashboard, List, Settings, ChevronDown, ChevronRight, FolderPlus, DownloadCloud, UploadCloud } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onExport, onImport }) => {
  const [openEstoque, setOpenEstoque] = useState(true);
  const [openCadastros, setOpenCadastros] = useState(false);
  const [openOutros, setOpenOutros] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to determine if a parent section should be highlighted
  const isEstoqueActive = currentView === 'entry' || currentView === 'list' || currentView === 'stock';
  const isCadastrosActive = ['suppliers', 'clients', 'products', 'operations'].includes(currentView);
  const isOutrosActive = ['analysis', 'processes', 'production_orders'].includes(currentView);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const MenuItem = ({ id, icon: Icon, label, active, onClick, disabled, isSubItem = false }: any) => {
    // The visual style from the image:
    // Active items have a white background that extends to the right, rounded on the left.
    // Inactive items are simple text/icons on the dark background.
    
    const baseClasses = "flex items-center gap-4 w-full transition-all duration-300 relative group";
    
    // For active items (White tab style)
    if (active) {
      return (
        <button onClick={disabled ? undefined : onClick} className={`${baseClasses} pl-6 py-4`}>
          {/* The white background container matching the body color */}
          <div className="absolute right-0 top-0 bottom-0 left-6 bg-gray-50 rounded-l-[30px] z-0" />
          
          {/* Icon and Text */}
          <div className="relative z-10 flex items-center gap-4 text-emerald-900 font-bold tracking-wide text-sm uppercase">
             <Icon size={20} strokeWidth={2.5} />
             <span>{label}</span>
          </div>
        </button>
      );
    }

    // For inactive items
    return (
      <button 
        onClick={disabled ? undefined : onClick} 
        className={`${baseClasses} px-8 py-4 text-emerald-100/70 hover:text-white ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
         <Icon size={20} />
         <span className="font-medium text-sm tracking-wide uppercase">{label}</span>
      </button>
    );
  };

  const SubMenuItem = ({ label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`w-full text-left py-3 pl-16 pr-4 text-xs font-bold uppercase tracking-wider transition-all relative
        ${active 
          ? 'text-white' 
          : 'text-emerald-100/50 hover:text-emerald-100'
        }
      `}
    >
      {active && <div className="absolute left-12 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-400 rounded-full"></div>}
      {label}
    </button>
  );

  return (
    <div className="w-64 bg-emerald-900 h-screen flex flex-col fixed left-0 top-0 z-20 shadow-2xl font-sans overflow-y-auto scrollbar-hide">
      
      {/* Logo Section */}
      <div className="flex flex-col items-center justify-center pt-10 pb-8">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
           <path d="M50 95 C 20 70 10 50 10 50 C 10 50 30 55 50 70 C 70 55 90 50 90 50 C 90 50 80 70 50 95 Z" fill="#4ade80" />
           <path d="M50 70 C 25 55 15 35 15 35 C 15 35 35 40 50 55 C 65 40 85 35 85 35 C 85 35 75 55 50 70 Z" fill="#22c55e" />
           <path d="M50 50 C 30 35 25 20 25 20 C 25 20 40 25 50 35 C 60 25 75 20 75 20 C 75 20 70 35 50 50 Z" fill="#15803d" />
           <circle cx="50" cy="15" r="5" fill="#15803d" />
        </svg>
        <h2 className="text-white font-bold tracking-widest text-2xl uppercase font-sans">TERRA AGRO</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full space-y-1">
        
        <MenuItem 
          id="dashboard" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => setView('dashboard')} 
        />

        {/* Accordion Group: Estoque */}
        <div className="relative">
             <button 
                onClick={() => setOpenEstoque(!openEstoque)}
                className={`flex items-center justify-between w-full px-8 py-4 text-emerald-100/70 hover:text-white transition-colors uppercase text-sm font-medium
                    ${isEstoqueActive && !openEstoque ? 'text-white font-bold' : ''}
                `}
             >
                <div className="flex items-center gap-4">
                    <List size={20} />
                    <span>Estoque</span>
                </div>
                {openEstoque ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
             </button>

             <div className={`overflow-hidden transition-all duration-300 ${openEstoque ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                <SubMenuItem label="Estoque Atual" active={currentView === 'stock'} onClick={() => setView('stock')} />
                <SubMenuItem label="Movimentação" active={currentView === 'entry'} onClick={() => setView('entry')} />
                <SubMenuItem label="Entrada/Saída" active={currentView === 'list'} onClick={() => setView('list')} />
             </div>
        </div>

        {/* Accordion Group: Cadastros */}
        <div className="relative">
             <button 
                onClick={() => setOpenCadastros(!openCadastros)}
                className={`flex items-center justify-between w-full px-8 py-4 text-emerald-100/70 hover:text-white transition-colors uppercase text-sm font-medium
                    ${isCadastrosActive && !openCadastros ? 'text-white font-bold' : ''}
                `}
             >
                <div className="flex items-center gap-4">
                    <FolderPlus size={20} />
                    <span>Cadastros</span>
                </div>
                {openCadastros ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
             </button>

             <div className={`overflow-hidden transition-all duration-300 ${openCadastros ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                <SubMenuItem label="Fornecedores" active={currentView === 'suppliers'} onClick={() => setView('suppliers')} />
                <SubMenuItem label="Clientes" active={currentView === 'clients'} onClick={() => setView('clients')} />
                <SubMenuItem label="Produtos" active={currentView === 'products'} onClick={() => setView('products')} />
                <SubMenuItem label="Operações" active={currentView === 'operations'} onClick={() => setView('operations')} />
             </div>
        </div>

        {/* Accordion Group: Outros */}
        <div className="relative">
             <button 
                onClick={() => setOpenOutros(!openOutros)}
                className={`flex items-center justify-between w-full px-8 py-4 text-emerald-100/70 hover:text-white transition-colors uppercase text-sm font-medium
                    ${isOutrosActive && !openOutros ? 'text-white font-bold' : ''}
                `}
             >
                <div className="flex items-center gap-4">
                    <Settings size={20} />
                    <span>Outros</span>
                </div>
                {openOutros ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
             </button>

             <div className={`overflow-hidden transition-all duration-300 ${openOutros ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <SubMenuItem label="Análises" active={currentView === 'analysis'} onClick={() => setView('analysis')} />
                <SubMenuItem label="Novo Processo" active={currentView === 'processes'} onClick={() => setView('processes')} />
                <SubMenuItem label="Ordens de Produção" active={currentView === 'production_orders'} onClick={() => setView('production_orders')} />
             </div>
        </div>

      </nav>
      
      {/* Import/Export Actions */}
      <div className="p-4 border-t border-emerald-800 space-y-3">
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onImport} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
         />
         <button 
            onClick={handleImportClick}
            className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 py-3 rounded-xl transition-all shadow-lg font-bold uppercase text-xs tracking-wider border border-emerald-700"
         >
            <UploadCloud size={18} />
            Importar Dados
         </button>
         <button 
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl transition-all shadow-lg font-bold uppercase text-xs tracking-wider"
         >
            <DownloadCloud size={18} />
            Exportar
         </button>
      </div>

    </div>
  );
};

export default Sidebar;

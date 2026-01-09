import React from 'react';
import { BackgroundType, PipeShape, NodeType } from '../types';
import { Square, CircleDot, Trash2 } from 'lucide-react';
import { DragDescriptor } from '../App';

interface EditorPaletteProps {
  activeType: BackgroundType;
  setActiveType: (t: BackgroundType) => void;
  onClear: () => void;
  onFill: () => void;
  setDraggingDescriptor: (d: DragDescriptor | null) => void;
}

export const EditorPalette: React.FC<EditorPaletteProps> = ({ 
  activeType, setActiveType, onClear, onFill, setDraggingDescriptor 
}) => {
  
  const shapes = [
    { label: 'Straight (I)', value: PipeShape.STRAIGHT, icon: <div className="w-1 h-5 bg-current" /> },
    { label: 'Corner (L)', value: PipeShape.CORNER, icon: <div className="w-4 h-4 border-t-4 border-r-4 border-current rounded-tr" /> },
    { label: 'Dead End', value: NodeType.DEAD_END, icon: <CircleDot size={16} /> },
    { label: 'Goal A (Src)', value: NodeType.SOURCE, icon: <Square size={16} fill="currentColor" /> },
    { label: 'Goal B (Sink)', value: NodeType.SINK, icon: <Square size={16} strokeWidth={2} /> },
    { label: 'Erase', value: 'ERASE', icon: <Trash2 size={16} /> },
  ];

  const types = [
    { label: 'Rotatable', value: BackgroundType.GREEN, color: 'text-cyber-green', border: 'border-cyber-green', bg: 'bg-green-900/50' },
    { label: 'Fixed', value: BackgroundType.ORANGE, color: 'text-cyber-orange', border: 'border-cyber-orange', bg: 'bg-orange-900/50' },
    { label: 'Switch', value: BackgroundType.BLUE, color: 'text-cyber-blue', border: 'border-cyber-blue', bg: 'bg-blue-900/50' },
  ];

  const handleDragStart = (e: React.DragEvent, shapeVal: any) => {
    // We pass data via dataTransfer for logic
    const desc = { shape: shapeVal, type: activeType };
    setDraggingDescriptor(desc); // Update App state for visual ghost
    e.dataTransfer.setData('application/json', JSON.stringify(desc));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggingDescriptor(null);
  };

  const getPreviewStyle = (shapeValue: any) => {
    if (shapeValue === 'ERASE') return 'text-red-500 border-red-500/50 bg-red-900/20';
    if (shapeValue === NodeType.SOURCE || shapeValue === NodeType.SINK || shapeValue === NodeType.DEAD_END) {
        return 'text-cyber-red border-cyber-red bg-red-900/20';
    }
    
    switch (activeType) {
        case BackgroundType.GREEN: return 'text-cyber-green border-cyber-green bg-green-900/20';
        case BackgroundType.ORANGE: return 'text-cyber-orange border-cyber-orange bg-orange-900/20';
        case BackgroundType.BLUE: return 'text-cyber-blue border-cyber-blue bg-blue-900/20';
        default: return 'text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-cyber-panel border-l border-zinc-800 h-full w-64 overflow-y-auto">
      <h3 className="text-cyber-blue font-mono text-lg font-bold border-b border-zinc-700 pb-2">CONSTRUCT</h3>
      
      <div className="space-y-6">
        
        {/* TYPE SELECTOR */}
        <div>
           <label className="text-xs text-zinc-500 uppercase mb-2 block font-mono">1. Material Type</label>
           <div className="grid grid-cols-1 gap-2">
            {types.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveType(item.value)}
                className={`
                  flex items-center gap-3 p-3 text-xs font-bold font-mono border rounded
                  transition-all duration-200 text-left
                  ${activeType === item.value
                    ? `bg-zinc-800 ${item.border} ${item.color} shadow-lg` 
                    : 'bg-zinc-900/50 border-zinc-700 text-zinc-500 hover:bg-zinc-800'
                  }
                `}
              >
                <div className={`w-3 h-3 rounded-full border ${item.value === activeType ? 'bg-current' : 'bg-transparent'}`}></div>
                <span>{item.label}</span>
              </button>
            ))}
           </div>
        </div>

        {/* SHAPE DRAGGABLES */}
        <div>
          <label className="text-xs text-zinc-500 uppercase mb-2 block font-mono">2. Drag to Grid</label>
          <div className="grid grid-cols-2 gap-3">
            {shapes.map((item, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, item.value)}
                onDragEnd={handleDragEnd}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 text-xs font-mono border rounded cursor-grab active:cursor-grabbing
                  transition-all duration-200 hover:brightness-125 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]
                  ${getPreviewStyle(item.value)}
                `}
              >
                {item.icon}
                <span className="font-bold">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 text-center">
             Drag pieces to board to place.<br/>Click existing pieces to rotate.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="pt-4 border-t border-zinc-800 mt-auto">
           <label className="text-xs text-zinc-500 uppercase mb-2 block font-mono">Grid Actions</label>
           <div className="flex flex-col gap-2">
             <button onClick={onFill} className="px-4 py-2 bg-zinc-800 text-white text-xs font-mono border border-zinc-600 hover:bg-zinc-700 rounded hover:text-cyber-green transition-colors">
                RANDOM FILL
             </button>
             <button onClick={onClear} className="px-4 py-2 bg-red-950/20 text-red-400 text-xs font-mono border border-red-900/30 hover:bg-red-900/40 rounded transition-colors">
                WIPE GRID
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
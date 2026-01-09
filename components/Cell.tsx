import React, { useState } from 'react';
import { BackgroundType, CellData, NodeType, PipeShape, TileCategory } from '../types';
import { DragDescriptor } from '../App';

interface CellProps {
  cell: CellData;
  onClick: () => void;
  isEditor?: boolean;
  onDrop?: (row: number, col: number, shape: any, type: any) => void;
  setDraggingDescriptor?: (d: DragDescriptor | null) => void;
  draggingDescriptor?: DragDescriptor | null;
}

export const Cell: React.FC<CellProps> = ({ 
  cell, onClick, isEditor, onDrop, setDraggingDescriptor, draggingDescriptor 
}) => {
  const { shape, background, rotation, isPowered, category, nodeType } = cell;
  const [isDragOver, setIsDragOver] = useState(false);

  // Colors
  const pipeColor = isPowered ? '#FFD700' : '#27272a'; // Gold/Yellow if powered, Zinc-800 if not
  const pipeGlow = isPowered ? 'drop-shadow(0 0 4px #eab308)' : '';
  
  // Background styles
  let bgClass = "bg-cyber-bg";
  let borderClass = "border-zinc-800";
  let showScanlines = false;

  switch (background) {
    case BackgroundType.GREEN:
      bgClass = "bg-green-900/40"; 
      borderClass = "border-green-600/50";
      showScanlines = true;
      break;
    case BackgroundType.ORANGE:
      bgClass = "bg-orange-800/40"; 
      borderClass = "border-orange-500/60";
      break;
    case BackgroundType.BLUE:
      bgClass = "bg-blue-900/40";
      borderClass = "border-cyan-400/50";
      break;
    case BackgroundType.RED:
      bgClass = "bg-red-900/40";
      borderClass = "border-red-600/50";
      break;
    case BackgroundType.NONE:
      borderClass = "border-zinc-900";
      break;
  }

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isEditor) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Prevent flickering when entering children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditor) return;
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditor || !onDrop) return;
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const parsed = JSON.parse(data);
        onDrop(cell.row, cell.col, parsed.shape, parsed.type);
      }
    } catch (err) {
      console.error("Drop failed", err);
    }
  };

  // SVG Render Helper
  const getPathForShape = (s: PipeShape) => {
    const center = 50;
    switch (s) {
      case PipeShape.STRAIGHT: return `M ${center} 0 L ${center} 100`;
      case PipeShape.CORNER: return `M ${center} 0 L ${center} ${center} L 100 ${center}`;
      case PipeShape.TEE: return `M ${center} 0 L ${center} 100 M ${center} ${center} L 100 ${center}`;
      case PipeShape.CROSS: return `M ${center} 0 L ${center} 100 M 0 ${center} L 100 ${center}`;
      default: return "";
    }
  };

  const renderPipe = (
    currentShape: PipeShape, 
    currentCategory: TileCategory, 
    currentNodeType: NodeType | undefined,
    powered: boolean,
    colorOverride?: string
  ) => {
    const stroke = 16;
    
    // Nodes
    if (currentCategory === TileCategory.NODE) {
      const isDeadEnd = currentNodeType === NodeType.DEAD_END;
      const isSource = currentNodeType === NodeType.SOURCE;
      const baseFill = colorOverride || (powered ? '#ef4444' : '#7f1d1d');

      if (isDeadEnd) {
        return <circle cx="50" cy="50" r="22" fill={baseFill} style={{filter: powered ? pipeGlow : ''}} />;
      } else {
        return (
          <g>
            <rect x="25" y="35" width="50" height="50" rx="4" fill={baseFill} style={{filter: powered ? pipeGlow : ''}} />
            <rect x="40" y="0" width="20" height="40" fill={colorOverride || (powered ? '#FFD700' : '#27272a')} />
            {!colorOverride && (
               <>
                <circle cx="35" cy="50" r="3" fill={powered ? "#fff" : "#450a0a"} />
                <circle cx="65" cy="50" r="3" fill={powered ? "#fff" : "#450a0a"} />
                <text x="50" y="65" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" opacity="0.5">{isSource ? 'A' : 'B'}</text>
               </>
            )}
          </g>
        );
      }
    }

    const pathD = getPathForShape(currentShape);
    if (!pathD) return null;

    return (
      <>
        <path 
          d={pathD} 
          stroke={colorOverride || pipeColor} 
          strokeWidth={stroke} 
          fill="none" 
          strokeLinecap="square"
          style={{ filter: powered ? pipeGlow : '' }}
        />
        {powered && !colorOverride && (
          <path d={pathD} stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="butt" className="opacity-80" />
        )}
      </>
    );
  };

  // Determine Ghost Preview Data
  let ghost = null;
  if (isDragOver && draggingDescriptor && draggingDescriptor.shape !== 'ERASE') {
      const type = draggingDescriptor.type;
      
      const isGhostNode = draggingDescriptor.shape === NodeType.SOURCE || 
                          draggingDescriptor.shape === NodeType.SINK || 
                          draggingDescriptor.shape === NodeType.DEAD_END;
      
      let ghostColor = "rgba(100, 100, 100, 0.5)"; // Fallback
      
      if (isGhostNode) {
          ghostColor = "rgba(255, 42, 42, 0.5)"; // Red for nodes
      } else {
          if (type === BackgroundType.GREEN) ghostColor = "rgba(0, 255, 65, 0.5)";
          if (type === BackgroundType.ORANGE) ghostColor = "rgba(255, 149, 0, 0.5)";
          if (type === BackgroundType.BLUE) ghostColor = "rgba(0, 204, 255, 0.5)";
      }

      const ghostCat = isGhostNode ? TileCategory.NODE : TileCategory.PIPE;
      const ghostShape = isGhostNode ? PipeShape.NONE : draggingDescriptor.shape as PipeShape;
      const ghostNode = isGhostNode ? draggingDescriptor.shape as NodeType : undefined;

      ghost = (
        <div className="absolute inset-0 pointer-events-none z-20 opacity-70">
           <svg viewBox="0 0 100 100" className="w-full h-full p-1">
              {renderPipe(ghostShape, ghostCat, ghostNode, false, ghostColor)}
           </svg>
           {/* Box Border for ghost */}
           <div className="absolute inset-0 border-2 border-dashed" style={{ borderColor: ghostColor }}></div>
        </div>
      );
  }

  // Erase Ghost
  if (isDragOver && draggingDescriptor && draggingDescriptor.shape === 'ERASE') {
      ghost = (
        <div className="absolute inset-0 pointer-events-none z-20 bg-red-900/50 flex items-center justify-center border-2 border-red-500 border-dashed">
            <div className="text-red-300 font-bold text-xs">ERASE</div>
        </div>
      );
  }

  return (
    <div 
      onClick={onClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative w-full h-full aspect-square border
        flex items-center justify-center
        cursor-pointer
        transition-all duration-100
        ${bgClass} ${borderClass}
        hover:brightness-110
      `}
    >
      {/* Background Detail for Switch */}
      {background === BackgroundType.BLUE && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
           <rect x="5" y="5" width="90" height="90" stroke="#00ccff" strokeWidth="1" fill="none" rx="8" />
        </div>
      )}
      
      {/* Background Detail for Nodes */}
      {category === TileCategory.NODE && (
         <div className="absolute inset-0 border-2 border-red-900/30 m-0.5 pointer-events-none"></div>
      )}

      {/* The Rotating Container */}
      <div 
        className="w-full h-full transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {renderPipe(shape, category, nodeType, isPowered)}
        </svg>
      </div>

      {/* Switch Indicator */}
      {background === BackgroundType.BLUE && shape !== PipeShape.NONE && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-3 h-3 rounded-full bg-cyber-blue shadow-[0_0_5px_#00ccff] animate-pulse"></div>
          </div>
      )}

      {/* GHOST PREVIEW */}
      {ghost}
      
      {/* Editor Overlay Helper */}
      {isEditor && (
        <div className="absolute top-0 left-0 text-[8px] text-gray-400 bg-black/80 p-0.5 font-mono z-10 pointer-events-none border border-zinc-700">
           {background !== BackgroundType.NONE ? background.substr(0,1) : ''}
        </div>
      )}
    </div>
  );
};
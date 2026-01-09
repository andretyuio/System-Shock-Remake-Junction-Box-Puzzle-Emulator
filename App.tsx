import React, { useState, useEffect } from 'react';
import { GRID_SIZE, DEFAULT_CELL, generateId } from './constants';
import { CellData, BackgroundType, PipeShape, TileCategory, NodeType } from './types';
import { calculatePower } from './utils/circuitLogic';
import { Cell } from './components/Cell';
import { EditorPalette } from './components/EditorPalette';
import { Settings, Play, Share2, Clipboard } from 'lucide-react';

// --- SEED UTILS ---
const encodeGrid = (grid: CellData[][]): string => {
  let seed = "";
  for(let r=0; r<GRID_SIZE; r++) {
    for(let c=0; c<GRID_SIZE; c++) {
      const cell = grid[r][c];
      
      let char = 'X'; // Default Empty

      // Determine Character based on simplified rules
      if (cell.category === TileCategory.NODE) {
        if (cell.nodeType === NodeType.SOURCE) char = 'A';
        else if (cell.nodeType === NodeType.SINK) char = 'B';
        else if (cell.nodeType === NodeType.DEAD_END) char = 'D';
      } else if (cell.background === BackgroundType.BLUE) {
         // Switch - Blue
         // S = Straight, s = Corner (implied to preserve shape)
         if (cell.shape === PipeShape.STRAIGHT) char = 'S';
         else if (cell.shape === PipeShape.CORNER) char = 's';
      } else {
         // Pipes (Green/Orange)
         // Capital = Green (Rotatable), Lower = Orange (Fixed)
         if (cell.shape === PipeShape.STRAIGHT) {
            char = cell.background === BackgroundType.GREEN ? 'I' : 'i';
         } else if (cell.shape === PipeShape.CORNER) {
            char = cell.background === BackgroundType.GREEN ? 'L' : 'l';
         }
      }

      // Rotation Mapping: 0, 9, 1, 2
      const rotIndex = (cell.rotation / 90) % 4;
      let rChar = '0';
      if (rotIndex === 1) rChar = '9'; // 90
      else if (rotIndex === 2) rChar = '1'; // 180
      else if (rotIndex === 3) rChar = '2'; // 270

      seed += `${char}${rChar}`;
    }
  }
  return seed;
};

const decodeGrid = (seed: string): CellData[][] | null => {
  // 64 cells * 2 chars = 128 chars
  if (seed.length !== GRID_SIZE * GRID_SIZE * 2) return null;

  const grid: CellData[][] = [];
  let index = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const char = seed[index];
      const rChar = seed[index+1];
      index += 2;

      const cell: CellData = {
        ...DEFAULT_CELL,
        id: generateId(r, c),
        row: r,
        col: c,
        category: TileCategory.PIPE,
        shape: PipeShape.NONE,
        background: BackgroundType.NONE,
        rotation: 0
      };

      // Decode Rotation
      if (rChar === '9') cell.rotation = 90;
      else if (rChar === '1') cell.rotation = 180;
      else if (rChar === '2') cell.rotation = 270;
      else cell.rotation = 0;

      // Decode Type
      switch (char) {
        case 'A':
          cell.category = TileCategory.NODE;
          cell.nodeType = NodeType.SOURCE;
          cell.background = BackgroundType.RED;
          break;
        case 'B':
          cell.category = TileCategory.NODE;
          cell.nodeType = NodeType.SINK;
          cell.background = BackgroundType.RED;
          break;
        case 'D':
          cell.category = TileCategory.NODE;
          cell.nodeType = NodeType.DEAD_END;
          cell.background = BackgroundType.RED;
          break;
        case 'I':
          cell.shape = PipeShape.STRAIGHT;
          cell.background = BackgroundType.GREEN;
          break;
        case 'i':
          cell.shape = PipeShape.STRAIGHT;
          cell.background = BackgroundType.ORANGE;
          break;
        case 'L':
          cell.shape = PipeShape.CORNER;
          cell.background = BackgroundType.GREEN;
          break;
        case 'l':
          cell.shape = PipeShape.CORNER;
          cell.background = BackgroundType.ORANGE;
          break;
        case 'S':
          cell.shape = PipeShape.STRAIGHT;
          cell.background = BackgroundType.BLUE;
          break;
        case 's':
          cell.shape = PipeShape.CORNER;
          cell.background = BackgroundType.BLUE;
          break;
        default:
          // 'X' or other -> Empty
          cell.background = BackgroundType.NONE;
          cell.shape = PipeShape.NONE;
          break;
      }

      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
};

const createEmptyGrid = () => {
  const grid: CellData[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push({
        ...DEFAULT_CELL,
        id: generateId(r, c),
        row: r,
        col: c,
      });
    }
    grid.push(row);
  }
  return grid;
};

export interface DragDescriptor {
  shape: PipeShape | NodeType | 'ERASE';
  type: BackgroundType;
}

export default function App() {
  const [grid, setGrid] = useState<CellData[][]>(() => {
    return createEmptyGrid();
  });
  
  // Default to EDIT mode
  const [mode, setMode] = useState<'PLAY' | 'EDIT'>('EDIT');
  
  // Editor State
  const [activeType, setActiveType] = useState<BackgroundType>(BackgroundType.GREEN);
  const [draggingDescriptor, setDraggingDescriptor] = useState<DragDescriptor | null>(null);
  
  const [isSolved, setIsSolved] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [showSeed, setShowSeed] = useState(false);

  // Sync seed input with current grid
  useEffect(() => {
    if (showSeed) {
      setSeedInput(encodeGrid(grid));
    }
  }, [grid, showSeed]);

  const handleImportSeed = () => {
    const loaded = decodeGrid(seedInput);
    if (loaded) {
      setGrid(loaded);
      const result = calculatePower(loaded);
      setIsSolved(result.solved);
      setMode('PLAY'); // Auto switch to play on load
      setShowSeed(false);
    } else {
      alert("Invalid seed format. Expected 128 characters.");
    }
  };

  const handleInteraction = (row: number, col: number) => {
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];

    // --- EDITOR MODE LOGIC (Click only rotates) ---
    if (mode === 'EDIT') {
      if (cell.background !== BackgroundType.NONE) {
        cell.rotation = (cell.rotation + 90) % 360;
      }
      
      setGrid(newGrid);
      const result = calculatePower(newGrid);
      setGrid(result.grid);
      setIsSolved(result.solved);
      return;
    }

    // --- PLAY MODE LOGIC ---
    // Ignore clicks on Fixed (Orange/Red) or Empty (None) tiles
    if (cell.background === BackgroundType.ORANGE || cell.background === BackgroundType.RED || cell.background === BackgroundType.NONE) return; 

    // Handle Rotation
    if (cell.background === BackgroundType.GREEN) {
      // Simple rotation
      cell.rotation = (cell.rotation + 90) % 360;
    } else if (cell.background === BackgroundType.BLUE) {
      // Blue Switch: Rotates neighbors
      if (cell.shape !== PipeShape.NONE) {
        cell.rotation = (cell.rotation + 90) % 360;
      }

      const neighbors = [
        { r: row - 1, c: col }, // N
        { r: row, c: col + 1 }, // E
        { r: row + 1, c: col }, // S
        { r: row, c: col - 1 }, // W
      ];

      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE) {
          const neighbor = newGrid[n.r][n.c];
          
          if (neighbor.category === TileCategory.PIPE && neighbor.shape !== PipeShape.NONE) {
             if (neighbor.background === BackgroundType.GREEN || neighbor.background === BackgroundType.ORANGE) {
               neighbor.rotation = (neighbor.rotation + 90) % 360;
             }
          }
        }
      });
    }

    // Recalculate Power Flow
    const result = calculatePower(newGrid);
    setGrid(result.grid);
    setIsSolved(result.solved);
  };

  const handleCellDrop = (row: number, col: number, shape: PipeShape | NodeType | 'ERASE', type: BackgroundType) => {
    if (mode !== 'EDIT') return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];

    if (shape === 'ERASE') {
      cell.category = TileCategory.PIPE;
      cell.shape = PipeShape.NONE;
      cell.background = BackgroundType.NONE;
      cell.nodeType = undefined;
      cell.rotation = 0;
    } else {
      // Enforce Unique Goals
      if (shape === NodeType.SOURCE || shape === NodeType.SINK) {
         for(let r=0; r<GRID_SIZE; r++) {
           for(let c=0; c<GRID_SIZE; c++) {
             if (newGrid[r][c].nodeType === shape) {
               newGrid[r][c].category = TileCategory.PIPE;
               newGrid[r][c].nodeType = undefined;
               newGrid[r][c].shape = PipeShape.NONE;
               newGrid[r][c].background = BackgroundType.NONE;
             }
           }
         }
      }

      cell.rotation = 0; // Reset rotation on new place
      
      const isNode = shape === NodeType.SOURCE || shape === NodeType.SINK || shape === NodeType.DEAD_END;
      
      if (isNode) {
        cell.category = TileCategory.NODE;
        cell.nodeType = shape as NodeType;
        cell.shape = PipeShape.NONE; 
        // Force Nodes to be RED background (Fixed)
        cell.background = BackgroundType.RED;
      } else {
        cell.category = TileCategory.PIPE;
        cell.shape = shape as PipeShape;
        cell.nodeType = undefined;
        cell.background = type;
      }
    }

    setGrid(newGrid);
    const result = calculatePower(newGrid);
    setGrid(result.grid);
    setIsSolved(result.solved);
  };

  // Initial Calculation on Mount
  useEffect(() => {
    const result = calculatePower(grid);
    setGrid(result.grid);
    setIsSolved(result.solved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetGrid = () => {
    setGrid(createEmptyGrid());
    setIsSolved(false);
  };

  const fillGrid = () => {
     const g = createEmptyGrid();
     const filled = g.map(row => row.map(cell => ({
       ...cell,
       background: BackgroundType.GREEN,
       shape: Math.random() > 0.5 ? PipeShape.STRAIGHT : PipeShape.CORNER,
       rotation: Math.floor(Math.random() * 4) * 90
     })));
     setGrid(filled);
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text font-mono flex flex-col items-center p-4 relative overflow-hidden select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-50"></div>
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-end mb-6 z-10 border-b border-zinc-800 pb-4 px-2">
        <div>
           <h1 className="text-3xl font-bold tracking-widest text-cyber-green drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
             JUNCTION BOX
           </h1>
           <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">System Interface // V.1.1.0</p>
        </div>

        <div className="flex gap-4">
          <button 
             onClick={() => setShowSeed(!showSeed)}
             className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded font-bold transition-all text-sm text-zinc-400 hover:text-white"
          >
            <Share2 size={16} />
            SEED
          </button>

          <button 
             onClick={() => setMode(mode === 'PLAY' ? 'EDIT' : 'PLAY')}
             className={`
               flex items-center gap-2 px-4 py-2 border rounded font-bold transition-all text-sm
               ${mode === 'EDIT' 
                 ? 'border-cyber-orange text-cyber-orange bg-orange-950/30 shadow-[0_0_15px_rgba(255,149,0,0.2)]' 
                 : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
               }
             `}
          >
            {mode === 'PLAY' ? <Settings size={16} /> : <Play size={16} />}
            {mode === 'PLAY' ? 'BUILDER MODE' : 'PLAY PUZZLE'}
          </button>
        </div>
      </header>

      {/* Seed Dialog */}
      {showSeed && (
        <div className="w-full max-w-xl z-20 mb-4 bg-zinc-900 border border-zinc-700 p-4 rounded shadow-2xl">
           <label className="text-xs text-zinc-500 uppercase block mb-2">Level Code (Seed)</label>
           <div className="flex gap-2">
             <input 
               type="text" 
               value={seedInput} 
               onChange={(e) => setSeedInput(e.target.value)}
               className="flex-1 bg-black border border-zinc-700 p-2 text-xs font-mono text-green-400 focus:outline-none focus:border-green-500"
             />
             <button onClick={handleImportSeed} className="px-4 py-2 bg-zinc-800 border border-zinc-600 text-xs text-white hover:bg-zinc-700">LOAD</button>
             <button onClick={() => {navigator.clipboard.writeText(seedInput)}} className="px-3 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700">
               <Clipboard size={14} className="text-white"/>
             </button>
           </div>
           <p className="text-[10px] text-zinc-600 mt-2">
             Format: 2 chars/cell. Type [I,i,L,l,S,s,A,B,D] + Rot [0,9,1,2]. 
             (Cap=Green, Low=Orange). 0=0°, 9=90°, 1=180°, 2=270°.
           </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 z-10 items-start">
        
        {/* Main Grid Area */}
        <div className="relative p-1 bg-zinc-900 rounded-sm border border-zinc-700 shadow-2xl">
          
          {/* Status Overlay */}
          <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
             <div className={`
               px-8 py-1 border-t border-l border-r rounded-t-lg font-bold tracking-wider text-sm
               transition-all duration-500
               ${isSolved 
                 ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue shadow-[0_0_20px_rgba(0,204,255,0.4)]' 
                 : 'bg-zinc-800 border-zinc-600 text-zinc-500'
               }
             `}>
               {isSolved ? 'CIRCUIT COMPLETE' : 'POWER OFFLINE'}
             </div>
          </div>

          <div 
            className="grid grid-cols-8 gap-px bg-zinc-950 p-px border border-zinc-800"
            style={{ width: 'min(80vw, 550px)', height: 'min(80vw, 550px)' }}
          >
            {grid.map((row, rIndex) => (
              <React.Fragment key={`row-${rIndex}`}>
                {row.map((cell, cIndex) => (
                  <Cell 
                    key={cell.id} 
                    cell={cell} 
                    onClick={() => handleInteraction(rIndex, cIndex)}
                    isEditor={mode === 'EDIT'}
                    onDrop={handleCellDrop}
                    setDraggingDescriptor={setDraggingDescriptor}
                    draggingDescriptor={draggingDescriptor}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
          
          {/* Grid Corner Decor */}
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyber-green/50"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyber-green/50"></div>
        </div>

        {/* Editor Sidebar */}
        {mode === 'EDIT' && (
          <div className="h-[min(80vw,550px)]">
             <EditorPalette 
               activeType={activeType}
               setActiveType={setActiveType}
               onClear={resetGrid}
               onFill={fillGrid}
               setDraggingDescriptor={setDraggingDescriptor}
             />
          </div>
        )}
      </div>

      {/* Instructions / Legend */}
      {mode === 'PLAY' && (
        <div className="mt-8 max-w-2xl text-center z-10 px-4">
          <p className="text-zinc-400 text-sm mb-4 font-light">
             Route power from <span className="text-red-500 font-bold">NODE A</span> to <span className="text-red-500 font-bold">NODE B</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-500 uppercase tracking-wide">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 border border-cyber-green/50"></div> 
              <span>Rotate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-600 border border-cyber-orange/50"></div> 
              <span>Fixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 border border-cyber-blue/50 flex items-center justify-center">
                <div className="w-1 h-1 bg-cyber-blue rounded-full"></div>
              </div> 
              <span>Switch</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
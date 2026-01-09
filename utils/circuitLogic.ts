import { CellData, Direction, PipeShape, TileCategory, NodeType } from '../types';
import { GRID_SIZE } from '../constants';

// Helper: Get connections for a specific shape at a specific rotation
// Returns [North, East, South, West] booleans
export const getConnections = (shape: PipeShape, rotation: number, category: TileCategory, nodeType?: NodeType): boolean[] => {
  if (category === TileCategory.BLOCKER || (category === TileCategory.NODE && nodeType === NodeType.DEAD_END)) {
    return [false, false, false, false];
  }
  
  // Base connections for rotation 0
  let base: boolean[] = [false, false, false, false]; 

  if (category === TileCategory.NODE) {
    if (nodeType === NodeType.SOURCE || nodeType === NodeType.SINK) {
       // Directional Port. Default North (0) for Rot 0.
       base = [true, false, false, false];
    }
  } else {
    // Pipes
    switch (shape) {
      case PipeShape.STRAIGHT: // N-S
        base = [true, false, true, false];
        break;
      case PipeShape.CORNER: // N-E
        base = [true, true, false, false];
        break;
      case PipeShape.TEE: // N-E-W
        base = [true, true, false, true];
        break;
      case PipeShape.CROSS: // N-E-S-W
        base = [true, true, true, true];
        break;
      default:
        base = [false, false, false, false];
    }
  }

  // Rotate the connections
  // rotation is 0, 90, 180, 270. 
  // 90 deg rotation shifts array right: [N, E, S, W] -> [W, N, E, S] 
  // Wait, shifting right:
  // Old N (0) moves to E (1).
  // Old E (1) moves to S (2).
  // So NewIndex = (OldIndex + steps) % 4.
  
  const rotated = [false, false, false, false];
  const steps = (rotation / 90) % 4;

  for (let i = 0; i < 4; i++) {
    if (base[i]) {
      rotated[(i + steps) % 4] = true;
    }
  }

  return rotated;
};

// Check if two cells are connected
export const areConnected = (from: CellData, to: CellData, directionFromTo: Direction): boolean => {
  const fromConns = getConnections(from.shape, from.rotation, from.category, from.nodeType);
  const toConns = getConnections(to.shape, to.rotation, to.category, to.nodeType);

  // Direction is 0:N, 1:E, 2:S, 3:W
  // If moving North (0), we need 'North' on From and 'South' (2) on To.
  const oppositeDir = (directionFromTo + 2) % 4;

  return fromConns[directionFromTo] && toConns[oppositeDir];
};

export const calculatePower = (grid: CellData[][]): { grid: CellData[][], solved: boolean } => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isPowered: false, powerLevel: 0 })));
  const queue: { r: number, c: number, level: number }[] = [];

  // 1. Find Sources
  let sourcesCount = 0;
  let sinksCount = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid[r][c].category === TileCategory.NODE) {
        if (newGrid[r][c].nodeType === NodeType.SOURCE) {
          // Check if the source is powered (it always is, it's a source)
          // But technically in these puzzles, sources inject power.
          newGrid[r][c].isPowered = true;
          queue.push({ r, c, level: 0 });
          sourcesCount++;
        }
        if (newGrid[r][c].nodeType === NodeType.SINK) {
          sinksCount++;
        }
      }
    }
  }

  // 2. BFS
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.r},${current.c}`;
    
    if (visited.has(key)) continue;
    visited.add(key);

    const currCell = newGrid[current.r][current.c];

    // Check neighbors
    const directions = [
      { r: -1, c: 0, dir: Direction.NORTH },
      { r: 0, c: 1, dir: Direction.EAST },
      { r: 1, c: 0, dir: Direction.SOUTH },
      { r: 0, c: -1, dir: Direction.WEST },
    ];

    for (const d of directions) {
      const nr = current.r + d.r;
      const nc = current.c + d.c;

      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        const nextCell = newGrid[nr][nc];
        
        // Check if physically connected
        if (areConnected(currCell, nextCell, d.dir)) {
          // If connected, power it
          if (!nextCell.isPowered) {
            nextCell.isPowered = true;
            nextCell.powerLevel = current.level + 1;
            queue.push({ r: nr, c: nc, level: current.level + 1 });
          }
        }
      }
    }
  }

  // 3. Check Solved Condition
  // All sinks must be powered.
  let poweredSinks = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = newGrid[r][c];
      if (cell.category === TileCategory.NODE && cell.nodeType === NodeType.SINK && cell.isPowered) {
        poweredSinks++;
      }
    }
  }

  const solved = sinksCount > 0 && poweredSinks === sinksCount;

  return { grid: newGrid, solved };
};
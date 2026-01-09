export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

export enum TileCategory {
  PIPE = 'PIPE',
  NODE = 'NODE', // Start/End points
  BLOCKER = 'BLOCKER', // Dead end
}

export enum PipeShape {
  STRAIGHT = 'STRAIGHT', // I
  CORNER = 'CORNER',     // L
  CROSS = 'CROSS',       // + (For switches usually, or complex puzzles)
  TEE = 'TEE',           // T
  NONE = 'NONE'
}

export enum NodeType {
  SOURCE = 'SOURCE', // Power Start (Square Red)
  SINK = 'SINK',     // Power Goal (Square Red)
  DEAD_END = 'DEAD_END' // Rounded Red
}

export enum BackgroundType {
  GREEN = 'GREEN',   // Rotatable
  ORANGE = 'ORANGE', // Fixed
  BLUE = 'BLUE',     // Switch (Rotates neighbors)
  RED = 'RED',       // Nodes (Fixed)
  NONE = 'NONE'      // Empty void
}

export interface CellData {
  id: string;
  row: number;
  col: number;
  category: TileCategory;
  shape: PipeShape;       // Visual shape of the pipe
  nodeType?: NodeType;    // If it's a node
  background: BackgroundType;
  rotation: number;       // 0, 90, 180, 270
  isPowered: boolean;
  powerLevel?: number;    // Distance from source (for gradient effects)
}

export interface GridState {
  cells: CellData[][];
  rows: number;
  cols: number;
  solved: boolean;
}
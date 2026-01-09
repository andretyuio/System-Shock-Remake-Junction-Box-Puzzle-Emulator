import { CellData, TileCategory, BackgroundType, PipeShape, NodeType } from './types';

export const GRID_SIZE = 8;

export const DEFAULT_CELL: CellData = {
  id: 'default',
  row: 0,
  col: 0,
  category: TileCategory.PIPE,
  shape: PipeShape.NONE,
  background: BackgroundType.NONE,
  rotation: 0,
  isPowered: false,
};

// Helper to generate a unique ID
export const generateId = (r: number, c: number) => `cell-${r}-${c}`;

export const PRESET_PUZZLE: Partial<CellData>[] = [
  // A simple preset to load initially
];

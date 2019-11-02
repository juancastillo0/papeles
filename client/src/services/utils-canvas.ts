import paper from "paper";

export type ExtendedTool = paper.Tool & {
  onActivate: () => any;
  isActive: () => boolean;
  onDeactivate: () => any;
};
export const SELECTED_COLOR = new paper.Color("rgb(0,150,250)");
export const RECT_COLOR = new paper.Color("#ccc");

export enum TOOLS_TYPES {
  "select" = "select",
  "move" = "move",
  "erase" = "erase",
  "draw" = "draw"
}
export const ALL_TOOLS_TYPES = Object.keys(TOOLS_TYPES) as TOOLS_TYPES[];

export type SavedPath = { x: number[]; y: number[]; t: number[] };
export const cursors = {
  [TOOLS_TYPES.draw]: "url('assets/5_objects.png') 6 5, auto",
  [TOOLS_TYPES.erase]: "url('assets/eraser-black-sm.png') 3 22, auto",
  [TOOLS_TYPES.move]: "move",
  [TOOLS_TYPES.select]: "default"
};

export function itemBushFromPath(path: paper.Item) {
  const { x, y, height, width } = path.internalBounds;
  const bushItem = {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height,
    path: path,
    id: path.id
  };
  return bushItem;
}
export type BushItem = ReturnType<typeof itemBushFromPath>;

export const DEFAULT_STROKE_COLOR = new paper.Color("black");

export const DEFAUTL_PATH_OPTIONS = {
  strokeColor: DEFAULT_STROKE_COLOR,
  strokeWidth: 1.5,
  strokeCap: "round",
  strokeJoin: "round"
};

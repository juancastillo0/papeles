import {
  BushItem,
  TOOLS_TYPES,
  itemBushFromPath,
  SavedPath,
  ExtendedTool
} from "./utils-canvas";
import paper from "paper";
import RBush from "rbush";
import { getAllTools } from "./utils-tools";
import { observable, action } from "mobx";

type PathAction = {};

type HandlerFunction = () => {
  onMouseDown?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onMouseDrag: (event: any) => void;
  onMouseUp: (event: any) => void;
  onMouseMove?: (event: any) => void;
};

export type BushItemId = BushItem & { id: number };
export class CanvasModel {
  scope = new paper.PaperScope();
  @observable canvas = document.createElement("canvas");
  bush = new RBush<BushItemId>();
  @observable currentTool: TOOLS_TYPES = TOOLS_TYPES.draw;
  tools: { [k in keyof typeof TOOLS_TYPES]: ExtendedTool } | undefined;
  getPenHandlers: HandlerFunction | undefined;
  getDrawHandlers: HandlerFunction | undefined;

  history: PathAction[] = [];
  historyPosition: number = 0;

  constructor(public name: string, withPen: boolean, public id?: string) {
    this.canvas.className = "canvas";
    this.canvas.style.width = "1000px";
    this.canvas.style.height = "1000px";
    this.canvas.width = 1000;
    this.canvas.height = 1000;
  }

  initialize(canvasScroll: HTMLDivElement, withPen: boolean) {
    while (canvasScroll.firstChild) {
      canvasScroll.removeChild(canvasScroll.firstChild);
    }
    canvasScroll.appendChild(this.canvas);

    if (this.tools === undefined) {
      this.scope.setup(this.canvas);
    
      const toolsData = getAllTools(this);

      this.tools = toolsData.tools;
      this.getPenHandlers = toolsData.getPenHandlers;
      this.getDrawHandlers = toolsData.getDrawHandlers;
      if (withPen) {
        this.usePen(withPen);
      }
    }
    this.scope.activate();
  }

  @action.bound activateTool(toolName: TOOLS_TYPES) {
    this.tools![toolName].activate();
    this.currentTool = toolName;
  }

  @action.bound usePen(withPen: boolean) {
    if (!this.getPenHandlers || !this.tools || !this.getDrawHandlers) return;
    if (withPen) {
      const penHandlers = this.getPenHandlers();
      const penTool = this.tools[TOOLS_TYPES.draw];
      penTool.onMouseDown = () => {};
      penTool.onMouseDrag = penHandlers.onMouseDrag;
      penTool.onMouseUp = penHandlers.onMouseUp;
      penTool.onMouseMove = penHandlers.onMouseMove!;
      penTool.onActivate = () => {
        this.canvas.addEventListener("pointerdown", penHandlers.onPointerDown!);
      };
      penTool.onDeactivate = () => {
        this.canvas.removeEventListener(
          "pointerdown",
          penHandlers.onPointerDown!
        );
      };
      penTool.activate();
    } else {
      const drawTool = this.tools[TOOLS_TYPES.draw];
      const drawHandlers = this.getDrawHandlers();
      drawTool.onMouseDown = drawHandlers.onMouseDown!;
      drawTool.onMouseDrag = drawHandlers.onMouseDrag;
      drawTool.onMouseUp = drawHandlers.onMouseUp;
    }
  }

  @action.bound addPath(path: paper.Path, savedPath: SavedPath) {
    path.data = { ...path.data, ...savedPath };
    path.simplify(1.5);
    this.bush.insert(itemBushFromPath(path));
  }

  @action.bound removePath(bushItem: BushItem) {
    bushItem.path.remove();
    this.bush.remove(bushItem);
  }

  @action.bound pastePath(path: paper.Item) {
    const bushItem = itemBushFromPath(path);
    this.bush.insert(bushItem);
  }
}

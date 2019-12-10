import { action, autorun, computed, IReactionDisposer, observable } from "mobx";
import { actionAsync, task } from "mobx-utils";
import paper from "paper";
import RBush from "rbush";
import { PaperPath, PaperPathBoxInput, PaperPathPoints, PaperPathUpdateInput, PaperPermission } from "../generated/graphql";
import { PaperPathMessage, PaperPathUpdate } from "../signaling/signaling";
import { CanvasPredictor } from "./CanvasPredictor";
import { PaperIndexedDB, PathIndexedDB, sameKeys } from "./IndexedDB";
import { Store } from "./Store";
import { BushItem, bushItemFromPath, DEFAULT_PATH_OPTIONS, ExtendedTool, TOOLS_TYPES } from "./utils-canvas";
import { getAllTools } from "./utils-tools";

export type SimplePermission = Pick<
  PaperPermission,
  "userId" | "userName" | "userEmail" | "type"
>;

export const UNDEFINED_USER = "undefined";

type HandlerFunction = () => {
  onMouseDown?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onMouseDrag: (event: any) => void;
  onMouseUp: (event: any) => void;
  onMouseMove?: (event: any) => void;
};

function getIdFromBushItem(bushItem: {
  id: number;
  device: string;
  userId?: string;
}) {
  return `${bushItem.id}-${bushItem.device}-${bushItem.userId}`;
}
export function getBoxFromBushItem(p: Omit<BushItemId, "path">): PaperPathBoxInput {
  return { maxX: p.maxX, maxY: p.maxY, minY: p.minY, minX: p.minX };
}

export type BushItemId = BushItem & {
  device: string;
  userId: string;
  id: number;
};
export type CreatedPath = Omit<BushItemId, "path"> & {
  data: string;
  points?: PaperPathPoints;
};

type ConstructorTypePaper = {
  papel: PaperIndexedDB & { paths?: PathIndexedDB[] };
  store: Store;
};
type ConstructorTypeInit = {
  store: Store;
  name: string;
  id: string;
};
type ConstructorType = {
  name?: string;
  papel?: PaperIndexedDB & { paths?: PathIndexedDB[] };
  id?: string;
  store: Store;
};

export class CanvasModel {
  store: Store;
  scope = new paper.PaperScope();
  bush = new RBush<BushItemId>();
  canvas = document.createElement("canvas");
  reactionDisposers: IReactionDisposer[] = [];
  canvasPredictor: CanvasPredictor;

  tools: { [k in keyof typeof TOOLS_TYPES]: ExtendedTool } | undefined;
  getPenHandlers: HandlerFunction | undefined;
  getDrawHandlers: HandlerFunction | undefined;

  @observable sequenceNumber: number;
  @observable lastPathId: number;
  @observable name: string;
  @observable permissions: SimplePermission[];
  @observable createdDate: Date;
  @observable ownerId: string;
  id: string;

  // history: PathAction[] = [];
  // historyPosition: number = 0;

  loadedPaths: PathIndexedDB[];
  @observable isLoading: boolean;
  @observable currentTool: TOOLS_TYPES = TOOLS_TYPES.draw;
  @observable isSaving: boolean = false;

  getDeviceAndUser() {
    return {
      device: window.navigator.userAgent,
      userId: this.store.user ? this.store.user.id : UNDEFINED_USER
    };
  }

  @computed get createdTimestamp() {
    return this.createdDate.getTime();
  }

  constructor({ papel, store }: ConstructorTypePaper);
  constructor({ name, id, store }: ConstructorTypeInit);
  constructor({ name, papel, id, store }: ConstructorType) {
    this.store = store;
    if (papel) {
      this.name = papel.name;
      this.id = papel.id;
      this.ownerId = papel.ownerId;

      if (papel.paths) {
        this.loadedPaths = papel.paths;
        this.lastPathId = this.processPaths(papel.paths);
        this.isLoading = false;
      } else {
        this.loadedPaths = [];
        this.lastPathId = 0;
        this.isLoading = true;
      }
      this.createdDate = new Date(papel.createdDate);
      this.sequenceNumber = papel.sequenceNumber;
      this.permissions = papel.permissions;
    } else {
      this.id = id!;
      this.name = name!;
      this.loadedPaths = [];
      this.lastPathId = 0;
      this.sequenceNumber = -1;
      this.createdDate = new Date();
      this.permissions = [];
      this.ownerId = this.store.user ? this.store.user.id : UNDEFINED_USER;
      this.isLoading = false;
    }

    this.canvas.className = "canvas";
    const size = Math.max(window.innerHeight, window.innerWidth);
    this.canvas.style.width = `${size * 1.5}px`;
    this.canvas.style.height = `${size * 1.5}px`;
    this.canvasPredictor = new CanvasPredictor(this, store.predictor);

    this.reactionDisposers.push(
      autorun(
        () => {
          this.store.db.updatePaper({
            id: this.id,
            name: this.name,
            currentTool: this.currentTool,
            permissions: [...this.permissions],
            ownerId: this.ownerId,
            createdDate: this.createdDate,
            sequenceNumber: this.sequenceNumber
          });
        },
        { requiresObservable: true }
      )
    );
  }

  dispose() {
    this.reactionDisposers.forEach(d => d());
  }

  predict() {
    const path = this.createdPaths[this.lastPathId];
    this.canvasPredictor.predict(path);
  }

  processPaths(paths: PathIndexedDB[]) {
    const { device, userId } = this.getDeviceAndUser();
    return paths.reduce((p, c) => {
      if (!c.sequenceNumber){
        if (c.sequenceNumber === 0){
          this.updatedPaths
        }else if (c.userId == userId && c.points){
          this.createdPaths[c.id] = {...c.box, ...c};
        }
      }
      
      if (c.device === device && c.userId === userId) {
        return Math.max(p, c.id);
      }
      return p;
      
    }, 0);
  }

  @action.bound updateCanvas(papel: {
    sequenceNumber?: number;
    name?: string;
    createdDate?: any;
    permissions?: SimplePermission[];
  }) {
    if (papel.createdDate) this.createdDate = new Date(papel.createdDate);
    if (papel.name) this.name = papel.name;
    if (papel.permissions){ 
      this.permissions = papel.permissions;
    }
    if (papel.sequenceNumber) this.sequenceNumber = papel.sequenceNumber;
  }

  @action.bound initialize(canvasScroll: HTMLDivElement) {
    while (canvasScroll.firstChild) {
      canvasScroll.removeChild(canvasScroll.firstChild);
    }
    canvasScroll.appendChild(this.canvas);

    if (this.tools === undefined) {
      this.scope.setup(this.canvas);

      const { tools, getPenHandlers, getDrawHandlers } = getAllTools(this);

      this.tools = tools;
      this.getPenHandlers = getPenHandlers;
      this.getDrawHandlers = getDrawHandlers;
      if (this.store.isUsingPen) {
        this.usePen(this.store.isUsingPen);
      }
      this.loadPaths();
    }

    this.scope.activate();
    this.activateTool(this.currentTool);
  }

  @actionAsync
  loadPaths = async () => {
    if (this.isLoading) {
      this.loadedPaths = await task(this.store.db.loadPaperPaths(this.id));
      this.lastPathId = this.processPaths(this.loadedPaths);
      this.isLoading = false;
    }
    if (this.loadedPaths.length > 0) {
      for (const pathData of this.loadedPaths) {
        if (!pathData.data) continue;
        this.loadPath(pathData);
      }
      this.loadedPaths = [];
    }
  };

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

  // ##################  OUTSIDE DATA ####################

  // @action.bound loadPath(pathData: PathIndexedDB) {
  //   const {
  //     data: { x, y, t },
  //     box
  //   } = pathData;
  //   const path = new this.scope.Path(DEFAUTL_PATH_OPTIONS);
  //   for (let i = 0; i < x.length; i++) {
  //     path.add(new this.scope.Point(x[i], y[i]));
  //   }
  //   path.pathData
  //   this._editPath(path, box);
  //   this._addPath({ ...pathData, ...pathData.box, path }, { x, y, t });
  // }

  @action.bound
  loadNewPaths(newPaths: {
    [k: string]: Omit<PaperPath, "paper" | "user" | "points">;
  }) {
    console.log(newPaths);
    for (const p of this.bush.all()) {
      const currKey = getIdFromBushItem(p);
      const newPath = newPaths[currKey];
      if (newPath) {
        if (newPath.data) {
          const newPathPaper = this._editPath(p.path, newPath.box);
          this.bush.remove(p);
          this.bush.insert({ ...p, ...newPath.box, path: newPathPaper });
        } else {
          this.removePath(p);
        }
        delete newPaths[currKey];
      }
    }

    for (const newPath of Object.values(newPaths)) {
      if (newPath.data !== null) {
        this.loadPath({ ...newPath, data: newPath.data });
      }
    }
  }

  @action.bound loadPath(
    pathData: Omit<PaperPathMessage, "paperId"> & { data: string }
  ) {
    const path = new this.scope.Path(DEFAULT_PATH_OPTIONS);
    path.pathData = pathData.data;
    this._editPath(path, pathData.box);
    this._addPath({ ...pathData, ...pathData.box, path });
  }

  @action.bound _editPath(path: paper.PathItem, box: PaperPathBoxInput) {
    const { minX, minY, maxX, maxY } = box;
    path.position.x = (minX + maxX) / 2;
    path.position.y = (minY + maxY) / 2;

    const newWidth = maxX - minX;
    const newHeight = maxY - minY;
    const { width, height } = path.internalBounds;
    if (Math.abs(width - newWidth) >= 3 || Math.abs(newHeight - height) >= 3) {
      path.scale(newWidth / width, newHeight / height);
    }
    return path;
  }

  @action.bound _addPath(bushItem: BushItemId) {
    this.bush.insert(bushItem);
  }

  // ################### PEER ACTIONS ##################################

  @action.bound deletePathPeer(path: PaperPathMessage) {
    const bushItem = this._findBushItem(path);
    if (bushItem) {
      bushItem.path.remove();
      this.bush.remove(bushItem);
    }
  }

  @action.bound updatePathPeer(path: PaperPathUpdate) {
    const bushItem = this._findBushItem(path);
    if (bushItem) {
      const newPath = this._editPath(bushItem.path, path.newBox);
      this.bush.remove(bushItem);
      this.bush.insert({ ...bushItem, ...path.box, path: newPath });
    }
  }

  _findBushItem(path: PaperPathMessage) {
    const paths = this.bush.search(path.box);
    for (const p of paths) {
      if (sameKeys(path, { ...p, paperId: this.id })) {
        return p;
      }
    }
  }

  @action.bound selectPathsPeer(paths: PaperPathUpdateInput[]) {}

  // ################  USER ACTIONS  #######################

  // allPaths: { [key: string]: SavedPath } = {};
  createdPaths: { [key: number]: CreatedPath } = {};
  deletedPaths: { [key: string]: BushItemId } = {};
  updatedPaths: { [key: string]: BushItemId } = {};

  @action.bound addPath(path: paper.PathItem, points?: PaperPathPoints) {
    this.lastPathId += 1;
    const bushItem = {
      ...bushItemFromPath(path),
      ...this.getDeviceAndUser(),
      id: this.lastPathId
    };
    this.bush.insert(bushItem);
    this.store.createPath(bushItem);

    const createdPath = {
      ...bushItem,
      data: path.pathData,
      points
    };
    this.createdPaths[bushItem.id] = createdPath;
    // this.canvasPredictor.predict(createdPath);
    return bushItem;
  }

  @action.bound removePath(bushItem: BushItemId) {
    bushItem.path.remove();
    this.bush.remove(bushItem);
    this.store.deletePath(bushItem);

    if (
      (!this.store.user ||
        bushItem.userId === UNDEFINED_USER ||
        bushItem.userId === this.store.user.id) &&
      bushItem.id in this.createdPaths
    ) {
      delete this.createdPaths[bushItem.id];
    } else {
      if (bushItem.userId === UNDEFINED_USER) {
        console.log("ERROR");
      }
      this.deletedPaths[getIdFromBushItem(bushItem)] = bushItem;
    }
  }

  @action.bound updatePaths(bushItems: BushItemId[]) {
    const newPaths: BushItemId[] = [];
    bushItems.forEach(p => {
      this.bush.remove(p);
      const newPath = { ...p, ...bushItemFromPath(p.path) };
      newPaths.push(newPath);

      if (
        (!this.store.user ||
          newPath.userId === UNDEFINED_USER ||
          newPath.userId === this.store.user.id) &&
        newPath.id in this.createdPaths
      ) {
        const prevPath = this.createdPaths[newPath.id];
        this.createdPaths[newPath.id] = {
          ...newPath,
          data: prevPath.data,
          points: prevPath.points
        };
      } else {
        if (newPath.userId === UNDEFINED_USER) {
          console.log("ERROR");
        }
        this.updatedPaths[getIdFromBushItem(newPath)] = newPath;
      }
    });
    this.bush.load(newPaths);
    this.store.updatePaths(
      newPaths.map((np, i) => ({
        ...np,
        box: getBoxFromBushItem(bushItems[i]),
        newBox: getBoxFromBushItem(np)
      }))
    );

    return newPaths;
  }

  @action.bound pastePath(bushItem: BushItemId) {
    return this.addPath(bushItem.path);
  }

  @action.bound selectPaths(bushItems: BushItemId[]) {
    this.store.selectPaths(bushItems.map(p => ({ ...p, paperId: this.id })));
  }

  // #####################  API CALLS  ###########################

  @action.bound 
  async save() {
    if (this.isSaving) return;

    this.isSaving = true;
    if (this.sequenceNumber === -1 && this.store.user) {
      console.log(this.createdDate.toISOString());
      try{
      const { data, errors } = await this.store.canvasApi.createPaper({
        name: this.name,
        id: this.id,
        createdDate: this.createdDate.toISOString()
      });
      if (!data || !data.createPaper) {
        console.log(errors);
        this.isSaving = false;
        return;
      }
    
      const papel = data.createPaper;
      this.sequenceNumber = 0;
      this.createdDate = new Date(papel.createdDate);
    }catch(e){
      console.log(e);
      this.isSaving = false;
    }
    }

    if (this.store.user) {
      console.log("enteresd");
      try {
        await Promise.all([
          this._createDataPaths(this.id),
          this._updateDataPaths(this.id),
          this._deleteDataPaths(this.id)
        ]);
      } catch (e) {
        console.error(e);
      }
    }
    this.isSaving = false;
  }

  @action.bound async _createDataPaths(paperId: string) {
    const createdDataPaths = Object.entries(this.createdPaths).map(
      ([id, p]) => {
        if (p.points) {
          p.points.t = p.points.t.map(t => t - this.createdTimestamp);
        }
        return {
          id: parseInt(id),
          data: p.data,
          box: getBoxFromBushItem(p),
          points: p.points || null
        };
      }
    );
    if (createdDataPaths.length > 0) {
      try {
        const ans = await this.store.canvasApi.createPaperPaths({
          device: this.getDeviceAndUser().device,
          paperId,
          paths: createdDataPaths
        });
        if (ans.data && !ans.data.createPaperPaths) {
          this.createdPaths = {};
        } else {
          console.log(ans.errors);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  @action.bound async _updateDataPaths(paperId: string) {
    const updatedDataPaths = Object.values(this.updatedPaths).map(bushItem => {
      return {
        id: bushItem.id,
        userId: bushItem.userId || this.store.user!.id,
        device: bushItem.device,
        box: getBoxFromBushItem(bushItem)
      };
    });
    if (updatedDataPaths.length > 0) {
      try {
        const ans = await this.store.canvasApi.updatePaperPaths({
          paperId,
          paths: updatedDataPaths
        });
        if (ans.data && !ans.data.updatePaperPaths) {
          this.updatedPaths = {};
        } else {
          console.log(ans.errors);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  @action.bound async _deleteDataPaths(paperId: string) {
    const deletedDataPaths = Object.values(this.deletedPaths).map(bushItem => {
      return {
        id: bushItem.id,
        userId: bushItem.userId || this.store.user!.id,
        device: bushItem.device
      };
    });
    if (deletedDataPaths.length > 0) {
      try {
        const ans = await this.store.canvasApi.deletePaperPaths({
          paperId,
          paths: deletedDataPaths
        });
        if (ans.data && !ans.data.deletePaperPaths) {
          this.deletedPaths = {};
        } else {
          console.log(ans.errors);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
}

import {
  BushItem,
  TOOLS_TYPES,
  bushItemFromPath,
  ExtendedTool,
  DEFAULT_PATH_OPTIONS
} from "./utils-canvas";
import paper from "paper";
import RBush from "rbush";
import { getAllTools } from "./utils-tools";
import { observable, action } from "mobx";
import {
  PaperPathBoxInput,
  DeletePaperPathsMutation,
  DeletePaperPathsDocument,
  DeletePaperPathsMutationVariables,
  UpdatePaperPathsMutation,
  UpdatePaperPathsMutationVariables,
  UpdatePaperPathsDocument,
  CreatePaperPathsMutation,
  CreatePaperPathsMutationVariables,
  CreatePaperDocument,
  CreatePaperPathsDocument,
  CreatePaperMutation,
  CreatePaperMutationVariables,
  Paper,
  PaperPath,
  PaperPathData,
  PaperPermissionType,
  PaperPathUpdateInput
} from "../generated/graphql";
import { store } from "./Store";
import { client } from "..";
import { PaperIndexedDB, PathIndexedDB, sameKeys } from "./IndexedDB";

type SimplePermission = { userId: string; type: PaperPermissionType };

type HandlerFunction = () => {
  onMouseDown?: (event: any) => void;
  onPointerDown?: (event: any) => void;
  onMouseDrag: (event: any) => void;
  onMouseUp: (event: any) => void;
  onMouseMove?: (event: any) => void;
};

function getDeviceAndUser() {
  return {
    device: window.navigator.userAgent,
    userId: store.user ? store.user.id : "undefined"
  };
}
function getIdFromBushItem(bushItem: {
  id: number;
  device: string;
  userId?: string;
}) {
  return `${bushItem.id}-${bushItem.device}-${bushItem.userId}`;
}
function getBoxFromBushItem(p: BushItemId): PaperPathBoxInput {
  return { maxX: p.maxX, maxY: p.maxY, minY: p.minY, minX: p.minX };
}

export type BushItemId = BushItem & {
  device: string;
  userId: string;
  id: number;
};
export type SavedPath = BushItemId & { data: PaperPathData };

export class CanvasModel {
  scope = new paper.PaperScope();
  bush = new RBush<BushItemId>();
  @observable canvas = document.createElement("canvas");

  @observable currentTool: TOOLS_TYPES = TOOLS_TYPES.draw;
  @observable isSaving: boolean = false;

  tools: { [k in keyof typeof TOOLS_TYPES]: ExtendedTool } | undefined;
  getPenHandlers: HandlerFunction | undefined;
  getDrawHandlers: HandlerFunction | undefined;

  sequenceNumber: number;
  lastPathId: number;
  createdTimestamp: number;

  @observable name: string;
  id: string;
  permissions: SimplePermission[];

  // history: PathAction[] = [];
  // historyPosition: number = 0;
  loadedPaths: PathIndexedDB[];
  @observable isLoading: boolean = false;

  constructor({
    papel
  }: {
    papel: PaperIndexedDB & { paths?: PathIndexedDB[] };
  });
  constructor({
    name,
    withPen,
    id
  }: {
    name: string;
    withPen: boolean;
    id: string;
  });
  constructor({
    name,
    withPen,
    papel,
    id
  }: {
    name?: string;
    withPen?: boolean;
    papel?: PaperIndexedDB & { paths?: PathIndexedDB[] };
    id?: string;
  }) {
    if (papel) {
      this.name = papel.name;
      this.id = papel.id;

      if (papel.paths) {
        this.loadedPaths = papel.paths;
        this.lastPathId = papel.paths.reduce((p, c) => {
          const { device, userId } = getDeviceAndUser();
          if (c.device === device && c.userId === userId) {
            return Math.max(p, c.id);
          }
          return p;
        }, 0);
      } else {
        this.loadedPaths = [];
        this.lastPathId = 0;
      }
      this.createdTimestamp = new Date(papel.createdDate).getTime();
      this.sequenceNumber = papel.sequenceNumber;
      this.permissions = papel.permissions;
    } else {
      this.id = id!;
      this.name = name!;
      this.loadedPaths = [];
      this.lastPathId = 0;
      this.sequenceNumber = -1;
      this.createdTimestamp = 0;
      this.permissions = [];
    }

    this.canvas.className = "canvas";
    const size = Math.max(window.innerHeight, window.innerWidth);
    this.canvas.style.width = `${size * 1.5}px`;
    this.canvas.style.height = `${size * 1.5}px`;
  }

  @action.bound updateCanvas(papel: {
    sequenceNumber?: number;
    name?: string;
    createdDate?: any;
    permissions?: SimplePermission[];
  }) {
    if (papel.createdDate)
      this.createdTimestamp = new Date(papel.createdDate).getTime();
    if (papel.name) this.name = papel.name;
    if (papel.permissions) this.permissions = papel.permissions;
    if (papel.sequenceNumber) this.sequenceNumber = papel.sequenceNumber;
  }

  @action.bound initialize(canvasScroll: HTMLDivElement, withPen: boolean) {
    this.isLoading = true;
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
    this.loadPaths();
  }

  @action.bound async loadPaths() {
    if (this.loadedPaths.length === 0) {
      this.loadedPaths = await store.loadPaths(this.id);
    }
    if (this.loadedPaths.length > 0) {
      for (const pathData of this.loadedPaths) {
        if (!pathData.data) continue;

        this.loadPath(pathData);
      }
      this.loadedPaths = [];
    }
    this.isLoading = false;
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
  @action.bound loadPath(pathData: PathIndexedDB) {
    const path = new this.scope.Path(DEFAULT_PATH_OPTIONS);
    path.pathData = pathData.data;
    this._editPath(path, pathData.box);
    this._addPath({ ...pathData, ...pathData.box, path });
  }

  @action.bound _editPath(path: paper.Item, box: PaperPathBoxInput) {
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

  @action.bound deletePathPeer(path: PathIndexedDB) {
    const bushItem = this._findBushItem(path);
    if (bushItem) {
      bushItem.path.remove();
      this.bush.remove(bushItem);
    }
  }

  @action.bound updatePathPeer(path: PathIndexedDB) {
    const bushItem = this._findBushItem(path);
    if (bushItem) {
      const newPath = this._editPath(bushItem.path, path.box);
      this.bush.remove(bushItem);
      this.bush.insert({ ...bushItem, ...path.box, path: newPath });
    }
  }

  _findBushItem(path: PathIndexedDB) {
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
  createdPaths: { [key: number]: SavedPath } = {};
  deletedPaths: { [key: string]: BushItemId } = {};
  updatedPaths: { [key: string]: BushItemId } = {};

  @action.bound addPath(path: paper.Item, pathData: PaperPathData) {
    this.lastPathId += 1;
    const bushItem = {
      ...bushItemFromPath(path),
      ...getDeviceAndUser(),
      id: this.lastPathId
    };
    this.bush.insert(bushItem);
    const savedPath = { ...bushItem, data: pathData };
    this.createdPaths[bushItem.id] = savedPath;
    return bushItem;
  }

  @action.bound removePath(bushItem: BushItemId) {
    bushItem.path.remove();
    this.bush.remove(bushItem);

    if (
      (!store.user || !bushItem.userId || bushItem.userId === store.user.id) &&
      bushItem.id in this.createdPaths
    ) {
      delete this.createdPaths[bushItem.id];
    } else {
      if (!bushItem.userId) {
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
        (!store.user || !newPath.userId || newPath.userId === store.user.id) &&
        newPath.id in this.createdPaths
      ) {
        this.createdPaths[newPath.id] = {
          ...newPath,
          data: this.createdPaths[newPath.id].data
        };
      } else {
        if (!newPath.userId) {
          console.log("ERROR");
        }
        this.updatedPaths[getIdFromBushItem(newPath)] = newPath;
      }
    });
    this.bush.load(newPaths);
    return newPaths;
  }

  @action.bound async pastePath(bushItem: BushItemId) {

    return null;
    // if (path) {
    //   // const oldDataPath = this.allPaths[getIdFromBushItem(bushItem)];
    //   return this.addPath(bushItem.path, path.data);
    // } else {
    //   console.log("ERROR");
    //   return null;
    // }
  }

  // #####################  API CALLS  ###########################

  @action.bound async save() {
    if (this.isSaving) return;

    this.isSaving = true;
    if (this.sequenceNumber === -1) {
      const ans = await client.mutate<
        CreatePaperMutation,
        CreatePaperMutationVariables
      >({
        mutation: CreatePaperDocument,
        variables: {
          name: this.name,
          id: this.id
        }
      });
      if (!ans.data || !ans.data.createPaper) {
        console.log(ans.errors);
        return;
      }
      const data = ans.data.createPaper;
      this.sequenceNumber = data.sequenceNumber;
      this.createdTimestamp = new Date(data.createdDate).getTime();
    }

    if (store.user != null) {
      try {
        await Promise.all([
          this._createDataPaths(this.id),
          this._updateDataPaths(this.id),
          this._deleteDataPaths(this.id)
        ]);
      } catch (e) {
        console.error(e);
      }
      this.isSaving = false;
    }
  }

  @action.bound async _createDataPaths(paperId: string) {
    const createdDataPaths = Object.entries(this.createdPaths).map(
      ([id, p]) => {
        // const minT = data.t.reduce((p, c) => Math.min(p, c), 999999999999999999);
        p.data.t = p.data.t.map(t => t - this.createdTimestamp);
        return {
          id: parseInt(id),
          data: p.data,
          box: getBoxFromBushItem(p)
        };
      }
    );
    if (createdDataPaths.length > 0) {
      try {
        const ans = await client.mutate<
          CreatePaperPathsMutation,
          CreatePaperPathsMutationVariables
        >({
          mutation: CreatePaperPathsDocument,
          variables: {
            device: getDeviceAndUser().device,
            paperId,
            paths: createdDataPaths
          }
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
        userId: bushItem.userId || store.user!.id,
        device: bushItem.device,
        box: getBoxFromBushItem(bushItem)
      };
    });
    if (updatedDataPaths.length > 0) {
      try {
        const ans = await client.mutate<
          UpdatePaperPathsMutation,
          UpdatePaperPathsMutationVariables
        >({
          mutation: UpdatePaperPathsDocument,
          variables: {
            paperId,
            paths: updatedDataPaths
          }
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
        userId: bushItem.userId || store.user!.id,
        device: bushItem.device
      };
    });
    if (deletedDataPaths.length > 0) {
      try {
        const ans = await client.mutate<
          DeletePaperPathsMutation,
          DeletePaperPathsMutationVariables
        >({
          mutation: DeletePaperPathsDocument,
          variables: {
            paperId,
            paths: deletedDataPaths
          }
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

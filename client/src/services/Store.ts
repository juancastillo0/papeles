import { NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { action, computed, IReactionDisposer, observable, reaction } from "mobx";
import { actionAsync, task } from "mobx-utils";
import React from "react";
import uuid from "uuid";
import { AuthApi } from "../auth/AuthApi";
import { AuthStore, UserProfile } from "../auth/AuthStore";
import { CanvasApi } from "../canvas/CanvasApi";
import { PaperPath, PaperPathBoxInput, SignalReceived } from "../generated/graphql";
import { DataChannelMessage, DataChannelMessageType, Signaling } from "../signaling/signaling";
import { Predictor } from "../tensorflow/predict";
import { BushItemId, CanvasModel, getBoxFromBushItem, SimplePermission } from "./CanvasModel";
import { getIdFromBushItem } from "./CanvasPredictor";
import { IndexedDB, PaperIndexedDB, PathIdentifier, PathIndexedDB } from "./IndexedDB";
import { TOOLS_TYPES } from "./utils-canvas";
import { DeviceSizes, getWindowSize } from "./utils-resize";

function bushItemToDB(bushItem: BushItemId, paperId: string): PathIndexedDB {
  return {
    box: getBoxFromBushItem(bushItem),
    data: bushItem.path.pathData,
    device: bushItem.device,
    paperId,
    id: bushItem.id,
    userId: bushItem.userId
  };
}

export class Store {
  constructor(
    public db: IndexedDB,
    public client: ApolloClient<NormalizedCacheObject>,
    papers: PaperIndexedDB[]
  ) {
    this.windowSize = this.setWindowSize();
    window.onresize = this.setWindowSize;

    this.canvasUploadImage = document.createElement("img");
    this.canvasUploadImage.style.display = "none";
    document.body.appendChild(this.canvasUploadImage);

    this.authStore = new AuthStore(this, new AuthApi(this.client));
    this.canvasApi = new CanvasApi(this.client);
    this.predictor = new Predictor();

    for (const papel of papers) {
      const canvas = new CanvasModel({ papel, store: this });
      this.canvasMap.set(canvas.id, canvas);
    }

    const currentCanvasId = localStorage.getItem("currentCanvasId");
    if (currentCanvasId && this.canvasMap.has(currentCanvasId)) {
      this.currentCanvasId = currentCanvasId;
    } else if (this.canvasMap.size === 0) {
      this.currentCanvasId = this.createCanvas("Nuevo Papel");
    } else {
      this.currentCanvasId = this.canvasMap.keys().next().value;
    }

    localStorage.setItem("currentCanvasId", this.currentCanvasId);
    this.reactionDisposers.push(
      reaction(() => this.currentCanvasId, this.persistData("currentCanvasId"))
    );
    this.reactionDisposers.push(
      reaction(
        () => this.authStore.user,
        u => this.onAuthStateChanged(u)
      )
    );
  }

  @action.bound setWindowSize() {
    this.windowSize = getWindowSize();
    if (this.windowSize.device > 1) {
      this.showCanvas = true;
    }
    if (this.windowSize.device <= 1 && this.showCanvas) {
      this.showCanvasList = false;
      this.showTable = false;
    } else if (
      this.windowSize.device === 2 &&
      this.showCanvasList &&
      this.showTable
    ) {
      this.showCanvasList = true;
      this.showTable = false;
    }
    return this.windowSize;
  }

  reactionDisposers: IReactionDisposer[] = [];
  persistData(key: string) {
    return (value: string) => {
      localStorage.setItem(key, value);
    };
  }
  dispose() {
    this.reactionDisposers.forEach(disposer => disposer());
    window.removeEventListener("resize", this.setWindowSize);
  }

  canvasApi: CanvasApi;
  authStore: AuthStore;
  predictor: Predictor;
  canvasUploadImage: HTMLImageElement;
  loadedIndexedDB: boolean = true;
  fetchedPapers: boolean = false;
  signaling: Signaling | null = null;

  // OBSERVABLES

  @observable resetStore: boolean = false;

  @observable windowSize: { w: number; h: number; device: DeviceSizes };

  @observable canvasMap = observable.map<string, CanvasModel>({});
  @observable currentCanvasId: string;
  @observable menuPosition: { x: number; y: number } | null = null;
  @observable isUsingPen: boolean = false;
  @observable modal: React.ReactNode | null = null;

  @computed get user() {
    return this.authStore.user;
  }
  @computed get currentCanvas() {
    return this.canvasMap.get(this.currentCanvasId)!;
  }
  @computed get currentTool() {
    return this.currentCanvas.currentTool;
  }
  @computed get isSaving() {
    return this.currentCanvas.isSaving;
  }

  // ACTIONS

  @action.bound
  setModal(modal: React.ReactNode | null) {
    this.modal = modal;
  }

  @action.bound
  onDataChannelMessage(peerId: string, message: DataChannelMessage) {
    switch (message.type) {
      case "CREATE_PAPER": {
        const papel = message.paper;
        const canvas = this.canvasMap.get(papel.id);
        if (canvas) {
          canvas.updateCanvas(papel);
        } else {
          const canvas = new CanvasModel({ papel, store: this });
          this.canvasMap.set(canvas.id, canvas);
        }
        break;
      }
      case "CREATE_PATH": {
        const path = message.path;
        const canvas = this.canvasMap.get(path.paperId);
        if (canvas) {
          canvas.loadPath(path);
        } else {
          console.log(`ERROR CREATE_PATH ${path}`);
        }
        break;
      }
      case "DELETE_PATH": {
        const path = message.path;
        const canvas = this.canvasMap.get(path.paperId);
        if (canvas) {
          canvas.deletePathPeer(path);
        } else {
          console.log(`ERROR DELETE_PATH ${path}`);
        }
        break;
      }
      case "UPDATE_PATH": {
        const paths = message.paths;
        const canvas = this.canvasMap.get(paths[0].paperId);
        if (canvas) {
          for (const path of paths) {
            canvas.updatePathPeer(path);
          }
        } else {
          console.log(`ERROR DELETE_PATH ${paths}`);
        }
        break;
      }
    }
  }

  // ########################  CONNECTIONS  ##################################

  selectedPaths: PathIdentifier[] = [];

  @action.bound
  createPath(_path: BushItemId) {
    const signaling = this.signaling;
    const path = bushItemToDB(_path, this.currentCanvasId);
    return Promise.all([
      this.db.addPaths([path]),
      ...(signaling
        ? this.currentCanvas.permissions.map(per => {
            return signaling.sendPathMessage(per.userId, {
              type: DataChannelMessageType.CREATE_PATH,
              path
            });
          })
        : [])
    ]);
  }

  @action.bound
  deletePath(_path: BushItemId) {
    const signaling = this.signaling;
    const path = bushItemToDB(_path, this.currentCanvasId);
    return Promise.all([
      this.db.deletePath(path),
      ...(signaling
        ? this.currentCanvas.permissions.map(per => {
            return signaling.sendPathMessage(per.userId, {
              type: DataChannelMessageType.DELETE_PATH,
              path
            });
          })
        : [])
    ]);
  }

  @action.bound
  selectPaths(paths: PathIdentifier[]) {
    this.selectedPaths = paths;
  }

  @action.bound
  updatePaths(_paths: (BushItemId & { newBox: PaperPathBoxInput })[]) {
    const signaling = this.signaling;
    const paths = _paths.map(p => bushItemToDB(p, this.currentCanvasId));
    const newPaths = paths.map((p, i) => ({ ...p, newBox: _paths[i].newBox }));
    return Promise.all([
      this.db.updatePaths(paths),
      ...(signaling
        ? this.currentCanvas.permissions.map(per => {
            return signaling.sendPathMessage(per.userId, {
              type: DataChannelMessageType.UPDATE_PATH,
              paths: newPaths
            });
          })
        : [])
    ]);
  }

  // #################################

  @action
  onAuthStateChanged = async (user: UserProfile) => {
    if (user) {
      this.db.updateUserId(user.id);
      this.signaling = new Signaling(user.id, this.onDataChannelMessage);
      this.fetchPapers();
    } else {
      if (this.signaling) this.signaling.close();
      this.db.deleteDB();
      localStorage.clear();
      this.dispose();
      this.resetStore = true;
    }
  };

  @action
  fetchPapers = async () => {
    if (this.user !== null) {
      const localPaths: { paperId: string; sequenceNumber: number }[] = [];
      for (const papel of this.canvasMap.values()) {
        if (papel.sequenceNumber !== -1) {
          localPaths.push({
            paperId: papel.id,
            sequenceNumber: papel.sequenceNumber
          });
        }
      }
      const allPapeles = await this.canvasApi.papersMeta({});
      const allPaths = await this.canvasApi.paperPaths({ localPaths });
      console.log(allPapeles, allPaths);
      if (allPaths && allPapeles && allPaths.data) {
        const mapPaths: {
          [key: string]: {
            [key: string]: Omit<PaperPath, "paper" | "user" | "points">;
          };
        } = {};
        for (const path of allPaths.data.paperPaths.paperPathsAns) {
          if (!(path.paperId in mapPaths)) {
            mapPaths[path.paperId] = {};
          }
          mapPaths[path.paperId][getIdFromBushItem(path)] = path;
        }
        const papers = allPapeles.data.papers;
        for (const papel of papers) {
          const localPaper = this.canvasMap.get(papel.id);
          if (localPaper) {
            localPaper.updateCanvas(papel);
            const paths = mapPaths[papel.id];
            if (paths) {
              localPaper.loadNewPaths(paths);
            }
          } else {
            const canvas = new CanvasModel({
              papel: { ...papel, currentTool: TOOLS_TYPES.draw },
              store: this
            });
            this.canvasMap.set(papel.id, canvas);
          }
        }

        const peers = new Set<string>();
        peers.add(this.user.id);

        for (const canvas of this.canvasMap.values()) {
          for (const peer of canvas.permissions) {
            if (!peers.has(peer.userId)) {
              this.signaling!.createConnection(peer.userId, true);
              peers.add(peer.userId);
            }
          }
        }
      }
    }
  };

  // CANVAS FUNCTIONS

  @action.bound
  toggleIsUsingPen() {
    this.isUsingPen = !this.isUsingPen;
    this.canvasMap.forEach(v => v.usePen(this.isUsingPen));
  }

  @action.bound
  openCanvas(canvasKey: string) {
    if (this.canvasMap.has(canvasKey)) {
      this.currentCanvasId = canvasKey;
    }
  }

  @action.bound
  saveCanvas() {
    if (this.user) {
      this.currentCanvas.save();
    }
  }

  @actionAsync
  deleteCanvas = async () => {
    const paperId = this.currentCanvas.id;

    await task(this.db.deletePaper(paperId));
    this.canvasMap.delete(this.currentCanvas.id);

    if (this.canvasMap.size === 0) {
      this.createCanvas("Nuevo Papel");
    } else {
      this.currentCanvasId = this.canvasMap.keys().next().value;
    }

    await task(this.canvasApi.deletePaper({ paperId }));
  };

  @action.bound
  createCanvas(canvasName: string) {
    let newCanvasName = canvasName;
    let i = 2;
    while (this.canvasMap.has(newCanvasName)) {
      newCanvasName = canvasName + " " + i;
      i += 1;
    }
    const canvas = new CanvasModel({
      id: uuid.v4(),
      name: newCanvasName,
      store: this
    });
    this.canvasMap.set(canvas.id, canvas);
    this.currentCanvasId = canvas.id;
    return canvas.id;
  }

  // CANVAS MENU

  @observable
  canShowMenu: boolean = true;

  @action.bound
  showMenu(event: MouseEvent | TouchEvent) {
    if (!this.canShowMenu) return;

    let pageX, pageY;
    if (event instanceof MouseEvent) {
      ({ pageX, pageY } = event);
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      ({ pageX, pageY } = event.changedTouches[0]);
    } else {
      return console.log(event);
    }

    this.menuPosition = { x: pageX, y: pageY };
  }

  @action.bound
  hideMenu() {
    if (this.menuPosition !== null) {
      this.menuPosition = null;
      this.canShowMenu = false;
    } else {
      this.canShowMenu = true;
    }
  }

  @action.bound
  changeTool(toolName: TOOLS_TYPES) {
    this.currentCanvas.activateTool(toolName);
  }

  // LAYOUT

  @observable showCanvasList: boolean = true;
  @observable showCanvas: boolean = true;
  @observable showTable: boolean = true;

  @action.bound toggleCanvasList() {
    this.showCanvasList = !this.showCanvasList;
    if (this.showCanvasList) {
      if (this.windowSize.device <= 1) {
        this.showCanvas = false;
      }
      if (this.windowSize.device === 2 && this.showTable) {
        this.showTable = false;
      }
    } else {
      this.showCanvas = true;
    }
  }
  @action.bound toggleTable() {
    this.showTable = !this.showTable;
    if (this.showTable) {
      if (this.windowSize.device <= 1) {
        this.showCanvas = false;
      }
      if (this.windowSize.device === 2 && this.showCanvasList) {
        this.showCanvasList = false;
      }
    } else {
      this.showCanvas = true;
    }
  }

  // SIGNALING

  evaluatePermissions(permissions: SimplePermission[]) {
    if (!this.signaling) return;
    for (const p of permissions) {
      this.signaling.createConnection(p.userId, true);
    }
  }

  createPermission(permission: SimplePermission) {
    this.currentCanvas.updateCanvas({
      permissions: [...this.currentCanvas.permissions, permission]
    });

    this.signaling!.sendPathMessage(permission.userId, {
      type: DataChannelMessageType.CREATE_PAPER,
      paper: this.currentCanvas
    });
  }
  handleSignal(signal: SignalReceived) {
    if (this.signaling) this.signaling.handleSignal(signal);
  }
}

export const storeContext = React.createContext<Store | null>(null);

export function useStore() {
  const store = React.useContext(storeContext);
  if (!store) {
    throw Error("useStore should be used inside a Store provider.");
  }
  return store;
}

export function useCurrentCanvas() {
  const store = useStore();
  return store.currentCanvas;
}

export function useStores() {
  const store = useStore();
  return { store, authStore: store.authStore };
}

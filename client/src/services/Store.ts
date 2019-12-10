import React from "react";
import { observable, action, computed } from "mobx";
import { CanvasModel } from "./CanvasModel";
import { TOOLS_TYPES } from "./utils-canvas";
import { getWindowSize, DeviceSizes } from "./utils-resize";
import {
  SignalReceived,
  PapersQuery,
  PapersQueryVariables,
  PapersDocument,
  Paper,
  DeletePaperMutation,
  DeletePaperDocument,
  DeletePaperMutationVariables
} from "../generated/graphql";
import { client } from "..";
import { Signaling, DataChannelMessage } from "../signaling/signaling";
import uuid from "uuid";
import { IndexedDB, createIndexedDB } from "./IndexedDB";

type userProfile = { id: string; name: string; email: string } | null;

class Store {

  constructor() {
    this.windowSize = getWindowSize();
    window.onresize = () => {
      this.windowSize = getWindowSize();
    };
    this.canvasUploadImage = document.createElement("img");
    this.canvasUploadImage.style.display = "none";
    document.body.appendChild(this.canvasUploadImage);
    // this.initIndexedDB();
  }

  @observable windowSize: { w: number; h: number; device: DeviceSizes };
  canvasUploadImage: HTMLImageElement;

  @observable canvasMap = observable.map<string, CanvasModel>({});
  @observable currentCanvasName: string | null = null;
  @observable menuPosition: { x: number; y: number } | null = null;
  @observable isUsingPen: boolean = false;

  @observable user: userProfile = null;
  @observable modal: React.ReactNode | null = null;

  loadedIndexedDB: boolean = true;
  fetchedPapers: boolean = false;
  signaling: Signaling | null = null;
  indexedDB: IndexedDB | null = null;

  @action.bound setModal(modal: React.ReactNode | null) {
    this.modal = modal;
  }
  @action.bound setUser(user: userProfile) {
    this.user = user;
    if (user) {
      if (this.indexedDB) {
        this.indexedDB.updateUserId(user.id);
      }
      this.fetchPapers();
      this.signaling = new Signaling(user.id, this.onDataChannelMessage);
    } else if (this.signaling) {
      this.signaling.close();
      this.canvasMap.clear();
      this.createCanvas("nuevo papel");
    }
  }

  @action.bound onDataChannelMessage(
    peerId: string,
    message: DataChannelMessage
  ) {
    switch (message.type) {
      case "CREATE_PAPER": {
        const papel = message.paper;
        if (this.canvasMap.has(papel.id)) {
          const canvas = this.canvasMap.get(papel.id)!;
          canvas.updateCanvas(papel);
        } else {
          const canvas = new CanvasModel({ papel });
          this.canvasMap.set(canvas.id, canvas);
        }
        break;
      }
      case "CREATE_PATH": {
        const path = message.path;
        if (this.canvasMap.has(path.paperId)) {
          const canvas = this.canvasMap.get(path.paperId)!;
          canvas.loadPath(path);
        } else {
          console.log(`ERROR CREATE_PATH ${path}`);
        }
        break;
      }
      case "DELETE_PATH": {
        const path = message.path;
        if (this.canvasMap.has(path.paperId)) {
          const canvas = this.canvasMap.get(path.paperId)!;
          canvas.deletePathPeer(path);
        } else {
          console.log(`ERROR DELETE_PATH ${path}`);
        }
        break;
      }
      case "UPDATE_PATH": {
        break;
      }
    }
  }

  async loadPaths(paperId: string) {
    if (this.indexedDB) {
      return await this.indexedDB.loadPaperPaths(paperId);
    }
    return [];
  }

  async initIndexedDB() {
    this.indexedDB = await createIndexedDB();
    const papers = await this.indexedDB.fetchPapers();
    for (const papel of papers) {
      const canvas = new CanvasModel({ papel });
      this.canvasMap.set(papel.id, canvas);
    }
    this.loadedIndexedDB = true;
    this.fetchPapers();
  }

  @action.bound async fetchPapers() {
    // if (!this.loadedIndexedDB || this.fetchedPapers) return;
    if (this.user !== null) {
      const ans = await client.query<PapersQuery, PapersQueryVariables>({
        query: PapersDocument
      });
      if (ans.data) {
        const papers = ans.data.papers;
        for (const papel of papers) {
          const canvas = new CanvasModel({ papel });
          this.canvasMap.set(papel.id, canvas);
        }
      }
    }
  }

  @action.bound toggleIsUsingPen() {
    this.isUsingPen = !this.isUsingPen;
    this.canvasMap.forEach(v => v.usePen(this.isUsingPen));
  }

  @computed get currentCanvas() {
    if (this.currentCanvasName) {
      return this.canvasMap.get(this.currentCanvasName);
    }
    return undefined;
  }
  @computed get currentTool() {
    const canvas = this.currentCanvas;
    if (canvas) {
      return canvas.currentTool;
    }
    return undefined;
  }
  @computed get isSaving() {
    return this.currentCanvas && this.currentCanvas.isSaving;
  }

  @action.bound openCanvas(canvasKey: string) {
    if (this.canvasMap.has(canvasKey)) {
      this.currentCanvasName = canvasKey;
    }
  }
  @action.bound deleteCanvas() {
    if (this.currentCanvas) {
      if (this.currentCanvas.id) {
        this._deleteCanvas(this.currentCanvas.id);
        this.canvasMap.delete(this.currentCanvas.id);
      } else {
        this.canvasMap.delete(this.currentCanvas.name);
      }
      if (this.canvasMap.size === 0) {
        this.createCanvas("nuevo papel");
      } else {
        this.currentCanvasName = this.canvasMap.keys().next().value;
      }
    }
  }

  async _deleteCanvas(paperId: string) {
    const ans = await client.mutate<
      DeletePaperMutation,
      DeletePaperMutationVariables
    >({
      mutation: DeletePaperDocument,
      variables: { paperId }
    });
  }

  @action.bound createCanvas(canvasName: string) {
    let newCanvasName = canvasName;
    let i = 2;
    while (this.canvasMap.has(newCanvasName)) {
      newCanvasName = canvasName + " " + i;
      i += 1;
    }
    const canvas = new CanvasModel({
      id: uuid.v4(),
      name: newCanvasName,
      withPen: this.isUsingPen
    });
    this.canvasMap.set(canvas.id, canvas);
    this.currentCanvasName = newCanvasName;
  }

  @observable canShowMenu: boolean = true;

  @action.bound showMenu(event: MouseEvent | TouchEvent) {
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

  @action.bound hideMenu() {
    if (this.menuPosition !== null) {
      this.menuPosition = null;
      this.canShowMenu = false;
    } else {
      this.canShowMenu = true;
    }
  }

  @action.bound changeTool(toolName: TOOLS_TYPES) {
    const canvas = this.currentCanvas;
    if (canvas !== undefined) {
      canvas.activateTool(toolName);
    }
  }

  @action.bound saveCanvas() {
    if (this.user && this.currentCanvas) {
      this.currentCanvas.save();
    }
  }

  handleSignal(signal: SignalReceived) {
    if (this.signaling) this.signaling.handleSignal(signal);
  }
}

export const store = new Store();
(window as any).store = store;
export const storeContext = React.createContext(store);

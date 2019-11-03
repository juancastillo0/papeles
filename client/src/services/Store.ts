import React from "react";
import { observable, action, computed } from "mobx";
import { CanvasModel } from "./CanvasModel";
import { TOOLS_TYPES } from "./utils-canvas";
import { getWindowSize, DeviceSizes } from "./utils-resize";
import { AuthStore } from "../auth/AuthStore";
import { Signal } from "../generated/graphql";

class Store extends AuthStore {
  constructor() {
    super();
    this.windowSize = getWindowSize();
    window.onresize = () => {
      this.windowSize = getWindowSize();
    };
    this.canvasUploadImage = document.createElement("img");
    this.canvasUploadImage.style.display = "none";
    document.body.appendChild(this.canvasUploadImage);
    this.createCanvas("new canvas");
  }
  @observable windowSize: { w: number; h: number; device: DeviceSizes };
  @observable canvasMap = observable.map<string, CanvasModel>({});
  @observable currentCanvasName: string | null = null;
  @observable menuPosition: { x: number; y: number } | null = null;
  @observable isUsingPen: boolean = false;
  @observable canvasUploadImage: HTMLImageElement;

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
  @action.bound openCanvas(canvasKey: string) {
    if (this.canvasMap.has(canvasKey)) {
      this.currentCanvasName = canvasKey;
    }
  }

  @action.bound createCanvas(canvasName: string) {
    let newCanvasName = canvasName;
    let i = 2;
    while (this.canvasMap.has(newCanvasName)) {
      newCanvasName = canvasName + " " + i;
      i += 1;
    }
    const canvas = new CanvasModel(newCanvasName, this.isUsingPen);
    this.canvasMap.set(newCanvasName, canvas);
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

  handleSignal(signal: Signal) {
    console.log(signal);
  }
}

export const store = new Store();
(window as any).store = store;
export const storeContext = React.createContext(store);

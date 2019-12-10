import {
  DEFAULT_STROKE_COLOR,
  DEFAUTL_PATH_OPTIONS,
  SELECTED_COLOR,
  ExtendedTool,
  RECT_COLOR
} from "./utils-canvas";
import { cursors } from "./utils-canvas";
import { BushItemId, CanvasModel } from "./CanvasModel";
import { store } from "../services/Store";
import { PaperPathData } from "../generated/graphql";

export function getAllTools({
  updatePaths,
  addPath,
  removePath,
  pastePath,
  bush,
  canvas,
  scope: paper
}: CanvasModel) {
  /** Select tool */
  function getSelectHandlers() {
    let from = new paper.Point(-1000, -1000);
    let rect = new paper.Path.Rectangle(from, from);
    let state: "moving" | "selecting" | "resizing" = "selecting";
    let selectedPaths: BushItemId[] = [];
    const tolerance = 6;
    let prevScale = 1;

    let copiedPaths: BushItemId[] | undefined;
    let copiedRect: paper.Path.Rectangle | undefined;

    function rectSizeIsValid() {
      if (rect) {
        const { width, height } = rect.internalBounds!;
        return width! >= 3 && height! >= 3;
      }
      return false;
    }
    function cloneSelectedPaths() {
      document.addEventListener("paste", handlePaste);
      if (copiedRect !== undefined) {
        copiedRect.remove();
      }
      if (copiedPaths !== undefined) {
        copiedPaths.forEach(p => p.path.remove());
      }
      if (!rect) return;

      copiedRect = rect.clone() as paper.Path.Rectangle;
      copiedRect.visible = false;

      copiedPaths = selectedPaths.map(p => {
        const newPath = p.path.clone();
        newPath.visible = false;
        return { ...p, path: newPath };
      });
    }
    async function handlePaste(event: ClipboardEvent) {
      if (event.clipboardData === null) return;
      const files = event.clipboardData.files;
      const prevTimestamp = store.canvasUploadImage.getAttribute(
        "data-timestamp"
      );
      const prevFilename = store.canvasUploadImage.getAttribute(
        "data-filename"
      );
      console.log(
        prevTimestamp,
        prevFilename,
        files.length > 0 && files[0].name
      );

      if (
        !(
          files.length > 0 &&
          files[0].type.includes("image") &&
          (prevTimestamp === null ||
            (prevFilename === files[0].name &&
              Date.now() - parseInt(prevTimestamp) < 1000))
        ) &&
        copiedRect !== undefined &&
        copiedPaths !== undefined
      ) {
        const { x, y } = rect.internalBounds;
        const { x: xPrev, y: yPrev, width, height } = copiedRect.internalBounds;
        const newPaths = await Promise.all(
          copiedPaths.map(bushItem => {
            const p = bushItem.path;
            p.position.x = x + p.position.x - xPrev - width / 2;
            p.position.y = y + p.position.y - yPrev - height / 2;
            p.visible = true;
            return pastePath(bushItem);
          })
        );

        selectedPaths = newPaths.reduce<BushItemId[]>((all, p) => {
          if (p !== null) all.push(p);
          return all;
        }, []);
        copiedPaths = undefined;

        rect = copiedRect;
        rect.visible = true;
        rect.position!.x = x;
        rect.position!.y = y;

        copiedRect = undefined;
        cloneSelectedPaths();
      }
    }
    function handleCut(event: ClipboardEvent) {
      cloneSelectedPaths();
      selectedPaths.forEach(p => {
        removePath(p);
      });
      rect.remove();
      event.preventDefault();
    }
    function handleCopy(event: ClipboardEvent) {
      cloneSelectedPaths();
      event.preventDefault();
    }
    function reloadSelectedPaths() {
      selectedPaths = updatePaths(selectedPaths);
    }
    function drawRect(from: paper.Point, to: paper.Point) {
      rect.remove();
      rect = new paper.Path.Rectangle(from, to);
      rect.strokeColor = RECT_COLOR;
      rect.dashArray = [5, 2];
    }
    function onMouseDown(event: paper.ToolEvent) {
      if (rectSizeIsValid()) {
        if (
          rect.hitTest(event.point, { segments: true, tolerance: tolerance })
        ) {
          state = "resizing";
          rect.data.bounds = rect.bounds!.clone();
          rect.data.scaleBase = event.point.subtract(rect.bounds!.center);
          return;
        }
        if (rect.contains(event.point)) {
          state = "moving";
          return;
        }
      }
      if (selectedPaths.length > 0) {
        document.removeEventListener("copy", handleCopy);
        document.removeEventListener("cut", handleCut);
      }
      rect.remove();

      state = "selecting";
      selectedPaths.forEach(p => (p.path.strokeColor = DEFAULT_STROKE_COLOR));
      from = event.point;
      rect = new paper.Path.Rectangle(from, event.point);
      store.hideMenu();
    }
    function onMouseDrag(event: paper.ToolEvent) {
      switch (state) {
        case "moving": {
          const delta = event.point.subtract(event.lastPoint);
          rect.position = rect.position!.add(delta);
          selectedPaths.forEach(p => {
            p.path.position = p.path.position!.add(delta);
          });
          break;
        }
        case "resizing": {
          const bounds = rect.data.bounds;
          const scale =
            event.point.subtract(bounds.center).length /
            rect.data.scaleBase.length;

          const newScale = scale / prevScale;
          rect.scale(newScale);
          selectedPaths.forEach(p => {
            p.path.scale(newScale, bounds.center);
          });
          prevScale = scale;
          break;
        }
        case "selecting":
          drawRect(from, event.point);
          break;
      }
    }
    function onMouseUp(event: paper.ToolEvent) {
      switch (state) {
        case "moving": {
          reloadSelectedPaths();
          break;
        }
        case "resizing": {
          reloadSelectedPaths();
          prevScale = 1;
          break;
        }
        case "selecting": {
          const rectRect = rect.internalBounds;
          const { x, y, width, height } = rectRect!;
          if (width < 3 || height < 3) {
            const { x, y } = event.point;
            const tolerancePointSelect = 4;
            const nearPaths = bush
              .search({
                minX: x - tolerancePointSelect,
                minY: y - tolerancePointSelect,
                maxX: x + tolerancePointSelect,
                maxY: y + tolerancePointSelect
              })
              .filter(p => {
                const ht = p.path.hitTest(event.point, {
                  segments: true,
                  stroke: true,
                  tolerance: tolerancePointSelect
                });
                return ht;
              });

            if (nearPaths.length > 0) {
              const selectedPath = nearPaths[0];
              selectedPath.path.strokeColor = new paper.Color(SELECTED_COLOR);
              selectedPaths = [selectedPath];
              const { minX, minY, maxX, maxY } = selectedPath;
              drawRect(
                new paper.Point(minX, minY),
                new paper.Point(maxX, maxY)
              );
            } else {
              store.showMenu((event as any).event);
            }
          } else {
            selectedPaths = bush.search({
              minX: x,
              minY: y,
              maxX: x + width,
              maxY: y + height
            });
            (window as any).selectedPaths = selectedPaths;
            selectedPaths = selectedPaths
              .filter(p => {
                const pathRect = p.path.internalBounds!;
                pathRect.height! += 1;
                pathRect.width! += 1;
                const percentIntersect =
                  pathRect.intersect(rectRect).area / pathRect.area;
                return percentIntersect > 0.7;
              })
              .map(p => {
                p.path.strokeColor = new paper.Color(SELECTED_COLOR);
                return p;
              });
          }
          if (selectedPaths.length == 0) {
            rect.remove();
            rect = new paper.Path.Rectangle(from, from);
          } else {
            document.addEventListener("copy", handleCopy);
            document.addEventListener("cut", handleCut);
          }
          break;
        }
      }
    }
    function onMouseMove(event: paper.ToolEvent) {
      if (rect) {
        const { width, height } = rect.internalBounds;
        if (width >= 3 && height >= 3) {
          if (
            rect.hitTest(event.point, { segments: true, tolerance: tolerance })
          ) {
            const center = rect.bounds.center;
            const point = event.point;
            if (center.x > point.x) {
              if (center.y > point.y) {
                canvas.style.cursor = "se-resize";
              } else {
                canvas.style.cursor = "ne-resize";
              }
            } else {
              if (center.y > point.y) {
                canvas.style.cursor = "ne-resize";
              } else {
                canvas.style.cursor = "se-resize";
              }
            }
            return;
          } else if (rect && rect.contains(event.point)) {
            canvas.style.cursor = cursors["move"];
            return;
          }
        }
      }
      canvas.style.cursor = cursors["select"];
    }

    return { onMouseDown, onMouseDrag, onMouseUp, onMouseMove };
  }
  /** Initialize select tool */
  const select = new paper.Tool() as ExtendedTool;
  const selectHandlers = getSelectHandlers();
  select.onMouseDown = selectHandlers.onMouseDown;
  select.onMouseDrag = selectHandlers.onMouseDrag;
  select.onMouseUp = selectHandlers.onMouseUp;
  select.onMouseMove = selectHandlers.onMouseMove;

  /** Eraser tool */
  function getEraseHandlers() {
    let path: paper.Path;
    function onMouseDown(event: paper.ToolEvent) {
      path = new paper.Path();
      path.add(event.point);
      store.hideMenu();
    }
    function onMouseDrag(event: paper.ToolEvent) {
      path.add(event.point);
      const { x, y } = event.point;
      const { x: x2, y: y2 } = event.lastPoint;
      const bushPaths = bush.search({
        minX: Math.min(x, x2),
        minY: Math.min(y, y2),
        maxX: Math.max(x, x2),
        maxY: Math.max(y, y2)
      });
      bushPaths.forEach(p => {
        if (p.path.intersects(path)) {
          removePath(p);
        }
      });
    }
    function onMouseUp(event: paper.ToolEvent) {
      if (path.length <= 3) {
        store.showMenu((event as any).event);
      }
    }
    return { onMouseDown, onMouseDrag, onMouseUp };
  }
  /** Initialize erase tool */
  const erase = new paper.Tool() as ExtendedTool;
  const eraseHandlders = getEraseHandlers();
  erase.onMouseDown = eraseHandlders.onMouseDown;
  erase.onMouseDrag = eraseHandlders.onMouseDrag;
  erase.onMouseUp = eraseHandlders.onMouseUp;

  /** Drawing tool */
  function getDrawHandlers() {
    let path: paper.Path;
    let pathSave: PaperPathData;
    function onMouseDown(event: paper.ToolEvent) {
      path = new paper.Path(DEFAUTL_PATH_OPTIONS);
      path.add(event.point);
      pathSave = {
        t: [new Date().getTime()],
        x: [event.point.x],
        y: [event.point.y]
      };
      store.hideMenu();
    }
    function onMouseDrag(event: paper.ToolEvent) {
      path.add(event.point);
      pathSave["t"].push(new Date().getTime());
      pathSave["x"].push(event.point.x);
      pathSave["y"].push(event.point.y);
    }
    function onMouseUp(event: paper.ToolEvent) {
      if (path.length > 3) {
        path.simplify(1.5);
        addPath(path, pathSave);
      } else {
        path.remove();
        store.showMenu((event as any).event);
      }
    }
    return { onMouseDown, onMouseDrag, onMouseUp };
  }

  /** Initialize drawing tool */
  const draw = new paper.Tool() as ExtendedTool;
  const drawHandlers = getDrawHandlers();
  draw.onMouseDown = drawHandlers.onMouseDown;
  draw.onMouseDrag = drawHandlers.onMouseDrag;
  draw.onMouseUp = drawHandlers.onMouseUp;
  draw.activate();

  /** Drag canvas with move tool */
  function updateScrollPosition(click: [number, number], event: MouseEvent) {
    canvas.parentElement!.scrollTo(
      click[0] - event.pageX,
      click[1] - event.pageY
    );
  }
  /** Move tool configuration */
  function MoveMouseHandlers() {
    let click: null | [number, number] = null;
    let isDragging = false;

    const onMouseDownMove = function(event: MouseEvent) {
      click = [
        event.pageX + canvas.parentElement!.scrollLeft,
        event.pageY + canvas.parentElement!.scrollTop
      ];
      store.hideMenu();
    };
    const onMouseMoveMove = function(event: MouseEvent) {
      if (click !== null) {
        updateScrollPosition(click, event);
        isDragging = true;
      }
    };
    const onMouseUpMove = function(event: MouseEvent) {
      if (!isDragging) {
        store.showMenu(event);
      }
      click = null;
      isDragging = false;
    };

    return {
      mousedown: onMouseDownMove,
      mousemove: onMouseMoveMove,
      mouseup: onMouseUpMove
    };
  }

  const moveHandlers = MoveMouseHandlers();

  /** Add move tool event listeners */
  function addMoveHandlers() {
    const _canvasScroll = document.getElementById("canvas-scroll")!;
    Object.entries(moveHandlers).forEach(([eventType, handler]) => {
      _canvasScroll.addEventListener(eventType as any, handler);
    });
  }
  /** Remove move tool event listeners */
  function removeMoveHandlers() {
    const _canvasScroll = document.getElementById("canvas-scroll")!;
    Object.entries(moveHandlers).forEach(([eventType, handler]) => {
      _canvasScroll.removeEventListener(eventType as any, handler);
    });
  }

  /** Initialize move tool */
  const move = new paper.Tool() as ExtendedTool;
  move.onActivate = () => {
    addMoveHandlers();
  };
  move.onDeactivate = () => {
    removeMoveHandlers();
  };

  /** Pen tool */
  type PointerType = "mouse" | "pen" | "touch";
  function getPenHandlers() {
    let type: PointerType;
    let handlers: {
      onMouseDown: (e: any) => any;
      onMouseDrag: (e: any) => any;
      onMouseUp: (e: any) => any;
      onMouseMove?: (e: any) => any;
    };
    const dummyTool = new paper.Tool() as ExtendedTool;
    dummyTool.onActivate = () => {
      canvas.addEventListener("pointerdown", onPointerDown);
    };
    dummyTool.onDeactivate = () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
    };

    function getPaperEvent(event: PointerEvent) {
      return {
        event,
        point: new paper.Point(event.offsetX, event.offsetY)
      };
    }

    function onPointerDown(event: PointerEvent) {
      type = event.pointerType as PointerType;

      switch (type) {
        case "mouse":
          handlers = selectHandlers;
          break;
        case "pen":
          if (event.button === 5 && event.buttons === 32) {
            handlers = eraseHandlders;
          } else {
            handlers = drawHandlers;
          }
          break;
        case "touch":
          if (!dummyTool.isActive()) {
            dummyTool.activate();
          }
          return;
      }
      if (dummyTool.isActive()) {
        draw.activate();
      }

      const paperEvent = getPaperEvent(event);
      handlers.onMouseDown(paperEvent);
    }

    function onMouseDrag(event: any) {
      handlers.onMouseDrag(event);
    }

    function onMouseUp(event: any) {
      handlers.onMouseUp(event);
    }

    function onMouseMove(event: any) {
      if (handlers.onMouseMove) handlers.onMouseMove(event);
    }
    return { onPointerDown, onMouseDrag, onMouseUp, onMouseMove };
  }

  return {
    tools: { move, select, draw, erase },
    getPenHandlers,
    getDrawHandlers,
    addMoveHandlers,
    removeMoveHandlers
  };
}

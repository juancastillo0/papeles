import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import styled from "styled-components";
import { useStore } from "../services/Store";
import { cursors } from "../services/utils-canvas";
import { PredictionMenus } from "./PredictionMenu";

type Props = {};

const StyledCanvasScroll = styled.div`
  margin: 0.3em;
  position: relative;
  overflow: auto;
  touch-action: none;
  border: 1px solid var(--aux-color);
  border-radius: 12px;
  max-width: 100%;
  height: 100%;
  background: var(--primary-color);
`;

export const Canvas: React.FC<Props> = observer(() => {
  const store = useStore();

  const [canvasScroll, setCanvasScroll] = useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (canvasScroll) {
      store.currentCanvas.initialize(canvasScroll);
    }
  }, [store, store.currentCanvas, canvasScroll]);

  const cursor = store.currentTool ? cursors[store.currentTool] : "";
  const touchAction =
    (store.currentTool && store.currentTool === "move") || store.isUsingPen
      ? "auto"
      : "none";

  return (
    <StyledCanvasScroll
      style={{
        cursor,
        touchAction
      }}
      ref={setCanvasScroll}
      id="canvas-scroll"
    >
      <PredictionMenus/>
    </StyledCanvasScroll>
  );
});

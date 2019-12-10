import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { storeContext } from "../services/Store";
import styled from "styled-components";
import { cursors } from "../services/utils-canvas";

type Props = {};

const StyledCanvasScroll = styled.div`
  margin: 0.3em;
  overflow: auto;
  touch-action: none;
  border: 1px solid var(--aux-color);
  border-radius: 12px;
  max-width: 100%;
  height: 100%;
`;

export const Canvas: React.FC<Props> = observer(() => {
  const store = React.useContext(storeContext);

  const [canvasScroll, setCanvasScroll] = useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (store.currentCanvas && canvasScroll) {
      store.currentCanvas.initialize(canvasScroll, store.isUsingPen);
    }
  }, [store.isUsingPen, store.currentCanvas, canvasScroll]);

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
    />
  );
});

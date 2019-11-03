import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { storeContext } from "../services/Store";
import styled from "styled-components";

type Props = {};

const StyledDiv = styled.div`
  margin: 0.3em;
  overflow: auto;
  touch-action: none;
  border: 1px solid var(--aux-color);
  border-radius: 10px;
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

  return <StyledDiv ref={setCanvasScroll} id="canvas-scroll"/>;
});

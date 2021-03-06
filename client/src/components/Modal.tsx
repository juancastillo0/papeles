import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components";
import { useStore } from "../services/Store";

const StyledDiv = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  background: rgba(240, 240, 240, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;

  #modal-container{
    max-height: 90%;
    overflow: auto;
  }
`;
export const Modal: React.FC = observer(() => {
  const store = useStore();
  const [lastUpdate, setLastUpdate] = React.useState(0);
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(
    null
  );
  React.useEffect(() => {
    if (containerRef !== null && store.modal !== null) {
      const listener = (e: MouseEvent | TouchEvent) => {
        console.log("containerRef.contains(e.target as any)");
        if (!containerRef.contains(e.target as any) && store.modal !== null) {
          store.setModal(null);
        }
      };
      const listKey = (e: KeyboardEvent) => {
        if (e.keyCode === 27) {
          store.setModal(null);
        }
      };
      window.addEventListener("keyup", listKey);
      window.addEventListener("mousedown", listener);
      window.addEventListener("touchstart", listener);

      return () => {
        window.removeEventListener("mousedown", listener);
        window.removeEventListener("touchstart", listener);
        window.removeEventListener("keyup", listKey);
      };
    }
    return undefined;
  }, [containerRef, store, store.modal]);

  return (
    <StyledDiv style={store.modal === null ? { display: "none" } : {}}>
      <div id="modal-container" ref={setContainerRef}>
        {store.modal}
      </div>
    </StyledDiv>
  );
});

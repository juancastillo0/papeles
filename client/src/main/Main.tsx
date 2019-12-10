import React from "react";
import { observer } from "mobx-react-lite";
import { Canvas } from "./Canvas";
import { CanvasList } from "./CanvasList";
import Resizer from "../components/Resizer";
import { VariablesTable } from "./VariablesTable";
import styled from "styled-components";
import { CanvasMenu } from "./CanvasMenu";
import { useStore } from "../services/Store";

const StyledDiv = styled.div`
  height: 100%;
  width: 100%;

  margin-top: 0.3em;

  #list-col {
    min-width: 200px;
    flex: 2;
  }
  #canvas-col {
    max-width: 100%;
    @media (min-width: 550px) {
      min-width: 400px;
    }
    flex: 6;
  }
  #table-col {
    min-width: 230px;
    flex: 3;
  }
`;
type Props = {};

export const Main: React.FC<Props> = observer(() => {
  const store = useStore();
  return (
    <StyledDiv className="row">
      {store.showCanvasList && (
        <Resizer id="list-col" showResizer={store.showCanvas}>
          <CanvasList />
        </Resizer>
      )}
      <div className={"col " + (!store.showCanvas && "hidden")} id="canvas-col">
        <CanvasMenu showAlways={true} />
        <CanvasMenu showAlways={false} />
        <Canvas />
      </div>
      {store.showTable && (
        <Resizer id="table-col" leftOrTop={true} showResizer={store.showCanvas}>
          <VariablesTable />
        </Resizer>
      )}
    </StyledDiv>
  );
});

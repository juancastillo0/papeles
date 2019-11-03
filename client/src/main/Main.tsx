import React from "react";
import { observer } from "mobx-react-lite";
import { Canvas } from "./Canvas";
import { CanvasList } from "./CanvasList";
import Resizer from "../components/Resizer";
import { VariablesTable } from "./VariablesTable";
import styled from "styled-components";
import { CanvasMenu } from "./CanvasMenu";

const StyledDiv = styled.div`
  height: 100%;
  width: 100%;

  margin-top: 0.3em;

  #list-col {
    min-width: 200px;
    flex: 2;
  }
  #canvas-col {
    min-width: 300px;
    flex: 6;
  }
  #table-col {
    min-width: 230px;
    flex: 3;
  }
`;
type Props = {};

export const Main: React.FC<Props> = observer(() => {
  return (
    <StyledDiv className="row">
      <Resizer id="list-col">
        <CanvasList />
      </Resizer>
      <div className="col" id="canvas-col">
        <CanvasMenu showAlways={true} />
        <CanvasMenu showAlways={false} />
        <Canvas />
      </div>
      <Resizer id="table-col" leftOrTop={true}>
        <VariablesTable />
      </Resizer>
    </StyledDiv>
  );
});

import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components";
import { Prediction, PredictionGraph } from "../services/CanvasPredictor";
import { useCurrentCanvas, useStore } from "../services/Store";
import { EdgeType } from "../tensorflow/utils-tensorflow";
type Props = {};

export const PredictionMenus: React.FC<Props> = observer(() => {
  const canvas = useCurrentCanvas();

  return (
    <>
      {canvas.canvasPredictor.graphs.map((g, index) => (
        <GraphPredictionMenu key={index} graph={g} />
      ))}
    </>
  );
});

const GraphPredictionMenu: React.FC<{ graph: PredictionGraph }> = observer(
  ({ graph }) => {
    const [menu, setMenu] = React.useState<null | HTMLDivElement>(null);
    const symbols: any[] = [];
    for (const node of graph.nodes.values()) {
      if (
        (node.parentEdge && node.parentEdge.data === EdgeType.SAME) ||
        node.data.trueLabel
      ) {
        continue;
      }
      symbols.push(
        <SymbolPredictionMenu key={node.id} prediction={node.data} />
      );
    }
    return symbols.length > 0 ? <div ref={setMenu}>{symbols}</div> : null;
  }
);

function getSymbolPosition(prediction: Prediction) {
  const maxY = prediction.path.maxY;
  const minX = prediction.path.minX;
  return { top: maxY + 25, left: minX - 25 };
}
const StyledSymbolPredictionMenu = styled.div`
  position: absolute;
`;
const SymbolButton = styled.button`
  width: 33px;
  height: 33px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  .mjx-container {
    margin: 0 !important;
  }
`;

const SymbolPredictionMenu: React.FC<{ prediction: Prediction }> = observer(
  ({ prediction }) => {
    const [menu, setMenu] = React.useState<null | HTMLDivElement>(null);
    const store = useStore();
    const position = getSymbolPosition(prediction);
    const buttons = prediction.preds.map((p, i) => (
      <SymbolButton
        key={p.label}
        onClick={() => {
          prediction.setLabel(p.label);
        }}
        dangerouslySetInnerHTML={{
          __html: store.predictor.mapSymSpan[p.label].children[0]!.innerHTML
        }}
      ></SymbolButton>
    ));

    // React.useEffect(()=>{
    //   if (menu){
    //     ((window as any).MathJax as any).typeset([menu]);
    //   }
    // }, [menu])
    return (
      <StyledSymbolPredictionMenu ref={setMenu} style={position}>
        <div className="d-flex">
          {buttons[0]}
          {buttons[1]}
        </div>
        <div className="d-flex">
          {buttons[2]}
          {buttons[3]}
        </div>
      </StyledSymbolPredictionMenu>
    );
  }
);

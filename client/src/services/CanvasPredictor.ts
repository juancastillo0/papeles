import { action, computed, observable } from "mobx";
import { actionAsync } from "mobx-utils";
import { PaperPathBoxInput } from "../generated/graphql";
import { Predictor } from "../tensorflow/predict";
import { Graph } from "../tensorflow/utils-graph";
import { EdgeType } from "../tensorflow/utils-tensorflow";
import { BushItemId, CanvasModel, CreatedPath } from "./CanvasModel";
import { PathIdentifier } from "./IndexedDB";
import { Box } from "./utils-box";

export class Prediction {
  constructor(path: BushItemId, preds: { label: string; proba: number }[]) {
    this.path = path;
    this.preds = observable.array(preds);
  }
  path: BushItemId;
  @observable preds: { label: string; proba: number }[];
  @observable trueLabel?: string;

  updatePreds(newPreds: { label: string; proba: number }[]) {
    this.preds = observable.array(newPreds);
  }

  setLabel(label: string) {
    this.trueLabel = label;
  }

  isSimilarPrediction(preds: { label: string; proba: number }[]) {
    return (
      this.preds[0].label == preds[0].label ||
      this.preds.reduce<number>((prev, l) => {
        return preds.find(v => v.label === l.label) ? prev + 1 : prev;
      }, 0) >= 2
    );
  }
}

export class PredictionGraph extends Graph<Prediction, BushItemId, EdgeType> {
  @computed
  get paths() {
    const paths: BushItemId[] = [];
    for (const p of this.nodes.values()) {
      paths.push(p.data.path);
    }
    return paths;
  }

  @computed
  get box() {
    return Box.mergeBoxes(this.paths);
  }

  @computed
  get percentile75() {
    const percentile = 0.75;

    const sortedNodes = this.paths.sort(
      (a, b) => Box.getDiagonalSize(a) - Box.getDiagonalSize(b)
    );
    const index = Math.floor(sortedNodes.length * percentile);

    return Box.getDiagonalSize(sortedNodes[index]);
  }

  minDistance(box: PaperPathBoxInput) {
    return Box.minDistance(this.box, box);
  }
}

// export function getIdsFromPrediction(p: Prediction) {
//   return p.paths.map(n=>`${n.id} ${n.userId} ${n.device}`);
// }

export function getIdFromPrediction(p: Prediction | BushItemId) {
  const path = "preds" in p ? p.path : p;
  return getIdFromBushItem(path);
}

export function getIdFromBushItem(n: Omit<PathIdentifier, "paperId">) {
  return `${n.id} ${n.userId} ${n.device}`;
}

export class CanvasPredictor {
  constructor(private canvas: CanvasModel, private predictor: Predictor) {}

  @observable
  graphs = observable.array<PredictionGraph>([]);

  @actionAsync
  predict = async (path: CreatedPath) => {
    // const graph = this.getOrCreateClosestGraph(path);

    // let predictions = await task(
    //   this.predictor.predict({
    //     bush: this.canvas.bush,
    //     ctx: this.canvas.canvas.getContext("2d")!,
    //     ecuGraph: graph,
    //     paths: [path]
    //   })
    // );

    // if (predictions) {
    //   const nodes = predictions
    //     .map(p => {
    //       let node = graph.getNode(p);
    //       if (!node) {
    //         node = graph.addNode(p);
    //       } else if (node.data.trueLabel !== undefined) {
    //         node.data.updatePreds(p.preds);
    //       }
    //       return node;
    //     })
    //     .filter(node => !node.data.trueLabel);

    //   predictions = this.searchForSameSymbol(predictions, graph);
    //   console.log(predictions);
    // }
  };

  @action.bound
  getOrCreateClosestGraph(path: CreatedPath) {
    let graph: PredictionGraph;
    if (this.graphs.length === 0) {
      graph = new PredictionGraph(getIdFromPrediction);
      this.graphs.push(graph);
    } else {
      const pathBox = new Box({ box: path });
      const box = this.graphs
        .map((g, i) => ({ dist: pathBox.minDistance(g.box), i }))
        .reduce((a, b) => (a.dist > b.dist ? b : a), { dist: 9999999, i: 0 });
      console.log(box, this.graphs[box.i].percentile75);
      if (box.dist < this.graphs[box.i].percentile75 * 3) {
        graph = this.graphs[box.i];
      } else {
        graph = new PredictionGraph(getIdFromPrediction);
        this.graphs.push(graph);
      }
    }
    return graph;
  }

  searchForSameSymbol(predictions: Prediction[], graph: PredictionGraph) {
    const bush = this.canvas.bush;

    for (const pred of predictions) {
      bush.search(Box.withPadding(pred.path, graph.percentile75)).filter(p => {
        const currPred = graph.getNode(p);
        return (
          currPred &&
          getIdFromBushItem(p) !== getIdFromBushItem(pred.path) &&
          pred.isSimilarPrediction(currPred.data.preds)
        );
      });
    }
    return predictions;
  }
}

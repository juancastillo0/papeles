import * as tf from "@tensorflow/tfjs";
import { Prediction } from "../services/CanvasPredictor";
import { mapSymLab } from "./map-symbols-label";
import { canvasImageFromTensor, dataFromPaths, Payload } from "./utils-tensorflow";
(window as any).tf = tf;
tf.setBackend("cpu");

export class Predictor {
  mapLabSym: { [key: number]: string };
  mapSymSpan: { [key: string]: HTMLSpanElement };
  model: tf.GraphModel | undefined;

  constructor() {
    this.mapLabSym = {};
    this.mapSymSpan = {};
    const rootDiv = document.getElementById("latex-symbols")!;

    Object.entries(mapSymLab).forEach(([key, value]) => {
      this.mapLabSym[value] = key;
      const span = document.createElement("span");
      span.innerHTML = `$$${key}$$`;
      rootDiv.appendChild(span);
      this.mapSymSpan[key] = span;
    });
    ((window as any).MathJax as any).typesetPromise([rootDiv]);
    // this.loadModel();
  }

  async loadModel() {
    this.model = await tf.loadGraphModel("./assets/web_model/model.json");
    console.log("loading model...");
    await this.model.executeAsync([
      tf.tensor([[0.1, 0.2, 0.3, 0.4, 0]]),
      tf.ones([1, 28, 28, 1])
    ]);
    console.log("Done loading");
  }

  async predict(payload: Payload, showImage = true) {
    if (!this.model) return console.log("Model not loaded");

    const { tensor, boxes, paths } = await dataFromPaths(payload);
    (window as any).tensor = tensor;

    if (showImage) {
      const imageData = await canvasImageFromTensor(tensor);
      payload.ctx.putImageData(imageData, 0, 0);
    }

    const ans = await this.model.executeAsync([boxes, tensor]);
    (window as any).ans = ans;

    let [
      predBoxesProbas,
      predBoxes,
      predBoxesLabels,
      predMaskProbas,
      predMaskLabels
    ] = ans;

    const [maskLabels, probas] = await Promise.all([
      predMaskLabels.data(),
      predMaskProbas.data()
    ]);

    const preds: { label: string; proba: number }[][] = [];
    let currPathPred: { label: string; proba: number }[] = [];
    for (let i = 0; i < maskLabels.length; i++) {
      currPathPred.push({
        label: this.mapLabSym[maskLabels[i]],
        proba: probas[i]
      });

      if (currPathPred.length % 4 === 0) {
        preds.push(currPathPred);
        currPathPred = [];
      }
    }

    const predictions: Prediction[] = [];
    for (let i = 0; i < preds.length; i++) {
      predictions.push(new Prediction(paths[i], preds[i]));
    }
    return predictions;
  }
}

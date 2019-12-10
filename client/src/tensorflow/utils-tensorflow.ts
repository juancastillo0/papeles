import * as tf from "@tensorflow/tfjs";
import RBush from "rbush";
import { BushItemId } from "../services/CanvasModel";
import { PredictionGraph } from "../services/CanvasPredictor";
import { Box } from "../services/utils-box";

export enum EdgeType {
  "RIGHT" = "RIGHT",
  "TOP" = "TOP",
  "BOTTOM" = "BOTTOM",
  "TOP_RIGHT" = "TOP_RIGHT",
  "BOTTOM_RIGHT" = "BOTTOM_RIGHT",
  "SAME" = "SAME"
}

export type Payload = {
  ecuGraph: PredictionGraph;
  bush: RBush<BushItemId>;
  paths: BushItemId[];
  ctx: CanvasRenderingContext2D;
};

const RGB_WEIGHTS: [number, number, number] = [0.2989, 0.587, 0.114];

export function cwhFromBox(box: [number, number, number, number]) {
  return [
    (box[0] + box[2]) / 2,
    (box[1] + box[3]) / 2,
    box[2] - box[0],
    box[3] - box[1]
  ];
}

export function boxFromCwh(cwh: [number, number, number, number]) {
  return [cwh[0] - cwh[2], cwh[1] - cwh[3], cwh[0] + cwh[2], cwh[1] + cwh[3]];
}

export function pathBoundsToCanvasBoxes(paths: BushItemId[], padding = 3) {
  const {minX, minY, maxX, maxY} = Box.mergeBoxes(paths);
  const pathsBoxes = paths.map(path => {
    const { x, y, width, height } = path.path.internalBounds;
    return [
      (x - minX) * 1.5 + padding,
      (y - minY) * 1.5 + padding,
      (x + width - minX) * 1.5 + padding,
      (y + height - minY) * 1.5 + padding
    ];
  });
  return {
    limitBox: [
      minX * 1.5 - padding,
      minY * 1.5 - padding,
      (maxX - minX) * 1.5 + 2 * padding,
      (maxY - minY) * 1.5 + 2 * padding
    ] as [number, number, number, number],
    pathsBoxes
  };
}

function closeBoxFromPaths(
  { ecuGraph, bush, paths }: Payload,
  padding: number,
  deltaLenghts = 2,
  maxDeltaLenghts = 4
) {
  const path = paths[paths.length - 1];
  const { x, y, width, height } = path.path.internalBounds;
  let closePaths: BushItemId[];
  let medianLenght: number;

  if (ecuGraph.isEmpty) {
    closePaths = [path];
    medianLenght = Math.max(width, height);
  } else {
    medianLenght = ecuGraph.percentile75;
    const delta = medianLenght * deltaLenghts;
    closePaths = bush
      .search({
        minX: x - delta,
        minY: y - delta,
        maxX: x + width + delta,
        maxY: y + height + delta
      })
      .filter(currPath => {
        if (ecuGraph.getNode(currPath) === undefined) {
          return false;
        }
        const {
          x: x2,
          y: y2,
          width: width2,
          height: height2
        } = currPath.path.internalBounds;
        const maxDist = Math.max(
          Math.abs(x - x2),
          Math.abs(y - y2),
          Math.abs(x + width - (x2 + width2)),
          Math.abs(y + height - (y2 + height2))
        );
        return maxDist / medianLenght < maxDeltaLenghts;
      });
  }
  const { limitBox, pathsBoxes } = pathBoundsToCanvasBoxes(closePaths, padding);
  medianLenght *= 1.5;
  return { limitBox, pathsBoxes, closePaths, medianLenght };
}

export function getTensorFromImage(
  ctx: CanvasRenderingContext2D,
  limitBox: [number, number, number, number]
) {
  const im = ctx.getImageData(...limitBox);

  const imData = im.data;
  const imTensorData: number[][][] = [];
  let row: number[][], pixel: number[];
  for (let i = 0; i < im.height; i++) {
    row = [];
    for (let j = 0; j < im.width; j++) {
      pixel = [];
      for (let color = 0; color < 3; color++) {
        pixel.push(imData[(i * im.width + j) * 4 + 3]);
      }
      row.push(pixel);
    }
    imTensorData.push(row);
  }
  return imTensorData;
}

export async function dataFromPaths(
  payload: Payload,
  normalized = true,
  padding = 7
) {
  const {
    limitBox,
    pathsBoxes: boxes,
    closePaths,
    medianLenght
  } = closeBoxFromPaths(payload, padding);
  console.log(limitBox);

  const imTensorData = getTensorFromImage(payload.ctx, limitBox);

  const scaler = Math.max(
    28 / medianLenght,
    24 / Math.min(limitBox[3], limitBox[2])
  );

  const newShape: [number, number] = [
    Math.round(limitBox[3] * scaler), //height
    Math.round(limitBox[2] * scaler) //width
  ];
  console.log(boxes, scaler, newShape);

  const imgTensor = tf.tidy(() => {
    let img = rgbToGrayscale([imTensorData] as any);
    img = tf.image.resizeBilinear<tf.Tensor<tf.Rank.R4>>(img, newShape);
    if (normalized) img = tf.div(img, img.max());
    img = tf.where(tf.greater(img, 0.7), tf.onesLike(img), img);
    // img = tf.add(img, 0.001);
    return img;
  });

  const boxesNorm = tf.tidy(() => {
    return tf
      .tensor(boxes)
      .div([[limitBox[2], limitBox[3], limitBox[2], limitBox[3]]])
      .concat(tf.zeros([boxes.length, 1]), -1);
  });
  boxesNorm.print();

  return { tensor: imgTensor, boxes: boxesNorm, paths: closePaths };
}

export function rgbToGrayscale(tensor: tf.Tensor<tf.Rank.R4>) {
  return tf.tidy(
    () => tf.mul(tensor, RGB_WEIGHTS).sum(-1, true) as tf.Tensor<tf.Rank.R4>
  );
}

export async function canvasImageFromTensor(tensor: tf.Tensor) {
  tensor = tensor.squeeze();
  if (tensor.shape.length != 2) {
    throw new Error();
  }
  let [height, width] = tensor.shape;
  let view = new Uint8ClampedArray(height * width * 4);
  const data = await tensor.data();
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let color = 0;
      for (color; color < 3; color++) {
        view[(i * width + j) * 4 + color] = 255 * (1 - data[i * width + j]);
      }
      view[(i * width + j) * 4 + color] = 255;
    }
  }
  return new ImageData(view, width, height);
}

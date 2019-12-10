import { PaperPathBoxInput } from "../generated/graphql";

export type Chw = { x: number; y: number; w: number; h: number };

export class Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor({ box }: { box: PaperPathBoxInput });
  constructor({ cwh }: { cwh: Chw });
  constructor(params: { box: PaperPathBoxInput } | { cwh: Chw }) {
    if ("box" in params) {
      const box = params.box;
      if (box.minX > box.maxX) throw new Error();
      if (box.minY > box.maxY) throw new Error();

      this.minX = box.minX;
      this.minY = box.minY;
      this.maxX = box.maxX;
      this.maxY = box.maxY;
    } else {
      const cwh = params.cwh;
      if (cwh.w <= 0) throw new Error();
      if (cwh.h <= 0) throw new Error();

      this.minX = cwh.x - cwh.w / 2;
      this.minY = cwh.y - cwh.h / 2;
      this.maxX = cwh.x + cwh.w / 2;
      this.maxY = cwh.y + cwh.h / 2;
    }
  }

  get box() {
    return {
      minX: this.minX,
      minY: this.minY,
      maxX: this.maxX,
      maxY: this.maxY
    };
  }

  static cwh(box: PaperPathBoxInput) {
    return {
      x: (box.minX + box.maxX) / 2,
      y: (box.minY + box.maxY) / 2,
      w: box.maxX - box.minX,
      h: box.maxY - box.minY
    };
  }
  get cwh() {
    return Box.cwh(this);
  }

  static minDistance(box: PaperPathBoxInput, box2: PaperPathBoxInput) {
    const intersectY = box2.maxY >= box.minY && box2.minY <= box.maxY;
    const intersectX = box2.maxX >= box.minX && box2.minX <= box.maxX;

    if (intersectY && intersectX) {
      return 0;
    } else if (intersectX) {
      return box2.maxY < box.minY ? box.minY - box2.maxY : box2.minY - box.maxY;
    } else if (intersectY) {
      return box2.maxX < box.minX ? box.minX - box2.maxX : box2.minX - box.maxX;
    } else if (box2.maxY < box.minY) {
      return Math.sqrt(
        box2.maxX < box.minX
          ? Math.pow(box2.maxX - box.minX, 2) +
              Math.pow(box2.maxY - box.minY, 2)
          : Math.pow(box2.minX - box.maxX, 2) +
              Math.pow(box2.maxY - box.minY, 2)
      );
    } else {
      return Math.sqrt(
        box2.maxX < box.minX
          ? Math.pow(box2.maxX - box.minX, 2) +
              Math.pow(box2.minY - box.maxY, 2)
          : Math.pow(box2.minX - box.maxX, 2) +
              Math.pow(box2.minY - box.maxY, 2)
      );
    }
  }
  minDistance(box: PaperPathBoxInput) {
    return Box.minDistance(this, box);
  }

  static getDiagonalSize(box: PaperPathBoxInput) {
    return Math.sqrt(
      Math.pow(box.maxX - box.minX, 2) + Math.pow(box.maxY - box.minY, 2)
    );
  }
  getDiagonalSize() {
    return Box.getDiagonalSize(this);
  }

  static withPadding(
    box: PaperPathBoxInput,
    padding: number
  ): PaperPathBoxInput {
    return {
      minX: box.minX - padding,
      maxX: box.maxX + padding,
      maxY: box.maxY + padding,
      minY: box.minX - padding
    };
  }

  static mergeBoxes( boxes: PaperPathBoxInput[]){
    let [minX, minY] = [9999999999, 9999999999];
    let [maxX, maxY] = [0, 0];
    boxes.forEach(b => {
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    });
    return {minX, minY, maxX, maxY};
  }


}

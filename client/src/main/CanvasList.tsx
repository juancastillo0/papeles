import React from "react";
import { observer } from "mobx-react-lite";
import { storeContext } from "../services/Store";
import { NewCanvasForm } from "./NewCanvasForm";

function makeClassNames(values: [boolean, string][]) {
  return values.reduce((prev, v) => {
    if (v[0]) prev += " " + v[1];
    return prev;
  }, "");
}

type Props = {};

export const CanvasList: React.FC<Props> = observer(() => {
  const store = React.useContext(storeContext);

  let canvasList;
  if (store.canvasMap.size > 0) {
    canvasList = [];
    for (let [key, canvas] of store.canvasMap.entries()) {
      canvasList.push(
        <button
          key={key}
          type="button"
          className={makeClassNames([
            [store.currentCanvasName === key, "active"],
            [true, "list-item"]
          ])}
          onClick={() => store.openCanvas(key)}
        >
          {canvas.name}
        </button>
      );
    }
  } else {
    canvasList = <div></div>;
  }

  return (
    <div>
      <div className="col">
        {canvasList}
        <NewCanvasForm />
      </div>
      <div>
        <h2>Compartidos</h2>
      </div>
    </div>
  );
});

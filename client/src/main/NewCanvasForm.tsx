import React from "react";
import { observer } from "mobx-react-lite";
import { storeContext } from "../services/Store";

type Props = {};

export const NewCanvasForm: React.FC<Props> = observer(() => {
  const store = React.useContext(storeContext);
  const [creating, setCreating] = React.useState(false);
  const [canvasName, setCanvasName] = React.useState("");
  const onSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      console.log(canvasName);
      store.createCanvas(canvasName);
    },
    [canvasName]
  );
  const onReset = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setCanvasName("");
      setCreating(false);
    },
    [canvasName]
  );

  return creating ? (
    <form onSubmit={onSubmit} onReset={onReset} className="list-item">
      <button type="reset" className="round-button">
        x
      </button>
      <input onChange={e => setCanvasName(e.target.value)} value={canvasName} />
      <button type="submit" className="round-button">
        +
      </button>
    </form>
  ) : (
    <button
      type="button"
      className="list-item"
      onClick={() => setCreating(b => !b)}
    >
      Crear
    </button>
  );
});

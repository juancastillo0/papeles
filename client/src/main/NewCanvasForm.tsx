import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../services/Store";
import { ListItem } from "./CanvasList";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {};

const NewCanvasFormStyled = styled.form`
  display: flex;
  max-width: 100%;
  input {
    width: 100%;
    padding: 0.7em 0.6em;
  }
  button {
    width: 2.7em;
  }
`;

export const NewCanvasForm: React.FC<Props> = observer(() => {
  const store = useStore();
  const [creating, setCreating] = React.useState(false);
  const [canvasName, setCanvasName] = React.useState("");

  const onSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      event.stopPropagation();
      console.log(canvasName);
      store.createCanvas(canvasName);
      onReset();
    },
    [canvasName]
  );
  const onReset = React.useCallback(
    (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      setCanvasName("");
      setCreating(false);
    },
    [canvasName]
  );

  return creating ? (
    <NewCanvasFormStyled onSubmit={onSubmit} onReset={onReset}>
      <button type="reset">
        <FontAwesomeIcon icon="times" size="1x" />
      </button>
      <input onChange={e => setCanvasName(e.target.value)} value={canvasName} />
      <button type="submit">
        <FontAwesomeIcon icon="plus" size="1x" />
      </button>
    </NewCanvasFormStyled>
  ) : (
    <ListItem type="button" onClick={() => setCreating(b => !b)}>
      <FontAwesomeIcon icon="plus" size="1x" style={{ paddingRight: 10 }} />
      Crear
    </ListItem>
  );
});

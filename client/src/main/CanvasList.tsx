import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../services/Store";
import { NewCanvasForm } from "./NewCanvasForm";
import { ToggleCanvasListButton } from "./CanvasMenu";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ItemProps = { active?: boolean };

export const ListItem = styled.button<ItemProps>`
  background: ${p =>
    p.active ? p.theme.colors.secondary : p.theme.colors.primaryLight};
  color: ${p => (p.active ? p.theme.colors.primaryLight : "black")};
  border: 0;
  border-bottom: 1px solid
    ${p => (p.active ? p.theme.colors.secondary : p.theme.colors.auxLight)};
  border-top: 1px solid
    ${p => (p.active ? p.theme.colors.secondary : p.theme.colors.auxLight)};
  padding: 0.7em;
`;

type Props = {};

const SearchDiv = styled.div`
  display: flex;
  align-items: center;
  padding: 0.55em 0.5em;

  svg {
    width: 100%;
    align-self: center;
  }

  input {
    width: 100%;
    padding: 0.5em;
  }
`;

const CanvasListStyled = styled.div``;

export const CanvasList: React.FC<Props> = observer(() => {
  const store = useStore();

  let canvasList;
  if (store.canvasMap.size > 0) {
    canvasList = [];
    for (let [key, canvas] of store.canvasMap.entries()) {
      canvasList.push(
        <ListItem
          key={key}
          type="button"
          active={store.currentCanvasId === key}
          onClick={() => store.openCanvas(key)}
        >
          {canvas.name}
        </ListItem>
      );
    }
  } else {
    canvasList = <div></div>;
  }

  const searchInput = (
    <SearchDiv>
      <div style={{ height: "100%", padding: "0 0.4em", display: "flex" }}>
        <FontAwesomeIcon icon="search" size="lg" />
      </div>
      <input placeholder="Busca" />
      {!store.showCanvas && <ToggleCanvasListButton />}
    </SearchDiv>
  );

  return (
    <div>
      <CanvasListStyled className="col">
        {searchInput}
        {canvasList}
        <NewCanvasForm />
      </CanvasListStyled>
      <div>
        <h2>Compartidos</h2>
      </div>
    </div>
  );
});

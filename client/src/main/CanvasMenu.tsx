import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import { storeContext } from "../services/Store";
import { ALL_TOOLS_TYPES } from "../services/utils-canvas";

const StyledCanvasMenu = styled.div`
  position: fixed;
  padding: 5px;
  border: 1px solid var(--aux-color);
  border-radius: 10px;
  background-color: var(--primary-color);
  z-index: 2;
  margin: 0 0.3em;
  button {
    background-color: var(--primary-color); 
    border: 0;
    margin: 0 2px;
    padding: 2px 5px;
    img {
      width: 35px;
    }
    svg {
      width: 35px;
      height: 35px;
      fill: var(--font-color);
    }
    :disabled {
      filter: brightness(85%);
      border-radius: 10px;
    } 
    :focus {
      outline-color: var(--aux-color);
    }
  }
`;

type Props = { showAlways: boolean };

function getPositionFromClick(
  canvasMenu: HTMLDivElement,
  { x, y }: { x: number; y: number }
) {
  const box = canvasMenu.getBoundingClientRect();
  const left = `${Math.min(
    Math.max(x - box.width / 2, 25),
    window.innerWidth - box.width - 40
  )}px`;
  const top = `${Math.min(
    Math.max(y - box.height * 2, 20),
    window.innerHeight - box.height - 40
  )}px`;
  return { top, left };
}

export const CanvasMenu: React.FC<Props> = observer(({ showAlways }) => {
  const store = React.useContext(storeContext);
  const [canvasMenu, setCanvasMenu] = useState<null | HTMLDivElement>(null);

  const position =
    showAlways || canvasMenu === null || store.menuPosition === null
      ? null
      : getPositionFromClick(canvasMenu, store.menuPosition);
  (window as any).canvasMenu = canvasMenu;
  return (
    <StyledCanvasMenu
      ref={setCanvasMenu}
      style={
        showAlways
          ? { display: "inline-block", position: "relative" }
          : position
          ? { display: "block", zIndex: 2000, ...position }
          : { left: -1000, top: -1000, zIndex: -1 }
      }
    >
      {ALL_TOOLS_TYPES.map(toolName => {
        const isCurrTool = store.currentTool === toolName;
        const style = {
          display: showAlways || !isCurrTool ? "inline-block" : "none"
        };
        const disabled = showAlways ? (isCurrTool ? true : false) : false;

        const toolButton = (
          <button
            key={toolName}
            id={`${toolName}-button`}
            style={style}
            onClick={() => {
              store.changeTool(toolName);
              if (!showAlways) {
                store.hideMenu();
              }
            }}
            disabled={disabled}
          >
            <svg>
              <use href={`#${toolName}-svg`} />
            </svg>
          </button>
        );

        return toolButton;
      })}
      <button id="eval-button">
        <svg>
          <use href="#checkmark-svg" />
        </svg>
      </button>
    </StyledCanvasMenu>
  );
});

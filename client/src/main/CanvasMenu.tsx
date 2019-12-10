import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import { storeContext } from "../services/Store";
import { ALL_TOOLS_TYPES } from "../services/utils-canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHistory } from "react-router-dom";
import { ShareForm } from "../components/ShareForm";

const StyledCanvasMenu = styled.div`
  display: flex;
  align-items: center;
  position: fixed;
  padding: 5px;
  border: 1px solid var(--aux-color);
  border-radius: 10px;
  background-color: var(--primary-color);
  z-index: 2;
  margin: 0 0.3em;
  justify-content: space-between;
  #canvas-buttons-div {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  button {
    background-color: var(--primary-color);
    border: 0;
    margin: 0 2px;
    padding: 2px 5px;
    min-height: 42px;
    min-width: 40px;
    img {
      width: 35px;
    }
    svg {
      width: 35px;
      height: 35px;
      fill: var(--font-color);
    }
    :hover {
      filter: brightness(95%);
      border-radius: 10px;
      cursor: pointer;
    }
    :disabled {
      filter: brightness(85%);
      border-radius: 10px;
    }
    :focus {
      outline-color: var(--aux-color);
    }
  }
  .spacer {
    display: inline-block;
    width: 2px;
    height: 35px;
    background: var(--aux-color);
    margin: 0.05em 0.1em;
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
  const history = useHistory();
  const store = React.useContext(storeContext);
  const [canvasMenu, setCanvasMenu] = useState<null | HTMLDivElement>(null);

  const position =
    showAlways || canvasMenu === null || store.menuPosition === null
      ? null
      : getPositionFromClick(canvasMenu, store.menuPosition);
  return (
    <StyledCanvasMenu
      ref={setCanvasMenu}
      style={
        showAlways
          ? { position: "relative" }
          : position
          ? { display: "block", zIndex: 2000, ...position }
          : { left: -1000, top: -1000, zIndex: -1 }
      }
    >
      {showAlways && (
        <button>
          <FontAwesomeIcon icon="chevron-circle-left" size="2x" />
        </button>
      )}
      <div id="canvas-buttons-div">
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
        <div className="spacer" />
        <button id="eval-button">
          <svg>
            <use href="#checkmark-svg" />
          </svg>
        </button>

        {showAlways && (
          <>
            <button
              onClick={() => {
                if (store.user) {
                  store.saveCanvas();
                } else {
                  history.push("/login");
                }
              }}
              disabled={store.isSaving}
            >
              <FontAwesomeIcon icon="save" size="2x" spin={store.isSaving} />
            </button>
            <button onClick={store.deleteCanvas}>
              <FontAwesomeIcon icon="trash-alt" size="2x" />
            </button>
            <button onClick={() => store.setModal(<ShareForm />)}>
              <FontAwesomeIcon icon="share-alt" size="2x" />
            </button>
          </>
        )}
      </div>
      {showAlways && (
        <button>
          <FontAwesomeIcon icon="chevron-circle-right" size="2x" />
        </button>
      )}
    </StyledCanvasMenu>
  );
});

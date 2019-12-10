import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import styled, { ThemeContext } from "styled-components";
import { useStore } from "../services/Store";
import { ALL_TOOLS_TYPES, TOOLS_TYPES } from "../services/utils-canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHistory } from "react-router-dom";
import { ShareForm } from "../components/ShareForm";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

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
    flex-wrap: wrap;
  }
  .spacer {
    display: inline-block;
    width: 2px;
    height: 35px;
    background: var(--aux-color);
    margin: 0.05em 0.1em;
  }
`;

const IconButton = styled.button`
  background-color: transparent;
  border-color: transparent;
  margin: 0 2px;
  padding: 2px 5px;
  min-height: 42px;
  min-width: 40px;
  font-size: 14px;
  border-radius: 10px;
  img {
    width: 35px;
  }
  svg {
    width: 35px;
    height: 35px;
  }
  :hover {
    background-color: ${p => p.theme.colors.auxLight};
    cursor: pointer;
  }
  :disabled {
    background-color: ${p => p.theme.colors.auxLight};
  }
  :focus {
    outline-color: var(--aux-color);
  }
`;

export const ToggleTableButton = observer(() => {
  const theme = React.useContext(ThemeContext);
  const store = useStore();
  return (
    <IconButton onClick={store.toggleTable}>
      <FontAwesomeIcon
        icon={
          `chevron-circle-${store.showTable ? "right" : "left"}` as
            | "chevron-circle-left"
            | "chevron-circle-right"
        }
        color={theme.colors.secondaryDark}
        size="2x"
      />
    </IconButton>
  );
});

export const ToggleCanvasListButton = observer(() => {
  const theme = React.useContext(ThemeContext);
  const store = useStore();
  return (
    <IconButton onClick={store.toggleCanvasList}>
      <FontAwesomeIcon
        icon={
          `chevron-circle-${store.showCanvasList ? "left" : "right"}` as
            | "chevron-circle-left"
            | "chevron-circle-right"
        }
        color={theme.colors.secondaryDark}
        size="2x"
      />
    </IconButton>
  );
});

const iconsForTools: {
  [key in keyof typeof TOOLS_TYPES]: {
    icon: IconProp;
    color: string;
    fontSize?: string;
  };
} = {
  [TOOLS_TYPES.draw]: { icon: "pencil-alt", color: "inherit" },
  [TOOLS_TYPES.erase]: { icon: "eraser", color: "inherit", fontSize: "2.1em" },
  [TOOLS_TYPES.move]: { icon: "arrows-alt", color: "inherit" },
  [TOOLS_TYPES.select]: {
    icon: "vector-square",
    color: "inherit",
    fontSize: "1.8em"
  }
};

const ToolsButtons = observer<{ showAlways: boolean }>(({ showAlways }) => {
  const store = useStore();
  return (
    <>
      {ALL_TOOLS_TYPES.map(toolName => {
        const isCurrTool = store.currentTool === toolName;
        const style = {
          display: showAlways || !isCurrTool ? "inline-block" : "none"
        };
        const disabled = showAlways ? (isCurrTool ? true : false) : false;

        return (
          <IconButton
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
            <FontAwesomeIcon
              icon={iconsForTools[toolName].icon}
              color={iconsForTools[toolName].color}
              size="2x"
              style={{ fontSize: iconsForTools[toolName].fontSize }}
            />
            {/* <svg>
              <use href={`#${toolName}-svg`} />
            </svg> */}
          </IconButton>
        );
      })}
    </>
  );
});

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
  const store = useStore();
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
          ? { display: "block", zIndex: 2, ...position }
          : { zIndex: -1 }
      }
    >
      {showAlways && <ToggleCanvasListButton />}
      <div id="canvas-buttons-div">
        <div id="tool-buttons">
          <ToolsButtons showAlways={showAlways} />
        </div>

        {!showAlways && <div className="spacer" />}

        <div id="other-buttons">
          <IconButton
            id="eval-button"
            onClick={() => {
              if (!showAlways) {
                store.hideMenu();
              }
              store.currentCanvas.predict();
            }}
          >
            <FontAwesomeIcon icon="check" size="2x" color="green" />
          </IconButton>

          {showAlways && (
            <>
              <IconButton
                onClick={() => {
                  if (store.user) {
                    store.saveCanvas();
                  } else {
                    history.push("/login");
                  }
                }}
                disabled={store.isSaving}
              >
                <FontAwesomeIcon
                  icon="save"
                  size="2x"
                  spin={store.isSaving}
                  color="#00309a"
                />
              </IconButton>
              <IconButton onClick={store.deleteCanvas}>
                <FontAwesomeIcon icon="trash-alt" size="2x" color="#a01313" />
              </IconButton>
              <IconButton onClick={() => store.setModal(<ShareForm />)}>
                <FontAwesomeIcon icon="share-alt" size="2x" />
              </IconButton>
            </>
          )}
        </div>
      </div>
      {showAlways && <ToggleTableButton />}
    </StyledCanvasMenu>
  );
});

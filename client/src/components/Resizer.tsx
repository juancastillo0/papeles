import React, { useCallback, useRef, useEffect, useState } from "react";
import styled from "styled-components";

const ResizerDivisionVertical = styled.div`
  margin: 0;
  width: 11px;
  flex: 0 0 auto;
  ::before {
    content: "";
    position: relative;
    display: block;
    width: 1px;
    height: 97.5%;
    top: 1.25%;
    background: rgb(245, 245, 245);
    margin: 0 auto;
  }
  :hover {
    cursor: ew-resize;
  }
`;

const ResizerDivisionHorizontal = styled.div`
  margin: 0;
  height: 11px;
  flex: 0 0 auto;
  ::before {
    content: "";
    position: relative;
    display: block;
    height: 1px;
    width: 97.5%;
    left: 1.25%;
    top: 5px;
    background: rgb(245, 245, 245);
    margin: auto 0 auto;
  }
  :hover {
    cursor: ns-resize;
  }
`;

function resizeHandler(
  elem: HTMLDivElement | null,
  vertical: boolean,
  leftOrTop: boolean
) {
  if (elem === null) return () => {};

  const keys: {
    direction: "pageY" | "pageX";
    size: "height" | "width";
    cursor: "ns-resize" | "ew-resize";
  } = vertical
    ? { direction: "pageY", size: "height", cursor: "ns-resize" }
    : { direction: "pageX", size: "width", cursor: "ew-resize" };
  let prevSize: number;
  let position: number;
  let touching: boolean;

  function getPosition(event: MouseEvent | TouchEvent): number {
    let pos: number;
    if (event instanceof MouseEvent) {
      pos = event[keys.direction];
    } else {
      event = event as TouchEvent;
      pos = event.changedTouches[0][keys.direction];
      touching = true;
    }
    return pos;
  }
  const onMouseMove = (event: MouseEvent | TouchEvent) => {
    const newSize = leftOrTop
      ? prevSize - getPosition(event) + position
      : prevSize + getPosition(event) - position;
    elem.style.flex = `0 1 ${newSize}px`;
    elem.style[keys.size] = `${newSize}px`;
  };

  function onMouseUp() {
    document.body.style.cursor = "default";

    if (touching) {
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("touchend", onMouseUp);
    } else {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
  }
  const onMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
    position = getPosition(event.nativeEvent);
    document.body.style.cursor = keys.cursor;
    prevSize = elem.getBoundingClientRect()[keys.size];

    if (touching) {
      window.addEventListener("touchmove", onMouseMove);
      window.addEventListener("touchend", onMouseUp);
    } else {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
  };

  return onMouseDown;
}

type Props = {
  showResizer?: boolean;
  vertical?: boolean;
  leftOrTop?: boolean;
  [key: string]: any;
};

const Resizer: React.FC<Props> = (
  { showResizer, vertical, leftOrTop, children, ...rest } = {
    vertical: false,
    leftOrTop: false
  }
) => {
  const [wrapperRef, setWrapperRef] = useState<HTMLDivElement | null>(null);

  const onMouseDown = useCallback(
    resizeHandler(wrapperRef, !!vertical, !!leftOrTop),
    [wrapperRef]
  );

  let resizerDisplay;
  if (showResizer !== undefined) {
    resizerDisplay = showResizer ? "" : "none";
  } else {
    resizerDisplay = rest.style !== undefined && rest.style.display;
  }

  const ResizerComponent = vertical
    ? ResizerDivisionHorizontal
    : ResizerDivisionVertical;

  const content = (
    <div
      className={vertical ? "row " : "col " + (rest.className || "")}
      {...rest}
      key="0"
      ref={(elem: HTMLDivElement) => setWrapperRef(elem)}
    >
      {children}
    </div>
  );

  const resizer = (
    <ResizerComponent
      key="resizer"
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      style={{ display: resizerDisplay }}
    />
  );

  return leftOrTop ? (
    <>
      {resizer}
      {content}
    </>
  ) : (
    <>
      {content}
      {resizer}
    </>
  );
};
export default Resizer;

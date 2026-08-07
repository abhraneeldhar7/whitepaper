"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { Ellipsis, Plus } from "lucide-react";
import { selectionCell, moveTableRow, moveTableColumn } from "prosemirror-tables";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface CellInfo {
  row: number;
  col: number;
  cellPos: number;
  cellDom: HTMLElement;
  wrapperDom: HTMLElement;
  cellRect: DOMRect;
  wrapperRect: DOMRect;
  colCount: number;
  rowCount: number;
}

function getCellInfo(editor: Editor): CellInfo | null {
  const { state, view } = editor;
  try {
    const $cell = selectionCell(state);
    if (!$cell) return null;

    const rowNode = $cell.node(-1);
    const tableNode = $cell.node(-2);

    let colIndex = 0;
    for (let i = 0; i < $cell.index(-1); i++) {
      colIndex += rowNode.child(i).attrs.colspan || 1;
    }
    const rowIndex = $cell.index(-2);

    let colCount = 0;
    let rowCount = 0;
    if (tableNode && tableNode.childCount > 0) {
      rowCount = tableNode.childCount;
      const firstRow = tableNode.child(0);
      for (let i = 0; i < firstRow.childCount; i++) {
        colCount += firstRow.child(i).attrs.colspan || 1;
      }
    }

    const cellDom = view.nodeDOM($cell.pos) as HTMLElement | null;
    if (!cellDom) return null;
    const wrapperDom = cellDom.closest(".tableWrapper") as HTMLElement | null;
    if (!wrapperDom) return null;

    return {
      row: rowIndex,
      col: colIndex,
      cellPos: $cell.pos,
      cellDom,
      wrapperDom,
      cellRect: cellDom.getBoundingClientRect(),
      wrapperRect: wrapperDom.getBoundingClientRect(),
      colCount,
      rowCount,
    };
  } catch {
    return null;
  }
}

interface EditorTableToolbarProps {
  editor: Editor;
}

export function EditorTableToolbar({ editor }: EditorTableToolbarProps) {
  const [cellInfo, setCellInfo] = useState<CellInfo | null>(null);
  const [hoveringTable, setHoveringTable] = useState(false);
  const [hoveringBtn, setHoveringBtn] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [dragging, setDragging] = useState<{ type: "col" | "row" } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const activeCellRef = useRef<HTMLElement | null>(null);
  const isMobileRef = useRef(false);
  const [, setTick] = useState(0);
  const hideTimer = useRef<number | null>(null);
  const dragRef = useRef<{
    type: "col" | "row";
    startX: number;
    startY: number;
    cellInfo: CellInfo;
  } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    isMobileRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      isMobileRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const updateFromSelection = useCallback(() => {
    const info = getCellInfo(editor);
    setCellInfo(info);

    if (activeCellRef.current) {
      activeCellRef.current.classList.remove("cell-active");
      activeCellRef.current = null;
    }
    if (info) {
      info.cellDom.classList.add("cell-active");
      activeCellRef.current = info.cellDom;
    }
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updateFromSelection);
    editor.on("transaction", updateFromSelection);

    const editorDom = editor.view.dom;

    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".tableWrapper")) {
        if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
        setHoveringTable(true);
      }
    };
    const onOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as HTMLElement | null;
      if (
        rel?.closest(".tableWrapper") ||
        rel?.closest(".table-add-col-btn") ||
        rel?.closest(".table-add-row-btn")
      ) {
        return;
      }
      hideTimer.current = window.setTimeout(() => setHoveringTable(false), 200);
    };

    editorDom.addEventListener("mouseover", onOver);
    editorDom.addEventListener("mouseout", onOut);
    updateFromSelection();

    return () => {
      editor.off("selectionUpdate", updateFromSelection);
      editor.off("transaction", updateFromSelection);
      editorDom.removeEventListener("mouseover", onOver);
      editorDom.removeEventListener("mouseout", onOut);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (activeCellRef.current) {
        activeCellRef.current.classList.remove("cell-active");
        activeCellRef.current = null;
      }
    };
  }, [editor, updateFromSelection]);

  const handleBtnEnter = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setHoveringBtn(true);
  }, []);

  const handleBtnLeave = useCallback(() => {
    hideTimer.current = window.setTimeout(() => setHoveringBtn(false), 200);
  }, []);

  const startDrag = useCallback(
    (e: React.PointerEvent, type: "col" | "row") => {
      if (!cellInfo) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;

      dragRef.current = { type, startX, startY, cellInfo };
      setDragging({ type });
      setGhostPos({ x: startX, y: startY });

      const onMove = (e: PointerEvent) => {
        setGhostPos({ x: e.clientX, y: e.clientY });
      };

      const onUp = (e: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        const d = dragRef.current;
        dragRef.current = null;
        setDragging(null);
        setGhostPos(null);

        if (!d) return;

        const { state, dispatch } = editor.view;
        const { type, startX: sx, startY: sy, cellInfo: info } = d;

        const dx = e.clientX - sx;
        const dy = e.clientY - sy;

        if (type === "col") {
          const threshold = Math.max(info.cellRect.width * 0.25, 30);
          if (Math.abs(dx) < threshold) return;
          const to = dx > 0 ? info.col + 1 : info.col - 1;
          if (to < 0 || to >= info.colCount) return;
          console.log("moveColumn", { from: info.col, to });
          moveTableColumn({ from: info.col, to })(state, dispatch);
          setTick((t) => t + 1);
        } else {
          const threshold = Math.max(info.cellRect.height * 0.25, 20);
          if (Math.abs(dy) < threshold) return;
          const to = dy > 0 ? info.row + 1 : info.row - 1;
          if (to < 0 || to >= info.rowCount) return;
          console.log("moveRow", { from: info.row, to });
          moveTableRow({ from: info.row, to })(state, dispatch);
          setTick((t) => t + 1);
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [cellInfo, editor]
  );

  const wrapperEl = cellInfo?.wrapperDom || null;
  if (!wrapperEl && !cellInfo) return null;

  const editorRect = editor.view.dom.getBoundingClientRect();

  const showAddButtons = isMobileRef.current || hoveringTable || hoveringBtn;

  let addColPos = null;
  let addRowPos = null;
  let ctxPos = null;
  let moveColPos = null;
  let moveRowPos = null;

  if (wrapperEl) {
    const wr = wrapperEl.getBoundingClientRect();
    addColPos = {
      left: wr.right - editorRect.left + 6,
      top: wr.top - editorRect.top + wr.height / 2,
    };
    addRowPos = {
      left: wr.left - editorRect.left + wr.width / 2,
      top: wr.bottom - editorRect.top + 6,
    };
  }

  if (cellInfo) {
    const { cellRect, wrapperRect } = cellInfo;
    ctxPos = {
      left: cellRect.left - editorRect.left + cellRect.width / 2,
      top: cellRect.bottom - editorRect.top + 4,
    };
    moveColPos = {
      left: cellRect.left - editorRect.left + cellRect.width / 2,
      top: wrapperRect.top - editorRect.top,
    };
    moveRowPos = {
      left: wrapperRect.left - editorRect.left,
      top: cellRect.top - editorRect.top + cellRect.height / 2,
    };
  }

  return (
    <>
      {addColPos && wrapperEl && (
        <div
          className="table-add-col-btn"
          style={{
            position: "absolute",
            left: addColPos.left,
            top: addColPos.top,
            transform: "translate(0, -50%)",
            opacity: showAddButtons ? 1 : 0,
            pointerEvents: showAddButtons ? "auto" : "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={handleBtnEnter}
          onMouseLeave={handleBtnLeave}
        >
          <Button
            variant="outline"
            size="icon-sm"
            className="size-6 rounded-full"
            onClick={() => {
              editor.chain().addColumnAfter().run();
              setTick((t) => t + 1);
            }}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      )}

      {addRowPos && wrapperEl && (
        <div
          className="table-add-row-btn"
          style={{
            position: "absolute",
            left: addRowPos.left,
            top: addRowPos.top,
            transform: "translate(-50%, 0)",
            opacity: showAddButtons ? 1 : 0,
            pointerEvents: showAddButtons ? "auto" : "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={handleBtnEnter}
          onMouseLeave={handleBtnLeave}
        >
          <Button
            variant="outline"
            size="icon-sm"
            className="size-6 rounded-full"
            onClick={() => {
              editor.chain().addRowAfter().run();
              setTick((t) => t + 1);
            }}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      )}

      {cellInfo && ctxPos && (
        <Popover open={contextOpen} onOpenChange={setContextOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="table-context-btn"
              style={{
                position: "absolute",
                left: ctxPos.left,
                top: ctxPos.top,
                transform: "translate(-50%, 0)",
              }}
            >
              <Ellipsis className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            side="bottom"
            sideOffset={4}
            className="w-40 p-1"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8"
              onClick={() => {
                editor.chain().deleteRow().run();
                setContextOpen(false);
                setTick((t) => t + 1);
              }}
            >
              Delete row
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8"
              onClick={() => {
                editor.chain().deleteColumn().run();
                setContextOpen(false);
                setTick((t) => t + 1);
              }}
            >
              Delete column
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive"
              onClick={() => {
                editor.chain().deleteTable().run();
                setContextOpen(false);
                setTick((t) => t + 1);
              }}
            >
              Delete table
            </Button>
          </PopoverContent>
        </Popover>
      )}

      {cellInfo && moveColPos && !dragging && (
        <div
          className="table-move-indicator-col"
          style={{
            position: "absolute",
            left: moveColPos.left,
            top: moveColPos.top,
            width: 20,
            height: 4,
            transform: "translate(-50%, -50%)",
            background: "var(--primary)",
            borderRadius: 2,
            cursor: "grab",
          }}
          onPointerDown={(e) => startDrag(e, "col")}
        />
      )}

      {cellInfo && moveRowPos && !dragging && (
        <div
          className="table-move-indicator-row"
          style={{
            position: "absolute",
            left: moveRowPos.left,
            top: moveRowPos.top,
            width: 4,
            height: 20,
            transform: "translate(-50%, -50%)",
            background: "var(--primary)",
            borderRadius: 2,
            cursor: "grab",
          }}
          onPointerDown={(e) => startDrag(e, "row")}
        />
      )}

      {ghostPos && (
        <div
          style={{
            position: "fixed",
            left: ghostPos.x,
            top: ghostPos.y,
            width: dragging?.type === "col" ? 20 : 4,
            height: dragging?.type === "col" ? 4 : 20,
            transform: "translate(-50%, -50%)",
            background: "var(--primary)",
            borderRadius: 2,
            opacity: 0.9,
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      )}
    </>
  );
}

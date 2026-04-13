import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import {
  getOperationalColumnValue,
  getOperationalDefaultSort,
  getOperationalNextSortState,
  sortOperationalData,
} from "./operationalDataTableSort";

export default function OperationalDataTable({
  columns,
  data,
  rowKey,
  onRowClick,
  sortState: controlledSortState,
  onSortChange,
  onSortedDataChange,
  rowClassName,
  tableClassName = "min-w-full divide-y divide-gray-200 text-sm",
  headerClassName = "sticky top-0 z-10 bg-gray-50",
  bodyClassName = "divide-y divide-gray-100 bg-white",
  emptyMessage = "No hay datos disponibles.",
  emptyMinHeight = "220px",
}) {
  const [internalSortState, setInternalSortState] = useState(() => getOperationalDefaultSort(columns));
  const [colWidths, setColWidths] = useState([]);
  const [tableWidth, setTableWidth] = useState(null);
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const bodyTableRef = useRef(null);
  const isControlled = controlledSortState !== undefined;
  const effectiveSortState = isControlled ? controlledSortState : internalSortState;

  useEffect(() => {
    if (isControlled) return;
    setInternalSortState((current) => {
      if (current?.key && columns.some((column) => column.key === current.key && column.sortable !== false)) {
        return current;
      }
      return getOperationalDefaultSort(columns);
    });
  }, [columns, isControlled]);

  const sortedRows = useMemo(() => sortOperationalData(data, columns, effectiveSortState), [columns, data, effectiveSortState]);

  useEffect(() => {
    onSortedDataChange?.(sortedRows, effectiveSortState);
  }, [onSortedDataChange, sortedRows, effectiveSortState]);

  useLayoutEffect(() => {
    const bodyTable = bodyTableRef.current;
    if (!bodyTable) return undefined;

    const measure = () => {
      const firstRow = bodyTable.tBodies?.[0]?.rows?.[0];
      const cells = firstRow ? Array.from(firstRow.cells) : [];
      const nextWidths = columns.map((column, index) => {
        if (column.width) return column.width;
        const cell = cells[index];
        return cell ? `${Math.ceil(cell.getBoundingClientRect().width)}px` : null;
      });
      setColWidths(nextWidths);
      setTableWidth(`${Math.ceil(bodyTable.getBoundingClientRect().width)}px`);
    };

    measure();
    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(bodyTable);
    if (bodyTable.parentElement) resizeObserver.observe(bodyTable.parentElement);

    return () => resizeObserver.disconnect();
  }, [columns, sortedRows]);

  const handleSort = (column) => {
    const nextSortState = getOperationalNextSortState(effectiveSortState, column);
    if (!nextSortState) return;
    if (!isControlled) {
      setInternalSortState(nextSortState);
    }
    onSortChange?.(nextSortState);
  };

  if (!sortedRows.length) {
    return (
      <div className="flex items-center justify-center px-4 py-6 text-sm text-gray-500" style={{ minHeight: emptyMinHeight }}>
        {emptyMessage}
      </div>
    );
  }

  const renderColGroup = () => (
    <colgroup>
      {columns.map((column, index) => (
        <col key={column.key} style={{ width: colWidths[index] || column.width || "auto" }} />
      ))}
    </colgroup>
  );

  const syncHeaderScroll = () => {
    if (!headerScrollRef.current || !bodyScrollRef.current) return;
    headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div ref={headerScrollRef} className="overflow-hidden border-b border-gray-200">
        <table className={tableClassName} style={tableWidth ? { width: tableWidth } : undefined}>
          {renderColGroup()}
          <thead className={headerClassName}>
            <tr>
              {columns.map((column) => {
                const isActive = effectiveSortState?.key === column.key;
                const sortable = column.sortable !== false;
                const alignmentClass = column.align === "right" ? "text-right" : "text-left";
                return (
                  <th
                    key={column.key}
                    className={[
                      "px-4 py-3 font-medium text-gray-700",
                      alignmentClass,
                      column.headerCellClassName || "",
                    ].join(" ").trim()}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className={[
                          "inline-flex items-center gap-1.5 transition-colors hover:text-gray-900",
                          alignmentClass === "text-right" ? "ml-auto" : "",
                        ].join(" ").trim()}
                      >
                        <span>{column.header}</span>
                        {isActive ? (
                          <ChevronUp
                            className={[
                              "h-3.5 w-3.5 transition-transform",
                              effectiveSortState?.direction === "desc" ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        ) : null}
                      </button>
                    ) : (
                      <span>{column.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      <div ref={bodyScrollRef} className="h-[36vh] min-h-0 overflow-auto" onScroll={syncHeaderScroll}>
        <table ref={bodyTableRef} className={tableClassName}>
          {renderColGroup()}
          <tbody className={bodyClassName}>
            {sortedRows.map((row, index) => {
              const key = typeof rowKey === "function" ? rowKey(row, index) : row?.[rowKey];
              const clickable = typeof onRowClick === "function";
              const resolvedRowClassName = typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName;
              return (
                <tr
                  key={key ?? index}
                  className={[
                    "transition hover:bg-gray-50",
                    clickable ? "cursor-pointer" : "",
                    resolvedRowClassName || "",
                  ].join(" ").trim()}
                  onClick={clickable ? () => onRowClick(row, index) : undefined}
                >
                  {columns.map((column) => {
                    const alignmentClass = column.align === "right" ? "text-right" : "text-left";
                    const resolvedCellClassName =
                      typeof column.cellClassName === "function" ? column.cellClassName(row, index) : column.cellClassName;
                    return (
                      <td
                        key={column.key}
                        className={[
                          "px-4 py-3 text-gray-700",
                          alignmentClass,
                          resolvedCellClassName || "",
                        ].join(" ").trim()}
                      >
                        {typeof column.render === "function" ? column.render(row, index) : getOperationalColumnValue(row, column) ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

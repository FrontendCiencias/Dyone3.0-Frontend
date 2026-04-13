export function getOperationalColumnValue(row, column) {
  if (typeof column?.sortValue === "function") return column.sortValue(row);
  if (typeof column?.accessor === "function") return column.accessor(row);
  if (typeof column?.accessor === "string") return row?.[column.accessor];
  return row?.[column?.key];
}

function normalizeOperationalValue(value, sortType) {
  if (value === null || value === undefined || value === "") return null;

  if (sortType === "number") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (sortType === "date") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  return String(value);
}

function compareOperationalValues(left, right, sortType, direction) {
  const normalizedLeft = normalizeOperationalValue(left, sortType);
  const normalizedRight = normalizeOperationalValue(right, sortType);

  if (normalizedLeft === null && normalizedRight === null) return 0;
  if (normalizedLeft === null) return 1;
  if (normalizedRight === null) return -1;

  let result = 0;
  if (sortType === "number" || sortType === "date") {
    result = normalizedLeft - normalizedRight;
  } else {
    result = normalizedLeft.localeCompare(normalizedRight, "es", {
      sensitivity: "base",
      numeric: true,
    });
  }

  return direction === "desc" ? result * -1 : result;
}

export function getOperationalDefaultSort(columns = []) {
  const firstSortableColumn = columns.find((column) => column.sortable !== false);
  return {
    key: firstSortableColumn?.key || null,
    direction: "asc",
  };
}

export function getOperationalNextSortState(currentSortState, column) {
  if (!column || column.sortable === false) return currentSortState;
  if (currentSortState?.key === column.key) {
    return {
      key: column.key,
      direction: currentSortState.direction === "asc" ? "desc" : "asc",
    };
  }
  return {
    key: column.key,
    direction: "asc",
  };
}

export function sortOperationalData(data = [], columns = [], sortState = null) {
  if (!Array.isArray(data)) return [];
  if (!sortState?.key) return data;

  const sortColumn = columns.find((column) => column.key === sortState.key);
  if (!sortColumn) return data;

  const sortType = sortColumn.sortType || "string";
  return [...data]
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const result = compareOperationalValues(
        getOperationalColumnValue(left.row, sortColumn),
        getOperationalColumnValue(right.row, sortColumn),
        sortType,
        sortState.direction,
      );
      return result || left.index - right.index;
    })
    .map((entry) => entry.row);
}

export const getEvenColumns = (
  columns: string[][],
  padding: number,
  indent = 0,
): string => {
  const maxColumnLengths = columns.reduce(
    (acc, column) =>
      column.map((cell, i) => Math.max(acc[i] || 0, cell.length)),
    [] as number[],
  );

  const indentStr = ' '.repeat(indent);
  const paddingStr = ' '.repeat(padding);
  return columns
    .map(
      (column) =>
        indentStr +
        column
          .map((cell, i) => cell.padEnd(maxColumnLengths[i]))
          .join(paddingStr),
    )
    .join('\n');
};

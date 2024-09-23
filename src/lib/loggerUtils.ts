export const getEvenColumns = (
  columns: string[][],
  padding: number,
): string => {
  const maxColumnLengths = columns.reduce(
    (acc, column) =>
      column.map((cell, i) => Math.max(acc[i] || 0, cell.length)),
    [] as number[],
  );

  return columns
    .map((column) =>
      column
        .map((cell, i) => cell.padEnd(maxColumnLengths[i]))
        .join(' '.repeat(padding)),
    )
    .join('\n');
};

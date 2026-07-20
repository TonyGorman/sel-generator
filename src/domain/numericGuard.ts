export const hasValue = (value: number | null): value is number => {
  return value !== null && Number.isInteger(value);
};

export type ImportResult = {
  createdCount: number;
  updatedCount: number;
  errors: { row: number; message: string }[];
};
import { createServicesTable, createTokensTable } from "../queries";

export const migrate = async () => {
  await createTokensTable();
  await createServicesTable();
};

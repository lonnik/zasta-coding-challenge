import { createTokenValueMappingTable } from "../queries";

export const migrate = async () => {
  await createTokenValueMappingTable();
};

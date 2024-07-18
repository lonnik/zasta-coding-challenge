import {
  shareDatabaseContainerForTeardown,
  shareDbContainerPort,
  spawnPostgresContainer,
} from "./util";

const setupTestDatabase = async () => {
  const dbContainer = await spawnPostgresContainer("postgres:16.3");
  await shareDbContainerPort(dbContainer, 5432);
  shareDatabaseContainerForTeardown(dbContainer);
};

export default setupTestDatabase;

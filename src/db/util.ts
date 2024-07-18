import path from "node:path";
import os from "node:os";
import { StartedTestContainer, GenericContainer } from "testcontainers";
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { PoolConfig } from "pg";

const tmpFileName = "jest_testcontainers_global_setup_postgres";

export const shareDbContainerPort = async (
  container: StartedTestContainer,
  defaultPort: number
) => {
  const variablesDir = path.join(os.tmpdir(), tmpFileName);
  await mkdir(variablesDir, { recursive: true });
  const filePath = path.join(variablesDir, "databasePort");
  await writeFile(filePath, container.getMappedPort(defaultPort).toString());
};

export const readTestDatabasePort = (): number | undefined => {
  const variablesDir = path.join(os.tmpdir(), tmpFileName);
  const filePath = path.join(variablesDir, "databasePort");
  const port = readFileSync(filePath, "utf8");
  return port ? parseInt(port) : undefined;
};

export const spawnPostgresContainer = (
  image: string
): Promise<StartedTestContainer> => {
  return new GenericContainer(image)
    .withEnvironment({ POSTGRES_DB: "zasta" })
    .withEnvironment({ POSTGRES_USER: "zasta" })
    .withEnvironment({ POSTGRES_PASSWORD: "zasta" })
    .withReuse()
    .withExposedPorts(5432)
    .withTmpFs({ "/temp_pgdata": "rw,noexec,nosuid,size=65536k" })
    .start();
};

export const shareDatabaseContainerForTeardown = (
  container: StartedTestContainer
) => {
  (globalThis as any).__DATABASE_CONTAINER__ = container;
};

export const getPostgresConfig = (): PoolConfig => {
  if (process.env.NODE_ENV === "test") {
    return {
      user: "zasta",
      host: "localhost",
      database: "zasta",
      password: "zasta",
      port: readTestDatabasePort() || 5432,
    };
  }

  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
  };
};

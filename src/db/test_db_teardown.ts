export const teardownDatabase = async (): Promise<void> => {
  const container = (globalThis as any).__DATABASE_CONTAINER__;
  await container.stop();
};

export default teardownDatabase;

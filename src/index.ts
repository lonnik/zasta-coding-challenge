import { app } from "./app";
import { pool } from "./db";
import { migrate } from "./db/migrate";

const port = process.env.PORT || "3000";

const gracelfulShutdown = () => async () => {
  await pool.end();
  process.exit(0);
};

const start = async () => {
  console.log("starting server...");

  try {
    // NOTE: normally this would be done in a separate migration script
    await migrate();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }

  process.on("SIGINT", gracelfulShutdown);
  process.on("SIGTERM", gracelfulShutdown);
};

start();

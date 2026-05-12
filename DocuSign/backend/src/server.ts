import { createApp } from "./app.js";
import { getConfig } from "./config/index.js";

const config = getConfig();

const start = async (): Promise<void> => {
  const app = await createApp();
  app.listen(config.PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on 0.0.0.0:${config.PORT}`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});

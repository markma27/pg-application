import { createApp } from "./app.js";
import { env } from "@pg/submission";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`PortfolioGuardian API listening on port ${env.PORT}`);
});

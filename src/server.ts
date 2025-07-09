import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes";
import { join } from "path";
import swisseph from "swisseph-v2";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

swisseph.swe_set_ephe_path(join(__dirname, "ephe"));

app.use(cors());
app.use(express.json());
app.use(routes);

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

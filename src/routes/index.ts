import { Router } from "express";
import { hello } from "../controllers/helloController";
import { birthChart } from "../controllers/birthChartController";
import { solar, lunar } from "../controllers/returnsController";

const router = Router();

router.get("/", hello);
router.post("/birth-chart", birthChart);
router.post("/return/solar", solar);
router.post("/return/lunar", lunar);

export default router;

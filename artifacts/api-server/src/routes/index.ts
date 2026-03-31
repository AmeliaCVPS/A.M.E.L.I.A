import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import triagemRouter from "./triagem.js";
import ticketsRouter from "./tickets.js";
import adminRouter from "./admin.js";
import mlRouter from "./ml.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/triagem", triagemRouter);
router.use("/tickets", ticketsRouter);
router.use("/admin", adminRouter);
router.use("/ml", mlRouter);

export default router;

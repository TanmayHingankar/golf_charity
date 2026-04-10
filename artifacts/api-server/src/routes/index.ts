import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import subscriptionsRouter from "./subscriptions.js";
import scoresRouter from "./scores.js";
import charitiesRouter from "./charities.js";
import drawsRouter from "./draws.js";
import winnersRouter from "./winners.js";
import adminRouter from "./admin.js";
import donationsRouter from "./donations.js";

const router: IRouter = Router();

router.use("/healthz", healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/scores", scoresRouter);
router.use("/charities", charitiesRouter);
router.use("/draws", drawsRouter);
router.use("/winners", winnersRouter);
router.use("/admin", adminRouter);
router.use("/donations", donationsRouter);
// Dashboard summary — alias /dashboard to admin router which has the /summary handler
router.use("/dashboard", adminRouter);

export default router;

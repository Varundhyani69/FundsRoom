import { Router } from "express";
import { getStockMovements } from "./product.controller";
import authenticate from "../../middleware/authenticate";

const router = Router();

router.use(authenticate);

// GET /stock-movements
router.get("/", getStockMovements);

export default router;

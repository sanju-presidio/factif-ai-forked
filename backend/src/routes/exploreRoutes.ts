import express from "express";
import { ExploreController } from "../controllers/exploreController";
import { GraphController } from "../controllers/graph.controller";

const router = express.Router();

// Health check endpoint
router.get("/health", ExploreController.healthCheck);

// Main explore message endpoint
router.post("/message", ExploreController.handleExploreMessage);
router.get("/current-path", ExploreController.handleExploreCurrentPath);

// Graph saving endpoint
router.post("/save-graph", GraphController.saveGraph);

export default router;

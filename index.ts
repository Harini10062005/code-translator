port "dotenv/config";
import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import apiRoutes from "./routes";

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use(apiRoutes);

// Setup frontend serving and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  server.listen(Number(PORT), "0.0.0.0", () => {
    log(`Server running on port ${PORT}`, "express");
  });
}

startServer().catch(console.error);

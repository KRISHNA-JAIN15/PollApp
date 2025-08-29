const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { PrismaClient } = require("./generated/prisma");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const createContext = require("./graphql/context");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: process.env.NODE_ENV !== "production",
  csrfPrevention: true,
  cache: "bounded",
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("📦 Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();

    // Start Apollo Server
    await server.start();
    console.log("🚀 Apollo Server started");

    app.use(
      cors({
        origin: [
          "http://localhost:3000",
          "http://localhost:3001",
          "https://poll-app-zeta-seven.vercel.app",
          "https://pollapp.krishnajain.tech"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "apollo-require-preflight",
        ],
        credentials: true,
      })
    );

    // Trust proxy for deployment
    app.set("trust proxy", 1);

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // JSON parsing error handler
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON format in request body",
        });
      }
      next(err);
    });

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: createContext,
      })
    );

    const authRoutes = require("./routes/auth");
    const pollRoutes = require("./routes/polls");
    const userRoutes = require("./routes/users");

    app.use("/api/auth", authRoutes);
    app.use("/api/polls", pollRoutes);
    app.use("/api/users", userRoutes);

    app.get("/api/health", (req, res) => {
      res.json({
        status: "OK",
        message: "Polling App API is running",
        database: "Connected",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        graphql: "/graphql",
        rest: "/api",
      });
    });

    app.get("/", (req, res) => {
      res.json({
        message: "Polling App Backend",
        database: "Connected",
        environment: process.env.NODE_ENV || "development",
        graphql: {
          endpoint: "/graphql",
          playground:
            process.env.NODE_ENV !== "production" ? "/graphql" : "disabled",
        },
        rest: {
          auth: "/api/auth",
          polls: "/api/polls",
          users: "/api/users",
        },
      });
    });

    app.use((err, req, res, next) => {
      console.error("Server Error:", err.stack);
      res.status(500).json({
        error: "Something went wrong!",
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
      });
    });

    app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
      });
    });

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📦 Database: Connected`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `📊 GraphQL endpoint: ${
          process.env.NODE_ENV === "production"
            ? "https://pollapp-ivzl.onrender.com"
            : "http://localhost:" + PORT
        }/graphql`
      );
      console.log(
        `🔗 REST API: ${
          process.env.NODE_ENV === "production"
            ? "https://pollapp-ivzl.onrender.com"
            : "http://localhost:" + PORT
        }/api`
      );
      console.log(`✅ All services are ready!`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔄 Gracefully shutting down...");
  try {
    await prisma.$disconnect();
    console.log("📦 Database disconnected");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🔄 Gracefully shutting down...");
  try {
    await prisma.$disconnect();
    console.log("📦 Database disconnected");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer().catch((error) => {
  console.error("❌ Error starting server:", error);
  process.exit(1);
});

module.exports = app;

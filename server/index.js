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
  playground: true,
});

async function startServer() {
  await server.start();

  app.use(cors());
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
      graphql: "/graphql",
      rest: "/api",
    });
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Polling App Backend",
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
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  });

  app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🔗 REST API: http://localhost:${PORT}/api`);
  });
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});

startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});

module.exports = app;

// Utility to warm up the server on app load
const warmupServer = async () => {
  try {
    const response = await fetch(
      "https://pollapp-ivzl.onrender.com/api/health",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      console.log("✅ Server is warm and ready");
    }
  } catch (error) {
    console.log("🔥 Warming up server...", error.message);
  }
};

export default warmupServer;

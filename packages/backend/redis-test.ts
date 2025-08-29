import { createClient } from "redis";

async function testRedis() {
  const client = createClient({
    socket: {
      host: "localhost", // or 127.0.0.1
      port: 6379,
    },
    password: "securesync2024", // ✅ add this
  });

  client.on("error", (err) => console.error("Redis connection failed:", err));

  try {
    await client.connect();
    console.log("✅ Connected to Redis!");

    await client.set("testKey", "Hello Redis with Auth!");
    const value = await client.get("testKey");
    console.log("Stored value:", value);

    await client.quit();
  } catch (error) {
    console.error("❌ Redis operation failed:", error);
  }
}

testRedis();

require("dotenv").config();
const { EventHubConsumerClient } = require("@azure/event-hubs");
const redis = require("redis");

const connectionString = process.env.EVENTHUB_KEY;
const eventHubName = "test-event33";
const consumerGroup = "$Default";

const redisClient = redis.createClient({
  url: process.env.REDIS_KEY,
});

function enrichTelemetry(data, metadata) {
  const enriched = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "turbineId" || key === "timestamp") {
      enriched[key] = value;
    } else {
      const unit = metadata[`${key}`] || "";
      enriched[key] = `${value} ${unit}`;
    }
  }
  return enriched;
}

async function main() {
  await redisClient.connect();

  const client = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

  console.log("Слухаємо повідомлення з Event Hub...");

  const subscription = client.subscribe({
    processEvents: async (events, context) => {
      for (const event of events) {
        const data = event.body;
        const turbineId = data.turbineId;

        if (!turbineId) {
          console.warn("Немає turbineId у повідомленні:", data);
          continue;
        }

        const metadata = await redisClient.hGetAll(turbineId);
        const enriched = enrichTelemetry(data, metadata);

        console.log("Enriched:", enriched);
      }
    },

    processError: async (err, context) => {
      console.error("Помилка під час обробки:", err);
    },
  });

  setTimeout(async () => {
    await subscription.close();
    await client.close();
    await redisClient.quit();
    console.log("Зупинено прослуховування Event Hub.");
  }, 60000);
}

main().catch(console.error);

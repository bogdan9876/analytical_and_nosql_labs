require("dotenv").config();
const { EventHubConsumerClient, EventHubProducerClient } = require("@azure/event-hubs");
const redis = require("redis");

const RAW_HUB_KEY = process.env.EVENTHUB_KEY;
const ENRICHED_HUB_KEY = process.env.ENRICHED_EVENTHUB_KEY;
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

  const consumer = new EventHubConsumerClient(consumerGroup, RAW_HUB_KEY, eventHubName);
  const producer = new EventHubProducerClient(ENRICHED_HUB_KEY);

  console.log("Слухаємо повідомлення з Event Hub...");

  const subscription = consumer.subscribe({
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
        await producer.sendBatch([{ body: enriched }]);
        console.log("✅ Відправлено у enriched-events");
      }
    },

    processError: async (err, context) => {
      console.error("Помилка під час обробки:", err);
    },
  });

  // setTimeout(async () => {
  //   await subscription.close();
  //   await consumer.close();
  //   await producer.close();
  //   await redisClient.quit();
  //   console.log("Зупинено прослуховування Event Hub.");
  // }, 60000);
}

main().catch(console.error);

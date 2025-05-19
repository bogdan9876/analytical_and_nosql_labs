require('dotenv').config();
const { EventHubConsumerClient } = require("@azure/event-hubs");

const connectionString = process.env.EVENTHUB_KEY;
const eventHubName = "test-event33";
const consumerGroup = "$Default";

const client = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

async function main() {
  console.log("Слухаємо повідомлення з Event Hub...");
  const subscription = client.subscribe({
    processEvents: async (events, context) => {
      for (const event of events) {
        console.log("Дані отримано:", event.body);
      }
    },
    processError: async (err, context) => {
      console.error("Помилка:", err);
    }
  });

  setTimeout(async () => {
    await subscription.close();
    await client.close();
    console.log("Зупинено");
  }, 60000);
}

main().catch(console.error);

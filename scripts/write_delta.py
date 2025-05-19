import os
import json
from dotenv import load_dotenv
from azure.eventhub.aio import EventHubConsumerClient
import daft
from daft import DataFrame
import asyncio

load_dotenv()

EVENT_HUB_CONN_STR = os.getenv('ENRICHED_EVENTHUB_KEY')
EVENT_HUB_NAME = "test-eventhub2"
CONSUMER_GROUP = "$Default"
DELTA_OUTPUT_PATH = "abfss://teststorage33.blob.core.windows.net/$logs"

messages = []

async def on_event(partition_context, event):
    if event is None:
        return
    try:
        body = event.body_as_str(encoding='UTF-8')
        data = json.loads(body)
        messages.append(data)
        print(f"📥 Отримано повідомлення: {data}")
        await partition_context.update_checkpoint(event)
    except Exception as e:
        print(f"❌ Помилка обробки події: {e}")

async def main():
    client = EventHubConsumerClient.from_connection_string(
        conn_str=EVENT_HUB_CONN_STR,
        consumer_group=CONSUMER_GROUP,
        eventhub_name=EVENT_HUB_NAME
    )

    async with client:
        task = asyncio.create_task(client.receive(on_event=on_event, starting_position="-1"))
        await asyncio.sleep(30)
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            print("Отримання подій зупинено.")

    print(f"Отримано {len(messages)} повідомлень")

    if messages:
        try:
            df = daft.from_pydict({key: [msg[key] for msg in messages] for key in messages[0].keys()})
            print("📦 DataFrame сформовано, зберігаємо в Delta Lake...")
            df.write_deltalake(DELTA_OUTPUT_PATH, mode="overwrite")
            print("✅ Успішно записано у Delta Lake.")
        except Exception as e:
            print(f"❌ Помилка при записі Delta Lake: {e}")
    else:
        print("⚠️ Подій не знайдено для збереження.")

if __name__ == "__main__":
    asyncio.run(main())

import os
import json
import asyncio
from dotenv import load_dotenv
from azure.eventhub.aio import EventHubConsumerClient
from daft import from_pydict
from deltalake.writer import write_deltalake

load_dotenv()

EVENT_HUB_CONN_STR = os.getenv("ENRICHED_EVENTHUB_KEY")
EVENT_HUB_NAME = "test-eventhub2"
CONSUMER_GROUP = "$Default"

SAS_TOKEN = os.getenv("AZURE_STORAGE_SAS_TOKEN")
STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
CONTAINER_NAME = "$logs"
DELTA_OUTPUT_PATH = f"abfss://{CONTAINER_NAME}@{STORAGE_ACCOUNT_NAME}.dfs.core.windows.net"

messages = []

async def on_event(partition_context, event):
    if event is None:
        return
    try:
        body = event.body_as_str(encoding="UTF-8")
        data = json.loads(body)
        messages.append(data)
        print(f"Отримано повідомлення: {data}")
        await partition_context.update_checkpoint(event)
    except Exception as e:
        print(f"Помилка обробки події: {e}")

async def main():
    client = EventHubConsumerClient.from_connection_string(
        conn_str=EVENT_HUB_CONN_STR,
        consumer_group=CONSUMER_GROUP,
        eventhub_name=EVENT_HUB_NAME
    )

    async with client:
        print("Починаємо отримання подій протягом 30 секунд")
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
            df = from_pydict({key: [msg[key] for msg in messages] for key in messages[0].keys()})
            df_pandas = df.to_pandas()

            print("🪵 Зберігаємо в Delta Lake...")
            write_deltalake(
            table_or_uri=DELTA_OUTPUT_PATH,
            data=df_pandas,
            mode="overwrite",
            storage_options={
                "account_name": STORAGE_ACCOUNT_NAME,
                "sas_token": SAS_TOKEN
            })
            print("Успішно записано у Delta Lake.")
        except Exception as e:
            print(f"Помилка при записі Delta Lake: {e}")
    else:
        print("Подій не знайдено для збереження.")

if __name__ == "__main__":
    asyncio.run(main())

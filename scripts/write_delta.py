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
CONTAINER_NAME = "test-container"
DELTA_OUTPUT_PATH = f"abfss://{CONTAINER_NAME}@{STORAGE_ACCOUNT_NAME}.dfs.core.windows.net/data"

messages = []
lock = asyncio.Lock()

async def on_event(partition_context, event):
    try:
        body = event.body_as_str(encoding="UTF-8")
        data = json.loads(body)
        async with lock:
            messages.append(data)
        await partition_context.update_checkpoint(event)
    except Exception as e:
        print(f"Помилка обробки події: {e}")

async def periodic_saver():
    while True:
        await asyncio.sleep(30)
        async with lock:
            if messages:
                try:
                    df = from_pydict({k: [m[k] for m in messages] for k in messages[0]})
                    df_pandas = df.to_pandas()
                    write_deltalake(
                        table_or_uri=DELTA_OUTPUT_PATH,
                        data=df_pandas,
                        mode="append",
                        storage_options={
                            "account_name": STORAGE_ACCOUNT_NAME,
                            "sas_token": SAS_TOKEN
                        }
                    )
                    print(f"Збережено {len(messages)} повідомлень.")
                    messages.clear()
                except Exception as e:
                    print(f"Помилка при записі: {e}")
            else:
                print("Немає нових повідомлень.")

async def main():
    client = EventHubConsumerClient.from_connection_string(
        conn_str=EVENT_HUB_CONN_STR,
        consumer_group=CONSUMER_GROUP,
        eventhub_name=EVENT_HUB_NAME
    )
    async with client:
        await asyncio.gather(
            client.receive(on_event=on_event, starting_position="-1"),
            periodic_saver()
        )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Зупинено вручну.")

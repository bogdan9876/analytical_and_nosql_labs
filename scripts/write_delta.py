import daft
from datetime import datetime

data = {
    "turbineId": ["T001"],
    "windSpeed": [18.5],
    "timestamp": [datetime.utcnow().isoformat()],
    "location": ["Odesa"],
    "maxWindSpeed": [25],
    "status": ["NORMAL"]
}

df = daft.from_pydict(data)
df.write_deltalake("delta_output/telemetry_data")
print("Data written to delta_output/")

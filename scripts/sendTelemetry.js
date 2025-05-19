require('dotenv').config();
const { Client, Message } = require("azure-iot-device");
const { Mqtt } = require("azure-iot-device-mqtt");

const connectionStrings = [
  process.env.IOT_CONNECTION_1,
  process.env.IOT_CONNECTION_2,
  process.env.IOT_CONNECTION_3,
  process.env.IOT_CONNECTION_4,
  process.env.IOT_CONNECTION_5,
  process.env.IOT_CONNECTION_6,
];

function generateTelemetry(turbineId) {
  return {
    turbineId,
    timestamp: new Date().toISOString(),
    wind_speed: parseInt((8 + Math.random() * 4)),
    wind_direction: Math.floor(Math.random() * 361),
    rotor_rpm: parseInt((10 + Math.random() * 5)),
    active_power: Math.floor(1200 + Math.random() * 600),
    generator_temp: parseInt((60 + Math.random() * 10)),
    gearbox_temp: parseInt((65 + Math.random() * 10)),
    pitch_angle: parseInt((10 + Math.random() * 10)),
  };
}


connectionStrings.forEach((connStr, index) => {
  const deviceId = `T00${index + 1}`;
  const client = Client.fromConnectionString(connStr, Mqtt);

  client.open((err) => {
    if (err) {
      console.error(`Could not connect [${deviceId}]: `, err.message);
      return;
    }
    console.log(`Connected: ${deviceId}`);

    setInterval(() => {
      const message = new Message(JSON.stringify(generateTelemetry(deviceId)));
      console.log(`Sending from ${deviceId}:`, message.getData());
      client.sendEvent(message);
    }, 5000);
  });
});

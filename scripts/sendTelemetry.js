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
  const timestamp = new Date().toISOString();

  const wind_speed = parseFloat((8 + Math.random() * 4).toFixed(2));
  const wind_direction = Math.floor(Math.random() * 361);
  const rotor_rpm = parseFloat((10 + wind_speed / 2 + Math.random()).toFixed(2));
  const active_power = parseInt(1200 + rotor_rpm * 20 + Math.random() * 50);

  const generator_temp = parseInt(60 + (active_power - 1200) / 100 + Math.random() * 5);
  const gearbox_temp = parseInt(65 + (rotor_rpm - 10) + Math.random() * 5);
  const pitch_angle = parseInt(10 + (12 - wind_speed) + Math.random() * 5);

  return {
    turbineId,
    timestamp,
    wind_speed,
    wind_direction,
    rotor_rpm,
    active_power,
    generator_temp,
    gearbox_temp,
    pitch_angle,
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
    }, 10000);
  });
});

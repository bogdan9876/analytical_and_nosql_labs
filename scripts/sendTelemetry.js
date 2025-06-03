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

function mpsToKmH(v) { return v * 3.6; }
function mpsToFtS(v) { return v / 0.3048; }
function mpsToKnots(v) { return v / 0.514444; }

function degToRad(d) { return d * (Math.PI / 180); }
function degToMil(d) { return d / 0.05625; }

function cToK(c) { return c + 273.15; }
function cToF(c) { return c * 9 / 5 + 32; }

function rpmToRps(rpm) { return rpm / 60; }

function kwToMw(p) { return p / 1000; }
function kwToWatts(p) { return p * 1000; }
function kwToKWh(p) { return p * 1; }

function convertValue(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'm/s') {
    if (toUnit === 'km/h') return mpsToKmH(value);
    if (toUnit === 'ft/s') return mpsToFtS(value);
    if (toUnit === 'knots') return mpsToKnots(value);
  }

  if (fromUnit === 'degrees') {
    if (toUnit === 'rad') return degToRad(value);
    if (toUnit === 'mil') return degToMil(value);
  }

  if (fromUnit === '°C') {
    if (toUnit === 'Kelvin') return cToK(value);
    if (toUnit === '°F') return cToF(value);
  }

  if (fromUnit === 'kW') {
    if (toUnit === 'MW') return kwToMw(value);
    if (toUnit === 'Watts') return kwToWatts(value);
    if (toUnit === 'kWh') return kwToKWh(value);
  }

  if (fromUnit === 'RPM' && toUnit === 'rps') return rpmToRps(value);

  return value;
}

const turbineConfigs = {
  T001: {
    unit_wind: 'm/s', unit_dir: 'degrees', unit_rotorRPM: 'RPM',
    unit_power: 'kW', unit_genTemp: '°C', unit_gearTemp: '°C', unit_pitch: 'degrees',
    windSpeedRange: [6, 12], rotorRPMRange: [12, 18], powerBase: 1100, genTempBase: 55, gearboxTempBase: 60, pitchAngleBase: 8
  },
  T002: {
    unit_wind: 'km/h', unit_dir: 'rad', unit_rotorRPM: 'RPM',
    unit_power: 'MW', unit_genTemp: 'Kelvin', unit_gearTemp: 'Kelvin', unit_pitch: 'radians',
    windSpeedRange: [6, 12], rotorRPMRange: [11, 17], powerBase: 1150, genTempBase: 57, gearboxTempBase: 62, pitchAngleBase: 9
  },
  T003: {
    unit_wind: 'ft/s', unit_dir: 'degrees', unit_rotorRPM: 'rps',
    unit_power: 'Watts', unit_genTemp: '°C', unit_gearTemp: '°C', unit_pitch: 'degrees',
    windSpeedRange: [6, 12], rotorRPMRange: [10, 15], powerBase: 1000, genTempBase: 53, gearboxTempBase: 58, pitchAngleBase: 7
  },
  T004: {
    unit_wind: 'knots', unit_dir: 'degrees', unit_rotorRPM: 'RPM',
    unit_power: 'kW', unit_genTemp: '°C', unit_gearTemp: 'Kelvin', unit_pitch: 'degrees',
    windSpeedRange: [6, 12], rotorRPMRange: [13, 19], powerBase: 1120, genTempBase: 56, gearboxTempBase: 61, pitchAngleBase: 8
  },
  T005: {
    unit_wind: 'm/s', unit_dir: 'mil', unit_rotorRPM: 'RPM',
    unit_power: 'kWh', unit_genTemp: '°C', unit_gearTemp: '°C', unit_pitch: 'mil',
    windSpeedRange: [6, 12], rotorRPMRange: [11, 16], powerBase: 1080, genTempBase: 54, gearboxTempBase: 59, pitchAngleBase: 7.5
  },
  T006: {
    unit_wind: 'km/h', unit_dir: 'degrees', unit_rotorRPM: 'RPM',
    unit_power: 'MW', unit_genTemp: '°F', unit_gearTemp: '°F', unit_pitch: 'degrees',
    windSpeedRange: [6, 12], rotorRPMRange: [12, 17.5], powerBase: 1130, genTempBase: 58, gearboxTempBase: 63, pitchAngleBase: 9.2
  }
};

function getRandomInRange(min, max, fixed = 2) {
  return parseFloat((min + Math.random() * (max - min)).toFixed(fixed));
}

function generateTelemetry(turbineId) {
  const timestamp = new Date().toISOString();
  const config = turbineConfigs[turbineId];

  const windBase = getRandomInRange(...config.windSpeedRange);
  const wind = convertValue(windBase, 'm/s', config.unit_wind);

  const dirBase = Math.floor(Math.random() * 361);
  const dir = convertValue(dirBase, 'degrees', config.unit_dir);

  const rotorBase = getRandomInRange(...config.rotorRPMRange);
  const rotor = convertValue(rotorBase, 'RPM', config.unit_rotorRPM);

  const powerBase = parseInt(config.powerBase + rotorBase * 20 + Math.random() * 50);
  const power = convertValue(powerBase, 'kW', config.unit_power);

  const genTempBase = config.genTempBase + (powerBase - config.powerBase) / 100 + Math.random() * 5;
  const genTemp = convertValue(genTempBase, '°C', config.unit_genTemp);

  const gearboxTempBase = config.gearboxTempBase + (rotorBase - config.rotorRPMRange[0]) + Math.random() * 5;
  const gearboxTemp = convertValue(gearboxTempBase, '°C', config.unit_gearTemp);

  const pitchBase = config.pitchAngleBase + (config.windSpeedRange[1] - windBase) + Math.random() * 5;
  const pitch = convertValue(pitchBase, 'degrees', config.unit_pitch);

  return {
    turbineId,
    timestamp,
    wind_speed: parseFloat(wind.toFixed(2)),
    wind_direction: parseFloat(dir.toFixed(2)),
    rotor_rpm: parseFloat(rotor.toFixed(2)),
    active_power: parseFloat(power.toFixed(2)),
    generator_temp: parseFloat(genTemp.toFixed(2)),
    gearbox_temp: parseFloat(gearboxTemp.toFixed(2)),
    pitch_angle: parseFloat(pitch.toFixed(2)),
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

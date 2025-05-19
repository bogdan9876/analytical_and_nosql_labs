require('dotenv').config();
const sql = require("mssql");
const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_KEY
});

const config = {
  server: "test-database33.database.windows.net",
  database: "test-database33",
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  authentication: {
    type: "azure-active-directory-default"
  }
};

async function cacheMeasurementMetadata() {
  try {
    await redisClient.connect();

    await sql.connect(config);
    const result = await sql.query("SELECT * FROM measurement");

    for (const row of result.recordset) {
      const key = row.turbineId;
      await redisClient.hSet(key, {
        wind_speed: row.wind_speed,
        wind_direction: row.wind_direction,
        rotor_rpm: row.rotor_rpm,
        active_power: row.active_power,
        generator_temp: row.generator_temp,
        gearbox_temp: row.gearbox_temp,
        pitch_angle: row.pitch_angle,
      });
      console.log(`Cached metadata for turbine ${key}`);
    }

    console.log("All turbine metadata cached successfully in Redis.");

    await sql.close();
    await redisClient.quit();
  } catch (error) {
    console.error("Error in caching:", error);
  }
}

cacheMeasurementMetadata();

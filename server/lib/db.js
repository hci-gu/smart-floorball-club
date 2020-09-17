const { MongoClient } = require('mongodb')

const { CONNECT_TO, DB_NAME } = process.env
let sensorData

const init = async () => {
  const client = await MongoClient.connect(CONNECT_TO, {})
  const db = client.db(DB_NAME)
  try {
    await db.createCollection('sensor-data')
  } catch (e) { }
  sensorData = db.collection('sensor-data')
}

init()

const save = async (sensorDataPoints) => {
  await sensorData.insertMany(sensorDataPoints)
}

module.exports = {
  save,
}

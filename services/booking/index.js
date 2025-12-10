const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const { computeFinalPrice } = require('./pricing');
const { MongoClient } = require('mongodb');


const app = express();
app.use(bodyParser.json());

// DB connection config
const pool = new Pool({
  host: process.env.PG_HOST || 'postgres',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DB || 'conference'
});

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017';
const mongoDbName = process.env.MONGO_DB || 'conference_logs';

let logsCollection;

async function initMongo() {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(mongoDbName);
    logsCollection = db.collection('booking_logs');
    console.log('Connected to MongoDB for booking logs');
  } catch (err) {
    console.error('Mongo connection failed:', err.message);
  }
}

initMongo();


const WEATHER_URL = process.env.WEATHER_URL || 'http://weather:5000';

// POST /bookings  { room_id, booking_date: "YYYY-MM-DD" }
app.post('/bookings', async (req, res) => {
  const { room_id, booking_date } = req.body;

  if (!room_id || !booking_date) {
    return res.status(400).json({ error: 'room_id and booking_date are required' });
  }

  try {
    // 1) Load room and location
    const roomResult = await pool.query(
      'SELECT r.*, l.name AS location_name FROM rooms r JOIN locations l ON r.location_id = l.id WHERE r.id = $1',
      [room_id]
    );
    if (roomResult.rowCount === 0) {
      return res.status(404).json({ error: 'room not found' });
    }
    const room = roomResult.rows[0];

    // 2) Call weather service
    const weatherRes = await fetch(
      `${WEATHER_URL}/forecast?location=${encodeURIComponent(room.location_name)}&date=${booking_date}`
    );

    if (!weatherRes.ok) {
      console.error('Weather service error:', weatherRes.status);
      return res.status(502).json({ error: 'weather service failed' });
    }

    const weather = await weatherRes.json();
    const temp = weather.temperature_c;

    // 3) Compute final price
    const finalPrice = computeFinalPrice(room.base_price, temp, 21);

    // 4) Insert booking (user_id left NULL for simplicity)
    try {
      const insertResult = await pool.query(
  'INSERT INTO bookings (user_id, room_id, booking_date, final_price) VALUES (NULL, $1, $2, $3) RETURNING *',
  [room_id, booking_date, finalPrice]
);

const booking = insertResult.rows[0];

// Fire-and-forget log into MongoDB
if (logsCollection) {
  logsCollection.insertOne({
    room_id,
    booking_date,
    final_price: finalPrice,
    temperature_c: temp,
    location: room.location_name,
    created_at: new Date()
  }).catch(err => {
    console.error('Failed to write booking log to Mongo:', err.message);
  });
}

return res.status(201).json({ booking, weather });

    } catch (err) {
      // unique_violation (room already booked that day)
      if (err.code === '23505') {
        return res.status(409).json({ error: 'room already booked for that date' });
      }
      console.error('DB error inserting booking:', err);
      return res.status(500).json({ error: 'failed to create booking' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'unexpected error' });
  }
});

// GET /bookings  -> list all bookings (for demo)
app.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, r.name AS room_name FROM bookings b JOIN rooms r ON b.room_id = r.id ORDER BY booking_date'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch bookings' });
  }
});

const port = process.env.PORT || 4002;
app.listen(port, () => {
  console.log(`Booking service listening on port ${port}`);
});

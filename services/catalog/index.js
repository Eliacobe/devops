const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

// read DB config from environment variables
const pool = new Pool({
  host: process.env.PG_HOST || 'postgres',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DB || 'conference'
});

app.get('/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch locations' });
  }
});

app.get('/rooms', async (req, res) => {
  try {
    const { location_id } = req.query;
    let query = 'SELECT r.*, l.name as location_name FROM rooms r JOIN locations l ON r.location_id = l.id';
    const params = [];
    if (location_id) {
      query += ' WHERE r.location_id = $1';
      params.push(location_id);
    }
    query += ' ORDER BY r.id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch rooms' });
  }
});

const port = process.env.PORT || 4003;
app.listen(port, () => {
  console.log(`Catalog service listening on port ${port}`);
});

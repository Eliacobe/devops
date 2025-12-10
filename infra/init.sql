-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  room_id INTEGER REFERENCES rooms(id),
  booking_date DATE NOT NULL,
  final_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (room_id, booking_date)
);

-- Seed some locations and rooms
INSERT INTO locations (name, city, country) VALUES
  ('HQ London','London','UK'),
  ('NY Office','New York','USA')
ON CONFLICT DO NOTHING;

INSERT INTO rooms (location_id, name, capacity, base_price)
SELECT l.id, r.name, r.capacity, r.base_price
FROM (VALUES
  ('HQ London', 'Room 1', 8, 100.00),
  ('HQ London', 'Room 2', 12, 150.00),
  ('NY Office', 'Big Room', 20, 250.00)
) AS r(location_name, name, capacity, base_price)
JOIN locations l ON l.name = r.location_name
ON CONFLICT DO NOTHING;

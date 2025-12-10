from flask import Flask, jsonify, request
import hashlib
from datetime import datetime

app = Flask(__name__)

def pseudo_temp(location, target_date_str):
    # deterministic pseudo-random temperature based on location+date
    key = f"{location}:{target_date_str}"
    h = hashlib.md5(key.encode()).hexdigest()
    n = int(h[:8], 16)
    # temp range: -5 to +35
    temp = (n % 41) - 5
    return float(temp)

@app.route('/forecast', methods=['GET'])
def forecast():
    location = request.args.get('location', 'London')
    date = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    temp = pseudo_temp(location, date)
    return jsonify({
        "location": location,
        "date": date,
        "temperature_c": temp
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

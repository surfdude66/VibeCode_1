from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import os

app = Flask(__name__)
# Database configuration
db_path = os.path.join(os.path.dirname(__file__), 'fitness.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.Integer, nullable=False) # minutes
    intensity = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "duration": self.duration,
            "intensity": self.intensity,
            "notes": self.notes,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M")
        }

class Wellness(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    energy_level = db.Column(db.Integer, nullable=False) # 1-10
    sleep_hours = db.Column(db.Float, nullable=False)
    mood_score = db.Column(db.Integer, nullable=False) # 1-10
    date = db.Column(db.Date, default=date.today)

    def to_dict(self):
        return {
            "id": self.id,
            "energy_level": self.energy_level,
            "sleep_hours": self.sleep_hours,
            "mood_score": self.mood_score,
            "date": self.date.strftime("%Y-%m-%d")
        }

# Create tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/activities', methods=['GET', 'POST'])
def handle_activities():
    if request.method == 'POST':
        data = request.json
        new_activity = Activity(
            type=data['type'],
            duration=data['duration'],
            intensity=data['intensity'],
            notes=data.get('notes', '')
        )
        db.session.add(new_activity)
        db.session.commit()
        return jsonify(new_activity.to_dict()), 201
    
    activities = Activity.query.order_by(Activity.timestamp.desc()).all()
    return jsonify([a.to_dict() for a in activities])

@app.route('/api/wellness', methods=['GET', 'POST'])
def handle_wellness():
    if request.method == 'POST':
        data = request.json
        # Check if wellness for today already exists
        today = date.today()
        existing = Wellness.query.filter_by(date=today).first()
        if existing:
            existing.energy_level = data['energy_level']
            existing.sleep_hours = data['sleep_hours']
            existing.mood_score = data['mood_score']
        else:
            new_wellness = Wellness(
                energy_level=data['energy_level'],
                sleep_hours=data['sleep_hours'],
                mood_score=data['mood_score']
            )
            db.session.add(new_wellness)
        
        db.session.commit()
        return jsonify({"status": "success"}), 201
    
    wellness_data = Wellness.query.order_by(Wellness.date.desc()).limit(7).all()
    # Reverse to show chronological order in charts
    return jsonify([w.to_dict() for w in reversed(wellness_data)])

if __name__ == '__main__':
    app.run(debug=True, port=5000)

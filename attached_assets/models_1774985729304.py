"""
A.M.E.L.I.A. — Database Models
Totem de triagem hospitalar com sistema de senhas e ML
"""

from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    sus_card = db.Column(db.String(15), unique=True, nullable=True)
    date_of_birth = db.Column(db.String(10), nullable=True)   # dd/mm/aaaa
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="patient", nullable=False)  # admin | patient
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tickets = db.relationship("Ticket", backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "cpf": self.cpf,
            "sus_card": self.sus_card,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class Ticket(db.Model):
    """Senha de atendimento gerada após triagem."""
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Código da senha: U001, M002, L003 …
    code = db.Column(db.String(10), unique=True, nullable=False)
    priority = db.Column(db.String(10), nullable=False)  # urgent | moderate | light

    # Dados da triagem
    symptoms_desc = db.Column(db.Text, nullable=False)
    pain_level = db.Column(db.Integer, nullable=True)        # 0-10
    temperature = db.Column(db.Float, nullable=True)
    blood_pressure = db.Column(db.String(20), nullable=True)
    heart_rate = db.Column(db.Integer, nullable=True)
    has_fever = db.Column(db.Boolean, default=False)
    difficulty_breathing = db.Column(db.Boolean, default=False)
    chest_pain = db.Column(db.Boolean, default=False)
    consciousness_altered = db.Column(db.Boolean, default=False)

    # ML
    ml_prediction = db.Column(db.String(10), nullable=True)   # urgent | moderate | light
    ml_confidence = db.Column(db.Float, nullable=True)
    admin_correction = db.Column(db.String(10), nullable=True) # correção do admin para retreino

    status = db.Column(db.String(20), default="waiting")  # waiting | called | attended | cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    called_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "code": self.code,
            "priority": self.priority,
            "symptoms_desc": self.symptoms_desc,
            "pain_level": self.pain_level,
            "temperature": self.temperature,
            "blood_pressure": self.blood_pressure,
            "heart_rate": self.heart_rate,
            "has_fever": self.has_fever,
            "difficulty_breathing": self.difficulty_breathing,
            "chest_pain": self.chest_pain,
            "consciousness_altered": self.consciousness_altered,
            "ml_prediction": self.ml_prediction,
            "ml_confidence": self.ml_confidence,
            "admin_correction": self.admin_correction,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class MLTrainingLog(db.Model):
    """Log de treinos e métricas do modelo ML."""
    __tablename__ = "ml_training_logs"

    id = db.Column(db.Integer, primary_key=True)
    trained_at = db.Column(db.DateTime, default=datetime.utcnow)
    samples_used = db.Column(db.Integer, default=0)
    accuracy = db.Column(db.Float, nullable=True)
    notes = db.Column(db.Text, nullable=True)

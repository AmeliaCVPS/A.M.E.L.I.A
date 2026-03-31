"""
A.M.E.L.I.A. — ML de Triagem
Classifica pacientes em: urgent (U) | moderate (M) | light (L)
usando scikit-learn com retreino supervisionado pelo admin.
"""

import os
import pickle
import numpy as np
import re
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

MODEL_PATH = os.path.join(os.path.dirname(__file__), "triage_model.pkl")

# ─────────────────────────────────────────────
# Palavras-chave para features de texto
# ─────────────────────────────────────────────
URGENT_KEYWORDS = [
    "dor no peito", "peito", "falta de ar", "não respira", "desmaio",
    "desmaiei", "inconsciente", "convulsão", "convulsão", "paralisia",
    "acidente", "hemorragia", "sangramento intenso", "vomitando sangue",
    "fezes com sangue", "pressão muito alta", "pressão altíssima",
    "infarto", "avc", "derrame", "coração", "parou", "crise",
    "confusão mental", "desorientado", "não consegue falar",
    "batimentos altos", "taquicardia severa", "arritmia",
    "temperatura muito alta", "febre muito alta", "40", "41", "42",
]

MODERATE_KEYWORDS = [
    "febre", "tontura", "vômito", "náusea", "diarreia", "dor abdominal",
    "dor de cabeça forte", "pressão alta", "inchaço", "alergia",
    "corte", "ferimento", "fratura", "torção", "queimadura leve",
    "falta de apetite", "cansaço excessivo", "palpitações",
    "tosse com secreção", "dificuldade para engolir", "urina escura",
]

LIGHT_KEYWORDS = [
    "dor de cabeça leve", "cansaço", "tosse seca", "coriza",
    "resfriado", "gripe leve", "dor muscular leve", "arranhão",
    "coceira", "rinite", "alergia leve", "dor nas costas leve",
    "insônia", "ansiedade leve", "dor de garganta leve",
]


def extract_features(data: dict) -> list:
    """
    Extrai vetor de features numérico a partir dos dados de triagem.
    data keys: symptoms_desc, pain_level, temperature, heart_rate,
               has_fever, difficulty_breathing, chest_pain,
               consciousness_altered
    """
    desc = (data.get("symptoms_desc") or "").lower()

    urgent_score = sum(1 for kw in URGENT_KEYWORDS if kw in desc)
    moderate_score = sum(1 for kw in MODERATE_KEYWORDS if kw in desc)
    light_score = sum(1 for kw in LIGHT_KEYWORDS if kw in desc)

    pain = float(data.get("pain_level") or 0)
    temp = float(data.get("temperature") or 36.5)
    hr = float(data.get("heart_rate") or 72)
    has_fever = 1 if data.get("has_fever") else 0
    diff_breath = 1 if data.get("difficulty_breathing") else 0
    chest = 1 if data.get("chest_pain") else 0
    consciousness = 1 if data.get("consciousness_altered") else 0

    # Normalização simples
    temp_score = max(0, temp - 37.0)   # desvio acima do normal
    hr_score   = max(0, hr - 100) / 50  # frequência elevada

    return [
        urgent_score,
        moderate_score,
        light_score,
        pain / 10.0,
        temp_score,
        hr_score,
        has_fever,
        diff_breath,
        chest,
        consciousness,
    ]


# ─────────────────────────────────────────────
# Dataset inicial heurístico (bootstrap)
# ─────────────────────────────────────────────
BOOTSTRAP_SAMPLES = [
    # (features_dict, label)
    ({"symptoms_desc": "dor no peito intensa falta de ar", "pain_level": 9, "temperature": 37.0, "heart_rate": 115, "chest_pain": True, "difficulty_breathing": True, "has_fever": False, "consciousness_altered": False}, "urgent"),
    ({"symptoms_desc": "desmaio convulsão inconsciente", "pain_level": 8, "temperature": 37.5, "heart_rate": 130, "chest_pain": False, "difficulty_breathing": True, "has_fever": False, "consciousness_altered": True}, "urgent"),
    ({"symptoms_desc": "febre muito alta 40 graus confusão mental", "pain_level": 7, "temperature": 40.0, "heart_rate": 110, "chest_pain": False, "difficulty_breathing": False, "has_fever": True, "consciousness_altered": True}, "urgent"),
    ({"symptoms_desc": "palpitações arritmia batimentos altos taquicardia severa", "pain_level": 7, "temperature": 36.8, "heart_rate": 135, "chest_pain": True, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "urgent"),
    ({"symptoms_desc": "sangramento intenso hemorragia vomitando sangue", "pain_level": 8, "temperature": 36.5, "heart_rate": 120, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "urgent"),
    ({"symptoms_desc": "avc derrame paralisia não consegue falar", "pain_level": 6, "temperature": 37.0, "heart_rate": 95, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": True}, "urgent"),

    ({"symptoms_desc": "febre alta 38.5 vômito diarreia dor abdominal", "pain_level": 6, "temperature": 38.5, "heart_rate": 95, "chest_pain": False, "difficulty_breathing": False, "has_fever": True, "consciousness_altered": False}, "moderate"),
    ({"symptoms_desc": "pressão alta tontura náusea palpitações", "pain_level": 5, "temperature": 37.0, "heart_rate": 98, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "moderate"),
    ({"symptoms_desc": "dor de cabeça forte inchaço alergia", "pain_level": 6, "temperature": 37.5, "heart_rate": 88, "chest_pain": False, "difficulty_breathing": False, "has_fever": True, "consciousness_altered": False}, "moderate"),
    ({"symptoms_desc": "tosse com secreção dificuldade para engolir febre", "pain_level": 4, "temperature": 38.0, "heart_rate": 85, "chest_pain": False, "difficulty_breathing": False, "has_fever": True, "consciousness_altered": False}, "moderate"),
    ({"symptoms_desc": "cansaço excessivo falta de apetite urina escura", "pain_level": 4, "temperature": 37.2, "heart_rate": 80, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "moderate"),
    ({"symptoms_desc": "queimadura fratura corte ferimento moderado", "pain_level": 5, "temperature": 36.8, "heart_rate": 90, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "moderate"),

    ({"symptoms_desc": "dor de cabeça leve cansaço resfriado", "pain_level": 2, "temperature": 36.5, "heart_rate": 70, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "light"),
    ({"symptoms_desc": "tosse seca coriza gripe leve", "pain_level": 2, "temperature": 37.0, "heart_rate": 72, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "light"),
    ({"symptoms_desc": "dor muscular leve nas costas", "pain_level": 3, "temperature": 36.4, "heart_rate": 68, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "light"),
    ({"symptoms_desc": "coceira rinite alergia leve", "pain_level": 1, "temperature": 36.3, "heart_rate": 65, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "light"),
    ({"symptoms_desc": "dor de garganta leve insônia ansiedade leve", "pain_level": 2, "temperature": 36.6, "heart_rate": 74, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "light"),
    ({"symptoms_desc": "arranhão pequeno corte superficial", "pain_level": 1, "temperature": 36.5, "heart_rate": 70, "chest_pain": False, "difficulty_breathing": False, "has_fever": False, "consciousness_altered": False}, "light"),
]


def build_model():
    """Cria e treina modelo RandomForest com dados bootstrap."""
    X = [extract_features(d) for d, _ in BOOTSTRAP_SAMPLES]
    y = [label for _, label in BOOTSTRAP_SAMPLES]
    clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    clf.fit(X, y)
    return clf


def load_model():
    """Carrega modelo do disco ou cria um novo."""
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    clf = build_model()
    save_model(clf)
    return clf


def save_model(clf):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)


def predict(data: dict) -> dict:
    """
    Retorna {'priority': 'urgent'|'moderate'|'light', 'confidence': float}
    """
    clf = load_model()
    features = extract_features(data)
    proba = clf.predict_proba([features])[0]
    classes = clf.classes_
    idx = int(np.argmax(proba))
    return {
        "priority": classes[idx],
        "confidence": round(float(proba[idx]) * 100, 1),
        "probabilities": {c: round(float(p) * 100, 1) for c, p in zip(classes, proba)},
    }


def retrain(corrected_tickets: list) -> dict:
    """
    Retreina o modelo com correções do admin.
    corrected_tickets: list of Ticket ORM objects que têm admin_correction preenchido.
    """
    # Começa do bootstrap
    X = [extract_features(d) for d, _ in BOOTSTRAP_SAMPLES]
    y = [label for _, label in BOOTSTRAP_SAMPLES]

    for t in corrected_tickets:
        feat = extract_features({
            "symptoms_desc": t.symptoms_desc,
            "pain_level": t.pain_level,
            "temperature": t.temperature,
            "heart_rate": t.heart_rate,
            "has_fever": t.has_fever,
            "difficulty_breathing": t.difficulty_breathing,
            "chest_pain": t.chest_pain,
            "consciousness_altered": t.consciousness_altered,
        })
        X.append(feat)
        y.append(t.admin_correction)

    clf = RandomForestClassifier(n_estimators=150, random_state=42, class_weight="balanced")
    clf.fit(X, y)

    # Calcula acurácia no próprio conjunto (indicativa)
    y_pred = clf.predict(X)
    acc = accuracy_score(y, y_pred)

    save_model(clf)
    return {"samples": len(X), "accuracy": round(acc * 100, 1)}

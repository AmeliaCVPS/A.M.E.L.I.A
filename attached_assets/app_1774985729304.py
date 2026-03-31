"""
A.M.E.L.I.A. — Totem de Triagem Hospitalar
Atendimento Médico Eficiente e Lenitivo com Inteligência Artificial
"""

import os, re, bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import (Flask, render_template, request, redirect, url_for,
                   session, flash, jsonify)
from extensions import db
from models import User, Ticket, MLTrainingLog

# ── Ticket sequence counters (em memória + DB) ─────────────────
_counters = {"urgent": 0, "moderate": 0, "light": 0}
_PREFIX   = {"urgent": "U", "moderate": "M", "light": "L"}


def _next_code(priority: str) -> str:
    """Gera próximo código de senha ex: U001, M002, L003"""
    _counters[priority] += 1
    return f"{_PREFIX[priority]}{_counters[priority]:03d}"


def _init_counters(app):
    with app.app_context():
        for priority, prefix in _PREFIX.items():
            last = (Ticket.query
                    .filter_by(priority=priority)
                    .order_by(Ticket.id.desc())
                    .first())
            if last:
                num = int(last.code[1:])
                _counters[priority] = num


# ── App factory ───────────────────────────────────────────────
def create_app():
    app = Flask(__name__, template_folder="templates", static_folder="static")

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "amelia-totem-secret-2025")
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

    db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db")
    os.makedirs(db_dir, exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(db_dir, 'amelia.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
        _init_counters(app)
        _ensure_admin(app)

    # ── Register routes ───────────────────────────────────────
    register_routes(app)
    return app


def _ensure_admin(app):
    with app.app_context():
        if not User.query.filter_by(role="admin").first():
            pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
            adm = User(name="Administrador AMELIA", cpf="00000000000",
                       sus_card="000000000000000", password_hash=pw, role="admin")
            db.session.add(adm)
            db.session.commit()


# ── Auth helpers ──────────────────────────────────────────────
def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def check_pw(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get("role") != "admin":
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


# ── Routes ───────────────────────────────────────────────────
def register_routes(app):

    # ── Totem home ────────────────────────────────────────────
    @app.route("/")
    def index():
        return render_template("totem_home.html")

    # ── Cadastro ──────────────────────────────────────────────
    @app.route("/cadastro", methods=["GET", "POST"])
    def cadastro():
        if request.method == "POST":
            name     = request.form.get("name", "").strip()
            cpf      = re.sub(r"\D", "", request.form.get("cpf", ""))
            sus      = re.sub(r"\D", "", request.form.get("sus_card", ""))
            dob      = request.form.get("date_of_birth", "").strip()
            phone    = request.form.get("phone", "").strip()
            password = request.form.get("password", "")
            confirm  = request.form.get("confirm_password", "")

            errors = []
            if not name:       errors.append("Nome é obrigatório.")
            if len(cpf) != 11: errors.append("CPF deve ter 11 dígitos.")
            if sus and len(sus) not in (0, 15): errors.append("Cartão SUS deve ter 15 dígitos.")
            if len(password) < 4: errors.append("Senha deve ter ao menos 4 caracteres.")
            if password != confirm: errors.append("As senhas não coincidem.")

            if not errors:
                if User.query.filter_by(cpf=cpf).first():
                    errors.append("CPF já cadastrado. Faça login.")

            if errors:
                return render_template("cadastro.html", errors=errors,
                                       form=request.form)

            user = User(name=name, cpf=cpf,
                        sus_card=sus or None,
                        date_of_birth=dob or None,
                        phone=phone or None,
                        password_hash=hash_pw(password),
                        role="patient")
            db.session.add(user)
            db.session.commit()
            flash("Cadastro realizado! Faça login para continuar.", "success")
            return redirect(url_for("login"))

        return render_template("cadastro.html", errors=[], form={})

    # ── Login ─────────────────────────────────────────────────
    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            identifier = re.sub(r"\D", "", request.form.get("identifier", ""))
            password   = request.form.get("password", "")

            user = (User.query.filter_by(cpf=identifier).first() or
                    User.query.filter_by(sus_card=identifier).first())

            if not user or not check_pw(password, user.password_hash):
                return render_template("login.html",
                                       error="CPF/SUS ou senha incorretos.")

            session.permanent = True
            session["user_id"] = user.id
            session["user_name"] = user.name.split()[0]
            session["role"] = user.role

            if user.role == "admin":
                return redirect(url_for("admin"))
            return redirect(url_for("triagem"))

        return render_template("login.html", error=None)

    # ── Logout ────────────────────────────────────────────────
    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for("index"))

    # ── Triagem ───────────────────────────────────────────────
    @app.route("/triagem", methods=["GET", "POST"])
    @login_required
    def triagem():
        if request.method == "POST":
            from ml.triage import predict

            data = {
                "symptoms_desc":       request.form.get("symptoms_desc", ""),
                "pain_level":          int(request.form.get("pain_level") or 0),
                "temperature":         float(request.form.get("temperature") or 36.5),
                "heart_rate":          int(request.form.get("heart_rate") or 72),
                "has_fever":           "has_fever" in request.form,
                "difficulty_breathing": "difficulty_breathing" in request.form,
                "chest_pain":          "chest_pain" in request.form,
                "consciousness_altered": "consciousness_altered" in request.form,
            }

            result  = predict(data)
            priority = result["priority"]
            code     = _next_code(priority)

            ticket = Ticket(
                user_id           = session["user_id"],
                code              = code,
                priority          = priority,
                symptoms_desc     = data["symptoms_desc"],
                pain_level        = data["pain_level"],
                temperature       = data["temperature"],
                heart_rate        = data["heart_rate"],
                has_fever         = data["has_fever"],
                difficulty_breathing = data["difficulty_breathing"],
                chest_pain        = data["chest_pain"],
                consciousness_altered = data["consciousness_altered"],
                ml_prediction     = result["priority"],
                ml_confidence     = result["confidence"],
                status            = "waiting",
            )
            db.session.add(ticket)
            db.session.commit()

            session["last_ticket_id"] = ticket.id
            return redirect(url_for("senha", ticket_id=ticket.id))

        return render_template("triagem.html",
                               user_name=session.get("user_name", ""))

    # ── Senha (resultado) ─────────────────────────────────────
    @app.route("/senha/<int:ticket_id>")
    @login_required
    def senha(ticket_id):
        ticket = Ticket.query.get_or_404(ticket_id)
        if ticket.user_id != session["user_id"] and session.get("role") != "admin":
            return redirect(url_for("index"))
        return render_template("senha.html", ticket=ticket)

    # ── Admin painel ──────────────────────────────────────────
    @app.route("/admin")
    @admin_required
    def admin():
        tickets  = Ticket.query.order_by(Ticket.created_at.desc()).all()
        patients = User.query.filter_by(role="patient").all()
        logs     = MLTrainingLog.query.order_by(MLTrainingLog.trained_at.desc()).limit(5).all()

        total   = len(tickets)
        waiting = sum(1 for t in tickets if t.status == "waiting")
        urgent  = sum(1 for t in tickets if t.priority == "urgent")
        moderate= sum(1 for t in tickets if t.priority == "moderate")
        light   = sum(1 for t in tickets if t.priority == "light")

        corrections_pending = sum(1 for t in tickets if t.admin_correction is None and t.status == "attended")

        return render_template("admin.html",
                               tickets=tickets,
                               patients=patients,
                               logs=logs,
                               stats=dict(total=total, waiting=waiting,
                                          urgent=urgent, moderate=moderate,
                                          light=light,
                                          corrections_pending=corrections_pending))

    # ── Admin: chamar próxima senha ───────────────────────────
    @app.route("/admin/chamar/<priority>", methods=["POST"])
    @admin_required
    def chamar_proximo(priority):
        ticket = (Ticket.query
                  .filter_by(priority=priority, status="waiting")
                  .order_by(Ticket.created_at.asc())
                  .first())
        if ticket:
            ticket.status    = "called"
            ticket.called_at = datetime.utcnow()
            db.session.commit()
            return jsonify({"code": ticket.code, "name": ticket.user.name})
        return jsonify({"code": None})

    # ── Admin: atualizar status do ticket ─────────────────────
    @app.route("/admin/ticket/<int:ticket_id>/status", methods=["POST"])
    @admin_required
    def update_ticket_status(ticket_id):
        ticket = Ticket.query.get_or_404(ticket_id)
        new_status = request.form.get("status")
        if new_status in ("waiting", "called", "attended", "cancelled"):
            ticket.status = new_status
            db.session.commit()
        return redirect(url_for("admin"))

    # ── Admin: corrigir classificação ML ─────────────────────
    @app.route("/admin/ticket/<int:ticket_id>/corrigir", methods=["POST"])
    @admin_required
    def corrigir_ticket(ticket_id):
        ticket = Ticket.query.get_or_404(ticket_id)
        correction = request.form.get("correction")
        if correction in ("urgent", "moderate", "light"):
            ticket.admin_correction = correction
            db.session.commit()
            flash(f"Correção salva para {ticket.code}. Retreine o modelo quando tiver dados suficientes.", "success")
        return redirect(url_for("admin"))

    # ── Admin: retreinar modelo ───────────────────────────────
    @app.route("/admin/retreinar", methods=["POST"])
    @admin_required
    def retreinar():
        from ml.triage import retrain
        corrected = Ticket.query.filter(Ticket.admin_correction.isnot(None)).all()
        if len(corrected) < 3:
            flash(f"São necessárias ao menos 3 correções para retreinar. Você tem {len(corrected)}.", "warning")
            return redirect(url_for("admin"))

        result = retrain(corrected)
        log = MLTrainingLog(
            samples_used=result["samples"],
            accuracy=result["accuracy"],
            notes=f"Retreino manual pelo admin. {len(corrected)} correções usadas."
        )
        db.session.add(log)
        db.session.commit()
        flash(f"Modelo retreinado! Acurácia: {result['accuracy']}% com {result['samples']} amostras.", "success")
        return redirect(url_for("admin"))

    # ── Admin: deletar ticket ─────────────────────────────────
    @app.route("/admin/ticket/<int:ticket_id>/deletar", methods=["POST"])
    @admin_required
    def deletar_ticket(ticket_id):
        ticket = Ticket.query.get_or_404(ticket_id)
        db.session.delete(ticket)
        db.session.commit()
        flash("Ticket removido.", "info")
        return redirect(url_for("admin"))

    # ── Admin: resetar fila ───────────────────────────────────
    @app.route("/admin/resetar-fila", methods=["POST"])
    @admin_required
    def resetar_fila():
        Ticket.query.delete()
        db.session.commit()
        _counters["urgent"] = 0
        _counters["moderate"] = 0
        _counters["light"] = 0
        flash("Fila resetada com sucesso.", "info")
        return redirect(url_for("admin"))

    # ── API: fila atual (para painel externo) ─────────────────
    @app.route("/api/fila")
    def api_fila():
        tickets = (Ticket.query
                   .filter(Ticket.status.in_(["waiting", "called"]))
                   .order_by(Ticket.created_at.asc())
                   .all())
        return jsonify([{
            "code": t.code,
            "priority": t.priority,
            "status": t.status,
            "name": t.user.name.split()[0] + " " + t.user.name.split()[-1][0] + "." if t.user else "—",
        } for t in tickets])

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)

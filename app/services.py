from sqlalchemy.orm import Session
from datetime import datetime
from .models import User, RegisteredQR


def register_qr(db: Session, name: str, email: str, phone: str, qr_value: str):
    # 1️⃣ Check if QR already exists
    existing_qr = db.query(RegisteredQR).filter(
        RegisteredQR.qr_value == qr_value
    ).first()

    if existing_qr:
        return {
            "status": "duplicate",
            "registered_at": existing_qr.registered_at
        }

    # 2️⃣ Check if user exists (email + phone)
    user = db.query(User).filter(
        User.email == email,
        User.phone == phone
    ).first()

    if not user:
        user = User(
            name=name,
            email=email,
            phone=phone
        )
        db.add(user)
        db.flush()  # gets user.id without full commit

    # 3️⃣ Create new QR registration
    new_qr = RegisteredQR(
        qr_value=qr_value,
        user_id=user.id,
        registered_at=datetime.utcnow()
    )

    db.add(new_qr)
    db.commit()

    return {
        "status": "registered",
        "user_id": user.id,
        "qr_value": qr_value
    }
def verify_qr(db: Session, qr_value: str):
    # Normalize value for consistent lookup
    qr_value = qr_value.strip().lower()

    existing_qr = db.query(RegisteredQR).filter(
        RegisteredQR.qr_value == qr_value
    ).first()

    # QR not in system — safe to buy
    if not existing_qr:
        return {"status": "clean"}

    # QR already registered — seller may be reselling to multiple buyers
    return {
        "status": "already_registered",
        "registered_at": existing_qr.registered_at,
    }
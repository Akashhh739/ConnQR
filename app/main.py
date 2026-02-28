from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services import register_qr
from pydantic import BaseModel
from app.services import register_qr, verify_qr
from fastapi import UploadFile, File
from app.qr_utils import decode_qr_from_image
import shutil
import os
app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Form

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class QRRegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    qr_value: str


class RegisterSuccessResponse(BaseModel):
    status: str
    user_id: int
    qr_value: str



class DuplicateResponse(BaseModel):
    status: str
    registered_at: str


@app.get("/")
def home():
    return {"message": "ConQR API Running"}
@app.post("/register-image", status_code=status.HTTP_201_CREATED)
def register_qr_image(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # Save uploaded file temporarily
    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        qr_value = decode_qr_from_image(temp_path)
    except Exception:
        os.remove(temp_path)
        raise HTTPException(
            status_code=400,
            detail="Invalid or unreadable QR image"
        )

    os.remove(temp_path)

    result = register_qr(
        db,
        name=name,
        email=email,
        phone=phone,
        qr_value=qr_value
    )

    if result["status"] == "duplicate":
        raise HTTPException(
            status_code=409,
            detail={
                "status": "duplicate",
                "registered_at": str(result["registered_at"])
            }
        )

    return result

@app.post("/verify-image")
def verify_qr_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    temp_path = f"temp_verify_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        qr_value = decode_qr_from_image(temp_path)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable QR image")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    result = verify_qr(db, qr_value)

    if result["status"] == "already_registered":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "status": "already_registered",
                "registered_at": str(result["registered_at"]),
            }
        )

    # status == "clean" — not in system, safe to buy
    return {"status": "clean"}

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_qr_endpoint(request: QRRegisterRequest, db: Session = Depends(get_db)):
    result = register_qr(
        db,
        name=request.name,
        email=request.email,
        phone=request.phone,
        qr_value=request.qr_value
    )

    if result["status"] == "duplicate":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "status": "duplicate",
                "registered_at": str(result["registered_at"])
            }
        )
class QRVerifyRequest(BaseModel):
    qr_value: str


@app.post("/verify")
def verify_qr_endpoint(request: QRVerifyRequest, db: Session = Depends(get_db)):
    result = verify_qr(db, request.qr_value)

    if result["status"] == "not_registered":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"status": "not_registered", "message": "This QR is not in our system. Unknown or fake ticket."}
        )

    if result["status"] == "already_used":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "status": "already_used",
                "message": "This QR has already been scanned. Possible fraud.",
                "checked_in_at": str(result["checked_in_at"]),
                "user": result["user"]
            }
        )

    # status == "granted"
    return {
        "status": "granted",
        "message": "Entry granted.",
        "registered_at": str(result["registered_at"]),
        "user": result["user"]
    }
    
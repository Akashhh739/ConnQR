import cv2


def decode_qr_from_image(image_path: str) -> str:
    img = cv2.imread(image_path)

    detector = cv2.QRCodeDetector()
    data, bbox, _ = detector.detectAndDecode(img)

    if not data:
        raise ValueError("No QR code found")

    # Normalize to ensure consistent duplicate detection
    return data.strip().lower()
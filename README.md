# KYC OCR App (MERN)

A privacy-first starter for extracting fields from an Aadhaar or PAN card image. The API performs OCR in memory, returns a reviewable result, and stores only masked identifiers and confirmed fields.

## Prerequisites

- Node.js 20+ and a working `npm`
- MongoDB Community Server or MongoDB Atlas

## Start the server

```powershell
cd server
Copy-Item .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm install
npm run dev
```

## Start the client

```powershell
cd client
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). The API runs at `http://localhost:5000`.

## Production notes

- Replace Tesseract with a managed/document OCR service for real-world accuracy.
- Do not accept unmasked Aadhaar numbers as a product requirement unless you have verified legal authority and controls. This starter stores only `XXXX XXXX 1234`.
- Add authentication, a consent record, encryption/key management, malware scanning, audit logging, retention/deletion jobs, and a human review workflow before production use.
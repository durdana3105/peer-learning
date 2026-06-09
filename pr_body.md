## What changed
- Created `backend/routes/users.js` to handle user profile photo uploads.
- Configured `multer` with a 5MB `fileSize` limit to prevent server disk space exhaustion.
- Added MIME type validation to restrict uploads strictly to `image/*` formats.
- Wired up the new user routes in `backend/app.js`.
- Added `multer` to the project dependencies in `package.json`.

## Why
The issue described a vulnerability where the user profile photo upload endpoint lacked file size validation, which could allow attackers to upload arbitrarily large files and exhaust server disk space and memory (DoS). This fix enforces a strict 5MB limit and verifies that the file is an image.

## How to test
```bash
npm install
npm run dev
# In another terminal, attempt to upload a non-image file:
curl -X POST -F "profilePhoto=@/path/to/file.txt" http://localhost:3000/api/users/upload-photo
# Should return: {"error": "Only image files are allowed!"}
```

## Screenshots (if UI change)
N/A

## Checklist
- [x] I have read the [CONTRIBUTING.md](CONTRIBUTING.md)
- [x] I have tested my changes locally
- [x] I can explain every line of code I've written
- [x] I have NOT used AI-generated code without understanding and attributing it

## Related issue
Closes #693

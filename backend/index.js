const express = require("express");
const multer = require("multer");
const cors = require("cors");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = 5000;

app.use(cors());

// Use multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route: Encrypt image
app.post("/encrypt", upload.single("image"), (req, res) => {
  try {
    const key = req.body.key;
    if (!key) return res.status(400).send("Missing key");

    const buffer = req.file.buffer;
    const base64 = buffer.toString("base64");

    const encrypted = CryptoJS.Blowfish.encrypt(base64, key).toString();

    res.set("Content-Disposition", "attachment; filename=encrypted.enc");
    res.set("Content-Type", "application/octet-stream");
    res.send(encrypted);
  } catch (err) {
    console.error(err);
    res.status(500).send("Encryption failed");
  }
});

// Route: Decrypt image
app.post("/decrypt", upload.single("file"), (req, res) => {
  try {
    const key = req.body.key;
    if (!key) return res.status(400).send("Missing key");

    const encryptedData = req.file.buffer.toString();
    const bytes = CryptoJS.Blowfish.decrypt(encryptedData, key);
    const base64 = bytes.toString(CryptoJS.enc.Utf8);

    if (!base64) return res.status(400).send("Incorrect decryption key or invalid file");

    const buffer = Buffer.from(base64, "base64");
    res.set("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Decryption failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

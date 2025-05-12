import React, { useState, useRef } from "react";
import axios from "axios";
import QRCode from "qrcode";
import jsQR from "jsqr";
import "./App.css";
import { motion } from "framer-motion";

function App() {
  const [file, setFile] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [decryptedImage, setDecryptedImage] = useState(null);
  const canvasRef = useRef();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDecryptedImage(null);
  };

  const handleQrFileChange = (e) => {
    setQrFile(e.target.files[0]);
  };

  const generateRandomKey = () => {
    return Math.random().toString(36).slice(2, 18); // 16-char random key
  };

  const handleEncrypt = async () => {
    if (!file) return alert("Please select an image");

    const key = generateRandomKey();

    try {
      // ✅ Generate QR Code from key using toDataURL
      const qrDataURL = await QRCode.toDataURL(key);
      const qrLink = document.createElement("a");
      qrLink.href = qrDataURL;
      qrLink.download = "key.png";
      qrLink.click();
    } catch (qrErr) {
      return alert("QR Code generation failed");
    }

    // 🔐 Encrypt image with key
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", key);

    try {
      const res = await axios.post("http://localhost:5000/encrypt", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "encrypted.enc");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Encryption failed");
    }
  };

  const extractKeyFromQR = () => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error("Failed to decode QR code"));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(qrFile);
    });
  };

  const handleDecrypt = async () => {
    if (!file || !qrFile) {
      return alert("Please select both encrypted file and QR code image");
    }

    try {
      const key = await extractKeyFromQR();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);

      const res = await axios.post("http://localhost:5000/decrypt", formData, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(res.data);
      setDecryptedImage(url);

      // ⬇️ Automatically download decrypted image
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "decrypted.png");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Decryption failed: " + err.message);
    }
  };

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h1 className="title">🔒 QR-Based Blowfish Image Encryption</h1>

      <input type="file" onChange={handleFileChange} className="file-input" />
      <p>Select QR code (only for decryption):</p>
      <input type="file" onChange={handleQrFileChange} accept="image/*" className="file-input" />

      <div className="button-group">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEncrypt}
          disabled={!file}
        >
          Encrypt & Download + QR
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDecrypt}
          disabled={!file || !qrFile}
        >
          Decrypt & Download
        </motion.button>
      </div>

      {decryptedImage && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p>🔓 Decrypted Image:</p>
          <img src={decryptedImage} alt="Decrypted" height="200" />
        </motion.div>
      )}

      {/* Hidden canvas for QR decoding */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </motion.div>
  );
}

export default App;

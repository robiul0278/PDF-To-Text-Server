const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const { PDFDocument } = require("pdf-lib");

const app = express();
app.use(cors());

// Use Multer to handle file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    // Access the uploaded file buffer
    const pdfBuffer = req.file.buffer;

    // PDF to Text Extract
    const pdfData = await pdfParse(pdfBuffer);
    const textWithSpacing = pdfData.text.replace(/([a-z])([A-Z])/g, "$1 $2");

    // PDF to Image Extract
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const images = [];
    for (const page of pdfDoc.getPages()) {
      const embeddedImages = page.node.normalizedEntries().XObject;
      if (embeddedImages) {
        Object.values(embeddedImages).forEach((image) => {
          const rawImage = pdfDoc.context.lookup(image);
          if (rawImage && rawImage.constructor.name === "PDFRawStream") {
            images.push(rawImage.contents);
          }
        });
      }
    }

    // Send the processed result as a response
    res.json({
      text: textWithSpacing,
      images: images.map((img) => img.toString("base64")),
    });
  } catch (err) {
    res.status(500).send("Error processing PDF: " + err.message);
  }
});

module.exports = app;

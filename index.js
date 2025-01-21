const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require('cors')
const pdfParse = require("pdf-parse");
const { PDFDocument } = require("pdf-lib");

const app = express();
app.use(cors())
const upload = multer({ dest: "uploads/" });

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // PDF to Text Extract
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const textWithSpacing = pdfData.text.replace(/([a-z])([A-Z])/g, "$1 $2");
    

    // PDF to Image Extract
    const pdfDoc = await PDFDocument.load(dataBuffer);
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

    res.json({
      text: textWithSpacing.text,
      images: images.map((img) => img.toString("base64")),
    });

    fs.unlinkSync(filePath); // Remove Upload File
  } catch (err) {
    res.status(500).send("Error processing PDF: " + err.message);
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));

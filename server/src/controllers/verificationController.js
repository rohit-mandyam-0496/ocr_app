import { createWorker } from "tesseract.js";
// import Tesseract from "tesseract.js";
import Verification from "../models/Verification.js";
import { parseDocument } from "../utils/documentParser.js";

export async function scanDocument(req, res, next) {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ message: "Upload a JPG, PNG, or WEBP image up to 5 MB." });

    if (req.body.consent !== "true")
      return res.status(400).json({ message: "Explicit consent is required." });

    // const imagePath = req.file.path;
    // const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
    //   logger: m => console.log(m) // Tracks recognition progress
    // });

    const worker = await createWorker(["eng", "hin"]);
    
    const { data } = await worker.recognize(req.file.buffer);
    console.log("data", data);

    const text = data.text;
    console.log("text", text);

    await worker.terminate();

    console.log("text", text);

    const result = await parseDocument(text);
    console.log("result", result);
    console.log("result.documentType", result.documentType);

    if (!result.documentType)
      return res.status(422).json({
        message:
          "No Aadhaar or PAN number could be detected. Try a clearer photo.",
      });

    const verification = await Verification.create({
      ...result,
      consentAt: new Date(),
    });

    return res.status(201).json({ verificationId: verification.id, result });
  } catch (error) {
    next(error);
  }
}

export async function confirmVerification(req, res, next) {
  try {
    const verification = await Verification.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        dateOfBirth: req.body.dateOfBirth,
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!verification)
      return res.status(404).json({ message: "Verification not found." });
    
    return res
      .status(200)
      .json({ message: "Verification confirmed.", data: verification });
      
  } 
  catch (error) {
    next(error);
  }
}

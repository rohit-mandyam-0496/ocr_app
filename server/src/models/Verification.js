import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    documentType: { type: String, enum: ["AADHAAR", "PAN"], required: true },
    name: { type: String, trim: true, maxlength: 120 },
    dateOfBirth: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    identifierMasked: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "CONFIRMED", "REJECTED"],
      default: "PENDING_REVIEW",
    },
    consentAt: { type: Date, required: true },
    confirmedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Verification", verificationSchema);

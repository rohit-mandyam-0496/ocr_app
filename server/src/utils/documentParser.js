const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
const aadhaarPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
const datePattern = /\b(\d{2})[/-](\d{2})[/-](\d{4})\b/;

const ignoredNameTerms = [
  "GOVERNMENT",
  "GOVT",
  "INDIA",
  "INCOME TAX",
  "DEPARTMENT",
  "PERMANENT ACCOUNT",
  "SIGNATURE",
  "DOB",
  "DATE OF BIRTH",
  "YEAR OF BIRTH",
  "MALE",
  "FEMALE",
  "ADDRESS",
  "VID",
];

function normalise(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

async function toIsoDate(value = "") {
  const match = await value.match(datePattern);
  if (!match) return undefined;

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);

  return Number.isNaN(parsed.getTime()) ? undefined : `${year}-${month}-${day}`;
}

async function isNameCandidate(line) {
  const clean = normalise(line);
  const upper = clean.toUpperCase();

  if (clean.length < 3 || clean.length > 80) return false;
  if (ignoredNameTerms.some((term) => upper.includes(term))) return false;
  if (panPattern.test(upper) || aadhaarPattern.test(upper)) return false;

  // Allows names, initials, dots and apostrophes—but rejects address-like OCR noise.
  return /^[A-Z][A-Z .']+$/i.test(clean) && /[A-Z]/i.test(clean);
}

async function extractAadharName(lines) {
  for (const line of lines) {
    const upper = await line.toUpperCase();
    // Stop once the card reaches relationship/DOB fields.
    if (
      /MOTHER|FATHER|DOB|DATE OF BIRTH|YEAR OF BIRTH|MALE|FEMALE/.test(upper)
    ) {
      break;
    }
    // Extract a title-cased English full name even if OCR adds symbols before it.
    const englishName = await line.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/,
    )?.[1];
    if (
      englishName &&
      !/GOVERNMENT|INDIA|INCOME TAX|DEPARTMENT/i.test(englishName)
    ) {
      return englishName;
    }
  }
  return undefined;
}

async function extractPanName(lines) {
  const panIndex = await lines.findIndex((line) =>
    /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(line.toUpperCase()),
  );

  const candidateLines = panIndex >= 0 ? lines.slice(0, panIndex) : lines;

  for (const line of candidateLines) {
    // Remove trailing OCR noise, especially text after "=" or "|".
    const beforeNoise = line.split(/[=|]/)[0];

    const clean = normalise(beforeNoise.replace(/[^\p{L}\s.'-]/gu, " "));

    const upper = clean.toUpperCase();

    if (
      /INCOME|TAX|DEPARTMENT|GOVT|GOVERNMENT|INDIA|PERMANENT|ACCOUNT/.test(
        upper,
      )
    ) {
      continue;
    }

    // PAN names are generally uppercase with at least two words.
    const words = clean.match(/\b[A-Z]{2,}\b/g) || [];

    if (words.length >= 2) {
      return words.join(" ");
    }
  }

  return undefined;
}

async function extractDob(lines, fullText) {
  // Check the DOB label line and the following two OCR lines.
  for (let index = 0; index < lines.length; index += 1) {
    if (/DOB|DATE OF BIRTH/i.test(lines[index])) {
      const nearbyText = lines.slice(index, index + 3).join(" ");
      const dob = await toIsoDate(nearbyText);
      if (dob) return dob;
    }
  }

  // Fallback for cards where OCR detects the date but misses the DOB label.
  return await toIsoDate(fullText);
}

export async function parseDocument(rawText) {
  const text = await rawText.replace(/\r/g, "");
  console.log("text", text);

  const upperText = await text.toUpperCase();
  console.log("upperText", upperText);

  const lines = await text.split("\n").map(normalise).filter(Boolean);
  console.log("lines", lines);

  const pan = await upperText.match(panPattern)?.[0];
  console.log("pan", pan);

  const aadhaar = await upperText
    .match(aadhaarPattern)?.[0]
    ?.replace(/\D/g, "");
  console.log("aadhaar", aadhaar);

  const documentType = pan ? "PAN" : aadhaar ? "AADHAAR" : null;
  console.log("documentType", documentType);

  const identifierMasked = pan
    ? `${pan.slice(0, 3)}******${pan.at(-1)}`
    : aadhaar
      ? `XXXX XXXX ${aadhaar.slice(-4)}`
      : null;
  console.log("identifierMasked", identifierMasked);

  let data = {
    documentType,
    identifierMasked,
    name:
      documentType === "PAN"
        ? await extractPanName(lines)
        : documentType === "AADHAAR"
          ? await extractAadharName(lines)
          : null,
    dateOfBirth: await extractDob(lines, text),
    confidence: documentType ? "HIGH" : "LOW",
  };
  console.log("data", data);

  return data;
}

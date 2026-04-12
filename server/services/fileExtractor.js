const { s3, BUCKET } = require('../config/s3');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const File = require('../models/File');

// Download a file from S3 and extract its text content.
// Supports: PDF, plain text, and files with existing transcriptions.
async function extractText(fileDoc) {
  // If we already have transcription text, use it
  if (fileDoc.transcription?.text) {
    return fileDoc.transcription.text;
  }

  // Need to pull from S3
  if (!fileDoc.s3Key) return null;

  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: fileDoc.s3Key });
    const res = await s3.send(cmd);
    const buffer = Buffer.from(await res.Body.transformToByteArray());

    const mime = fileDoc.fileType || fileDoc.mimeType || '';

    // PDF
    if (mime.includes('pdf') || fileDoc.s3Key.endsWith('.pdf')) {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
      } catch (e) {
        console.error('PDF parse failed for', fileDoc.originalName, e.message);
        return null;
      }
    }

    // Plain text, markdown, etc.
    if (mime.includes('text') || fileDoc.s3Key.match(/\.(txt|md|csv)$/)) {
      return buffer.toString('utf-8');
    }

    // Word docs — basic extraction (strip XML tags)
    if (mime.includes('word') || mime.includes('document') || fileDoc.s3Key.match(/\.docx?$/)) {
      // Very rough fallback — proper docx parsing would need mammoth or similar
      const raw = buffer.toString('utf-8');
      const stripped = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return stripped.length > 50 ? stripped : null;
    }

    return null;
  } catch (err) {
    console.error('S3 download failed for', fileDoc.originalName, err.message);
    return null;
  }
}

// Extract text from multiple file IDs, returns a combined context string.
async function extractFromFiles(fileIds, userId) {
  if (!fileIds || fileIds.length === 0) return '';

  const files = await File.find({
    _id: { $in: fileIds },
    userId: userId
  });

  let context = '';
  for (const file of files) {
    const text = await extractText(file);
    if (text) {
      context += `\n\n--- From ${file.originalName} ---\n${text}`;
    }
  }
  return context;
}

module.exports = { extractText, extractFromFiles };

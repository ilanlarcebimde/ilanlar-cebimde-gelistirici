/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outputFile = path.join(process.cwd(), "public", "og", "default-1200x630.jpg");

function bytesToKb(n) {
  return Math.round((n / 1024) * 10) / 10;
}

async function run() {
  const inputFile = process.argv[2] ? path.resolve(process.argv[2]) : outputFile;

  if (!fs.existsSync(inputFile)) {
    console.error("Input file not found:", inputFile);
    console.error("");
    console.error("Usage:");
    console.error("  1) Copy your 6-7 MB image to public/og/default-1200x630.jpg then run: npm run optimize:og");
    console.error("  2) Or pass the source path: npm run optimize:og -- path/to/your-image.jpg");
    process.exit(1);
  }

  const before = fs.statSync(inputFile).size;

  // Try a few quality levels until under target size
  const targets = [78, 74, 72, 70, 68];
  let lastSize = before;

  if (!fs.existsSync(path.dirname(outputFile))) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  }

  for (const q of targets) {
    const buf = await sharp(inputFile)
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .jpeg({ quality: q, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(outputFile, buf);

    lastSize = fs.statSync(outputFile).size;
    console.log("quality=" + q + " -> " + bytesToKb(lastSize) + " KB");

    if (lastSize <= 500 * 1024) break;
  }

  const after = fs.statSync(outputFile).size;
  console.log("Before:", bytesToKb(before), "KB");
  console.log("After :", bytesToKb(after), "KB");
  console.log("Output:", outputFile);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

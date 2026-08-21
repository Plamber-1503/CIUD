const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const pdfPath = path.join(projectDir, 'assets/pdf/Folleto_Ojos_en_Alerta.pdf');
const outputDir = path.join(projectDir, 'assets/images');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Reading PDF:', pdfPath);
const pdfBuffer = fs.readFileSync(pdfPath);
console.log('PDF loaded into buffer. Size:', pdfBuffer.length, 'bytes');

let imgCount = 0;
let i = 0;

while (i < pdfBuffer.length - 3) {
    if (pdfBuffer[i] === 0xFF && pdfBuffer[i+1] === 0xD8 && pdfBuffer[i+2] === 0xFF) {
        let start = i;
        let end = -1;
        for (let j = start + 3; j < pdfBuffer.length - 1; j++) {
            if (pdfBuffer[j] === 0xFF && pdfBuffer[j+1] === 0xD9) {
                end = j + 2;
                break;
            }
        }
        if (end !== -1 && (end - start) > 10000) { // filter out small thumbnails (<10KB)
            imgCount++;
            const imgData = pdfBuffer.subarray(start, end);
            const fileName = `extracted_image_${imgCount}.jpg`;
            const filePath = path.join(outputDir, fileName);
            fs.writeFileSync(filePath, imgData);
            console.log(`Saved ${fileName} (${(imgData.length / 1024).toFixed(1)} KB)`);
            i = end;
            continue;
        }
    }
    i++;
}

console.log(`Extraction finished. Total extracted high-res JPEG images: ${imgCount}`);

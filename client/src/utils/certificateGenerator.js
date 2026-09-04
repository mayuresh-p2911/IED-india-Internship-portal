/**
 * Client-side certificate generator & downloader using HTML5 Canvas.
 * Generates pixel-perfect certificate images (JPG / PNG) matching the exact IED India template.
 */

export async function renderCertificateCanvas(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        if (document.fonts) {
          try {
            await document.fonts.load('54px "Alex Brush"');
          } catch (_) {}
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 682;
        const ctx = canvas.getContext('2d');

        // Draw the exact official certificate base image
        ctx.drawImage(img, 0, 0, 1024, 682);

        const internName = (name || 'Intern Name').trim();

        // Calculate font size to fit dynamically if the name is extra long
        let fontSize = 54;
        ctx.font = `${fontSize}px "Alex Brush", cursive, sans-serif`;
        while (ctx.measureText(internName).width > 470 && fontSize > 24) {
          fontSize -= 2;
          ctx.font = `${fontSize}px "Alex Brush", cursive, sans-serif`;
        }

        // Exact calligraphy settings
        ctx.fillStyle = '#092d76';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        // Draw the intern name centered at X=518.5, baseline at Y=348
        ctx.fillText(internName, 518.5, 348);

        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load certificate template image'));
    };

    img.src = '/img/certificate_clean_base.jpg';
  });
}

/**
 * Downloads the certificate directly as a high-resolution JPEG image
 */
export async function downloadCertificateImage(name) {
  const canvas = await renderCertificateCanvas(name);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (name || 'Intern').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${cleanName}_Certificate.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(true);
    }, 'image/jpeg', 0.96);
  });
}

/**
 * Generates a data URL preview for quick display in img tags
 */
export async function getCertificateDataUrl(name) {
  const canvas = await renderCertificateCanvas(name);
  return canvas.toDataURL('image/jpeg', 0.9);
}

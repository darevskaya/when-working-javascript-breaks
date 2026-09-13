// This function is serialized into a Blob, so it must be self-contained.
export function renderFractal() {
  self.onmessage = ({ data: { width, height } }) => {
    const limit = 240;
    const stripHeight = 12;
    let row = 0;
    const palette = [
      [12, 32, 39],
      [23, 100, 112],
      [73, 158, 130],
      [231, 193, 107],
      [251, 237, 197],
      [23, 100, 112],
    ];

    function renderStrip() {
      const rows = Math.min(stripHeight, height - row);
      const pixels = new Uint8ClampedArray(width * rows * 4);
      for (let y = 0; y < rows; y++) {
        const imaginary = ((row + y) / height - 0.5) * 2.2;
        for (let x = 0; x < width; x++) {
          const real = (x / width - 0.5) * 2.2 * (width / height) - 0.65;
          let zr = 0;
          let zi = 0;
          let iteration = 0;
          while (zr * zr + zi * zi <= 4 && iteration < limit) {
            const next = zr * zr - zi * zi + real;
            zi = 2 * zr * zi + imaginary;
            zr = next;
            iteration++;
          }
          const offset = (y * width + x) * 4;
          if (iteration === limit) {
            pixels.set([9, 24, 28, 255], offset);
          } else {
            const smooth =
              iteration + 1 - Math.log2(Math.log2(Math.hypot(zr, zi)));
            const shade = Math.max(0, Math.log2(1 + smooth) * 1.2);
            const index = Math.floor(shade);
            const fraction = shade - index;
            const start = palette[index % palette.length];
            const end = palette[(index + 1) % palette.length];
            for (let channel = 0; channel < 3; channel++) {
              pixels[offset + channel] =
                start[channel] + (end[channel] - start[channel]) * fraction;
            }
            pixels[offset + 3] = 255;
          }
        }
      }
      self.postMessage({ row, rows, pixels }, [pixels.buffer]);
      row += rows;
      // Pace delivery so the audience can see the image build strip by strip.
      if (row < height) setTimeout(renderStrip, 32);
      else self.close();
    }
    renderStrip();
  };
}

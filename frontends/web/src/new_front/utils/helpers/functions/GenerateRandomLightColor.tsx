export default function GenerateRandomLightColor(): string {
  const getRelativeLuminance = (r: number, g: number, b: number): number => {
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;

    const rL = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const gL = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const bL = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  };
  let color;
  let luminance;

  do {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    color = `rgb(${r}, ${g}, ${b})`;
    luminance = getRelativeLuminance(r, g, b);
  } while (luminance < 0.7); // Adjust the threshold as needed

  return color;
}

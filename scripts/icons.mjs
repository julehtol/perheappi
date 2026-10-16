// Luo sovelluskuvakkeet: node scripts/icons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const house = (fill, heart) => `
  <path d="M256 104 L408 228 Q416 235 416 246 L416 392 Q416 412 396 412 L116 412 Q96 412 96 392 L96 246 Q96 235 104 228 Z"
        fill="${fill}" stroke="${fill}" stroke-width="24" stroke-linejoin="round"/>
  ${heart ? `<path d="M256 362 C256 362 176 312 176 262 C176 236 196 218 218 218 C236 218 249 228 256 242 C263 228 276 218 294 218 C316 218 336 236 336 262 C336 312 256 362 256 362 Z" fill="${heart}"/>` : ""}
`;

const full = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="url(#g)"/>
  <g transform="translate(256 262) scale(${pad ? 0.72 : 0.92}) translate(-256 -262)">${house("#fff8ef", "#ec4899")}</g>
</svg>`;

const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${house("#ffffff", null)}</svg>`;

writeFileSync("public/icons/icon.svg", full(false));
const out = [
  ["icon-192.png", full(false), 192],
  ["icon-512.png", full(false), 512],
  ["maskable-512.png", full(true), 512],
  ["apple-touch-icon.png", full(true), 180],
  ["badge-96.png", badge, 96],
];
for (const [name, svg, size] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/${name}`);
}
await sharp(Buffer.from(full(false))).resize(32, 32).png().toFile("app/icon.png");
console.log("valmis");

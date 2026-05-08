import type { CategorySlug } from "./types";

export type CategoryPaletteId =
  | "default"
  | "powdered-pastels"
  | "take-a-break"
  | "atmospheric"
  | "comfort-zone"
  | "tropic-tonalities";

export type CategoryPalette = {
  id: CategoryPaletteId;
  label: string;
  source: string;
  colors: string[];
};

export const categoryColorOrder: CategorySlug[] = ["sleep", "meal", "move", "work", "exercise", "leisure", "other"];

export const categoryPalettes: CategoryPalette[] = [
  {
    id: "default",
    label: "기본",
    source: "Daytrace",
    colors: ["#657895", "#bc7a52", "#72906a", "#4f7b68", "#b76661", "#806c9f", "#7a776f"]
  },
  {
    id: "powdered-pastels",
    label: "Powdered Pastels",
    source: "01-POWDERED-PASTELS.png",
    colors: ["#F5EBC8", "#D5D5D7", "#EBD8DC", "#D4E4F1", "#F0D9CC", "#C9D3C0", "#DBD3DC"]
  },
  {
    id: "take-a-break",
    label: "Take a Break",
    source: "02-TAKE-A-BREAK.png",
    colors: ["#B28F6B", "#D79D31", "#876D58", "#EE6E8B", "#9A9B86", "#FFA266", "#C37C54"]
  },
  {
    id: "atmospheric",
    label: "Atmospheric",
    source: "03-ATMOSPHERIC.png",
    colors: ["#B7D0EA", "#6EA9D2", "#AAABC4", "#A6B2A9", "#497AB7", "#5DC6C3", "#E4CC82"]
  },
  {
    id: "comfort-zone",
    label: "Comfort Zone",
    source: "04-COMFORT-ZONE.png",
    colors: ["#D8C0AD", "#E38E84", "#8A756A", "#E3BEA2", "#B5ACAB", "#AE8C8E", "#80565B"]
  },
  {
    id: "tropic-tonalities",
    label: "Tropic Tonalities",
    source: "05-TROPIC-TONALITIES.png",
    colors: ["#F0EFEB", "#A867A4", "#45BBCA", "#BDCA24", "#E0EE88", "#FF8E00", "#E4465E"]
  }
];

export function getCategoryPalette(id: string | null) {
  return categoryPalettes.find((palette) => palette.id === id) ?? categoryPalettes[0];
}

export function mixHex(hex: string, target: string, amount: number) {
  const source = parseHex(hex);
  const destination = parseHex(target);

  return toHex({
    r: Math.round(source.r + (destination.r - source.r) * amount),
    g: Math.round(source.g + (destination.g - source.g) * amount),
    b: Math.round(source.b + (destination.b - source.b) * amount)
  });
}

function parseHex(hex: string) {
  const normalized = hex.replace("#", "");

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function toHex(color: { r: number; g: number; b: number }) {
  return `#${[color.r, color.g, color.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

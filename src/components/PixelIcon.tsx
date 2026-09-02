import type { PixelIconName } from "../types";

const ICONS: Record<PixelIconName, string[]> = {
  fish: ["........", "....dd..", ".d.ddcd.", "dcccccdd", ".d.ddcd.", "....dd..", "........", "........"],
  chicken: ["........", "...ddd..", "..dyyyd.", ".dyyyyyd", ".dyyyyyd", "..dyyyd.", "...ddd..", "........"],
  milk: ["..dddd..", "..dwwd..", ".dwwwwd.", ".dwwwwd.", ".dwwwwd.", ".dwwwwd.", "..dddd..", "........"],
  seeds: ["........", ".o..o...", "...o..o.", "..o.o...", ".o...o..", "...o....", "........", "........"],
  carrot: ["...gg...", "..gggg..", "...gg...", "...oo...", "..oooo..", "..oooo..", "...oo...", "........"],
  apple: ["...d....", "...gd...", "..drrd..", ".drrrrd.", ".drrrrd.", "..drrd..", "...dd...", "........"],
  bamboo: ["...gg...", "...gd...", "..ggd...", "...gd...", "...gdgg.", "...gdg..", "...gd...", "........"],
  berry: ["..ggg...", "...g....", ".dppd...", "dppppd..", "dppppd..", ".dppd...", "..dd....", "........"],
  star: ["...y....", "...y....", ".yyyyy..", "..yyy...", "..y.y...", ".y...y..", "........", "........"],
  coin: ["........", "..dddd..", ".dyyyyd.", "dyyyyyyd", "dyyyyyyd", ".dyyyyd.", "..dddd..", "........"],
  heart: ["........", ".pp.pp..", "ppppppp.", "ppppppp.", ".ppppp..", "..ppp...", "...p....", "........"],
  controller: ["........", "..dddd..", ".dccccd.", "dccdcccd", "dccccdcd", ".dccccd.", "..d..d..", "........"],
  moon: ["...yyy..", "..yyyy..", ".yyyy...", ".yyyy...", ".yyyy...", "..yyyy..", "...yyy..", "........"],
  shop: ["..dddd..", ".dppppd.", "dppppppd", "dppddppd", "dppppppd", "dppppppd", ".dddddd.", "........"],
  flower: ["...p....", "..ppp...", ".ppdpp..", "..ppp...", "...g....", "..ggg...", "...g....", "........"],
  yarn: ["..dddd..", ".dppppd.", "dppdpppd", "dpppdppd", "dppppdpd", ".dppppd.", "..dddd..", ".....dd."],
  sparkle: ["...y....", "...y....", ".y.y.y..", "..yyy...", "yyyyyyy.", "..yyy...", ".y.y.y..", "...y...."],
};

const COLORS: Record<string, string> = {
  d: "#493641",
  p: "#c98293",
  c: "#fff7f3",
  g: "#82977d",
  o: "#c98450",
  r: "#b95666",
  w: "#ffffff",
  y: "#e6b85f",
};

export function PixelIcon({ name, size = 32 }: { name: PixelIconName; size?: number }) {
  const pixels = ICONS[name].join("").split("");
  return (
    <span
      className="pixel-icon"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {pixels.map((pixel, index) => (
        <span
          key={index}
          style={{ backgroundColor: pixel === "." ? "transparent" : COLORS[pixel] }}
        />
      ))}
    </span>
  );
}

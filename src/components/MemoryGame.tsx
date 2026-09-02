import { useEffect, useMemo, useRef, useState } from "react";
import type { PixelIconName } from "../types";
import { PixelIcon } from "./PixelIcon";

const SYMBOLS: PixelIconName[] = ["fish", "carrot", "apple", "bamboo", "heart", "controller"];

interface Card {
  id: string;
  icon: PixelIconName;
}

function shuffledCards(): Card[] {
  return [...SYMBOLS, ...SYMBOLS]
    .map((icon, index) => ({ id: `${icon}-${index}`, icon, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ id, icon }) => ({ id, icon }));
}

export function MemoryGame({ onFinish, onBack }: { onFinish: (score: number, coins: number) => void; onBack: () => void }) {
  const cards = useMemo(shuffledCards, []);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const awarded = useRef(false);

  useEffect(() => {
    if (open.length !== 2) return;
    const first = cards.find((card) => card.id === open[0]);
    const second = cards.find((card) => card.id === open[1]);
    const timer = window.setTimeout(() => {
      if (first?.icon === second?.icon) setMatched((current) => [...current, first!.icon]);
      setOpen([]);
    }, 560);
    return () => window.clearTimeout(timer);
  }, [cards, open]);

  useEffect(() => {
    if (matched.length === SYMBOLS.length && !awarded.current) {
      awarded.current = true;
      const score = Math.max(100, 1000 - Math.max(0, moves - 6) * 35);
      onFinish(score, 10 + Math.max(0, 8 - Math.floor(moves / 3)));
    }
  }, [matched.length, moves, onFinish]);

  function flip(card: Card) {
    if (open.length >= 2 || open.includes(card.id) || matched.includes(card.icon)) return;
    setOpen((current) => [...current, card.id]);
    if (open.length === 1) setMoves((current) => current + 1);
  }

  const complete = matched.length === SYMBOLS.length;

  return (
    <section className="mini-game">
      <header className="screen-heading">
        <button onClick={onBack} className="back-button">‹ Games</button>
        <div><p>Memory pairs</p><h1>Match the treats</h1></div>
        <span className="move-count">{moves} moves</span>
      </header>
      <div className="memory-grid" aria-label="Memory card grid">
        {cards.map((card) => {
          const visible = open.includes(card.id) || matched.includes(card.icon);
          return (
            <button
              key={card.id}
              className={`memory-card ${visible ? "is-open" : ""} ${matched.includes(card.icon) ? "is-matched" : ""}`}
              onClick={() => flip(card)}
              aria-label={visible ? card.icon : "Hidden card"}
            >
              <span className="memory-card__back">?</span>
              <span className="memory-card__face"><PixelIcon name={card.icon} size={42} /></span>
            </button>
          );
        })}
      </div>
      {complete && (
        <div className="game-result" role="status">
          <PixelIcon name="star" size={42} />
          <h2>Every pair found!</h2>
          <p>Your friend earned a pocketful of coins.</p>
          <button className="primary-button" onClick={onBack}>Back to games</button>
        </div>
      )}
    </section>
  );
}

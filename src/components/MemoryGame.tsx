import { useEffect, useRef, useState } from "react";
import { getMemoryReward } from "../lib/gameState";
import type { PixelIconName } from "../types";
import { GameResultPanel } from "./GameResultPanel";
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

interface RoundResult {
  score: number;
  previousBest: number;
  coinsEarned: number;
}

export function MemoryGame({ previousBest, onFinish, onBack }: { previousBest: number; onFinish: (score: number, coins: number) => void; onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>(shuffledCards);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
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
      const coinsEarned = getMemoryReward(moves);
      setResult({ score, previousBest, coinsEarned });
      onFinish(score, coinsEarned);
    }
  }, [matched.length, moves, onFinish, previousBest]);

  function flip(card: Card) {
    if (open.length >= 2 || open.includes(card.id) || matched.includes(card.icon)) return;
    setOpen((current) => [...current, card.id]);
    if (open.length === 1) setMoves((current) => current + 1);
  }

  function replay() {
    awarded.current = false;
    setCards(shuffledCards());
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setResult(null);
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
      {complete && result && (
        <GameResultPanel
          title="Every pair found!"
          score={result.score}
          previousBest={result.previousBest}
          coinsEarned={result.coinsEarned}
          onReplay={replay}
          onBack={onBack}
        />
      )}
    </section>
  );
}

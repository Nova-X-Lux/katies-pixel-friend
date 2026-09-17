import { useEffect, useRef, useState } from "react";
import { getMemoryReward } from "../lib/gameState";
import { playSound } from "../lib/sound";
import type { PixelIconName } from "../types";
import { GameResultPanel } from "./GameResultPanel";
import { PixelIcon } from "./PixelIcon";
import "./existing-games.css";

const SYMBOLS: PixelIconName[] = ["fish", "carrot", "apple", "bamboo", "heart", "controller"];
const SYMBOL_NAMES: Record<string, string> = { fish: "fish", carrot: "carrots", apple: "apples", bamboo: "bamboo", heart: "hearts", controller: "game controllers" };

interface Card {
  id: string;
  icon: PixelIconName;
}

function shuffledCards(): Card[] {
  const cards = [...SYMBOLS, ...SYMBOLS].map((icon, index) => ({ id: `${icon}-${index}`, icon }));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

interface RoundResult {
  score: number;
  previousBest: number;
  coinsEarned: number;
}

interface MemoryRound {
  cards: Card[];
  open: string[];
  matched: PixelIconName[];
  moves: number;
  message: string;
  result: RoundResult | null;
}

function freshRound(): MemoryRound {
  return { cards: shuffledCards(), open: [], matched: [], moves: 0, message: "Turn over two cards to find a pair.", result: null };
}

export function MemoryGame({ previousBest, onFinish, onBack }: { previousBest: number; onFinish: (score: number, coins: number) => void; onBack: () => void }) {
  const [round, setRound] = useState<MemoryRound>(freshRound);
  const roundRef = useRef(round);
  const timerRef = useRef<number | undefined>(undefined);
  const generation = useRef(0);
  const awarded = useRef(false);
  const bestAtStart = useRef(previousBest);
  const finishRef = useRef(onFinish);

  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);
  useEffect(() => () => { window.clearTimeout(timerRef.current); }, []);

  function updateRound(next: MemoryRound) {
    roundRef.current = next;
    setRound(next);
  }

  function flip(card: Card) {
    const current = roundRef.current;
    if (current.result || current.open.length >= 2 || current.open.includes(card.id) || current.matched.includes(card.icon)) return;
    playSound("tap");
    const next = { ...current, open: [...current.open, card.id], moves: current.moves + (current.open.length === 1 ? 1 : 0) };
    updateRound(next);
    if (next.open.length !== 2) return;

    const first = current.cards.find((candidate) => candidate.id === current.open[0]);
    const isMatch = first?.icon === card.icon;
    const activeGeneration = generation.current;
    timerRef.current = window.setTimeout(() => {
      if (generation.current !== activeGeneration) return;
      timerRef.current = undefined;
      const resolved = roundRef.current;
      const matched = isMatch ? [...resolved.matched, card.icon] : resolved.matched;
      const complete = matched.length === SYMBOLS.length;
      let result: RoundResult | null = null;
      if (complete && !awarded.current) {
        awarded.current = true;
        const score = Math.max(100, 1000 - Math.max(0, resolved.moves - 6) * 35);
        result = { score, previousBest: bestAtStart.current, coinsEarned: getMemoryReward(resolved.moves) };
      }
      updateRound({
        ...resolved,
        open: [],
        matched,
        result,
        message: complete ? "Every pair found. Lovely work!" : isMatch ? `A pair of ${SYMBOL_NAMES[card.icon]}!` : "Not a pair this time. Try two more.",
      });
      if (result) {
        playSound("success");
        finishRef.current(result.score, result.coinsEarned);
      } else if (isMatch) {
        playSound("reward");
      }
    }, isMatch ? 360 : 760);
  }

  function replay() {
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    generation.current += 1;
    awarded.current = false;
    bestAtStart.current = previousBest;
    updateRound(freshRound());
    playSound("tap");
  }

  return (
    <section className="mini-game">
      <header className="screen-heading">
        <button onClick={onBack} className="back-button">‹ Games</button>
        <div><p>Memory pairs</p><h1>Match the treats</h1></div>
        <span className="move-count">{round.moves} {round.moves === 1 ? "move" : "moves"}</span>
      </header>
      <div className="memory-progress"><span>{round.matched.length} of {SYMBOLS.length} pairs</span><span>No timer. Take your time.</span></div>
      <div className="memory-grid" role="group" aria-label="Memory cards" aria-describedby="memory-message">
        {round.cards.map((card, index) => {
          const isMatched = round.matched.includes(card.icon);
          const visible = round.open.includes(card.id) || isMatched;
          return (
            <button
              key={card.id}
              className={`memory-card ${visible ? "is-open" : ""} ${isMatched ? "is-matched" : ""}`}
              onClick={() => flip(card)}
              disabled={isMatched || round.open.includes(card.id) || round.open.length === 2 || Boolean(round.result)}
              aria-label={`Card ${index + 1}: ${isMatched ? `${card.icon}, matched` : visible ? card.icon : "face down"}`}
            >
              <span className="memory-card__back" aria-hidden="true">?</span>
              <span className="memory-card__face" aria-hidden="true"><PixelIcon name={card.icon} size={42} /></span>
            </button>
          );
        })}
      </div>
      <p id="memory-message" className="game-control-hint" role="status" aria-live="polite">{round.message}</p>
      {round.result && (
        <GameResultPanel title="Every pair found!" score={round.result.score} previousBest={round.result.previousBest} coinsEarned={round.result.coinsEarned} onReplay={replay} onBack={onBack} />
      )}
    </section>
  );
}

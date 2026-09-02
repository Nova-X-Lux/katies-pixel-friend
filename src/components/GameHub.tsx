import { useState } from "react";
import type { PetSave } from "../types";
import { PixelIcon } from "./PixelIcon";
import { MemoryGame } from "./MemoryGame";
import { TreatCatch } from "./TreatCatch";
import { FireflyGame } from "./FireflyGame";

type GameId = "memory" | "catch" | "fireflies";

export function GameHub({ save, onAward, onClose }: { save: PetSave; onAward: (gameId: string, score: number, coins: number) => void; onClose: () => void }) {
  const [game, setGame] = useState<GameId | null>(null);

  if (game === "memory") return <MemoryGame onFinish={(score, coins) => onAward("memory", score, coins)} onBack={() => setGame(null)} />;
  if (game === "catch") return <TreatCatch petType={save.petType} onFinish={(score, coins) => onAward("catch", score, coins)} onBack={() => setGame(null)} />;
  if (game === "fireflies") return <FireflyGame onFinish={(score, coins) => onAward("fireflies", score, coins)} onBack={() => setGame(null)} />;

  return (
    <main className="games-shell">
      <header className="screen-heading">
        <button onClick={onClose} className="back-button">‹ Room</button>
        <div><p>Play together</p><h1>Choose a game</h1></div>
        <span />
      </header>
      <div className="game-list">
        <button onClick={() => setGame("catch")} className="game-card game-card--catch">
          <span className="game-card__art"><PixelIcon name="apple" size={58} /><PixelIcon name="star" size={34} /></span>
          <span><strong>Treat catch</strong><small>Catch snacks before they tumble past.</small><b>Best: {save.highScores.catch ?? 0}</b></span>
        </button>
        <button onClick={() => setGame("memory")} className="game-card game-card--memory">
          <span className="game-card__art"><PixelIcon name="heart" size={54} /><PixelIcon name="controller" size={36} /></span>
          <span><strong>Memory pairs</strong><small>Find every matching pixel pair.</small><b>Best: {save.highScores.memory ?? 0}</b></span>
        </button>
        <button onClick={() => setGame("fireflies")} className="game-card game-card--fireflies">
          <span className="game-card__art"><PixelIcon name="moon" size={54} /><PixelIcon name="sparkle" size={36} /></span>
          <span><strong>Firefly glow</strong><small>Light up a moonlit garden together.</small><b>Best: {save.highScores.fireflies ?? 0}</b></span>
        </button>
      </div>
      <p className="games-note">Games earn coins and make {save.petName} happier.</p>
    </main>
  );
}

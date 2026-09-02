import { useState } from "react";
import type { PetSave } from "../types";
import { PixelIcon } from "./PixelIcon";
import { MemoryGame } from "./MemoryGame";
import { TreatCatch } from "./TreatCatch";

type GameId = "memory" | "catch";

export function GameHub({ save, onAward, onClose }: { save: PetSave; onAward: (gameId: string, score: number, coins: number) => void; onClose: () => void }) {
  const [game, setGame] = useState<GameId | null>(null);

  if (game === "memory") return <MemoryGame previousBest={save.highScores.memory ?? 0} onFinish={(score, coins) => onAward("memory", score, coins)} onBack={() => setGame(null)} />;
  if (game === "catch") return <TreatCatch petType={save.petType} previousBest={save.highScores.catch ?? 0} onFinish={(score, coins) => onAward("catch", score, coins)} onBack={() => setGame(null)} />;

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
      </div>
      <p className="games-note">Games earn coins and make {save.petName} happier.</p>
    </main>
  );
}

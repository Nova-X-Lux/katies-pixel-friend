import { useEffect, useRef, useState } from "react";
import { PETS } from "../data/pets";
import { getTreatCatchReward } from "../lib/gameState";
import { playSound } from "../lib/sound";
import type { PetKind, PixelIconName } from "../types";
import { GameResultPanel } from "./GameResultPanel";
import { PixelIcon } from "./PixelIcon";
import "./existing-games.css";

interface FallingTreat {
  id: number;
  lane: number;
  y: number;
  icon: PixelIconName;
}

const TREAT_ICONS: PixelIconName[] = ["apple", "berry", "carrot", "star"];
type RoundStatus = "ready" | "playing" | "paused" | "done";

interface CatchRound {
  lane: number;
  treats: FallingTreat[];
  score: number;
  remaining: number;
  spawnIn: number;
}

interface RoundResult {
  score: number;
  previousBest: number;
  coinsEarned: number;
}

function freshRound(): CatchRound {
  return { lane: 1, treats: [], score: 0, remaining: 20_000, spawnIn: 200 };
}

export function TreatCatch({ petType, previousBest, onFinish, onBack }: { petType: PetKind; previousBest: number; onFinish: (score: number, coins: number) => void; onBack: () => void }) {
  const [status, setStatus] = useState<RoundStatus>("ready");
  const [round, setRound] = useState<CatchRound>(freshRound);
  const [result, setResult] = useState<RoundResult | null>(null);
  const roundRef = useRef(round);
  const statusRef = useRef<RoundStatus>("ready");
  const idRef = useRef(0);
  const awarded = useRef(false);
  const bestAtStart = useRef(previousBest);
  const finishRef = useRef(onFinish);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);

  function changeStatus(next: RoundStatus) {
    statusRef.current = next;
    setStatus(next);
  }

  function moveTo(nextLane: number) {
    if (statusRef.current !== "playing") return;
    const next = { ...roundRef.current, lane: Math.max(0, Math.min(2, nextLane)) };
    if (next.lane === roundRef.current.lane) return;
    roundRef.current = next;
    setRound(next);
    playSound("tap");
  }

  function pause() {
    if (statusRef.current === "playing") changeStatus("paused");
  }

  function resume() {
    if (document.hidden || statusRef.current !== "paused") return;
    playSound("tap");
    changeStatus("playing");
  }

  useEffect(() => {
    if (status === "paused") resumeButton.current?.focus();
    if (status === "playing") pauseButton.current?.focus();
  }, [status]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden && statusRef.current === "playing") {
        statusRef.current = "paused";
        setStatus("paused");
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (statusRef.current !== "playing") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveTo(roundRef.current.lane + (event.key === "ArrowLeft" ? -1 : 1));
      } else if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        event.preventDefault();
        pause();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    let frame = 0;
    let previousTime = performance.now();

    function tick(now: number) {
      if (statusRef.current !== "playing") return;
      // Cap a stalled frame so treats never jump over a catch on a busy phone.
      const elapsed = Math.min(Math.max(0, now - previousTime), 100);
      previousTime = now;
      const current = roundRef.current;
      const step = Math.min(elapsed, current.remaining);
      let caught = 0;
      const treats = current.treats.flatMap((treat) => {
        const next = { ...treat, y: treat.y + step * 0.037 };
        if (next.y >= 79 && treat.y <= 88 && next.lane === current.lane) {
          caught += 1;
          return [];
        }
        return next.y < 102 ? [next] : [];
      });
      let spawnIn = current.spawnIn - step;
      if (spawnIn <= 0 && current.remaining > 2_600) {
        const id = idRef.current++;
        treats.push({ id, lane: Math.floor(Math.random() * 3), y: -8, icon: TREAT_ICONS[id % TREAT_ICONS.length] });
        spawnIn += 720;
      }
      const next: CatchRound = {
        ...current,
        treats,
        score: current.score + caught * 10,
        remaining: Math.max(0, current.remaining - step),
        spawnIn,
      };
      roundRef.current = next;
      setRound(next);
      if (caught) playSound("reward");

      if (next.remaining <= 0) {
        statusRef.current = "done";
        setStatus("done");
        if (!awarded.current) {
          awarded.current = true;
          const coinsEarned = getTreatCatchReward(next.score);
          setResult({ score: next.score, previousBest: bestAtStart.current, coinsEarned });
          if (coinsEarned) playSound("success");
          finishRef.current(next.score, coinsEarned);
        }
        return;
      }
      frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [status]);

  function start() {
    if (statusRef.current === "playing") return;
    const next = freshRound();
    roundRef.current = next;
    awarded.current = false;
    bestAtStart.current = previousBest;
    setRound(next);
    setResult(null);
    playSound("tap");
    changeStatus(document.hidden ? "paused" : "playing");
  }

  return (
    <section className="mini-game">
      <header className="screen-heading">
        <button onClick={onBack} className="back-button">‹ Games</button>
        <div><p>Treat catch</p><h1>Snack time</h1></div>
        <span className="move-count" aria-label={`${Math.ceil(round.remaining / 1_000)} seconds remaining`}>{Math.ceil(round.remaining / 1_000)}s</span>
      </header>

      <div className="catch-field" aria-label="Treat catching game" aria-describedby="catch-instructions">
        <div className="lane-lines" aria-hidden="true"><i /><i /></div>
        {round.treats.map((treat) => (
          <span key={treat.id} className="falling-treat" style={{ left: `${treat.lane * 33.333 + 16.666}%`, top: `${treat.y}%` }} aria-hidden="true">
            <PixelIcon name={treat.icon} size={34} />
          </span>
        ))}
        <img src={PETS[petType].asset} alt="" className="catch-pet" style={{ left: `${round.lane * 33.333 + 16.666}%` }} />
        {status === "ready" && (
          <div className="game-overlay"><PixelIcon name="apple" size={54} /><h2>Ready to catch?</h2><p>Three lanes. Twenty seconds. How many snacks can you bring home?</p><button className="primary-button" onClick={start}>Start game</button></div>
        )}
        {status === "paused" && (
          <div className="game-overlay" role="group" aria-label="Game paused"><PixelIcon name="heart" size={42} /><h2>Take your time</h2><p>Your treats will wait right here.</p><button ref={resumeButton} className="primary-button" onClick={resume}>Resume game</button><button className="text-button" onClick={onBack}>Back to games</button></div>
        )}
        {status === "done" && result && (
          <GameResultPanel title={round.score === 0 ? "Let’s try once more" : "Treats collected!"} score={result.score} previousBest={result.previousBest} coinsEarned={result.coinsEarned} onReplay={start} onBack={onBack} overlay />
        )}
      </div>

      <div className="lane-controls" role="group" aria-label="Move your friend">
        {[0, 1, 2].map((nextLane) => (
          <button key={nextLane} className={round.lane === nextLane ? "is-active" : ""} onClick={() => moveTo(nextLane)} disabled={status !== "playing"} aria-pressed={round.lane === nextLane}>
            {nextLane === 0 ? "Left" : nextLane === 1 ? "Middle" : "Right"}
          </button>
        ))}
      </div>
      <div className="catch-round-footer">
        <p className="score-readout">Score <strong>{round.score}</strong></p>
        {(status === "playing" || status === "paused") && <button ref={pauseButton} className="back-button" onClick={status === "paused" ? resume : pause}>{status === "paused" ? "Resume" : "Pause"}</button>}
      </div>
      <p id="catch-instructions" className="game-control-hint">Tap a lane or use ← →. Press P to pause.</p>
    </section>
  );
}

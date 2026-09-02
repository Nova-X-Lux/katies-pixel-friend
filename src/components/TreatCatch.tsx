import { useEffect, useRef, useState } from "react";
import { PETS } from "../data/pets";
import type { PetKind, PixelIconName } from "../types";
import { PixelIcon } from "./PixelIcon";

interface FallingTreat {
  id: number;
  lane: number;
  y: number;
  icon: PixelIconName;
}

const TREAT_ICONS: PixelIconName[] = ["apple", "berry", "carrot", "star"];

export function TreatCatch({ petType, onFinish, onBack }: { petType: PetKind; onFinish: (score: number, coins: number) => void; onBack: () => void }) {
  const [status, setStatus] = useState<"ready" | "playing" | "done">("ready");
  const [lane, setLane] = useState(1);
  const [treats, setTreats] = useState<FallingTreat[]>([]);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(20);
  const idRef = useRef(0);
  const awarded = useRef(false);
  const laneRef = useRef(lane);

  useEffect(() => { laneRef.current = lane; }, [lane]);

  useEffect(() => {
    if (status !== "playing") return;
    const spawn = window.setInterval(() => {
      const id = idRef.current++;
      setTreats((current) => [...current, { id, lane: Math.floor(Math.random() * 3), y: -8, icon: TREAT_ICONS[id % TREAT_ICONS.length] }]);
    }, 720);
    const tick = window.setInterval(() => {
      setTreats((current) => {
        let caught = 0;
        const next = current
          .map((treat) => ({ ...treat, y: treat.y + 3.7 }))
          .filter((treat) => {
            if (treat.y >= 79 && treat.y <= 88 && treat.lane === laneRef.current) {
              caught += 1;
              return false;
            }
            return treat.y < 102;
          });
        if (caught) setScore((value) => value + caught * 10);
        return next;
      });
    }, 100);
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setStatus("done");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => { window.clearInterval(spawn); window.clearInterval(tick); window.clearInterval(timer); };
  }, [status]);

  useEffect(() => {
    if (status === "done" && !awarded.current) {
      awarded.current = true;
      onFinish(score, 6 + Math.floor(score / 30));
    }
  }, [onFinish, score, status]);

  function start() {
    awarded.current = false;
    setScore(0);
    setSeconds(20);
    setTreats([]);
    setLane(1);
    setStatus("playing");
  }

  return (
    <section className="mini-game">
      <header className="screen-heading">
        <button onClick={onBack} className="back-button">‹ Games</button>
        <div><p>Treat catch</p><h1>Catch every snack</h1></div>
        <span className="move-count">{seconds}s</span>
      </header>

      <div className="catch-field" aria-label="Treat catching game">
        <div className="lane-lines" aria-hidden="true"><i /><i /></div>
        {treats.map((treat) => (
          <span key={treat.id} className="falling-treat" style={{ left: `${treat.lane * 33.333 + 16.666}%`, top: `${treat.y}%` }}>
            <PixelIcon name={treat.icon} size={34} />
          </span>
        ))}
        <img
          src={PETS[petType].asset}
          alt=""
          className="catch-pet"
          style={{ left: `${lane * 33.333 + 16.666}%` }}
        />
        {status === "ready" && (
          <div className="game-overlay"><PixelIcon name="apple" size={54} /><h2>Ready to catch?</h2><p>Move between the three lanes and catch as many treats as you can.</p><button className="primary-button" onClick={start}>Start game</button></div>
        )}
        {status === "done" && (
          <div className="game-overlay"><PixelIcon name="star" size={54} /><h2>{score} points!</h2><p>Your friend brought home {6 + Math.floor(score / 30)} coins.</p><button className="primary-button" onClick={start}>Play again</button><button className="text-button" onClick={onBack}>Back to games</button></div>
        )}
      </div>

      <div className="lane-controls" aria-label="Move your friend">
        {[0, 1, 2].map((nextLane) => (
          <button key={nextLane} className={lane === nextLane ? "is-active" : ""} onClick={() => setLane(nextLane)} disabled={status !== "playing"}>
            {nextLane === 0 ? "Left" : nextLane === 1 ? "Middle" : "Right"}
          </button>
        ))}
      </div>
      <p className="score-readout">Score <strong>{score}</strong></p>
    </section>
  );
}

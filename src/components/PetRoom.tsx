import { useEffect, useMemo, useState } from "react";
import { PETS, getDialogue } from "../data/pets";
import { careForPet, deriveMood, feedPet, getRoomPhase, wakePet } from "../lib/gameState";
import type { CareAction, PetSave } from "../types";
import { PixelIcon } from "./PixelIcon";
import { StatBar } from "./StatBar";

interface PetRoomProps {
  save: PetSave;
  syncState: "saved" | "saving" | "offline";
  onChange: (next: PetSave) => void;
  onGames: () => void;
  onShop: () => void;
  onSettings: () => void;
}

function RoomDecoration({ itemId }: { itemId: string }) {
  if (itemId === "rose-cushion") return <div className="room-decoration rose-cushion" aria-hidden="true"><PixelIcon name="heart" size={24} /></div>;
  if (itemId === "yarn-ball") return <div className="room-decoration yarn-ball" aria-hidden="true"><PixelIcon name="yarn" size={35} /></div>;
  if (itemId === "moon-mobile") return <div className="room-decoration moon-mobile" aria-hidden="true"><i /><PixelIcon name="moon" size={34} /></div>;
  if (itemId === "starlight-jar") return <div className="room-decoration starlight-jar" aria-hidden="true"><PixelIcon name="sparkle" size={28} /></div>;
  if (itemId === "flower-rug") return null;
  return <div className="heart-lamp" aria-hidden="true"><PixelIcon name="heart" size={28} /></div>;
}

export function PetRoom({ save, syncState, onChange, onGames, onShop, onSettings }: PetRoomProps) {
  const [sheet, setSheet] = useState<"feed" | "care" | null>(null);
  const [dialogueSeed, setDialogueSeed] = useState(() => Date.now());
  const [roomPhase, setRoomPhase] = useState(getRoomPhase);
  const mood = deriveMood(save);
  const pet = PETS[save.petType];
  const selectedDecoration = save.selectedDecoration || "heart-lamp";
  const dialogue = useMemo(
    () => getDialogue(save.petType, mood, dialogueSeed),
    [save.petType, mood, dialogueSeed],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setRoomPhase(getRoomPhase()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function care(action: CareAction) {
    onChange(careForPet(save, action));
    setDialogueSeed(Date.now());
    setSheet(null);
  }

  return (
    <main className="game-shell">
      <header className="game-topbar">
        <div className="coin-pill"><PixelIcon name="star" size={24} /><strong>{save.coins}</strong></div>
        <div className="room-status"><span>{roomPhase === "day" ? "☀ Day" : "☾ Night"}</span><p className={`sync-state sync-state--${syncState}`}>{syncState === "saved" ? "Saved" : syncState === "saving" ? "Saving…" : "Saved on this phone"}</p></div>
        <button className="icon-button" onClick={onSettings} aria-label="Open settings">⚙</button>
      </header>

      <section className={`pixel-room time-${roomPhase} mood-${mood}`} aria-label={`${save.petName}'s room during the ${roomPhase}`}>
        <div className="pixel-window" aria-hidden="true"><span /><i /><b /></div>
        <div className="pixel-lamp" aria-hidden="true"><span /><i /></div>
        <div className={`pixel-rug ${selectedDecoration === "flower-rug" ? "pixel-rug--flower" : ""}`} aria-hidden="true" />
        <RoomDecoration itemId={selectedDecoration} />
        <button
          className="pet-stage"
          onClick={() => {
            onChange(save.isSleeping ? wakePet(save) : careForPet(save, "pet"));
            setDialogueSeed(Date.now());
          }}
          aria-label={save.isSleeping ? `Wake ${save.petName}` : `Pet ${save.petName}`}
        >
          <img className="pet-sprite" src={pet.asset} alt={`${pet.label} named ${save.petName}`} />
          {mood === "sleeping" && <span className="sleep-pixels" aria-hidden="true">z z</span>}
        </button>
      </section>

      <section className="pet-panel">
        <div className="speech-bubble">
          <div><h1>{save.petName}</h1><span>{pet.label}</span></div>
          <p>“{dialogue}”</p>
        </div>

        <div className="stats-grid">
          <StatBar label="Full" value={save.stats.fullness} tone="#c98293" />
          <StatBar label="Happy" value={save.stats.happiness} tone="#d5a15d" />
          <StatBar label="Energy" value={save.stats.energy} tone="#8f87b8" />
          <StatBar label="Clean" value={save.stats.cleanliness} tone="#7d9a8a" />
        </div>

        <nav className="action-dock" aria-label="Care actions">
          <button onClick={() => setSheet("feed")}><PixelIcon name="apple" /><span>Feed</span></button>
          <button onClick={() => setSheet("care")}><PixelIcon name="heart" /><span>Care</span></button>
          <button className="action-dock__play" onClick={onGames}><PixelIcon name="controller" /><span>Play</span></button>
          <button onClick={onShop}><PixelIcon name="shop" /><span>Shop</span></button>
        </nav>
      </section>

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(null)}>
          <section className="bottom-sheet" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label={sheet === "feed" ? "Choose food" : "Care for your friend"}>
            <div className="sheet-handle" />
            <div className="sheet-heading"><h2>{sheet === "feed" ? "Choose a snack" : `Care for ${save.petName}`}</h2><button onClick={() => setSheet(null)} aria-label="Close">×</button></div>
            {sheet === "feed" ? (
              <div className="item-list">
                {pet.foods.map((item) => (
                  <button key={item.id} disabled={save.coins < item.cost} onClick={() => { onChange(feedPet(save, item)); setDialogueSeed(Date.now()); setSheet(null); }}>
                    <PixelIcon name={item.icon} size={38} />
                    <span><strong>{item.name}</strong><small>+{item.fullness} fullness</small></span>
                    <b>{item.cost} ★</b>
                  </button>
                ))}
              </div>
            ) : (
              <div className="item-list">
                <button onClick={() => care("pet")}><PixelIcon name="heart" size={38} /><span><strong>Gentle pets</strong><small>More happiness</small></span></button>
                <button onClick={() => care("wash")}><PixelIcon name="star" size={38} /><span><strong>Freshen up</strong><small>More cleanliness</small></span></button>
                <button onClick={() => care("nap")}><PixelIcon name="moon" size={38} /><span><strong>Cosy nap</strong><small>More energy</small></span></button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { PETS } from "../data/pets";
import type { PetKind } from "../types";

export function AdoptionScreen({ onAdopt }: { onAdopt: (kind: PetKind, name: string) => void }) {
  const [selected, setSelected] = useState<PetKind | null>(null);
  const [name, setName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (selected && name.trim()) onAdopt(selected, name.trim().slice(0, 18));
  }

  return (
    <main className="adoption-shell">
      <header className="adoption-heading">
        <p>Someone is waiting</p>
        <h1>Choose your pixel friend</h1>
      </header>

      <div className="pet-choice-row" role="list" aria-label="Companion choices">
        {(Object.keys(PETS) as PetKind[]).map((kind) => {
          const pet = PETS[kind];
          const active = selected === kind;
          return (
            <button
              key={kind}
              className={`pet-choice ${active ? "is-selected" : ""}`}
              onClick={() => { setSelected(kind); setName(""); }}
              aria-pressed={active}
            >
              <img src={pet.asset} alt="" />
              <strong>{pet.label}</strong>
            </button>
          );
        })}
      </div>

      {selected ? (
        <form className="naming-card" onSubmit={submit}>
          <div>
            <h2>Name your {PETS[selected].label.toLowerCase()}</h2>
            <p>{PETS[selected].strapline}</p>
          </div>
          <label>
            <span>Friend’s name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              maxLength={18}
              placeholder="Type a name…"
              required
            />
          </label>
          <button className="primary-button">Meet my friend</button>
        </form>
      ) : (
        <p className="adoption-hint">Tap a friend to say hello.</p>
      )}
    </main>
  );
}

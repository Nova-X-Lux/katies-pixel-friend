import { useState } from "react";
import { SHOP_ITEMS } from "../data/shop";
import { buyShopItem, selectShopItem } from "../lib/gameState";
import type { PetSave, ShopCategory } from "../types";
import { PixelIcon } from "./PixelIcon";

type OwnershipFilter = "all" | "available" | "owned";

const CATEGORIES: { value: "all" | ShopCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lights", label: "Lights" },
  { value: "soft", label: "Soft things" },
  { value: "toys", label: "Toys" },
  { value: "decorations", label: "Decor" },
];

const OWNERSHIP_FILTERS: { value: OwnershipFilter; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "available", label: "Available" },
  { value: "owned", label: "Owned" },
];

export function ShopPanel({
  save,
  onChange,
  onClose,
}: {
  save: PetSave;
  onChange: (next: PetSave) => void;
  onClose: () => void;
}) {
  const owned = save.unlockedDecorations ?? ["heart-lamp"];
  const [category, setCategory] = useState<"all" | ShopCategory>("all");
  const [ownership, setOwnership] = useState<OwnershipFilter>("all");
  const visibleItems = SHOP_ITEMS.filter((item) => {
    const isOwned = owned.includes(item.id);
    const matchesCategory = category === "all" || item.category === category;
    const matchesOwnership = ownership === "all"
      || (ownership === "owned" && isOwned)
      || (ownership === "available" && !isOwned);
    return matchesCategory && matchesOwnership;
  });

  return (
    <main className="shop-shell">
      <header className="screen-heading">
        <button onClick={onClose} className="back-button">‹ Room</button>
        <div><p>Spend your coins</p><h1>Cosy Shop</h1></div>
        <span className="shop-balance" aria-label={`${save.coins} coins`}><PixelIcon name="coin" size={18} /> {save.coins}</span>
      </header>

      <section className="shop-intro">
        <PixelIcon name="shop" size={44} />
        <div><strong>Little comforts</strong><p>Buy them once, then swap the room whenever you like.</p></div>
      </section>

      <section className="shop-filters" aria-label="Shop filters">
        <div className="filter-scroll" aria-label="Item availability">
          {OWNERSHIP_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={ownership === filter.value ? "is-active" : ""}
              onClick={() => setOwnership(filter.value)}
              aria-pressed={ownership === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="filter-scroll filter-scroll--categories" aria-label="Item categories">
          {CATEGORIES.map((filter) => (
            <button
              key={filter.value}
              className={category === filter.value ? "is-active" : ""}
              onClick={() => setCategory(filter.value)}
              aria-pressed={category === filter.value}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <div className="shop-grid">
        {visibleItems.map((item) => {
          const isOwned = owned.includes(item.id);
          const isSelected = save.selectedDecoration === item.id;
          const canBuy = save.coins >= item.cost;
          return (
            <article className={`shop-card ${isSelected ? "is-selected" : ""}`} key={item.id}>
              <div className={`shop-card__art shop-card__art--${item.id}`}>
                <PixelIcon name={item.icon} size={48} />
                {isSelected && <span>In room</span>}
              </div>
              <h2>{item.name}</h2>
              <span className="shop-card__category">{CATEGORIES.find((filter) => filter.value === item.category)?.label}</span>
              <p>{item.description}</p>
              <button
                disabled={isSelected || (!isOwned && !canBuy)}
                onClick={() => onChange(isOwned ? selectShopItem(save, item.id) : buyShopItem(save, item))}
              >
                {isSelected ? "Placed" : isOwned ? "Place it" : canBuy ? `${item.cost} coins` : `Need ${item.cost} coins`}
              </button>
            </article>
          );
        })}
      </div>
      {visibleItems.length === 0 && (
        <div className="shop-empty">
          <PixelIcon name="heart" size={38} />
          <strong>Nothing in this little corner yet</strong>
          <p>Try another category or filter.</p>
        </div>
      )}
    </main>
  );
}

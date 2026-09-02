import type { FeedItem, PetKind, PetMood } from "../types";

export interface PetDefinition {
  kind: PetKind;
  label: string;
  strapline: string;
  asset: string;
  foods: FeedItem[];
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const PETS: Record<PetKind, PetDefinition> = {
  cat: {
    kind: "cat",
    label: "Cat",
    strapline: "Curious, cuddly and just a little dramatic.",
    asset: asset("pets/cat.png"),
    foods: [
      { id: "cat-fish", name: "Fish bites", cost: 3, fullness: 22, happiness: 4, icon: "fish" },
      { id: "cat-chicken", name: "Chicken", cost: 4, fullness: 27, happiness: 6, icon: "chicken" },
      { id: "cat-milk", name: "Cosy milk", cost: 2, fullness: 12, happiness: 7, icon: "milk" },
    ],
  },
  hamster: {
    kind: "hamster",
    label: "Hamster",
    strapline: "Tiny paws, enormous enthusiasm.",
    asset: asset("pets/hamster.png"),
    foods: [
      { id: "hamster-seeds", name: "Seed mix", cost: 3, fullness: 22, happiness: 4, icon: "seeds" },
      { id: "hamster-carrot", name: "Carrot", cost: 3, fullness: 19, happiness: 7, icon: "carrot" },
      { id: "hamster-apple", name: "Apple slice", cost: 2, fullness: 14, happiness: 8, icon: "apple" },
    ],
  },
  panda: {
    kind: "panda",
    label: "Panda",
    strapline: "Excellent at snacks and even better at naps.",
    asset: asset("pets/panda.png"),
    foods: [
      { id: "panda-bamboo", name: "Bamboo", cost: 3, fullness: 23, happiness: 4, icon: "bamboo" },
      { id: "panda-apple", name: "Apple slices", cost: 3, fullness: 18, happiness: 8, icon: "apple" },
      { id: "panda-berries", name: "Berry bowl", cost: 4, fullness: 21, happiness: 9, icon: "berry" },
    ],
  },
};

const DIALOGUE: Record<PetKind, Record<PetMood, string[]>> = {
  cat: {
    cheerful: ["I may permit more cuddles.", "Everything is exactly where I want it."],
    playful: ["Try to catch me.", "I have spotted something that needs pouncing on."],
    hungry: ["The bowl appears suspiciously empty.", "A small snack would be acceptable."],
    sleepy: ["I am claiming the warmest spot.", "My eyelids are becoming extremely heavy."],
    lonely: ["There you are. I saved your spot.", "A little attention, please?"],
    messy: ["I seem to have become slightly scruffy.", "Could you help with my fur?"],
    sleeping: ["Mrrp... just five more minutes."],
  },
  hamster: {
    cheerful: ["Best day! Best snack! Best everything!", "My tiny paws are ready."],
    playful: ["Wheel-speed challenge!", "Let us do something exciting!"],
    hungry: ["Emergency snack meeting?", "My cheeks have room for supplies."],
    sleepy: ["Tiny nap. Then more running.", "I used all of my zoom."],
    lonely: ["You came back! Look how fast I can wave!", "I kept busy, but this is better."],
    messy: ["There may have been a bedding incident.", "A quick tidy would be lovely."],
    sleeping: ["Squeak... zzz..."],
  },
  panda: {
    cheerful: ["I have achieved maximum cosy.", "Today feels soft and lovely."],
    playful: ["I am ready to roll.", "Do you think we can beat our score?"],
    hungry: ["I was just thinking about bamboo...", "Snack, then adventure?"],
    sleepy: ["Five more minutes...", "I have a very important nap scheduled."],
    lonely: ["I had a long nap while I waited.", "You are here. That makes the room nicer."],
    messy: ["I may have rolled through something dusty.", "Could I have a little clean-up?"],
    sleeping: ["Zzz... bamboo dreams..."],
  },
};

export function getDialogue(kind: PetKind, mood: PetMood, seed = Date.now()): string {
  const lines = DIALOGUE[kind][mood];
  return lines[Math.abs(seed) % lines.length];
}

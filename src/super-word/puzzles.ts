import type { Puzzle } from './types.js'

// ── Easy (3 letters) ──────────────────────────────────────
const EASY_PUZZLES: readonly Puzzle[] = [
  {
    answer: 'CAT',
    difficulty: 'easy',
    prompt: "Find the letters to spell the furry pet that purrs and says 'meow'! 🐱",
    hint: 'It has whiskers and a long tail — and loves napping!',
    hintEmoji: '🐱',
    items: [
      { id: 'c0', type: 'letter', char: 'C', emoji: '🌙', label: 'Moon', x: 18, y: 18 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 58, y: 16 },
      { id: 't0', type: 'letter', char: 'T', emoji: '🌲', label: 'Tree', x: 82, y: 30 },
      { id: 'd0', type: 'distractor', emoji: '⭐', label: 'Star', x: 36, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🌸', label: 'Flower', x: 68, y: 50 },
      { id: 'd2', type: 'distractor', emoji: '🦋', label: 'Butterfly', x: 20, y: 60 },
      { id: 'd3', type: 'distractor', emoji: '🌈', label: 'Rainbow', x: 50, y: 64 },
      { id: 'd4', type: 'distractor', emoji: '🎈', label: 'Balloon', x: 78, y: 65 },
    ],
  },
  {
    answer: 'SUN',
    difficulty: 'easy',
    prompt: 'Find the letters to spell the big, bright, warm thing in the daytime sky! ☀️',
    hint: 'It rises in the east every morning and keeps us warm!',
    hintEmoji: '☀️',
    items: [
      { id: 's0', type: 'letter', char: 'S', emoji: '🐚', label: 'Shell', x: 20, y: 20 },
      { id: 'u0', type: 'letter', char: 'U', emoji: '🪴', label: 'Plant', x: 62, y: 14 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Acorn', x: 82, y: 34 },
      { id: 'd0', type: 'distractor', emoji: '🌊', label: 'Wave', x: 38, y: 40 },
      { id: 'd1', type: 'distractor', emoji: '🌺', label: 'Hibiscus', x: 16, y: 62 },
      { id: 'd2', type: 'distractor', emoji: '🦜', label: 'Parrot', x: 52, y: 65 },
      { id: 'd3', type: 'distractor', emoji: '🍄', label: 'Mushroom', x: 78, y: 64 },
      { id: 'd4', type: 'distractor', emoji: '🎵', label: 'Music', x: 40, y: 26 },
    ],
  },
  {
    answer: 'DOG',
    difficulty: 'easy',
    prompt: "This loyal pet wags its tail and loves to play fetch! 🐶",
    hint: "It barks, fetches sticks, and is everyone's best friend!",
    hintEmoji: '🐶',
    items: [
      { id: 'd_0', type: 'letter', char: 'D', emoji: '🥁', label: 'Drum', x: 22, y: 16 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 60, y: 20 },
      { id: 'g0', type: 'letter', char: 'G', emoji: '🍇', label: 'Grapes', x: 80, y: 32 },
      { id: 'd0', type: 'distractor', emoji: '🦴', label: 'Bone', x: 38, y: 38 },
      { id: 'd1', type: 'distractor', emoji: '🎾', label: 'Tennis Ball', x: 16, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🏠', label: 'House', x: 50, y: 60 },
      { id: 'd3', type: 'distractor', emoji: '🌳', label: 'Tree', x: 76, y: 58 },
      { id: 'd4', type: 'distractor', emoji: '🐾', label: 'Paw Print', x: 30, y: 66 },
    ],
  },
  {
    answer: 'BUG',
    difficulty: 'easy',
    prompt: 'This tiny crawly creature has six legs! Find its letters! 🐛',
    hint: 'It crawls on the ground and some of them can fly!',
    hintEmoji: '🐛',
    items: [
      { id: 'b0', type: 'letter', char: 'B', emoji: '🎈', label: 'Balloon', x: 20, y: 18 },
      { id: 'u0', type: 'letter', char: 'U', emoji: '☂️', label: 'Umbrella', x: 56, y: 14 },
      { id: 'g0', type: 'letter', char: 'G', emoji: '💎', label: 'Gem', x: 82, y: 28 },
      { id: 'd0', type: 'distractor', emoji: '🍃', label: 'Leaf', x: 40, y: 36 },
      { id: 'd1', type: 'distractor', emoji: '🌻', label: 'Sunflower', x: 68, y: 48 },
      { id: 'd2', type: 'distractor', emoji: '🐞', label: 'Ladybug', x: 18, y: 58 },
      { id: 'd3', type: 'distractor', emoji: '🪨', label: 'Rock', x: 52, y: 64 },
      { id: 'd4', type: 'distractor', emoji: '🍯', label: 'Honey', x: 78, y: 62 },
    ],
  },
  {
    answer: 'HAT',
    difficulty: 'easy',
    prompt: 'You put this on your head to look stylish or stay warm! 🎩',
    hint: 'It sits on top of your head — some are tall, some are flat!',
    hintEmoji: '🎩',
    items: [
      { id: 'h0', type: 'letter', char: 'H', emoji: '🏠', label: 'House', x: 16, y: 20 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 54, y: 16 },
      { id: 't0', type: 'letter', char: 'T', emoji: '🌮', label: 'Taco', x: 84, y: 26 },
      { id: 'd0', type: 'distractor', emoji: '👟', label: 'Shoe', x: 36, y: 40 },
      { id: 'd1', type: 'distractor', emoji: '🧤', label: 'Gloves', x: 66, y: 46 },
      { id: 'd2', type: 'distractor', emoji: '🧣', label: 'Scarf', x: 20, y: 62 },
      { id: 'd3', type: 'distractor', emoji: '👓', label: 'Glasses', x: 50, y: 66 },
      { id: 'd4', type: 'distractor', emoji: '🎀', label: 'Ribbon', x: 78, y: 60 },
    ],
  },
  {
    answer: 'PIG',
    difficulty: 'easy',
    prompt: "This pink farm animal rolls in the mud and goes 'oink'! 🐷",
    hint: 'It has a curly tail and a flat snout!',
    hintEmoji: '🐷',
    items: [
      { id: 'p0', type: 'letter', char: 'P', emoji: '🍐', label: 'Pear', x: 18, y: 16 },
      { id: 'i0', type: 'letter', char: 'I', emoji: '🍦', label: 'Ice Cream', x: 60, y: 18 },
      { id: 'g0', type: 'letter', char: 'G', emoji: '🎸', label: 'Guitar', x: 80, y: 34 },
      { id: 'd0', type: 'distractor', emoji: '🌾', label: 'Wheat', x: 38, y: 36 },
      { id: 'd1', type: 'distractor', emoji: '🐔', label: 'Chicken', x: 68, y: 52 },
      { id: 'd2', type: 'distractor', emoji: '🚜', label: 'Tractor', x: 20, y: 60 },
      { id: 'd3', type: 'distractor', emoji: '🥕', label: 'Carrot', x: 50, y: 66 },
      { id: 'd4', type: 'distractor', emoji: '🐄', label: 'Cow', x: 78, y: 64 },
    ],
  },
  {
    answer: 'CUP',
    difficulty: 'easy',
    prompt: 'You drink water, juice, or hot cocoa from this! Find its letters! ☕',
    hint: 'It has a handle and you fill it with your favourite drink!',
    hintEmoji: '☕',
    items: [
      { id: 'c0', type: 'letter', char: 'C', emoji: '🍪', label: 'Cookie', x: 22, y: 18 },
      { id: 'u0', type: 'letter', char: 'U', emoji: '🦄', label: 'Unicorn', x: 58, y: 14 },
      { id: 'p0', type: 'letter', char: 'P', emoji: '🍕', label: 'Pizza', x: 84, y: 30 },
      { id: 'd0', type: 'distractor', emoji: '🥤', label: 'Juice Box', x: 40, y: 38 },
      { id: 'd1', type: 'distractor', emoji: '🍰', label: 'Cake', x: 16, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🥄', label: 'Spoon', x: 66, y: 50 },
      { id: 'd3', type: 'distractor', emoji: '🫖', label: 'Teapot', x: 50, y: 66 },
      { id: 'd4', type: 'distractor', emoji: '🧊', label: 'Ice', x: 78, y: 64 },
    ],
  },
  {
    answer: 'BEE',
    difficulty: 'easy',
    prompt: 'This buzzy insect makes honey and has black and yellow stripes! 🐝',
    hint: 'It buzzes from flower to flower and lives in a hive!',
    hintEmoji: '🐝',
    items: [
      { id: 'b0', type: 'letter', char: 'B', emoji: '🎈', label: 'Balloon', x: 20, y: 16 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 56, y: 20 },
      { id: 'e1', type: 'letter', char: 'E', emoji: '🐘', label: 'Elephant', x: 82, y: 30 },
      { id: 'd0', type: 'distractor', emoji: '🌷', label: 'Tulip', x: 38, y: 40 },
      { id: 'd1', type: 'distractor', emoji: '🍯', label: 'Honey', x: 66, y: 48 },
      { id: 'd2', type: 'distractor', emoji: '🦋', label: 'Butterfly', x: 18, y: 58 },
      { id: 'd3', type: 'distractor', emoji: '🌻', label: 'Sunflower', x: 50, y: 64 },
      { id: 'd4', type: 'distractor', emoji: '🌿', label: 'Herb', x: 78, y: 62 },
    ],
  },
  {
    answer: 'OWL',
    difficulty: 'easy',
    prompt: "This wise bird comes out at night and says 'hoo hoo'! 🦉",
    hint: 'It can turn its head almost all the way around!',
    hintEmoji: '🦉',
    items: [
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 18, y: 18 },
      { id: 'w0', type: 'letter', char: 'W', emoji: '🌊', label: 'Wave', x: 58, y: 16 },
      { id: 'l0', type: 'letter', char: 'L', emoji: '🍋', label: 'Lemon', x: 82, y: 28 },
      { id: 'd0', type: 'distractor', emoji: '🌙', label: 'Moon', x: 36, y: 38 },
      { id: 'd1', type: 'distractor', emoji: '🌲', label: 'Pine Tree', x: 68, y: 46 },
      { id: 'd2', type: 'distractor', emoji: '🐭', label: 'Mouse', x: 20, y: 60 },
      { id: 'd3', type: 'distractor', emoji: '🌌', label: 'Night Sky', x: 50, y: 66 },
      { id: 'd4', type: 'distractor', emoji: '🪶', label: 'Feather', x: 78, y: 62 },
    ],
  },
  {
    answer: 'COW',
    difficulty: 'easy',
    prompt: "This farm animal gives us milk and says 'moo'! 🐄",
    hint: 'It has black and white spots and eats grass all day!',
    hintEmoji: '🐄',
    items: [
      { id: 'c0', type: 'letter', char: 'C', emoji: '🌽', label: 'Corn', x: 16, y: 20 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍩', label: 'Donut', x: 56, y: 14 },
      { id: 'w0', type: 'letter', char: 'W', emoji: '🪵', label: 'Wood', x: 84, y: 32 },
      { id: 'd0', type: 'distractor', emoji: '🥛', label: 'Milk', x: 38, y: 40 },
      { id: 'd1', type: 'distractor', emoji: '🌾', label: 'Wheat', x: 18, y: 58 },
      { id: 'd2', type: 'distractor', emoji: '🐴', label: 'Horse', x: 66, y: 50 },
      { id: 'd3', type: 'distractor', emoji: '🔔', label: 'Bell', x: 50, y: 66 },
      { id: 'd4', type: 'distractor', emoji: '🧀', label: 'Cheese', x: 78, y: 64 },
    ],
  },
]

// ── Medium (4 letters) ────────────────────────────────────
const MEDIUM_PUZZLES: readonly Puzzle[] = [
  {
    answer: 'FROG',
    difficulty: 'medium',
    prompt: "This green jumper loves lily pads and goes 'ribbit'! Find its letters! 🐸",
    hint: "It's green, loves to jump, and lives near ponds!",
    hintEmoji: '🐸',
    items: [
      { id: 'f0', type: 'letter', char: 'F', emoji: '🌸', label: 'Flower', x: 22, y: 17 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌈', label: 'Rainbow', x: 62, y: 14 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 15, y: 48 },
      { id: 'g0', type: 'letter', char: 'G', emoji: '🍇', label: 'Grapes', x: 80, y: 40 },
      { id: 'd0', type: 'distractor', emoji: '🦆', label: 'Duck', x: 42, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🌿', label: 'Leaf', x: 56, y: 62 },
      { id: 'd2', type: 'distractor', emoji: '🐝', label: 'Bee', x: 28, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '💧', label: 'Water', x: 72, y: 65 },
    ],
  },
  {
    answer: 'STAR',
    difficulty: 'medium',
    prompt: 'On a clear night, thousands of these twinkle above you! Find the letters! ⭐',
    hint: 'They twinkle in the night sky — you can even make wishes on them!',
    hintEmoji: '⭐',
    items: [
      { id: 's0', type: 'letter', char: 'S', emoji: '🌻', label: 'Sunflower', x: 16, y: 18 },
      { id: 't0', type: 'letter', char: 'T', emoji: '🌴', label: 'Palm Tree', x: 52, y: 14 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍄', label: 'Mushroom', x: 83, y: 24 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌹', label: 'Rose', x: 30, y: 50 },
      { id: 'd0', type: 'distractor', emoji: '🌙', label: 'Moon', x: 68, y: 46 },
      { id: 'd1', type: 'distractor', emoji: '🦉', label: 'Owl', x: 20, y: 65 },
      { id: 'd2', type: 'distractor', emoji: '🌌', label: 'Galaxy', x: 55, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '🎆', label: 'Fireworks', x: 78, y: 66 },
    ],
  },
  {
    answer: 'BOOK',
    difficulty: 'medium',
    prompt: 'I have pages and a cover — you read stories inside me! Find my letters! 📚',
    hint: 'You find lots of these in a library!',
    hintEmoji: '📚',
    items: [
      { id: 'b0', type: 'letter', char: 'B', emoji: '🐝', label: 'Bee', x: 18, y: 17 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍩', label: 'Donut', x: 55, y: 18 },
      { id: 'o1', type: 'letter', char: 'O', emoji: '🦭', label: 'Seal', x: 82, y: 17 },
      { id: 'k0', type: 'letter', char: 'K', emoji: '🪁', label: 'Kite', x: 32, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '✏️', label: 'Pencil', x: 62, y: 48 },
      { id: 'd1', type: 'distractor', emoji: '📏', label: 'Ruler', x: 16, y: 66 },
      { id: 'd2', type: 'distractor', emoji: '🎒', label: 'Backpack', x: 50, y: 68 },
      { id: 'd3', type: 'distractor', emoji: '🍎', label: 'Apple', x: 78, y: 66 },
    ],
  },
  {
    answer: 'FISH',
    difficulty: 'medium',
    prompt: 'This creature swims in the ocean and has shiny scales! Find its letters! 🐟',
    hint: 'It breathes underwater through gills and has fins!',
    hintEmoji: '🐟',
    items: [
      { id: 'f0', type: 'letter', char: 'F', emoji: '🍟', label: 'Fries', x: 18, y: 16 },
      { id: 'i0', type: 'letter', char: 'I', emoji: '🍦', label: 'Ice Cream', x: 56, y: 20 },
      { id: 's0', type: 'letter', char: 'S', emoji: '🐚', label: 'Shell', x: 82, y: 18 },
      { id: 'h0', type: 'letter', char: 'H', emoji: '🪝', label: 'Hook', x: 34, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '🌊', label: 'Wave', x: 64, y: 46 },
      { id: 'd1', type: 'distractor', emoji: '🐙', label: 'Octopus', x: 18, y: 64 },
      { id: 'd2', type: 'distractor', emoji: '⚓', label: 'Anchor', x: 50, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '🦀', label: 'Crab', x: 78, y: 62 },
    ],
  },
  {
    answer: 'CAKE',
    difficulty: 'medium',
    prompt: 'You blow out candles on this yummy treat on your birthday! 🎂',
    hint: 'It has frosting, layers, and sometimes sprinkles!',
    hintEmoji: '🎂',
    items: [
      { id: 'c0', type: 'letter', char: 'C', emoji: '🍬', label: 'Candy', x: 20, y: 18 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 60, y: 14 },
      { id: 'k0', type: 'letter', char: 'K', emoji: '🪁', label: 'Kite', x: 82, y: 28 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 16, y: 50 },
      { id: 'd0', type: 'distractor', emoji: '🎁', label: 'Gift', x: 42, y: 38 },
      { id: 'd1', type: 'distractor', emoji: '🎉', label: 'Party', x: 68, y: 48 },
      { id: 'd2', type: 'distractor', emoji: '🎈', label: 'Balloon', x: 34, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🕯️', label: 'Candle', x: 78, y: 64 },
    ],
  },
  {
    answer: 'BIRD',
    difficulty: 'medium',
    prompt: 'This feathered friend flies through the sky and sings songs! 🐦',
    hint: 'It builds nests in trees and lays eggs!',
    hintEmoji: '🐦',
    items: [
      { id: 'b0', type: 'letter', char: 'B', emoji: '🎈', label: 'Balloon', x: 16, y: 16 },
      { id: 'i0', type: 'letter', char: 'I', emoji: '🍦', label: 'Ice Cream', x: 58, y: 18 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌈', label: 'Rainbow', x: 84, y: 24 },
      { id: 'd_0', type: 'letter', char: 'D', emoji: '🥁', label: 'Drum', x: 30, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '🌳', label: 'Tree', x: 62, y: 46 },
      { id: 'd1', type: 'distractor', emoji: '🪶', label: 'Feather', x: 18, y: 62 },
      { id: 'd2', type: 'distractor', emoji: '🐛', label: 'Worm', x: 48, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '☁️', label: 'Cloud', x: 78, y: 64 },
    ],
  },
  {
    answer: 'TREE',
    difficulty: 'medium',
    prompt: 'This tall plant has a trunk, branches, and lots of leaves! 🌳',
    hint: 'Birds build nests in it and it gives us shade!',
    hintEmoji: '🌳',
    items: [
      { id: 't0', type: 'letter', char: 'T', emoji: '🌮', label: 'Taco', x: 20, y: 18 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌹', label: 'Rose', x: 56, y: 14 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🐘', label: 'Elephant', x: 84, y: 22 },
      { id: 'e1', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 30, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '🍂', label: 'Fallen Leaf', x: 62, y: 44 },
      { id: 'd1', type: 'distractor', emoji: '🐿️', label: 'Squirrel', x: 18, y: 62 },
      { id: 'd2', type: 'distractor', emoji: '🪵', label: 'Log', x: 48, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '🍎', label: 'Apple', x: 76, y: 62 },
    ],
  },
  {
    answer: 'MOON',
    difficulty: 'medium',
    prompt: 'This glowing circle lights up the night sky! Find its letters! 🌙',
    hint: 'It changes shape every month — sometimes full, sometimes a sliver!',
    hintEmoji: '🌙',
    items: [
      { id: 'm0', type: 'letter', char: 'M', emoji: '🍄', label: 'Mushroom', x: 18, y: 18 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 56, y: 16 },
      { id: 'o1', type: 'letter', char: 'O', emoji: '🦉', label: 'Owl', x: 82, y: 20 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 34, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '⭐', label: 'Star', x: 64, y: 44 },
      { id: 'd1', type: 'distractor', emoji: '🦇', label: 'Bat', x: 16, y: 62 },
      { id: 'd2', type: 'distractor', emoji: '🌌', label: 'Galaxy', x: 50, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '🔭', label: 'Telescope', x: 78, y: 64 },
    ],
  },
  {
    answer: 'BEAR',
    difficulty: 'medium',
    prompt: 'This big, furry animal loves honey and sleeps all winter! 🐻',
    hint: 'It hibernates in a cave and can be brown, black, or white!',
    hintEmoji: '🐻',
    items: [
      { id: 'b0', type: 'letter', char: 'B', emoji: '🫐', label: 'Blueberry', x: 18, y: 16 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🦅', label: 'Eagle', x: 58, y: 20 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 82, y: 18 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌈', label: 'Rainbow', x: 34, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '🍯', label: 'Honey', x: 64, y: 46 },
      { id: 'd1', type: 'distractor', emoji: '🏔️', label: 'Mountain', x: 16, y: 64 },
      { id: 'd2', type: 'distractor', emoji: '🐟', label: 'Fish', x: 48, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '🌲', label: 'Pine', x: 78, y: 62 },
    ],
  },
  {
    answer: 'RAIN',
    difficulty: 'medium',
    prompt: 'Water drops fall from the clouds when this happens! 🌧️',
    hint: 'You need an umbrella or a raincoat when it comes!',
    hintEmoji: '🌧️',
    items: [
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌹', label: 'Rose', x: 20, y: 16 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 58, y: 14 },
      { id: 'i0', type: 'letter', char: 'I', emoji: '🍦', label: 'Ice Cream', x: 82, y: 24 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 32, y: 48 },
      { id: 'd0', type: 'distractor', emoji: '☂️', label: 'Umbrella', x: 64, y: 42 },
      { id: 'd1', type: 'distractor', emoji: '🌈', label: 'Rainbow', x: 18, y: 62 },
      { id: 'd2', type: 'distractor', emoji: '⛈️', label: 'Storm', x: 48, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '💧', label: 'Droplet', x: 78, y: 64 },
    ],
  },
]

// ── Hard (5 letters) ──────────────────────────────────────
const HARD_PUZZLES: readonly Puzzle[] = [
  {
    answer: 'OCEAN',
    difficulty: 'hard',
    prompt: 'This massive body of salty water covers most of Earth! Find its letters! 🌊',
    hint: 'Whales and dolphins live here — it has waves and tides!',
    hintEmoji: '🌊',
    items: [
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 18, y: 16 },
      { id: 'c0', type: 'letter', char: 'C', emoji: '🦀', label: 'Crab', x: 54, y: 14 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 82, y: 20 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '⚓', label: 'Anchor', x: 16, y: 44 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 80, y: 42 },
      { id: 'd0', type: 'distractor', emoji: '🐚', label: 'Shell', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🐳', label: 'Whale', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🏖️', label: 'Beach', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🦈', label: 'Shark', x: 78, y: 66 },
    ],
  },
  {
    answer: 'MOUSE',
    difficulty: 'hard',
    prompt: 'This tiny squeaky animal loves cheese and has big ears! 🐭',
    hint: 'It has a long thin tail and whiskers — cats chase it!',
    hintEmoji: '🐭',
    items: [
      { id: 'm0', type: 'letter', char: 'M', emoji: '🍄', label: 'Mushroom', x: 16, y: 18 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 52, y: 14 },
      { id: 'u0', type: 'letter', char: 'U', emoji: '☂️', label: 'Umbrella', x: 84, y: 22 },
      { id: 's0', type: 'letter', char: 'S', emoji: '🐚', label: 'Shell', x: 18, y: 46 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 78, y: 44 },
      { id: 'd0', type: 'distractor', emoji: '🧀', label: 'Cheese', x: 42, y: 36 },
      { id: 'd1', type: 'distractor', emoji: '🐱', label: 'Cat', x: 60, y: 58 },
      { id: 'd2', type: 'distractor', emoji: '🕳️', label: 'Hole', x: 28, y: 66 },
      { id: 'd3', type: 'distractor', emoji: '🪤', label: 'Trap', x: 76, y: 64 },
    ],
  },
  {
    answer: 'TIGER',
    difficulty: 'hard',
    prompt: 'This fierce big cat has orange fur and black stripes! 🐯',
    hint: 'It lives in the jungle and is the biggest cat in the world!',
    hintEmoji: '🐯',
    items: [
      { id: 't0', type: 'letter', char: 'T', emoji: '🌴', label: 'Palm Tree', x: 20, y: 16 },
      { id: 'i0', type: 'letter', char: 'I', emoji: '🍦', label: 'Ice Cream', x: 56, y: 14 },
      { id: 'g0', type: 'letter', char: 'G', emoji: '🍇', label: 'Grapes', x: 84, y: 20 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🐘', label: 'Elephant', x: 16, y: 46 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌈', label: 'Rainbow', x: 80, y: 44 },
      { id: 'd0', type: 'distractor', emoji: '🌿', label: 'Jungle Leaf', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🐒', label: 'Monkey', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🦜', label: 'Parrot', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🐍', label: 'Snake', x: 76, y: 66 },
    ],
  },
  {
    answer: 'CLOUD',
    difficulty: 'hard',
    prompt: 'These fluffy white shapes float across the sky! Find all the letters! ☁️',
    hint: 'They bring rain and sometimes look like animals or shapes!',
    hintEmoji: '☁️',
    items: [
      { id: 'c0', type: 'letter', char: 'C', emoji: '🍬', label: 'Candy', x: 18, y: 16 },
      { id: 'l0', type: 'letter', char: 'L', emoji: '🍋', label: 'Lemon', x: 54, y: 18 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 82, y: 22 },
      { id: 'u0', type: 'letter', char: 'U', emoji: '🦄', label: 'Unicorn', x: 16, y: 44 },
      { id: 'd_0', type: 'letter', char: 'D', emoji: '🥁', label: 'Drum', x: 80, y: 42 },
      { id: 'd0', type: 'distractor', emoji: '☀️', label: 'Sun', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '✈️', label: 'Plane', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🌈', label: 'Rainbow', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🪁', label: 'Kite', x: 76, y: 66 },
    ],
  },
  {
    answer: 'PLANT',
    difficulty: 'hard',
    prompt: 'This green living thing grows in soil and needs water and sunlight! 🌱',
    hint: 'It starts as a tiny seed and grows leaves and sometimes flowers!',
    hintEmoji: '🌱',
    items: [
      { id: 'p0', type: 'letter', char: 'P', emoji: '🍐', label: 'Pear', x: 18, y: 18 },
      { id: 'l0', type: 'letter', char: 'L', emoji: '🍋', label: 'Lemon', x: 52, y: 14 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 84, y: 20 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 16, y: 46 },
      { id: 't0', type: 'letter', char: 'T', emoji: '🌮', label: 'Taco', x: 80, y: 44 },
      { id: 'd0', type: 'distractor', emoji: '💧', label: 'Water', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '☀️', label: 'Sun', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🐛', label: 'Caterpillar', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🪴', label: 'Pot', x: 76, y: 66 },
    ],
  },
  {
    answer: 'SNAKE',
    difficulty: 'hard',
    prompt: 'This long, slithery reptile has no legs and flicks its tongue! 🐍',
    hint: 'It slithers on the ground and some of them rattle their tails!',
    hintEmoji: '🐍',
    items: [
      { id: 's0', type: 'letter', char: 'S', emoji: '🐚', label: 'Shell', x: 20, y: 16 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 56, y: 14 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 84, y: 22 },
      { id: 'k0', type: 'letter', char: 'K', emoji: '🪁', label: 'Kite', x: 16, y: 46 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 80, y: 44 },
      { id: 'd0', type: 'distractor', emoji: '🪨', label: 'Rock', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🌵', label: 'Cactus', x: 62, y: 58 },
      { id: 'd2', type: 'distractor', emoji: '🦎', label: 'Lizard', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🏜️', label: 'Desert', x: 76, y: 66 },
    ],
  },
  {
    answer: 'HORSE',
    difficulty: 'hard',
    prompt: 'This majestic animal gallops fast and you can ride it! 🐴',
    hint: 'It has a mane, hooves, and loves eating apples and carrots!',
    hintEmoji: '🐴',
    items: [
      { id: 'h0', type: 'letter', char: 'H', emoji: '🏠', label: 'House', x: 18, y: 16 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 54, y: 18 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌹', label: 'Rose', x: 82, y: 22 },
      { id: 's0', type: 'letter', char: 'S', emoji: '🌻', label: 'Sunflower', x: 16, y: 44 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🐘', label: 'Elephant', x: 80, y: 42 },
      { id: 'd0', type: 'distractor', emoji: '🥕', label: 'Carrot', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🤠', label: 'Cowboy', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🌾', label: 'Hay', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🏇', label: 'Jockey', x: 76, y: 66 },
    ],
  },
  {
    answer: 'TRAIN',
    difficulty: 'hard',
    prompt: 'This vehicle rides on tracks and goes choo-choo! Find all its letters! 🚂',
    hint: 'It has carriages, runs on rails, and stops at stations!',
    hintEmoji: '🚂',
    items: [
      { id: 't0', type: 'letter', char: 'T', emoji: '🌮', label: 'Taco', x: 20, y: 18 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌈', label: 'Rainbow', x: 54, y: 14 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 84, y: 20 },
      { id: 'i0', type: 'letter', char: 'I', emoji: '🍦', label: 'Ice Cream', x: 16, y: 46 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 80, y: 44 },
      { id: 'd0', type: 'distractor', emoji: '🛤️', label: 'Tracks', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🚉', label: 'Station', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '💨', label: 'Steam', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🧳', label: 'Suitcase', x: 76, y: 66 },
    ],
  },
  {
    answer: 'LEMON',
    difficulty: 'hard',
    prompt: 'This sour yellow fruit makes your face scrunch up! Find its letters! 🍋',
    hint: 'You squeeze it to make lemonade — it is very sour!',
    hintEmoji: '🍋',
    items: [
      { id: 'l0', type: 'letter', char: 'L', emoji: '🍃', label: 'Leaf', x: 18, y: 16 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🥚', label: 'Egg', x: 56, y: 18 },
      { id: 'm0', type: 'letter', char: 'M', emoji: '🍄', label: 'Mushroom', x: 82, y: 22 },
      { id: 'o0', type: 'letter', char: 'O', emoji: '🍊', label: 'Orange', x: 16, y: 44 },
      { id: 'n0', type: 'letter', char: 'N', emoji: '🌰', label: 'Nut', x: 80, y: 44 },
      { id: 'd0', type: 'distractor', emoji: '🍓', label: 'Strawberry', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '🥤', label: 'Drink', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🍌', label: 'Banana', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🧊', label: 'Ice', x: 76, y: 66 },
    ],
  },
  {
    answer: 'DREAM',
    difficulty: 'hard',
    prompt: 'When you close your eyes at night, your mind creates these stories! 💭',
    hint: 'You have these while sleeping — sometimes magical, sometimes silly!',
    hintEmoji: '💭',
    items: [
      { id: 'd_0', type: 'letter', char: 'D', emoji: '🥁', label: 'Drum', x: 20, y: 16 },
      { id: 'r0', type: 'letter', char: 'R', emoji: '🌹', label: 'Rose', x: 54, y: 14 },
      { id: 'e0', type: 'letter', char: 'E', emoji: '🐘', label: 'Elephant', x: 84, y: 22 },
      { id: 'a0', type: 'letter', char: 'A', emoji: '🍎', label: 'Apple', x: 16, y: 44 },
      { id: 'm0', type: 'letter', char: 'M', emoji: '🍄', label: 'Mushroom', x: 80, y: 42 },
      { id: 'd0', type: 'distractor', emoji: '🌙', label: 'Moon', x: 40, y: 34 },
      { id: 'd1', type: 'distractor', emoji: '⭐', label: 'Star', x: 62, y: 56 },
      { id: 'd2', type: 'distractor', emoji: '🛏️', label: 'Bed', x: 28, y: 64 },
      { id: 'd3', type: 'distractor', emoji: '🧸', label: 'Teddy Bear', x: 76, y: 66 },
    ],
  },
]

/** Full puzzle pool — all difficulties combined */
export const PUZZLES: readonly Puzzle[] = [
  ...EASY_PUZZLES,
  ...MEDIUM_PUZZLES,
  ...HARD_PUZZLES,
]

/** Number of puzzles to randomly select for a session when no filter is provided */
export const DEFAULT_SESSION_SIZE = 5

/** Shuffle an array using Fisher-Yates */
function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Select puzzles for a game session.
 * - If `answers` is provided, filter to those specific puzzles.
 * - If `difficulty` is provided, filter to that difficulty level.
 * - Otherwise, randomly pick `DEFAULT_SESSION_SIZE` puzzles from the full pool.
 * Always returns puzzles in shuffled order.
 */
export function selectPuzzles(opts: {
  answers?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  count?: number
}): Puzzle[] {
  let pool: readonly Puzzle[] = PUZZLES

  // Filter by specific answers first
  if (opts.answers && opts.answers.length > 0) {
    const filtered = pool.filter(p => opts.answers!.includes(p.answer))
    if (filtered.length > 0) pool = filtered
  }

  // Filter by difficulty
  if (opts.difficulty) {
    const filtered = pool.filter(p => p.difficulty === opts.difficulty)
    if (filtered.length > 0) pool = filtered
  }

  const shuffled = shuffle(pool)
  const count = opts.count ?? DEFAULT_SESSION_SIZE
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

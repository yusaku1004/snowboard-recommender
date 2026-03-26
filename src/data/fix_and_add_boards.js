const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'boards_data.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`Initial board count: ${data.length}`);
console.log(`Boards missing gender: ${data.filter(b => !b.gender).length}`);

// ============================================================
// TASK 1: Fix missing gender fields
// ============================================================

const womensModels = ['Paradise', 'DESIRE W', 'Raina', 'Veda', 'Spellcaster', 'Rival'];
// NOVEMBER DESIRE W: women's version, CAPITA Paradise: women's, ROXY: always womens
// Arbor Veda: women's model, K2 Spellcaster: women's, YES. Rival: women's

data.forEach(board => {
  if (board.gender) return; // already has gender

  // ROXY is always womens
  if (board.brand === 'ROXY') {
    board.gender = 'womens';
    return;
  }

  // Known women's models
  if (womensModels.includes(board.model)) {
    board.gender = 'womens';
    return;
  }

  // 011 Artistic → unisex
  if (board.brand === '011 Artistic') {
    board.gender = 'unisex';
    return;
  }

  // Boards with very short max length and no strong carving → unisex
  const maxLen = Math.max(...board.available_lengths);
  if (maxLen <= 148 && board.style_scores.carving <= 5) {
    board.gender = 'unisex';
    return;
  }

  // Default: mens
  board.gender = 'mens';
});

console.log(`After fix - boards missing gender: ${data.filter(b => !b.gender).length}`);

// ============================================================
// TASK 2: Add new boards
// ============================================================

const newBoards = [];

// --- A) 2024 models (discounted older versions) ---

// BURTON
newBoards.push({
  brand: "BURTON", model: "Custom", year: 2024, flex: 6, shape: "camber",
  available_lengths: [150, 154, 156, 158, 162], price: 69300,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "BURTON", model: "Process", year: 2024, flex: 4, shape: "hybrid_camber",
  available_lengths: [148, 152, 155, 157, 159], price: 59400,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "BURTON", model: "Kilroy Twin", year: 2024, flex: 4, shape: "camber",
  available_lengths: [148, 150, 152, 154, 156], price: 54000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 8, carving: 5, run_tricks: 5, powder: 4 }
});

// CAPITA
newBoards.push({
  brand: "CAPITA", model: "DOA", year: 2024, flex: 6, shape: "hybrid_camber",
  available_lengths: [148, 150, 152, 154, 156, 158], price: 62700,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 6, run_tricks: 7, powder: 5 }
});
newBoards.push({
  brand: "CAPITA", model: "Horrorscope", year: 2024, flex: 4, shape: "flat",
  available_lengths: [147, 149, 151, 153, 155], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 8, park: 8, carving: 3, run_tricks: 5, powder: 3 }
});

// K2
newBoards.push({
  brand: "K2", model: "Afterblack", year: 2024, flex: 5, shape: "hybrid_camber",
  available_lengths: [149, 152, 155, 158, 161], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 6, carving: 6, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "K2", model: "Standard", year: 2024, flex: 4, shape: "rocker",
  available_lengths: [147, 150, 152, 155, 158], price: 46200,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 6, carving: 4, run_tricks: 5, powder: 6 }
});

// RIDE
newBoards.push({
  brand: "RIDE", model: "Algorythm", year: 2024, flex: 6, shape: "hybrid_camber",
  available_lengths: [151, 154, 157, 160], price: 61600,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "RIDE", model: "Psychocandy", year: 2024, flex: 5, shape: "camber",
  available_lengths: [148, 151, 154, 157], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 6, run_tricks: 6, powder: 5 }
});

// SALOMON
newBoards.push({
  brand: "SALOMON", model: "Assassin", year: 2024, flex: 6, shape: "hybrid_camber",
  available_lengths: [150, 153, 156, 159, 162], price: 60500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 7, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "SALOMON", model: "Sleepwalker", year: 2024, flex: 4, shape: "flat",
  available_lengths: [148, 150, 152, 155, 158], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 8, park: 8, carving: 3, run_tricks: 5, powder: 3 }
});

// YES.
newBoards.push({
  brand: "YES.", model: "Greats", year: 2024, flex: 6, shape: "hybrid_camber",
  available_lengths: [150, 152, 154, 156, 158], price: 58300,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 6, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "YES.", model: "Basic", year: 2024, flex: 4, shape: "flat",
  available_lengths: [148, 150, 152, 154, 156], price: 44000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 8, park: 7, carving: 3, run_tricks: 5, powder: 3 }
});

// GNU
newBoards.push({
  brand: "GNU", model: "Head Space", year: 2024, flex: 5, shape: "hybrid_camber",
  available_lengths: [149, 152, 155, 158], price: 57200,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 6, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "GNU", model: "Money", year: 2024, flex: 5, shape: "camber",
  available_lengths: [149, 152, 155, 158], price: 52800,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 6, powder: 5 }
});

// JONES
newBoards.push({
  brand: "JONES", model: "Mountain Twin", year: 2024, flex: 6, shape: "camber",
  available_lengths: [151, 154, 157, 160, 163], price: 66000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 7 }
});
newBoards.push({
  brand: "JONES", model: "Frontier", year: 2024, flex: 5, shape: "hybrid_camber",
  available_lengths: [152, 155, 158, 161], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 5, carving: 6, run_tricks: 6, powder: 7 }
});

// NITRO
newBoards.push({
  brand: "NITRO", model: "Team", year: 2024, flex: 6, shape: "camber",
  available_lengths: [152, 155, 157, 159], price: 57200,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "NITRO", model: "Cinema", year: 2024, flex: 4, shape: "flat",
  available_lengths: [148, 150, 152, 155], price: 44000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 8, park: 8, carving: 3, run_tricks: 5, powder: 3 }
});

// LIB TECH
newBoards.push({
  brand: "LIB TECH", model: "Skate Banana", year: 2024, flex: 5, shape: "hybrid_camber",
  available_lengths: [148, 150, 153, 156, 159], price: 59400,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "LIB TECH", model: "Cold Brew", year: 2024, flex: 6, shape: "camber",
  available_lengths: [149, 152, 155, 158], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});

// --- B) Women's models ---

// BURTON women's
newBoards.push({
  brand: "BURTON", model: "Feelgood", year: 2025, flex: 6, shape: "camber",
  available_lengths: [140, 142, 146, 149, 152], price: 72600,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "BURTON", model: "Yeasayer", year: 2025, flex: 3, shape: "flat",
  available_lengths: [140, 144, 148], price: 54000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 7, carving: 3, run_tricks: 5, powder: 4 }
});
newBoards.push({
  brand: "BURTON", model: "Stylus", year: 2025, flex: 2, shape: "flat",
  available_lengths: [138, 141, 144, 147], price: 39600,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 6, carving: 2, run_tricks: 4, powder: 4 }
});

// CAPITA women's
newBoards.push({
  brand: "CAPITA", model: "Birds of a Feather", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [140, 142, 144, 146, 148], price: 62700,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 7, carving: 6, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "CAPITA", model: "Space Metal Fantasy", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [141, 143, 145, 147], price: 57200,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 7, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});

// RIDE women's
newBoards.push({
  brand: "RIDE", model: "Saturday", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [138, 142, 146, 150], price: 55000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 7, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "RIDE", model: "Heartbreaker", year: 2025, flex: 3, shape: "flat",
  available_lengths: [139, 143, 147], price: 44000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 7, carving: 3, run_tricks: 4, powder: 4 }
});

// SALOMON women's
newBoards.push({
  brand: "SALOMON", model: "Rumble Fish", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [142, 144, 146, 148, 150], price: 57200,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 6, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "SALOMON", model: "Lotus", year: 2025, flex: 3, shape: "rocker",
  available_lengths: [138, 142, 146], price: 44000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 6, carving: 3, run_tricks: 4, powder: 5 }
});

// K2 women's
newBoards.push({
  brand: "K2", model: "Dreamsicle", year: 2025, flex: 3, shape: "rocker",
  available_lengths: [142, 146, 149, 152], price: 44000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 7, park: 6, carving: 3, run_tricks: 4, powder: 5 }
});
newBoards.push({
  brand: "K2", model: "Lime Lite", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [142, 146, 149], price: 49500,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 5, run_tricks: 6, powder: 5 }
});

// JONES women's
newBoards.push({
  brand: "JONES", model: "Dream Catcher", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [142, 145, 148, 151, 154], price: 58300,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 5, park: 5, carving: 6, run_tricks: 6, powder: 7 }
});
newBoards.push({
  brand: "JONES", model: "Twin Sister", year: 2025, flex: 5, shape: "camber",
  available_lengths: [143, 146, 149, 152], price: 60500,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 6, run_tricks: 7, powder: 6 }
});

// GNU women's
newBoards.push({
  brand: "GNU", model: "Velvet", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [139, 143, 146, 149], price: 52800,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 7, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "GNU", model: "Gloss", year: 2025, flex: 3, shape: "rocker",
  available_lengths: [139, 142, 146], price: 46200,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 6, carving: 3, run_tricks: 4, powder: 5 }
});

// NITRO women's
newBoards.push({
  brand: "NITRO", model: "Drop", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [142, 146, 149, 152], price: 49500,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "NITRO", model: "Mystique", year: 2025, flex: 3, shape: "flat",
  available_lengths: [138, 142, 146, 149], price: 39600,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 7, carving: 3, run_tricks: 4, powder: 4 }
});

// LIB TECH women's
newBoards.push({
  brand: "LIB TECH", model: "Glider", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [141, 145, 149, 153], price: 55000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 5, run_tricks: 6, powder: 6 }
});
newBoards.push({
  brand: "LIB TECH", model: "Bent Metal", year: 2025, flex: 5, shape: "camber",
  available_lengths: [140, 143, 147, 150], price: 57200,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 6, powder: 5 }
});

// YES. women's
newBoards.push({
  brand: "YES.", model: "Hello", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [141, 144, 147, 149], price: 52800,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 7, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});

// ROSSIGNOL women's
newBoards.push({
  brand: "ROSSIGNOL", model: "Frenemy", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [140, 144, 148, 152], price: 46200,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "ROSSIGNOL", model: "Gala", year: 2025, flex: 3, shape: "rocker",
  available_lengths: [138, 142, 146], price: 39600,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 6, carving: 3, run_tricks: 4, powder: 5 }
});

// ROXY women's
newBoards.push({
  brand: "ROXY", model: "Dawn", year: 2025, flex: 4, shape: "hybrid_camber",
  available_lengths: [142, 146, 149, 152], price: 52800,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 6, park: 6, carving: 5, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "ROXY", model: "XOXO", year: 2025, flex: 3, shape: "flat",
  available_lengths: [138, 142, 146, 149], price: 44000,
  image_url: "", url: "", gender: "womens",
  style_scores: { ground_tricks: 8, park: 7, carving: 3, run_tricks: 4, powder: 4 }
});

// --- C) Extreme flex boards ---

newBoards.push({
  brand: "RICE28", model: "RT9", year: 2025, flex: 1, shape: "flat",
  available_lengths: [148, 150, 152, 154], price: 75900,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 10, park: 7, carving: 2, run_tricks: 4, powder: 2 }
});
newBoards.push({
  brand: "FNTC", model: "SOT", year: 2025, flex: 1, shape: "rocker",
  available_lengths: [143, 147, 150, 153], price: 65780,
  image_url: "", url: "", gender: "unisex",
  style_scores: { ground_tricks: 10, park: 8, carving: 2, run_tricks: 3, powder: 3 }
});
newBoards.push({
  brand: "OGASAKA", model: "FC", year: 2025, flex: 10, shape: "camber",
  available_lengths: [155, 158, 161, 164], price: 132000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 1, park: 2, carving: 10, run_tricks: 5, powder: 4 }
});
newBoards.push({
  brand: "GRAY", model: "EPIC", year: 2025, flex: 10, shape: "camber",
  available_lengths: [156, 159, 162], price: 143000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 1, park: 2, carving: 10, run_tricks: 4, powder: 3 }
});
newBoards.push({
  brand: "MOSS", model: "REVOLVER", year: 2025, flex: 9, shape: "camber",
  available_lengths: [155, 158, 161], price: 121000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 2, park: 3, carving: 10, run_tricks: 6, powder: 4 }
});
newBoards.push({
  brand: "SCOOTER", model: "DAYLIFE", year: 2025, flex: 1, shape: "flat",
  available_lengths: [139, 143, 147, 150], price: 68200,
  image_url: "", url: "", gender: "unisex",
  style_scores: { ground_tricks: 10, park: 7, carving: 2, run_tricks: 3, powder: 2 }
});

// --- D) Missing/underrepresented brands (2025 models) ---

// LOBSTER
newBoards.push({
  brand: "LOBSTER", model: "Jibboard", year: 2025, flex: 3, shape: "rocker",
  available_lengths: [148, 151, 153, 155], price: 57200,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 9, park: 8, carving: 3, run_tricks: 4, powder: 3 }
});
newBoards.push({
  brand: "LOBSTER", model: "Sender", year: 2025, flex: 6, shape: "hybrid_camber",
  available_lengths: [152, 155, 157, 159], price: 62700,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});

// ENDEAVOR
newBoards.push({
  brand: "ENDEAVOR", model: "Pioneer", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [152, 155, 158], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 6, carving: 6, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "ENDEAVOR", model: "Clout", year: 2025, flex: 4, shape: "flat",
  available_lengths: [148, 151, 154], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 8, park: 7, carving: 3, run_tricks: 5, powder: 3 }
});

// WESTON
newBoards.push({
  brand: "WESTON", model: "Backwoods", year: 2025, flex: 6, shape: "hybrid_camber",
  available_lengths: [155, 158, 161, 164], price: 66000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 3, park: 4, carving: 6, run_tricks: 6, powder: 9 }
});

// TELOS
newBoards.push({
  brand: "TELOS", model: "Backslash", year: 2025, flex: 4, shape: "rocker",
  available_lengths: [150, 153, 156], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 6, carving: 4, run_tricks: 5, powder: 6 }
});

// MARHAR
newBoards.push({
  brand: "MARHAR", model: "Lumberjack", year: 2025, flex: 7, shape: "camber",
  available_lengths: [155, 158, 161], price: 60500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 3, park: 4, carving: 8, run_tricks: 7, powder: 6 }
});
newBoards.push({
  brand: "MARHAR", model: "Sasquatch", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [152, 155, 158], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 6, carving: 6, run_tricks: 6, powder: 6 }
});

// SANTA CRUZ
newBoards.push({
  brand: "SANTA CRUZ", model: "Street Shark", year: 2025, flex: 4, shape: "flat",
  available_lengths: [149, 152, 155], price: 46200,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 8, park: 8, carving: 3, run_tricks: 5, powder: 3 }
});
newBoards.push({
  brand: "SANTA CRUZ", model: "Screaming Hand", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [151, 154, 157], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 5, run_tricks: 6, powder: 5 }
});

// SIGNAL
newBoards.push({
  brand: "SIGNAL", model: "Park", year: 2025, flex: 4, shape: "flat",
  available_lengths: [149, 152, 155], price: 46200,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 9, carving: 3, run_tricks: 5, powder: 3 }
});
newBoards.push({
  brand: "SIGNAL", model: "OG", year: 2025, flex: 5, shape: "camber",
  available_lengths: [151, 154, 157], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 6, powder: 5 }
});

// UNIT
newBoards.push({
  brand: "UNIT", model: "Drifter", year: 2025, flex: 4, shape: "rocker",
  available_lengths: [149, 152, 155], price: 49500,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 7, park: 6, carving: 4, run_tricks: 5, powder: 6 }
});

// ACADEMY
newBoards.push({
  brand: "ACADEMY", model: "Team", year: 2025, flex: 5, shape: "hybrid_camber",
  available_lengths: [151, 154, 157], price: 52800,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 6, park: 7, carving: 6, run_tricks: 6, powder: 5 }
});
newBoards.push({
  brand: "ACADEMY", model: "Propacamba", year: 2025, flex: 6, shape: "camber",
  available_lengths: [153, 156, 159], price: 55000,
  image_url: "", url: "", gender: "mens",
  style_scores: { ground_tricks: 5, park: 6, carving: 7, run_tricks: 7, powder: 6 }
});

// ============================================================
// Add new boards and sort
// ============================================================

console.log(`New boards to add: ${newBoards.length}`);
data = data.concat(newBoards);

// Sort by brand (alphabetical), then model name
data.sort((a, b) => {
  const brandCmp = a.brand.localeCompare(b.brand);
  if (brandCmp !== 0) return brandCmp;
  return a.model.localeCompare(b.model);
});

console.log(`Final board count: ${data.length}`);
console.log(`Boards with gender: ${data.filter(b => b.gender).length}`);
console.log(`  mens: ${data.filter(b => b.gender === 'mens').length}`);
console.log(`  womens: ${data.filter(b => b.gender === 'womens').length}`);
console.log(`  unisex: ${data.filter(b => b.gender === 'unisex').length}`);
console.log(`Boards missing gender: ${data.filter(b => !b.gender).length}`);

// Verify no duplicates (same brand + model + year)
const seen = new Set();
const dupes = [];
data.forEach(b => {
  const key = `${b.brand}|${b.model}|${b.year}`;
  if (seen.has(key)) dupes.push(key);
  seen.add(key);
});
if (dupes.length > 0) {
  console.log('WARNING - Duplicate entries:', dupes);
}

// Write back
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('File written successfully.');

import { useState, useEffect, useCallback, useRef } from "react";

const FAMILY_FAVOURITES = [
  "Pesto Pasta Salad", "Pizza", "Tacos", "Hamburgers", "Mexican Chicken",
  "Fish", "Fried Rice", "Fish and chips", "Pasta bake", "Ramen",
  "Healthy butter chicken", "Chicken parmigiana", "Cannelloni", "Bolognese",
  "Lemongrass pork noodle salad", "Roast chicken", "Turmeric chicken",
  "Chili", "Gnocchi", "Feijao", "Italian rice", "Breakfast for dinner",
  "Beef bowls", "Beans and rice", "Soba noodle salad"
];

const RECIPE_LINKS = {
  "Spaghetti Bolognese": [
    { label: "RecipeTin Eats", url: "https://www.recipetineats.com/spaghetti-bolognese/" },
    { label: "My Kids Lick the Bowl", url: "https://mykidslickthebowl.com/spaghetti-bolognese/" }
  ],
  "Roast Chicken, Potatoes & Greens": [
    { label: "RecipeTin Eats", url: "https://www.recipetineats.com/roast-chicken/" }
  ],
  "Leftover Chicken Fried Rice": [
    { label: "Kitchen Sanctuary", url: "https://www.kitchensanctuary.com/chicken-fried-rice/" }
  ],
  "Healthy Butter Chicken & Rice": [
    { label: "Kids Eat by Shanai", url: "https://kidseatbyshanai.com/healthy-butter-chicken/" }
  ],
  "Asian Glazed Salmon with Greens": [
    { label: "RecipeTin Eats", url: "https://www.recipetineats.com/asian-glazed-salmon/" }
  ],
  "Taco Night": [
    { label: "RecipeTin Eats", url: "https://www.recipetineats.com/ground-beef-tacos/" }
  ]
};

const DEFAULT_MEALS = [
  { day: "Saturday", short: "Sat", emoji: "🍝", title: "Spaghetti Bolognese", tags: ["Kid favourite", "30 min", "Freezer friendly"], desc: "A classic Aussie spag bol — rich beef mince sauce with hidden grated veggies (carrot, zucchini), simmered in tomato. Make a double batch and freeze half. Serve with parmesan and garlic bread.", locked: false, type: "flexible" },
  { day: "Sunday", short: "Sun", emoji: "🍗", title: "Roast Chicken, Potatoes & Greens", tags: ["Family tradition", "1.5 hrs"], desc: "Your Sunday classic — whole roast chicken with crispy potatoes and steamed broccoli. Save all leftover chicken and cook extra rice for tomorrow's fried rice.", locked: true, type: "fixed" },
  { day: "Monday", short: "Mon", emoji: "🍳", title: "Leftover Chicken Fried Rice", tags: ["Uses leftovers", "Kids can help", "15 min"], desc: "Perfect for your 6-year-old to help! Use last night's leftover roast chicken and cold rice. Kids crack eggs, stir the wok, add frozen peas and corn. Soy sauce and sesame oil to finish.", locked: true, type: "leftover" },
  { day: "Tuesday", short: "Tue", emoji: "🍛", title: "Healthy Butter Chicken & Rice", tags: ["Kid favourite", "30 min", "Freezer friendly"], desc: "A mild, creamy butter chicken using Greek yoghurt instead of heavy cream. Serve with basmati rice and a side of cucumber and yoghurt. Leave out the chilli for the kids.", locked: false, type: "flexible" },
  { day: "Wednesday", short: "Wed", emoji: "🐟", title: "Asian Glazed Salmon with Greens", tags: ["Omega-3 rich", "15 min"], desc: "Quick-glazed salmon with soy, oyster sauce, sweet chilli and ginger. Serve with jasmine rice and stir-fried bok choy or broccolini. Swap salmon for barramundi if preferred.", locked: true, type: "fish" },
  { day: "Thursday", short: "Thu", emoji: "🌮", title: "Taco Night", tags: ["Kids can build", "20 min"], desc: "Seasoned beef mince with cumin, paprika, garlic and black beans. Set out bowls of fillings and let everyone build their own tacos. Kids love the DIY element.", locked: false, type: "flexible" },
  { day: "Friday", short: "Fri", emoji: "🍽️", title: "Friday Night Out", tags: ["Night off!"], desc: "Enjoy a family dinner out! If plans change: pizza night, breakfast for dinner, or fish and chips from the local.", locked: true, type: "out" }
];

const EMOJI_MAP = {
  "Bolognese": "🍝", "Spaghetti Bolognese": "🍝", "Pasta bake": "🍝", "Cannelloni": "🍝",
  "Pesto Pasta Salad": "🥗", "Soba noodle salad": "🥗", "Lemongrass pork noodle salad": "🥗",
  "Pizza": "🍕", "Tacos": "🌮", "Taco Night": "🌮", "Hamburgers": "🍔",
  "Mexican Chicken": "🌶️", "Chili": "🌶️", "Fish": "🐟", "Fish and chips": "🐟",
  "Fried Rice": "🍳", "Italian rice": "🍚", "Beans and rice": "🍚", "Ramen": "🍜",
  "Healthy butter chicken": "🍛", "Turmeric chicken": "🍛",
  "Chicken parmigiana": "🍗", "Roast chicken": "🍗",
  "Gnocchi": "🥟", "Feijao": "🫘", "Breakfast for dinner": "🥞", "Beef bowls": "🥩",
};

function getEmoji(title) {
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "🍽️";
}

async function getAISuggestion(currentMeal, dayName, constraints) {
  try {
    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMeal, dayName, constraints }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("AI suggestion error:", err);
    return null;
  }
}

function generateShoppingList(meals) {
  const base = {
    "Meat & Seafood": [], "Fresh Vegetables": [], "Fresh Basics": [],
    "Dairy & Fridge": [], "Frozen": [], "Pantry — Grains & Pasta": [],
    "Pantry — Tins & Sauces": [], "Pantry — Spices": []
  };
  const icons = {
    "Meat & Seafood": "🥩", "Fresh Vegetables": "🥬", "Fresh Basics": "🍋",
    "Dairy & Fridge": "🧀", "Frozen": "🧊", "Pantry — Grains & Pasta": "🍚",
    "Pantry — Tins & Sauces": "🥫", "Pantry — Spices": "🧂"
  };
  base["Meat & Seafood"].push("1 whole chicken (~1.8 kg, free-range)");
  base["Fresh Vegetables"].push("2 kg potatoes (roasting)", "1 head broccoli");
  base["Fresh Basics"].push("2 lemons", "1 bulb garlic", "6 eggs (free-range)", "250g butter");
  base["Dairy & Fridge"].push("Small wedge parmesan");
  base["Pantry — Grains & Pasta"].push("1 kg jasmine rice");
  meals.forEach(m => {
    const t = m.title.toLowerCase();
    if (t.includes("bolognese")) { base["Meat & Seafood"].push("500g beef mince"); base["Fresh Vegetables"].push("2 carrots", "2 zucchini", "2 brown onions"); base["Pantry — Grains & Pasta"].push("500g spaghetti", "1 loaf garlic bread"); base["Pantry — Tins & Sauces"].push("2×400g tinned crushed tomatoes", "Tomato paste", "Worcestershire sauce"); base["Pantry — Spices"].push("Beef stock cube"); }
    if (t.includes("butter chicken")) { base["Meat & Seafood"].push("500g chicken thigh or breast"); base["Fresh Basics"].push("1 knob fresh ginger"); base["Dairy & Fridge"].push("200g Greek yoghurt", "300ml cream or coconut cream"); base["Fresh Vegetables"].push("1 Lebanese cucumber", "1 brown onion"); base["Pantry — Grains & Pasta"].push("500g basmati rice"); base["Pantry — Tins & Sauces"].push("Tomato paste"); base["Pantry — Spices"].push("Garam masala", "Ground cumin", "Ground turmeric", "Ground coriander"); }
    if (t.includes("salmon") || t.includes("fish")) { base["Meat & Seafood"].push("4 salmon or barramundi fillets (~150g each)"); base["Fresh Vegetables"].push("2 bunches bok choy", "1 bunch broccolini", "1 bunch spring onions"); base["Fresh Basics"].push("1 knob fresh ginger"); base["Pantry — Tins & Sauces"].push("Soy sauce", "Oyster sauce", "Sweet chilli sauce", "Sesame oil"); base["Pantry — Spices"].push("Sesame seeds"); }
    if (t.includes("taco")) { base["Meat & Seafood"].push("500g beef mince"); base["Fresh Vegetables"].push("1 cos lettuce", "2 tomatoes", "2 avocados", "1 brown onion"); base["Dairy & Fridge"].push("200g tasty cheese (grated)", "150g sour cream"); base["Pantry — Grains & Pasta"].push("8-pack taco shells or soft tortillas"); base["Pantry — Tins & Sauces"].push("400g tin black beans"); base["Pantry — Spices"].push("Smoked paprika", "Ground cumin"); }
    if (t.includes("fried rice")) { base["Frozen"].push("500g frozen peas", "250g frozen corn kernels"); base["Pantry — Tins & Sauces"].push("Soy sauce", "Sesame oil"); base["Fresh Vegetables"].push("1 bunch spring onions"); }
  });
  for (const cat in base) base[cat] = [...new Set(base[cat])];
  for (const cat in base) if (base[cat].length === 0) delete base[cat];
  if (!base["Pantry — Tins & Sauces"]) base["Pantry — Tins & Sauces"] = [];
  if (!base["Pantry — Tins & Sauces"].includes("Olive oil")) base["Pantry — Tins & Sauces"].push("Olive oil");
  if (!base["Pantry — Spices"]) base["Pantry — Spices"] = [];
  if (!base["Pantry — Spices"].includes("Salt & pepper")) base["Pantry — Spices"].push("Salt & pepper");
  return { list: base, icons };
}

function MealCard({ meal, index, onRegenerate, isRegenerating }) {
  const [open, setOpen] = useState(index === 0);
  const links = RECIPE_LINKS[meal.title] || [];
  const isWeekend = ["Sat", "Sun", "Fri"].includes(meal.short);
  return (
    <div style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(45,45,45,0.07)", animation: `slideUp 0.4s ease-out ${index * 0.06}s both` }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer", userSelect: "none" }}>
        <span style={{ background: isWeekend ? "#C4704B" : "#6B7F4E", color: "#fff", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 6, minWidth: 42, textAlign: "center" }}>{meal.short}</span>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", flex: 1 }}>{meal.title}</span>
        <span style={{ fontSize: "1.4rem" }}>{meal.emoji || getEmoji(meal.title)}</span>
        <span style={{ color: "#8C8578", fontSize: "1.1rem", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </div>
      <div style={{ maxHeight: open ? 600 : 0, overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {(meal.tags || []).map((tag, i) => {
              let bg = "#D4DFC7", color = "#6B7F4E";
              if (tag.includes("leftover") || tag.includes("Uses")) { bg = "#F2D9C7"; color = "#C4704B"; }
              if (tag.includes("Kid") || tag.includes("help") || tag.includes("build")) { bg = "#E8E0F5"; color = "#6B5B95"; }
              return <span key={i} style={{ display: "inline-block", background: bg, color, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{tag}</span>;
            })}
          </div>
          <p style={{ color: "#8C8578", fontSize: 14, margin: "12px 0", lineHeight: 1.7 }}>{meal.desc}</p>
          {links.length > 0 && <div style={{ marginBottom: 10 }}>{links.map((link, i) => <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#6B7F4E", fontWeight: 600, fontSize: 13, textDecoration: "none", marginRight: 16, marginTop: 4 }}>↗ {link.label}</a>)}</div>}
          {!meal.locked && meal.type !== "out" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={(e) => { e.stopPropagation(); onRegenerate(index, "favourite"); }} disabled={isRegenerating} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: isRegenerating ? "#ccc" : "#F2D9C7", color: isRegenerating ? "#999" : "#C4704B", border: "none", padding: "8px 14px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: isRegenerating ? "not-allowed" : "pointer" }}>🔀 Swap from favourites</button>
              <button onClick={(e) => { e.stopPropagation(); onRegenerate(index, "ai"); }} disabled={isRegenerating} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: isRegenerating ? "#ccc" : "#D4DFC7", color: isRegenerating ? "#999" : "#6B7F4E", border: "none", padding: "8px 14px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: isRegenerating ? "not-allowed" : "pointer" }}>{isRegenerating ? "✨ Thinking..." : "✨ Suggest something new"}</button>
            </div>
          )}
          {meal.locked && meal.type !== "out" && <div style={{ fontSize: 12, color: "#aaa", marginTop: 8, fontStyle: "italic" }}>🔒 Fixed — {meal.type === "leftover" ? "uses Sunday leftovers" : meal.type === "fish" ? "weekly fish night" : "family tradition"}</div>}
        </div>
      </div>
    </div>
  );
}

function ShoppingList({ meals }) {
  const [checked, setChecked] = useState({});
  const { list, icons } = generateShoppingList(meals);
  const toggle = (cat, idx) => { const key = `${cat}-${idx}`; setChecked(prev => ({ ...prev, [key]: !prev[key] })); };
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #F2D9C7 0%, #F5E0D0 100%)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 14, color: "#C4704B", lineHeight: 1.7 }}>
        <strong style={{ color: "#2D2D2D" }}>Shopping notes:</strong> This list auto-updates when you swap meals. Check your pantry first — you likely already have many staples.
      </div>
      {Object.entries(list).map(([category, items], catIdx) => (
        <div key={category} style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", marginBottom: 14, boxShadow: "0 2px 12px rgba(45,45,45,0.07)", animation: `slideUp 0.4s ease-out ${catIdx * 0.05}s both` }}>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>{icons[category] || "📦"} {category}</h3>
          {items.map((item, i) => {
            const key = `${category}-${i}`;
            const isChecked = checked[key];
            return (
              <div key={i} onClick={() => toggle(category, i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", userSelect: "none", borderBottom: i < items.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isChecked ? "#6B7F4E" : "#8C8578"}`, background: isChecked ? "#6B7F4E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 11, fontWeight: 700 }}>{isChecked && "✓"}</div>
                <span style={{ fontSize: 14, textDecoration: isChecked ? "line-through" : "none", color: isChecked ? "#8C8578" : "#2D2D2D", opacity: isChecked ? 0.5 : 1 }}>{item}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function MealPlanner() {
  const [meals, setMeals] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("gordon-meals-v1")); if (saved?.meals?.length === 7) return saved.meals; } catch (e) {}
    return DEFAULT_MEALS;
  });
  const [tab, setTab] = useState("meals");
  const [regeneratingIdx, setRegeneratingIdx] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("gordon-meals-v1", JSON.stringify({ meals, updatedAt: new Date().toISOString() })); } catch (e) {}
  }, [meals]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleRegenerate = useCallback(async (index, mode) => {
    const currentMeal = meals[index];
    if (mode === "favourite") {
      const currentTitles = meals.map(m => m.title.toLowerCase());
      const available = FAMILY_FAVOURITES.filter(f => !currentTitles.includes(f.toLowerCase()));
      if (available.length === 0) { showToast("No more favourites — try AI suggestion!"); return; }
      const pick = available[Math.floor(Math.random() * available.length)];
      setMeals(prev => prev.map((m, i) => i === index ? { ...currentMeal, title: pick, emoji: getEmoji(pick), desc: "From your family favourites list. A simple, kid-friendly dinner everyone enjoys.", tags: ["Family favourite", "From your list"] } : m));
      showToast(`Swapped to "${pick}"`);
    } else {
      setRegeneratingIdx(index);
      const constraints = currentMeal.type === "fish" ? "Must be a fish/seafood dish with Asian greens" : "Should be simple, healthy, and kid-friendly. Not fish/seafood (that's a different night).";
      const suggestion = await getAISuggestion(currentMeal.title, currentMeal.day, constraints);
      if (suggestion) {
        setMeals(prev => prev.map((m, i) => i === index ? { ...currentMeal, title: suggestion.title, desc: suggestion.desc, tags: suggestion.tags || ["AI suggestion"], emoji: suggestion.emoji || getEmoji(suggestion.title) } : m));
        showToast(`New suggestion: "${suggestion.title}"`);
      } else {
        showToast("Couldn't get a suggestion — try again or swap from favourites");
      }
      setRegeneratingIdx(null);
    }
  }, [meals, showToast]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg, #6B7F4E 0%, #4A5E33 100%)", color: "#fff", padding: "40px 24px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-50%", left: "-25%", width: "150%", height: "200%", background: "radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.2rem", fontWeight: 400, letterSpacing: "0.02em", marginBottom: 4 }}>Weekly Meal Plan</h1>
        <div style={{ fontSize: 14, opacity: 0.85 }}>Family of 4 · Saturday to Friday · Simple, healthy & kid-friendly</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", background: "#FBF7F2", borderBottom: "1px solid rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 10 }}>
        {["meals", "shopping"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: "14px 28px", fontWeight: 600, fontSize: 13, cursor: "pointer", borderBottom: `3px solid ${tab === t ? "#6B7F4E" : "transparent"}`, color: tab === t ? "#6B7F4E" : "#8C8578", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t === "meals" ? "Meal Plan" : "Shopping List"}</div>
        ))}
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        {tab === "meals" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #F2D9C7 0%, #F5E0D0 100%)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 14, color: "#C4704B", lineHeight: 1.7, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div><strong style={{ color: "#2D2D2D" }}>Your plan</strong> — tap any meal to expand. Swap unlocked meals from your favourites list or get fresh AI suggestions.</div>
              <button onClick={() => { setMeals(DEFAULT_MEALS); showToast("Reset to default plan"); }} style={{ background: "rgba(196,112,75,0.15)", color: "#C4704B", border: "none", padding: "6px 14px", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>↻ Reset</button>
            </div>
            {meals.map((meal, i) => <MealCard key={`${i}-${meal.title}`} meal={meal} index={i} onRegenerate={handleRegenerate} isRegenerating={regeneratingIdx === i} />)}
          </>
        )}
        {tab === "shopping" && <ShoppingList meals={meals} />}
      </div>
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#2D2D2D", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 100, animation: "toastIn 0.3s ease-out", maxWidth: "90vw", textAlign: "center" }}>{toast}</div>}
    </div>
  );
  }

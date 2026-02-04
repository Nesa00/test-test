[![Deploy static content to Pages](https://github.com/Nesa00/protein-calculator/actions/workflows/static.yml/badge.svg)](https://github.com/Nesa00/protein-calculator/actions/workflows/static.yml) 

# Protein Calculator

## App Layout Overview


```
-------------------------------------------------------------
|  Weight: [___] kg   Activity: [v]                          |
|  Daily Protein Requirement:  ___ g/day                     |
|  Total protein - consumed: ___ g/day   [status color]      |
-------------------------------------------------------------
|  Food List (search, select)   |  Selected Foods & Amount   |
|-------------------------------|----------------------------|
| [ ] Chicken breast   31g/100g | [✓] Chicken breast [___] g |
| [ ] Egg              13g/100g | [✓] Egg           [___] g  |
| [ ] ...              ...      | [✓] ...           [___] g  |
| ...                           |                            |
|                               | Total protein: ___ g       |
-------------------------------------------------------------
```

- **Top section:** Enter your weight and activity level. The app automatically calculates and displays your daily protein requirement and the total protein consumed.
- **Status color:** The total protein consumed is colored (red/yellow/green) based on how close you are to your daily requirement (Bootstrap badge: `bg-danger`, `bg-warning`, `bg-success`).
- **Left table:** Search and select foods (checkboxes). Shows protein per 100g. Selecting a food enables it in the right table.
- **Right table:** Shows only selected foods. Enter grams consumed for each. You can uncheck here to remove from both tables. Protein is calculated live and totalled.
- **Responsive:** On mobile, tables stack vertically; on desktop, they are side by side.
- **Bootstrap styling:** Cards, tables, badges, and form controls use Bootstrap for a modern look.

---

**Features:**
- Modern Bootstrap UI
- Live calculation of daily and consumed protein
- Searchable food list
- Responsive design
- Color-coded protein status (red/yellow/green)

---

**Example screenshot (visual representation):**

![Protein Calculator Layout Example](https://user-images.githubusercontent.com/your-screenshot-link.png)


// Load activity levels config from JSON file
let activityLevelsConfig = null;
let config = {};

async function loadActivityLevelsConfig() {
    try {
        const resp = await fetch('activity-level-config.json');
        if (!resp.ok) throw new Error('Failed to load activity-level-config.json');
        const arr = await resp.json();
        activityLevelsConfig = arr;
        config = {};
        arr.forEach(lvl => {
            config[lvl.key || lvl.label.toLowerCase().replace(/[^a-z0-9]/g, '')] = parseFloat(lvl.value);
        });
    } catch (e) {
        activityLevelsConfig = [
            { value: '0.8', label: 'Sedentary', key: 'sedentary' },
            { value: '1.2', label: 'Active', key: 'active' },
            { value: '1.6', label: 'Athlete', key: 'athlete' }
        ];
        config = {};
        activityLevelsConfig.forEach(lvl => {
            config[lvl.key || lvl.label.toLowerCase().replace(/[^a-z0-9]/g, '')] = parseFloat(lvl.value);
        });
    }
}

function saveToLocalStorage(weight, activity, result) {
    localStorage.setItem('proteinData', JSON.stringify({ weight, activity, result }));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('proteinData');
    return data ? JSON.parse(data) : null;
}

function saveFoodDataToLocalStorage(foodData) {
    localStorage.setItem('foodProteinData', JSON.stringify(foodData));
}

function loadFoodDataFromLocalStorage() {
    const data = localStorage.getItem('foodProteinData');
    return data ? JSON.parse(data) : null;
}

// --- Refactored: script2.js logic, but loads config from JSON ---
let foodList = [];
let activityLevels = [];
let selectedFoods = [];

async function loadConfigs() {
    // Load foods
    const foodResp = await fetch('food-config.json');
    const foodObj = await foodResp.json();
    foodList = Object.entries(foodObj).map(([name, obj]) => ({
        name,
        proteins: parseFloat(obj.proteins),
        carbohydrates: parseFloat(obj.carbohydrates),
        fats: parseFloat(obj.fats),
        amount: parseFloat(obj.amount),
        unit: obj.unit
    }));
    // Load activity levels
    const actResp = await fetch('activity-level-config.json');
    activityLevels = await actResp.json();
}

function saveToLocalStorage() {
    localStorage.setItem('protein_selectedFoods', JSON.stringify(selectedFoods));
    const weightInput = document.getElementById('weight');
    if (weightInput) localStorage.setItem('protein_weight', weightInput.value);
    const activitySel = document.getElementById('activity');
    if (activitySel) localStorage.setItem('protein_activity', activitySel.value);
}

function loadFromLocalStorage() {
    // Foods
    const foods = localStorage.getItem('protein_selectedFoods');
    if (foods) {
        try { selectedFoods = JSON.parse(foods); } catch {}
    }
    // Weight
    const weightInput = document.getElementById('weight');
    const w = localStorage.getItem('protein_weight');
    if (weightInput && w !== null) weightInput.value = w;
    // Activity
    const activitySel = document.getElementById('activity');
    const a = localStorage.getItem('protein_activity');
    if (activitySel && a !== null) activitySel.value = a;
}

function renderActivityDropdownAndList() {
    const activitySel = document.getElementById('activity');
    if (activitySel) {
        activitySel.innerHTML = '';
        activityLevels.forEach((lvl, i) => {
            const opt = document.createElement('option');
            opt.value = lvl.value;
            opt.textContent = lvl.label;
            activitySel.appendChild(opt);
        });
    }
    const listContainer = document.getElementById('activity-list-container');
    if (listContainer) {
        let ul = document.createElement('ul');
        ul.className = 'list-group list-group-flush mt-1';
        ul.style.fontSize = '0.78em';
        ul.style.maxWidth = '220px';
        ul.style.lineHeight = '1.1';
        activityLevels.forEach(lvl => {
            const li = document.createElement('li');
            li.className = 'list-group-item px-1 py-0 border-0';
            li.innerHTML = `<b>${lvl.label}</b>: ${lvl.description || lvl.desc || ''} ${lvl.value ? `(×${lvl.value}g/kg)` : ''}`;
            ul.appendChild(li);
        });
        listContainer.innerHTML = '';
        listContainer.appendChild(ul);
    }
}

function getActivityMultiplier() {
    const activitySel = document.getElementById('activity');
    if (!activitySel) return 0.8;
    return parseFloat(activitySel.value) || 0.8;
}

function getWeight() {
    const weightInput = document.getElementById('weight');
    if (!weightInput) return 70;
    const val = parseFloat(weightInput.value);
    return isNaN(val) ? 70 : val;
}

function calculateRequiredProtein() {
    const weight = getWeight();
    const factor = getActivityMultiplier();
    return (weight * factor).toFixed(2);
}

function updateRequiredProteinLabel() {
    const reqLabel = document.getElementById('required-protein-badge');
    if (reqLabel) {
        reqLabel.textContent = calculateRequiredProtein() + ' g/day';
    }
}

function populateFoodList() {
    const tbody = document.querySelector('#foodTable2 tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    // Get filter value
    const searchInput = document.getElementById('foodSearch2');
    const filter = searchInput ? searchInput.value.trim().toLowerCase() : '';
    foodList.forEach((food, i) => {
        if (!filter || food.name.toLowerCase().includes(filter)) {
            const isSelected = selectedFoods.some(f => f.name === food.name);
            const tr = document.createElement('tr');
            tr.className = isSelected ? 'table-primary food-row' : 'food-row';
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td>${food.name}</td>
                <td>${food.proteins}</td>
                <td>${food.carbohydrates}</td>
                <td>${food.fats}</td>
            `;
            tr.addEventListener('click', function() {
                const alreadySelected = selectedFoods.some(f => f.name === food.name);
                if (!alreadySelected) {
                    selectedFoods.push({
                        name: food.name,
                        consumed: food.amount,
                        proteins: ((food.proteins * food.amount) / 100).toFixed(2),
                        carbohydrates: ((food.carbohydrates * food.amount) / 100).toFixed(2),
                        fats: ((food.fats * food.amount) / 100).toFixed(2),
                        unit: food.unit
                    });
                } else {
                    selectedFoods = selectedFoods.filter(f => f.name !== food.name);
                }
                saveToLocalStorage();
                populateFoodList();
                populateSelectedFoods();
            });
            tbody.appendChild(tr);
        }
    });
}

function populateSelectedFoods() {
    const tbody = document.querySelector('#selectedFoodsTable2 tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let totalProteins = 0, totalCarbs = 0, totalFats = 0;
    selectedFoods.forEach((food, i) => {
        totalProteins += parseFloat(food.proteins) || 0;
        totalCarbs += parseFloat(food.carbohydrates) || 0;
        totalFats += parseFloat(food.fats) || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${food.name}</td>
            <td><input type="number" class="form-control form-control-sm" value="${food.consumed}" data-index="${i}"></td>
            <td class="selected-proteins">${food.proteins}</td>
            <td class="selected-carbohydrates">${food.carbohydrates}</td>
            <td class="selected-fats">${food.fats}</td>
            <td><button type="button" class="btn btn-sm btn-outline-danger" data-index="${i}">✕</button></td>
        `;
        tbody.appendChild(tr);
    });
    // Add event listeners for remove buttons
    tbody.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-index'));
            selectedFoods.splice(idx, 1);
            saveToLocalStorage();
            populateFoodList();
            populateSelectedFoods();
        });
    });
    // Add event listeners for consumed input
    tbody.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            const idx = parseInt(this.getAttribute('data-index'));
            let val = parseFloat(this.value);
            if (isNaN(val) || val < 0) val = 0;
            selectedFoods[idx].consumed = val;
            // Update values
            const baseFood = foodList.find(f => f.name === selectedFoods[idx].name);
            selectedFoods[idx].proteins = ((val * baseFood.proteins) / 100).toFixed(2);
            selectedFoods[idx].carbohydrates = ((val * baseFood.carbohydrates) / 100).toFixed(2);
            selectedFoods[idx].fats = ((val * baseFood.fats) / 100).toFixed(2);
            // Update cells
            this.closest('tr').querySelector('.selected-proteins').textContent = selectedFoods[idx].proteins;
            this.closest('tr').querySelector('.selected-carbohydrates').textContent = selectedFoods[idx].carbohydrates;
            this.closest('tr').querySelector('.selected-fats').textContent = selectedFoods[idx].fats;
            // Update totals
            let totalProteins = 0, totalCarbs = 0, totalFats = 0;
            selectedFoods.forEach(f => {
                totalProteins += parseFloat(f.proteins) || 0;
                totalCarbs += parseFloat(f.carbohydrates) || 0;
                totalFats += parseFloat(f.fats) || 0;
            });
            const totalProteinSpan = document.querySelector('.mt-3.fw-bold.text-end .text-success');
            if (totalProteinSpan) {
                totalProteinSpan.textContent = totalProteins.toFixed(2) + ' g';
            }
            // Update consumed protein label in summary card (top) and badge color
            const consumedBadge = document.getElementById('consumed-protein-badge');
            const requiredBadge = document.getElementById('required-protein-badge');
            let requiredProteinValue = 0;
            if (requiredBadge) {
                const match = requiredBadge.textContent.match(/([\d.]+)/);
                if (match) requiredProteinValue = parseFloat(match[1]);
            }
            if (consumedBadge) {
                consumedBadge.textContent = totalProteins.toFixed(2) + ' g/day';
                if (totalProteins >= requiredProteinValue && requiredProteinValue > 0) {
                    consumedBadge.classList.remove('bg-warning');
                    consumedBadge.classList.add('bg-success');
                } else {
                    consumedBadge.classList.remove('bg-success');
                    consumedBadge.classList.add('bg-warning');
                }
            }
            saveToLocalStorage();
        });
    });
    // Update total protein display (bottom)
    const totalProteinSpan = document.querySelector('.mt-3.fw-bold.text-end .text-success');
    if (totalProteinSpan) {
        totalProteinSpan.textContent = totalProteins.toFixed(2) + ' g';
    }
    // Update consumed protein label in summary card (top) and badge color
    const consumedBadge = document.getElementById('consumed-protein-badge');
    const requiredBadge = document.getElementById('required-protein-badge');
    let requiredProteinValue = 0;
    if (requiredBadge) {
        const match = requiredBadge.textContent.match(/([\d.]+)/);
        if (match) requiredProteinValue = parseFloat(match[1]);
    }
    if (consumedBadge) {
        consumedBadge.textContent = totalProteins.toFixed(2) + ' g/day';
        if (totalProteins >= requiredProteinValue && requiredProteinValue > 0) {
            consumedBadge.classList.remove('bg-warning');
            consumedBadge.classList.add('bg-success');
        } else {
            consumedBadge.classList.remove('bg-success');
            consumedBadge.classList.add('bg-warning');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfigs();
    renderActivityDropdownAndList();
    loadFromLocalStorage();
    populateFoodList();
    // Add search-as-you-type for food
    const searchInput = document.getElementById('foodSearch2');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            populateFoodList();
        });
    }
    updateRequiredProteinLabel();
    populateSelectedFoods();
    // Update required protein and save to localStorage when weight or activity changes
    const weightInput = document.getElementById('weight');
    const activitySel = document.getElementById('activity');
    if (weightInput) weightInput.addEventListener('input', function() {
        updateRequiredProteinLabel();
        populateSelectedFoods();
        saveToLocalStorage();
    });
    if (activitySel) activitySel.addEventListener('change', function() {
        updateRequiredProteinLabel();
        populateSelectedFoods();
        saveToLocalStorage();
    });
});
                    renderSelectedFoods(foodData);

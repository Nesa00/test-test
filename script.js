// Protein calculator logic and local storage
const config = {
    sedentary: 0.8,
    active: 1.2,
    athlete: 1.6
};

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

// Load food data from protein_config.json (only first time)
async function fetchAndStoreFoodData() {
    let foodData = loadFoodDataFromLocalStorage();
    if (!foodData) {
        try {
            const response = await fetch('protein_config.json');
            foodData = await response.json();
            saveFoodDataToLocalStorage(foodData);
        } catch (e) {
            foodData = {};
        }
    }
    return foodData;
}

let selectedFoods = {};
function renderFoodTable(foodData, filter = '') {
    const tbody = document.querySelector('#foodTable tbody');
    tbody.innerHTML = '';
    const foods = Object.entries(foodData)
        .filter(([name]) => name.toLowerCase().includes(filter.toLowerCase()));
    foods.forEach(([name, protein]) => {
        const row = document.createElement('tr');
        const checked = selectedFoods[name]?.checked ? 'checked' : '';
        row.innerHTML = `
            <td><input type="checkbox" class="food-check" data-food="${name}" ${checked}></td>
            <td>${name}</td>
            <td>${protein}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderSelectedFoods(foodData) {
    const container = document.getElementById('selectedFoodsList');
    container.innerHTML = '';
    const selected = Object.entries(selectedFoods).filter(([_, v]) => v.checked);
    if (selected.length === 0) {
        container.innerHTML = '<div class="text-muted">No foods selected.</div>';
        return;
    }
    let totalProtein = 0;
    const table = document.createElement('table');
    table.className = 'table table-sm table-bordered align-middle';
    table.innerHTML = `<thead><tr><th>Food</th><th>Consumed (g)</th><th>Protein (g)</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    selected.forEach(([name, {consumed}]) => {
        const proteinPer100g = foodData[name];
        const grams = parseFloat(consumed) || '';
        const protein = grams ? ((proteinPer100g * grams) / 100).toFixed(2) : '0.00';
        if (grams) totalProtein += parseFloat(protein);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${name}</td>
            <td><input type="number" class="form-control form-control-sm selected-amount" data-food="${name}" min="0" placeholder="g" value="${grams}"></td>
            <td class="selected-protein">${protein}</td>
        `;
        tbody.appendChild(tr);
    });
    container.appendChild(table);
    const total = document.createElement('div');
    total.className = 'mt-3 fw-bold text-end';
    total.innerHTML = `Total protein: <span class="text-success" id="totalProteinAmount">${totalProtein.toFixed(2)} g</span>`;
    container.appendChild(total);
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('proteinForm');
    const resultDiv = document.getElementById('result');
    const weightInput = document.getElementById('weight');
    const activitySelect = document.getElementById('activity');
    const foodSearch = document.getElementById('foodSearch');

    // Load previous data
    const saved = loadFromLocalStorage();
    if (saved) {
        weightInput.value = saved.weight;
        activitySelect.value = saved.activity;
        resultDiv.textContent = `Recommended protein intake: ${saved.result} g/day`;
    }

    function updateSummary() {
        const weight = parseFloat(weightInput.value) || '';
        const activity = activitySelect.value;
        let protein = '';
        if (weight && config[activity]) {
            protein = (weight * config[activity]).toFixed(1);
        }
        let summary = '';
        summary += `<div><strong>Weight:</strong> ${weight ? weight + ' kg' : '-'}</div>`;
        summary += `<div><strong>Activity:</strong> ${activity.charAt(0).toUpperCase() + activity.slice(1)}</div>`;
        summary += `<div><strong>Daily Protein Requirement:</strong> <span class="text-primary">${protein ? protein + ' g/day' : '-'}</span></div>`;
        resultDiv.innerHTML = summary;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateSummary();
        // Save to localStorage
        const weight = parseFloat(weightInput.value);
        const activity = activitySelect.value;
        const protein = (weight && config[activity]) ? (weight * config[activity]).toFixed(1) : '';
        saveToLocalStorage(weight, activity, protein);
    });

    weightInput.addEventListener('input', updateSummary);
    activitySelect.addEventListener('change', updateSummary);

    // Food list logic
    const foodData = await fetchAndStoreFoodData();
    renderFoodTable(foodData);
    renderSelectedFoods(foodData);

    foodSearch.addEventListener('input', function() {
        renderFoodTable(foodData, foodSearch.value);
        attachFoodTableEvents(foodData);
    });

    function attachFoodTableEvents(foodData) {
        document.querySelectorAll('.food-check').forEach(cb => {
            cb.addEventListener('change', function() {
                const food = this.getAttribute('data-food');
                if (!selectedFoods[food]) selectedFoods[food] = {checked: false, consumed: ''};
                selectedFoods[food].checked = this.checked;
                if (!this.checked) selectedFoods[food].consumed = '';
                renderFoodTable(foodData, foodSearch.value);
                attachFoodTableEvents(foodData);
                renderSelectedFoods(foodData);
                attachSelectedFoodsEvents(foodData);
            });
        });
    }

    function attachSelectedFoodsEvents(foodData) {
        document.querySelectorAll('.selected-amount').forEach(inp => {
            inp.addEventListener('input', function() {
                const food = this.getAttribute('data-food');
                if (!selectedFoods[food]) selectedFoods[food] = {checked: true, consumed: ''};
                selectedFoods[food].consumed = parseFloat(this.value) || '';
                // Only update the protein cell and total, not the whole table
                const proteinPer100g = foodData[food];
                const grams = parseFloat(this.value) || 0;
                const protein = grams ? ((proteinPer100g * grams) / 100).toFixed(2) : '0.00';
                // Update protein cell
                const proteinCell = this.parentElement.nextElementSibling;
                if (proteinCell) proteinCell.textContent = protein;
                // Update total
                let totalProtein = 0;
                Object.entries(selectedFoods).forEach(([name, {checked, consumed}]) => {
                    if (checked && consumed) {
                        totalProtein += (foodData[name] * consumed) / 100;
                    }
                });
                const totalEl = document.getElementById('totalProteinAmount');
                if (totalEl) totalEl.textContent = totalProtein.toFixed(2) + ' g';
            });
        });
    }

    // Initial attach
    attachFoodTableEvents(foodData);
    renderSelectedFoods(foodData);
    attachSelectedFoodsEvents(foodData);
    updateSummary();
});

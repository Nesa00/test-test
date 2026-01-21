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
        const checked = selectedFoods[name] ? 'checked' : '';
        const consumed = selectedFoods[name]?.consumed || '';
        row.innerHTML = `
            <td><input type="checkbox" class="food-check" data-food="${name}" ${checked}></td>
            <td>${name}</td>
            <td>${protein}</td>
            <td><input type="number" class="form-control form-control-sm food-amount" data-food="${name}" min="0" placeholder="g" value="${consumed}" ${checked ? '' : 'disabled'}></td>
        `;
        tbody.appendChild(row);
    });
}

function renderSelectedFoods(foodData) {
    const container = document.getElementById('selectedFoodsList');
    container.innerHTML = '';
    const selected = Object.entries(selectedFoods).filter(([_, v]) => v.checked && v.consumed > 0);
    if (selected.length === 0) {
        container.innerHTML = '<div class="text-muted">No foods selected.</div>';
        return;
    }
    let totalProtein = 0;
    const list = document.createElement('ul');
    list.className = 'list-group';
    selected.forEach(([name, {consumed}]) => {
        const proteinPer100g = foodData[name];
        const protein = ((proteinPer100g * consumed) / 100).toFixed(2);
        totalProtein += parseFloat(protein);
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `<span>${name} (${consumed}g)</span><span class="badge bg-primary">${protein}g</span>`;
        list.appendChild(li);
    });
    container.appendChild(list);
    const total = document.createElement('div');
    total.className = 'mt-3 fw-bold text-end';
    total.innerHTML = `Total protein: <span class="text-success">${totalProtein.toFixed(2)} g</span>`;
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

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const weight = parseFloat(weightInput.value);
        const activity = activitySelect.value;
        const protein = (weight * config[activity]).toFixed(1);
        resultDiv.textContent = `Recommended protein intake: ${protein} g/day`;
        saveToLocalStorage(weight, activity, protein);
    });

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
                // Enable/disable input
                const input = document.querySelector(`.food-amount[data-food="${food}"]`);
                if (input) input.disabled = !this.checked;
                renderSelectedFoods(foodData);
            });
        });
        document.querySelectorAll('.food-amount').forEach(inp => {
            inp.addEventListener('input', function() {
                const food = this.getAttribute('data-food');
                if (!selectedFoods[food]) selectedFoods[food] = {checked: false, consumed: ''};
                selectedFoods[food].consumed = parseFloat(this.value) || '';
                renderSelectedFoods(foodData);
            });
        });
    }

    // Initial attach
    attachFoodTableEvents(foodData);
});

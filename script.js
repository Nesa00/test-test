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

function renderFoodTable(foodData, filter = '') {
    const tbody = document.querySelector('#foodTable tbody');
    tbody.innerHTML = '';
    const foods = Object.entries(foodData)
        .filter(([name]) => name.toLowerCase().includes(filter.toLowerCase()));
    foods.forEach(([name, protein]) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${name}</td><td>${protein}</td>`;
        tbody.appendChild(row);
    });
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

    foodSearch.addEventListener('input', function() {
        renderFoodTable(foodData, foodSearch.value);
    });
});

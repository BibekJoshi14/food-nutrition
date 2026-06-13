// ============================================
// NUTRISCAN AI — Frontend Logic
// ============================================

const BACKEND_URL = 'https://food-nutrition-production.up.railway.app';
// Daily goals
const DAILY_GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65
};


let currentAnalysis = null;
let mealLog = JSON.parse(localStorage.getItem('mealLog')) || [];
let dailyTotals = JSON.parse(localStorage.getItem('dailyTotals')) || {
  calories: 0, protein: 0, carbs: 0, fat: 0
};
let macroChart = null;


function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('foodPreview').src = e.target.result;
    document.getElementById('uploadBox').classList.add('hidden');
    document.getElementById('previewBox').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}


const uploadBox = document.getElementById('uploadBox');

uploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadBox.style.borderColor = '#68d391';
});

uploadBox.addEventListener('dragleave', () => {
  uploadBox.style.borderColor = '#2d3748';
});

uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadBox.style.borderColor = '#2d3748';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('foodPreview').src = ev.target.result;
      document.getElementById('uploadBox').classList.add('hidden');
      document.getElementById('previewBox').classList.remove('hidden');
      document.getElementById('results').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
});

// Clear image
function clearImage() {
  document.getElementById('foodPreview').src = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('uploadBox').classList.remove('hidden');
  document.getElementById('previewBox').classList.add('hidden');
  document.getElementById('results').classList.add('hidden');
  document.getElementById('loading').classList.add('hidden');
}

// ============================================
// ANALYZE FOOD
// ============================================
async function analyzeFood() {
  const preview = document.getElementById('foodPreview');
  if (!preview.src) {
    alert('Please upload a food image first.');
    return;
  }

  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  document.getElementById('analyzeBtn').disabled = true;

  try {
    // Convert image to base64
    const base64 = preview.src;

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    // Save current analysis
    currentAnalysis = data;

    // Render results
    renderResults(data);

  } catch (err) {
    alert('Analysis failed: ' + err.message);
    console.error(err);
  } finally {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('analyzeBtn').disabled = false;
  }
}

// ============================================
// RENDER RESULTS
// ============================================
function renderResults(data) {
  document.getElementById('results').classList.remove('hidden');

  // Meal info
  renderMealInfo(data.meal_info);

  // Foods list
  renderFoodsList(data.foods);

  // Nutrition grid
  renderNutritionGrid(data.total_nutrition);

  // Recommendations
  renderRecommendations(data.recommendations);

  // Macro chart
  renderMacroChart(data.total_nutrition);
}

// Meal info badges
function renderMealInfo(info) {
  const scoreColor = info.health_score >= 7 ? '#68d391'
    : info.health_score >= 4 ? '#f6ad55'
    : '#fc8181';

  document.getElementById('mealInfo').innerHTML = `
    <span class="meal-badge">🍽️ ${info.type.toUpperCase()}</span>
    <span class="meal-badge">🌍 ${info.cuisine}</span>
    <span class="health-score" style="background:${scoreColor}22;color:${scoreColor}">
      ❤️ Health Score: ${info.health_score}/10
    </span>
    <p style="width:100%;font-size:0.78rem;color:#718096;margin-top:4px">
      ${info.description}
    </p>
  `;
}

// Foods detected list
function renderFoodsList(foods) {
  document.getElementById('foodsList').innerHTML = foods.map(food => `
    <div class="food-item">
      <div>
        <span class="food-name">${food.name}</span>
        <div style="font-size:0.72rem;color:#4a5568;margin-top:2px">
          ${food.portion} ${food.quantity > 1 ? `× ${food.quantity}` : ''}
        </div>
      </div>
      <div style="text-align:right">
        <div class="food-cal">${food.nutrition.calories} kcal</div>
        <span class="food-conf">${food.confidence}% match</span>
      </div>
    </div>
  `).join('');
}

// Nutrition grid
function renderNutritionGrid(nutrition) {
  const items = [
    { label: 'Calories', value: nutrition.calories, unit: 'kcal', color: '#68d391' },
    { label: 'Protein', value: nutrition.protein, unit: 'g', color: '#63b3ed' },
    { label: 'Carbs', value: nutrition.carbs, unit: 'g', color: '#f6ad55' },
    { label: 'Fat', value: nutrition.fat, unit: 'g', color: '#fc8181' },
    { label: 'Fiber', value: nutrition.fiber, unit: 'g', color: '#b794f4' },
    { label: 'Sugar', value: nutrition.sugar, unit: 'g', color: '#f687b3' },
  ];

  document.getElementById('nutritionGrid').innerHTML = items.map(item => `
    <div class="nutrition-item">
      <div class="nutrition-value" style="color:${item.color}">
        ${Math.round(item.value)}${item.unit}
      </div>
      <div class="nutrition-label">${item.label}</div>
    </div>
  `).join('');
}

// Recommendations
function renderRecommendations(recs) {
  const icons = ['💡', '🥗', '🏃', '💊', '⚠️'];
  const list = recs.recommendations || [];

  document.getElementById('recommendationsList').innerHTML = `
    ${list.map((rec, i) => `
      <div class="rec-item">
        <span class="rec-icon">${icons[i] || '💡'}</span>
        <span>${rec}</span>
      </div>
    `).join('')}
    <div class="rec-item" style="margin-top:8px;padding-top:8px;border-top:1px solid #1a1d27">
      <span class="rec-icon">🏋️</span>
      <span>${recs.exercise_to_burn || 'Exercise data unavailable'}</span>
    </div>
    <div class="rec-item">
      <span class="rec-icon">⭐</span>
      <span>Overall Rating:
        <strong style="color:${
          recs.overall_rating === 'Excellent' ? '#68d391' :
          recs.overall_rating === 'Good' ? '#63b3ed' :
          recs.overall_rating === 'Fair' ? '#f6ad55' : '#fc8181'
        }">${recs.overall_rating}</strong>
      </span>
    </div>
  `;
}

// ============================================
// MACRO CHART
// ============================================
function renderMacroChart(nutrition) {
  const ctx = document.getElementById('macroChart').getContext('2d');

  if (macroChart) macroChart.destroy();

  macroChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{
        data: [
          nutrition.protein * 4,
          nutrition.carbs * 4,
          nutrition.fat * 9
        ],
        backgroundColor: [
          '#63b3ed',
          '#f6ad55',
          '#fc8181'
        ],
        borderColor: '#1a1d27',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a0aec0',
            font: { family: 'Inter', size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((context.parsed / total) * 100).toFixed(1);
              return ` ${context.label}: ${pct}% (${context.parsed} kcal)`;
            }
          }
        }
      }
    }
  });
}

// ============================================
// MEAL LOG
// ============================================
function addToMealLog() {
  if (!currentAnalysis) return;

  const entry = {
    id: Date.now(),
    foods: currentAnalysis.foods.map(f => f.name).join(', '),
    nutrition: currentAnalysis.total_nutrition,
    time: new Date().toLocaleTimeString(),
    meal_type: currentAnalysis.meal_info.type
  };

  mealLog.unshift(entry);
  localStorage.setItem('mealLog', JSON.stringify(mealLog));

  // Update daily totals
  dailyTotals.calories += currentAnalysis.total_nutrition.calories;
  dailyTotals.protein += currentAnalysis.total_nutrition.protein;
  dailyTotals.carbs += currentAnalysis.total_nutrition.carbs;
  dailyTotals.fat += currentAnalysis.total_nutrition.fat;
  localStorage.setItem('dailyTotals', JSON.stringify(dailyTotals));

  // Update UI
  renderMealLog();
  updateDailyProgress();

  alert('✅ Meal added to your log!');
}

function renderMealLog() {
  const log = document.getElementById('mealLog');

  if (mealLog.length === 0) {
    log.innerHTML = '<p class="empty">No meals logged yet. Analyze a food photo to start!</p>';
    return;
  }

  log.innerHTML = mealLog.map(entry => `
    <div class="log-item">
      <div>
        <div class="log-foods">${entry.foods}</div>
        <div class="log-time">🕐 ${entry.time} — ${entry.meal_type}</div>
      </div>
      <div class="log-cal">${Math.round(entry.nutrition.calories)} kcal</div>
    </div>
  `).join('');
}

function clearMealLog() {
  if (!confirm('Clear all meal logs?')) return;
  mealLog = [];
  dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  localStorage.removeItem('mealLog');
  localStorage.removeItem('dailyTotals');
  renderMealLog();
  updateDailyProgress();
}

// ============================================
// DAILY PROGRESS
// ============================================
function updateDailyProgress() {
  // Header
  document.getElementById('dailyCalories').textContent =
    Math.round(dailyTotals.calories);

  // Progress bars
  const calPct = Math.min((dailyTotals.calories / DAILY_GOALS.calories) * 100, 100);
  const protPct = Math.min((dailyTotals.protein / DAILY_GOALS.protein) * 100, 100);
  const carbPct = Math.min((dailyTotals.carbs / DAILY_GOALS.carbs) * 100, 100);
  const fatPct = Math.min((dailyTotals.fat / DAILY_GOALS.fat) * 100, 100);

  document.getElementById('calBar').style.width = calPct + '%';
  document.getElementById('protBar').style.width = protPct + '%';
  document.getElementById('carbBar').style.width = carbPct + '%';
  document.getElementById('fatBar').style.width = fatPct + '%';

  document.getElementById('calProgress').textContent =
    `${Math.round(dailyTotals.calories)} / ${DAILY_GOALS.calories} kcal`;
  document.getElementById('protProgress').textContent =
    `${Math.round(dailyTotals.protein)} / ${DAILY_GOALS.protein}g`;
  document.getElementById('carbProgress').textContent =
    `${Math.round(dailyTotals.carbs)} / ${DAILY_GOALS.carbs}g`;
  document.getElementById('fatProgress').textContent =
    `${Math.round(dailyTotals.fat)} / ${DAILY_GOALS.fat}g`;
}

// ============================================
// START
// ============================================
renderMealLog();
updateDailyProgress();
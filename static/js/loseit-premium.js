// Lose It Premium - High-Fidelity Desktop JavaScript

let currentUserId = null;
let currentDate = new Date().toISOString().split('T')[0];
let calorieDonutChart = null;
let weightSparklineChart = null;
let macroCircleChart = null;
let fastingInterval = null;
let searchTimeout = null;

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeDatePicker();
    initializeSmartSearch();
    initializeFastingTimer();
});

// Check authentication
async function checkAuthentication() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    if (!userId) {
        Toast.info('Please sign in to access Lose It');
        setTimeout(() => {
            window.location.href = '/auth';
        }, 1500);
        return;
    }
    
    currentUserId = userId;
    
    // Update sidebar username
    const sidebarUsername = document.getElementById('sidebarUsername');
    if (sidebarUsername) {
        sidebarUsername.textContent = username || 'Profile';
    }
    
    // Load initial data
    loadDayData();
}

// Get authentication headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-ID': currentUserId
    };
}

// Initialize date picker
function initializeDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = currentDate;
        datePicker.max = new Date().toISOString().split('T')[0];
    }
}

// Change date
function changeDate(days) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    currentDate = date.toISOString().split('T')[0];
    
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = currentDate;
    }
    
    loadDayData();
}

// Load day data
async function loadDayData() {
    await Promise.all([
        loadFoodLogs(),
        loadDailySummary(),
        loadWeightLogs()
    ]);
}

// Initialize smart search with AI prediction
function initializeSmartSearch() {
    const searchInput = document.getElementById('smartSearch');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            getSearchSuggestions(query);
        }, 300);
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// Get search suggestions (AI-powered)
async function getSearchSuggestions(query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    try {
        // Use food analyzer for AI suggestions
        const response = await fetch('/api/loseit/analyze-food', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                food_description: query,
                quantity_g: 100
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store analysis data in a way that can be passed to the function
            const analysisJson = JSON.stringify(data);
            const encodedAnalysis = encodeURIComponent(analysisJson);
            
            // Show suggestion
            suggestionsDiv.innerHTML = `
                <div class="search-suggestion-item" onclick="selectFoodSuggestionFromSearch('${escapeHtml(query)}', '${encodedAnalysis}')">
                    <div style="font-weight: 600;">${escapeHtml(query)}</div>
                    <div style="font-size: 0.85rem; color: var(--loseit-text-light);">
                        ${Math.round(data.calories || 0)} cal • ${Math.round(data.protein_g || 0)}g protein • ${Math.round(data.carbs_g || 0)}g carbs
                    </div>
                </div>
            `;
            suggestionsDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error getting suggestions:', error);
    }
}

// Select food suggestion from search (with encoded analysis)
function selectFoodSuggestionFromSearch(foodName, encodedAnalysis) {
    try {
        const analysisData = JSON.parse(decodeURIComponent(encodedAnalysis));
        selectFoodSuggestion(foodName, analysisData);
    } catch (e) {
        console.error('Error parsing analysis data:', e);
        // Fallback: just set the food name
        document.getElementById('smartSearch').value = foodName;
        document.getElementById('searchSuggestions').style.display = 'none';
        showFoodModal();
        document.getElementById('foodInput').value = foodName;
    }
}

// Select food suggestion
function selectFoodSuggestion(foodName, analysisData) {
    document.getElementById('smartSearch').value = foodName;
    document.getElementById('searchSuggestions').style.display = 'none';
    
    // Auto-fill and show modal
    const mealType = 'snack'; // Default, user can change
    showFoodModal(mealType);
    
    // Set food name and quantity
    const foodInput = document.getElementById('foodInput');
    const foodQuantity = document.getElementById('foodQuantity');
    
    if (foodInput) foodInput.value = foodName;
    
    // Store per-100g values for recalculation
    const per100g = {
        calories_per_100g: analysisData.calories_per_100g || 0,
        protein_per_100g: analysisData.protein_per_100g || 0,
        carbs_per_100g: analysisData.carbs_per_100g || 0,
        fats_per_100g: analysisData.fats_per_100g || 0,
        fiber_per_100g: analysisData.fiber_per_100g || 0
    };
    
    const quantity = Math.round(analysisData.quantity_g || 100);
    if (foodQuantity) {
        foodQuantity.value = quantity;
    }
    
    // Calculate values for the quantity
    const factor = quantity / 100.0;
    const calculatedData = {
        quantity_g: quantity,
        calories: Math.round((per100g.calories_per_100g || 0) * factor * 10) / 10,
        protein_g: Math.round((per100g.protein_per_100g || 0) * factor * 10) / 10,
        carbs_g: Math.round((per100g.carbs_per_100g || 0) * factor * 10) / 10,
        fats_g: Math.round((per100g.fats_per_100g || 0) * factor * 10) / 10,
        fiber_g: Math.round((per100g.fiber_per_100g || 0) * factor * 10) / 10,
        calories_per_100g: per100g.calories_per_100g,
        protein_per_100g: per100g.protein_per_100g,
        carbs_per_100g: per100g.carbs_per_100g,
        fats_per_100g: per100g.fats_per_100g,
        fiber_per_100g: per100g.fiber_per_100g
    };
    
    // Store analysis data and display it
    const analysisDiv = document.getElementById('foodAnalysis');
    if (analysisDiv && analysisData) {
        analysisDiv.dataset.analysis = JSON.stringify(calculatedData);
        analysisDiv.dataset.per100g = JSON.stringify(per100g);
        displayFoodAnalysis(calculatedData);
    }
}

// Load food logs and display in tables
async function loadFoodLogs() {
    try {
        const response = await fetch(`/api/loseit/food-logs?date=${currentDate}`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.logs) {
            displayFoodLogsInTables(data.logs);
        }
    } catch (error) {
        console.error('Error loading food logs:', error);
    }
}

// Display food logs in tables
function displayFoodLogsInTables(logs) {
    const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealTotals = {
        breakfast: { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0 },
        lunch: { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0 },
        dinner: { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0 },
        snack: { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0 }
    };
    
    meals.forEach(mealType => {
        const tbody = document.getElementById(`${mealType}Items`);
        const mealLogs = logs.filter(log => log.meal_type === mealType);
        
        if (!tbody) return;
        
        if (mealLogs.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No items logged yet</td></tr>';
        } else {
            tbody.innerHTML = mealLogs.map(log => {
                // Update totals
                mealTotals[mealType].calories += log.calories || 0;
                mealTotals[mealType].carbs += log.carbs_g || 0;
                mealTotals[mealType].fat += log.fats_g || 0;
                mealTotals[mealType].protein += log.protein_g || 0;
                mealTotals[mealType].sodium += 0; // Sodium not in current schema
                
                return `
                    <tr>
                        <td>${escapeHtml(log.food_name)}</td>
                        <td>-</td>
                        <td>${Math.round(log.calories || 0)}</td>
                        <td>${Math.round(log.carbs_g || 0)}g</td>
                        <td>${Math.round(log.fats_g || 0)}g</td>
                        <td>${Math.round(log.protein_g || 0)}g</td>
                        <td>-</td>
                        <td>
                            <button class="tool-btn" onclick="deleteFoodLog(${log.id})" style="padding: 0.25rem 0.5rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Update totals
            document.getElementById(`${mealType}Calories`).textContent = Math.round(mealTotals[mealType].calories);
            document.getElementById(`${mealType}Carbs`).textContent = Math.round(mealTotals[mealType].carbs) + 'g';
            document.getElementById(`${mealType}Fat`).textContent = Math.round(mealTotals[mealType].fat) + 'g';
            document.getElementById(`${mealType}Protein`).textContent = Math.round(mealTotals[mealType].protein) + 'g';
            document.getElementById(`${mealType}Sodium`).textContent = '-';
        }
    });
}

// Load daily summary and update charts
async function loadDailySummary() {
    try {
        const response = await fetch(`/api/loseit/daily-summary?date=${currentDate}`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.summary) {
            updateCalorieDonut(data.summary);
            updateMacroBars(data.summary);
            updateMacroCircle(data.summary);
            updateHydration(data.summary);
        }
    } catch (error) {
        console.error('Error loading daily summary:', error);
    }
}

// Update calorie donut chart
function updateCalorieDonut(summary) {
    const ctx = document.getElementById('calorieDonutChart');
    if (!ctx) return;
    
    const goal = summary.calorie_goal || 2000;
    const consumed = summary.calories || 0;
    const exercise = 0; // TODO: Add exercise calories
    const net = consumed - exercise;
    const remaining = Math.max(0, goal - net);
    
    // Update text
    document.getElementById('donutCalories').textContent = Math.round(consumed);
    document.getElementById('donutGoal').textContent = goal;
    document.getElementById('donutNet').textContent = `Net: ${Math.round(net)}`;
    
    if (calorieDonutChart) {
        calorieDonutChart.destroy();
    }
    
    calorieDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Consumed', 'Remaining'],
            datasets: [{
                data: [consumed, remaining],
                backgroundColor: [
                    '#FF9400',
                    '#E0E0E0'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

// Update macro progress bars
function updateMacroBars(summary) {
    const goals = {
        carbs: summary.carbs_goal || 0,
        fat: summary.fats_goal || 0,
        protein: summary.protein_goal || 0
    };
    
    const consumed = {
        carbs: summary.carbs_g || 0,
        fat: summary.fats_g || 0,
        protein: summary.protein_g || 0
    };
    
    // Carbs
    const carbsPercent = goals.carbs > 0 ? Math.min((consumed.carbs / goals.carbs) * 100, 100) : 0;
    document.getElementById('carbsValue').textContent = `${Math.round(consumed.carbs)}g / ${Math.round(goals.carbs)}g`;
    document.getElementById('carbsFill').style.width = carbsPercent + '%';
    
    // Fat
    const fatPercent = goals.fat > 0 ? Math.min((consumed.fat / goals.fat) * 100, 100) : 0;
    document.getElementById('fatValue').textContent = `${Math.round(consumed.fat)}g / ${Math.round(goals.fat)}g`;
    document.getElementById('fatFill').style.width = fatPercent + '%';
    
    // Protein
    const proteinPercent = goals.protein > 0 ? Math.min((consumed.protein / goals.protein) * 100, 100) : 0;
    document.getElementById('proteinValue').textContent = `${Math.round(consumed.protein)}g / ${Math.round(goals.protein)}g`;
    document.getElementById('proteinFill').style.width = proteinPercent + '%';
}

// Update macro circle chart
function updateMacroCircle(summary) {
    const ctx = document.getElementById('macroCircleChart');
    if (!ctx) return;
    
    const carbs = summary.carbs_g || 0;
    const fat = summary.fats_g || 0;
    const protein = summary.protein_g || 0;
    const total = carbs + fat + protein;
    
    // Update totals
    document.getElementById('macroTotal').textContent = Math.round(total) + 'g';
    document.getElementById('macroCarbsTotal').textContent = Math.round(carbs) + 'g';
    document.getElementById('macroFatTotal').textContent = Math.round(fat) + 'g';
    document.getElementById('macroProteinTotal').textContent = Math.round(protein) + 'g';
    
    if (macroCircleChart) {
        macroCircleChart.destroy();
    }
    
    if (total === 0) {
        // Show empty state
        return;
    }
    
    macroCircleChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Carbs', 'Fat', 'Protein'],
            datasets: [{
                data: [carbs, fat, protein],
                backgroundColor: [
                    '#4A90E2',  // Blue for carbs
                    '#FF9400',  // Orange for fat
                    '#27AE60'   // Green for protein
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${Math.round(value)}g (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update hydration
function updateHydration(summary) {
    const water = summary.water_ml || 0;
    const goal = 2000;
    const percent = Math.min((water / goal) * 100, 100);
    
    document.getElementById('hydrationFill').style.height = percent + '%';
    document.getElementById('waterTotal').textContent = water;
    document.getElementById('waterGoal').textContent = goal;
}

// Initialize fasting timer
function initializeFastingTimer() {
    // 16:8 fasting plan - 16 hours fasting, 8 hours eating
    // For demo, start at 16:00 remaining
    let remainingMinutes = 16 * 60; // 16 hours in minutes
    
    const updateFasting = () => {
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        document.getElementById('fastingTime').textContent = timeString;
        
        // Update progress circle (16 hours = 960 minutes)
        const totalMinutes = 16 * 60;
        const progress = (remainingMinutes / totalMinutes) * 100;
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = document.getElementById('fastingProgress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
        }
        
        if (remainingMinutes > 0) {
            remainingMinutes--;
        } else {
            clearInterval(fastingInterval);
        }
    };
    
    updateFasting();
    fastingInterval = setInterval(updateFasting, 60000); // Update every minute
}

// Load weight logs and create sparkline
async function loadWeightLogs() {
    try {
        const response = await fetch('/api/loseit/weight-logs?limit=7', {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.logs) {
            createWeightSparkline(data.logs.reverse()); // Oldest first
            
            if (data.logs.length > 0) {
                const latest = data.logs[data.logs.length - 1];
                document.getElementById('currentWeight').textContent = `${latest.weight_kg.toFixed(1)} kg`;
                
                if (data.logs.length > 1) {
                    const change = latest.weight_kg - data.logs[0].weight_kg;
                    const changeEl = document.getElementById('weightChange');
                    changeEl.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`;
                    changeEl.style.color = change < 0 ? 'var(--loseit-green)' : 'var(--loseit-red)';
                }
            }
        }
    } catch (error) {
        console.error('Error loading weight logs:', error);
    }
}

// Create weight sparkline chart
function createWeightSparkline(logs) {
    const ctx = document.getElementById('weightSparkline');
    if (!ctx) return;
    
    if (weightSparklineChart) {
        weightSparklineChart.destroy();
    }
    
    const labels = logs.map((log, i) => i + 1);
    const weights = logs.map(log => log.weight_kg);
    
    weightSparklineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: weights,
                borderColor: '#FF9400',
                backgroundColor: 'rgba(255, 148, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
}

// Food modal functions
function showFoodModal(mealType = 'snack') {
    const modal = document.getElementById('foodModal');
    const title = document.getElementById('foodModalTitle');
    const mealTypeSelect = document.getElementById('mealType');
    
    if (title) {
        title.textContent = `Log ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
    }
    
    if (mealTypeSelect) {
        mealTypeSelect.value = mealType;
    }
    
    // Clear form fields
    const foodInput = document.getElementById('foodInput');
    const foodQuantity = document.getElementById('foodQuantity');
    const foodBrand = document.getElementById('foodBrand');
    const foodNotes = document.getElementById('foodNotes');
    const foodAnalysis = document.getElementById('foodAnalysis');
    
    if (foodInput) foodInput.value = '';
    if (foodQuantity) {
        foodQuantity.value = '100';
        // Remove existing event listener and add new one
        foodQuantity.removeEventListener('input', recalculateNutrition);
        foodQuantity.addEventListener('input', recalculateNutrition);
        foodQuantity.addEventListener('change', recalculateNutrition);
    }
    if (foodBrand) foodBrand.value = '';
    if (foodNotes) foodNotes.value = '';
    if (foodAnalysis) {
        foodAnalysis.style.display = 'none';
        foodAnalysis.dataset.analysis = ''; // Clear stored analysis
        foodAnalysis.dataset.per100g = ''; // Clear per-100g data
    }
    
    if (modal) {
        modal.classList.add('active');
        // Focus on food input
        setTimeout(() => {
            if (foodInput) foodInput.focus();
        }, 100);
    }
}

// Recalculate nutrition values when quantity changes
function recalculateNutrition() {
    const foodQuantity = document.getElementById('foodQuantity');
    const foodAnalysis = document.getElementById('foodAnalysis');
    
    if (!foodQuantity || !foodAnalysis) return;
    
    const newQuantity = parseFloat(foodQuantity.value);
    if (!newQuantity || newQuantity <= 0) return;
    
    // Get per-100g data if available
    const per100gData = foodAnalysis.dataset.per100g;
    if (!per100gData) {
        // Try to get from current analysis
        const currentAnalysis = foodAnalysis.dataset.analysis;
        if (currentAnalysis) {
            try {
                const analysis = JSON.parse(currentAnalysis);
                // Extract per-100g values
                const originalQuantity = analysis.quantity_g || 100;
                const factor = 100 / originalQuantity;
                
                const per100g = {
                    calories_per_100g: (analysis.calories || 0) * factor,
                    protein_per_100g: (analysis.protein_g || 0) * factor,
                    carbs_per_100g: (analysis.carbs_g || 0) * factor,
                    fats_per_100g: (analysis.fats_g || 0) * factor,
                    fiber_per_100g: (analysis.fiber_g || 0) * factor
                };
                
                foodAnalysis.dataset.per100g = JSON.stringify(per100g);
                updateNutritionForQuantity(newQuantity, per100g);
            } catch (e) {
                console.error('Error parsing analysis:', e);
            }
        }
        return;
    }
    
    try {
        const per100g = JSON.parse(per100gData);
        updateNutritionForQuantity(newQuantity, per100g);
    } catch (e) {
        console.error('Error parsing per100g data:', e);
    }
}

// Update nutrition display for new quantity
function updateNutritionForQuantity(quantity, per100g) {
    const factor = quantity / 100.0;
    
    const recalculated = {
        quantity_g: quantity,
        calories: Math.round((per100g.calories_per_100g || 0) * factor * 10) / 10,
        protein_g: Math.round((per100g.protein_per_100g || 0) * factor * 10) / 10,
        carbs_g: Math.round((per100g.carbs_per_100g || 0) * factor * 10) / 10,
        fats_g: Math.round((per100g.fats_per_100g || 0) * factor * 10) / 10,
        fiber_g: Math.round((per100g.fiber_per_100g || 0) * factor * 10) / 10
    };
    
    // Update stored analysis data
    const foodAnalysis = document.getElementById('foodAnalysis');
    if (foodAnalysis) {
        foodAnalysis.dataset.analysis = JSON.stringify(recalculated);
        // Store per-100g if not already stored
        if (!foodAnalysis.dataset.per100g) {
            foodAnalysis.dataset.per100g = JSON.stringify(per100g);
        }
    }
    
    // Update display
    displayFoodAnalysis(recalculated);
}

function closeFoodModal() {
    document.getElementById('foodModal').classList.remove('active');
}

// Analyze food
let analyzeFoodTimeout = null;
function debounceAnalyzeFood() {
    clearTimeout(analyzeFoodTimeout);
    analyzeFoodTimeout = setTimeout(() => {
        const foodInput = document.getElementById('foodInput').value;
        if (foodInput.length > 3) {
            analyzeFood();
        }
    }, 1000);
}

async function analyzeFood() {
    const foodInput = document.getElementById('foodInput').value;
    const quantityInput = document.getElementById('foodQuantity').value;
    
    if (!foodInput) return;
    
    const analysisDiv = document.getElementById('foodAnalysis');
    analysisDiv.style.display = 'block';
    analysisDiv.innerHTML = '<div style="text-align: center; padding: 1rem;"><i class="fas fa-spinner fa-spin"></i> Analyzing...</div>';
    
    try {
        const response = await fetch('/api/loseit/analyze-food', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                food_description: foodInput,
                quantity_g: parseFloat(quantityInput) || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const quantityField = document.getElementById('foodQuantity');
            const currentQuantity = parseFloat(quantityField.value) || 100;
            
            // Store per-100g values for recalculation
            const per100g = {
                calories_per_100g: data.calories_per_100g || 0,
                protein_per_100g: data.protein_per_100g || 0,
                carbs_per_100g: data.carbs_per_100g || 0,
                fats_per_100g: data.fats_per_100g || 0,
                fiber_per_100g: data.fiber_per_100g || 0
            };
            
            // If AI detected quantity, use it; otherwise use current input
            const finalQuantity = data.quantity_g && !quantityInput ? data.quantity_g : currentQuantity;
            
            if (quantityField) {
                quantityField.value = Math.round(finalQuantity);
            }
            
            // Calculate values for current quantity
            const factor = finalQuantity / 100.0;
            const calculatedData = {
                quantity_g: finalQuantity,
                calories: Math.round((per100g.calories_per_100g || 0) * factor * 10) / 10,
                protein_g: Math.round((per100g.protein_per_100g || 0) * factor * 10) / 10,
                carbs_g: Math.round((per100g.carbs_per_100g || 0) * factor * 10) / 10,
                fats_g: Math.round((per100g.fats_per_100g || 0) * factor * 10) / 10,
                fiber_g: Math.round((per100g.fiber_per_100g || 0) * factor * 10) / 10,
                // Keep per-100g values for recalculation
                calories_per_100g: per100g.calories_per_100g,
                protein_per_100g: per100g.protein_per_100g,
                carbs_per_100g: per100g.carbs_per_100g,
                fats_per_100g: per100g.fats_per_100g,
                fiber_per_100g: per100g.fiber_per_100g
            };
            
            // Store both calculated data and per-100g data
            analysisDiv.dataset.analysis = JSON.stringify(calculatedData);
            analysisDiv.dataset.per100g = JSON.stringify(per100g);
            
            displayFoodAnalysis(calculatedData);
        } else {
            analysisDiv.innerHTML = `<div style="color: var(--loseit-red); padding: 1rem;">${data.error || 'Could not analyze food'}</div>`;
        }
    } catch (error) {
        analysisDiv.innerHTML = `<div style="color: var(--loseit-red); padding: 1rem;">Error: ${error.message}</div>`;
    }
}

function displayFoodAnalysis(data) {
    const analysisDiv = document.getElementById('foodAnalysis');
    if (!analysisDiv) return;
    
    // Ensure analysis data is stored
    if (!analysisDiv.dataset.analysis) {
        analysisDiv.dataset.analysis = JSON.stringify(data);
    }
    
    const quantity = data.quantity_g || parseFloat(document.getElementById('foodQuantity').value) || 100;
    
    analysisDiv.style.display = 'block';
    analysisDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.75rem; color: var(--loseit-text);">
            <i class="fas fa-check-circle" style="color: var(--loseit-green);"></i> Analysis Complete
            <span style="font-size: 0.85rem; font-weight: 400; color: var(--loseit-text-light); margin-left: 0.5rem;">
                (for ${Math.round(quantity)}g)
            </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--loseit-orange);">${Math.round(data.calories || 0)}</div>
                <div style="font-size: 0.85rem; color: var(--loseit-text-light);">Calories</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--loseit-blue);">${Math.round(data.carbs_g || 0)}g</div>
                <div style="font-size: 0.85rem; color: var(--loseit-text-light);">Carbs</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--loseit-orange);">${Math.round(data.fats_g || 0)}g</div>
                <div style="font-size: 0.85rem; color: var(--loseit-text-light);">Fat</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--loseit-green);">${Math.round(data.protein_g || 0)}g</div>
                <div style="font-size: 0.85rem; color: var(--loseit-text-light);">Protein</div>
            </div>
        </div>
        ${data.fiber_g ? `
        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--loseit-gray-border); text-align: center;">
            <span style="font-size: 0.9rem; color: var(--loseit-text-light);">
                Fiber: <strong style="color: var(--loseit-text);">${Math.round(data.fiber_g || 0)}g</strong>
            </span>
        </div>
        ` : ''}
    `;
}

// Log food
async function logFood() {
    const foodInput = document.getElementById('foodInput').value.trim();
    const quantity = parseFloat(document.getElementById('foodQuantity').value);
    const mealType = document.getElementById('mealType').value;
    const notes = document.getElementById('foodNotes').value.trim();
    const analysisDiv = document.getElementById('foodAnalysis');
    
    if (!foodInput) {
        Toast.error('Please enter a food item');
        return;
    }
    
    if (!quantity || quantity <= 0) {
        Toast.error('Please enter a valid quantity');
        return;
    }
    
    // Get analysis data if available
    let analysisData = null;
    if (analysisDiv && analysisDiv.dataset.analysis) {
        try {
            analysisData = JSON.parse(analysisDiv.dataset.analysis);
        } catch (e) {
            console.error('Error parsing analysis data:', e);
        }
    }
    
    // If no analysis data, try to analyze first
    if (!analysisData || !analysisData.calories) {
        Toast.info('Analyzing food before logging...');
        try {
            const analyzeResponse = await fetch('/api/loseit/analyze-food', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    food_description: foodInput,
                    quantity_g: quantity
                })
            });
            
            const analyzeData = await analyzeResponse.json();
            if (analyzeData.success) {
                analysisData = analyzeData;
                // Update the stored analysis
                if (analysisDiv) {
                    analysisDiv.dataset.analysis = JSON.stringify(analyzeData);
                }
            }
        } catch (e) {
            console.error('Error analyzing food:', e);
        }
    }
    
    // Prepare food log data
    const foodLogData = {
        food_name: foodInput,
        meal_type: mealType,
        quantity_g: quantity,
        notes: notes || null
    };
    
    // Add nutrition data if available
    if (analysisData) {
        foodLogData.calories = analysisData.calories || null;
        foodLogData.protein_g = analysisData.protein_g || null;
        foodLogData.carbs_g = analysisData.carbs_g || null;
        foodLogData.fats_g = analysisData.fats_g || null;
        foodLogData.fiber_g = analysisData.fiber_g || null;
    }
    
    try {
        const response = await fetch('/api/loseit/log-food', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(foodLogData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Food logged successfully!');
            closeFoodModal();
            
            // Reload data to show the new entry
            await loadDayData();
        } else {
            Toast.error(data.error || 'Error logging food');
            console.error('Log food error:', data);
        }
    } catch (error) {
        Toast.error('Error: ' + error.message);
        console.error('Log food exception:', error);
    }
}

// Delete food log
async function deleteFoodLog(logId) {
    if (!confirm('Delete this food log?')) return;
    
    try {
        const response = await fetch('/api/loseit/delete-food-log', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ log_id: logId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Food log deleted');
            loadDayData();
        } else {
            Toast.error('Error deleting food log');
        }
    } catch (error) {
        Toast.error('Error: ' + error.message);
    }
}

// Add water
async function addWater(amount) {
    try {
        const response = await fetch('/api/loseit/log-water', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ amount_ml: amount })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success(`Added ${amount}ml of water!`);
            loadDailySummary();
        } else {
            Toast.error(data.error || 'Error logging water');
        }
    } catch (error) {
        Toast.error('Error: ' + error.message);
    }
}

// Utility functions
function copyFromYesterday(mealType) {
    Toast.info('Copying from yesterday...');
    // TODO: Implement
}

function createRecipe(mealType) {
    Toast.info('Recipe builder coming soon!');
    // TODO: Implement
}

function scanPhoto(mealType) {
    Toast.info('Photo scanning coming soon!');
    // TODO: Implement
}

function showExerciseModal() {
    Toast.info('Exercise logging coming soon!');
    // TODO: Implement
}

// Toggle weekly view
function toggleWeeklyView() {
    const weeklyModal = document.getElementById('weeklyModal');
    if (weeklyModal) {
        weeklyModal.classList.add('active');
        loadWeeklySummary();
    }
}

function closeWeeklyModal() {
    document.getElementById('weeklyModal').classList.remove('active');
}

// Load weekly summary
async function loadWeeklySummary() {
    try {
        const response = await fetch('/api/loseit/weekly-summary', {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.weekly) {
            displayWeeklyView(data.weekly);
        }
    } catch (error) {
        console.error('Error loading weekly summary:', error);
        Toast.error('Error loading weekly data');
    }
}

// Display weekly view
function displayWeeklyView(weekly) {
    // Update summary cards
    document.getElementById('weeklyTotalCalories').textContent = Math.round(weekly.total_calories);
    document.getElementById('weeklyTotalDeficit').textContent = Math.round(weekly.total_deficit);
    document.getElementById('weeklyAvgDaily').textContent = Math.round(weekly.average_daily_calories);
    document.getElementById('weeklyAvgDeficit').textContent = Math.round(weekly.average_daily_deficit);
    
    // Update deficit color
    const totalDeficitEl = document.getElementById('weeklyTotalDeficit');
    const avgDeficitEl = document.getElementById('weeklyAvgDeficit');
    
    if (weekly.total_deficit > 0) {
        totalDeficitEl.style.color = 'var(--loseit-green)';
        totalDeficitEl.textContent = '+' + Math.round(weekly.total_deficit);
    } else {
        totalDeficitEl.style.color = 'var(--loseit-red)';
    }
    
    if (weekly.average_daily_deficit > 0) {
        avgDeficitEl.style.color = 'var(--loseit-green)';
        avgDeficitEl.textContent = '+' + Math.round(weekly.average_daily_deficit);
    } else {
        avgDeficitEl.style.color = 'var(--loseit-red)';
    }
    
    // Display calendar
    const calendarEl = document.getElementById('weeklyCalendar');
    const today = new Date().toISOString().split('T')[0];
    
    calendarEl.innerHTML = weekly.days.map(day => {
        const isToday = day.date === today;
        const deficitClass = day.deficit > 0 ? 'positive' : 'negative';
        const deficitSign = day.deficit > 0 ? '+' : '';
        
        return `
            <div class="weekly-day-card ${isToday ? 'today' : ''}">
                <div class="weekly-day-name">${day.day_short}</div>
                <div class="weekly-day-date">${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div class="weekly-day-calories">${Math.round(day.calories)}</div>
                <div class="weekly-day-goal">Goal: ${Math.round(day.goal)}</div>
                <div class="weekly-day-deficit ${deficitClass}">
                    ${deficitSign}${Math.round(day.deficit)} cal
                </div>
            </div>
        `;
    }).join('');
}

function signOut() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('is_authenticated');
    window.location.href = '/auth';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.showFoodModal = showFoodModal;
window.closeFoodModal = closeFoodModal;
window.analyzeFood = analyzeFood;
window.logFood = logFood;
window.deleteFoodLog = deleteFoodLog;
window.addWater = addWater;
window.changeDate = changeDate;
window.loadDayData = loadDayData;
window.selectFoodSuggestion = selectFoodSuggestion;
window.selectFoodSuggestionFromSearch = selectFoodSuggestionFromSearch;
window.recalculateNutrition = recalculateNutrition;
window.copyFromYesterday = copyFromYesterday;
window.createRecipe = createRecipe;
window.scanPhoto = scanPhoto;
window.showExerciseModal = showExerciseModal;
window.toggleWeeklyView = toggleWeeklyView;
window.closeWeeklyModal = closeWeeklyModal;
window.signOut = signOut;

// Mobile sidebar and panel toggles
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.loseit-sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99; display: none;';
    overlay.onclick = toggleMobileSidebar;
    
    if (sidebar) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            if (!document.querySelector('.sidebar-overlay')) {
                document.body.appendChild(overlay);
                overlay.style.display = 'block';
            }
            document.body.style.overflow = 'hidden';
        } else {
            const existingOverlay = document.querySelector('.sidebar-overlay');
            if (existingOverlay) existingOverlay.remove();
            document.body.style.overflow = '';
        }
    }
}

function toggleMobilePanel() {
    const panel = document.querySelector('.loseit-panel');
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none;';
    overlay.onclick = toggleMobilePanel;
    
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            if (!document.querySelector('.panel-overlay')) {
                document.body.appendChild(overlay);
                overlay.style.display = 'block';
            }
            document.body.style.overflow = 'hidden';
        } else {
            const existingOverlay = document.querySelector('.panel-overlay');
            if (existingOverlay) existingOverlay.remove();
            document.body.style.overflow = '';
        }
    }
}

window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleMobilePanel = toggleMobilePanel;

// Make charts responsive on window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Resize Chart.js charts
        if (window.calorieDonutChart) {
            window.calorieDonutChart.resize();
        }
        if (window.macroCircleChart) {
            window.macroCircleChart.resize();
        }
        if (window.weightSparklineChart) {
            window.weightSparklineChart.resize();
        }
    }, 250);
});


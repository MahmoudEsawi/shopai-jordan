// Lose It - Food & Weight Tracking JavaScript

let currentUserId = null;
let currentMealType = 'all';
let weightChart = null;
let analyzeFoodTimeout = null;

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});

// Check if user is authenticated
async function checkAuthentication() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    if (!userId) {
        // Redirect to auth page if not authenticated
        Toast.info('Please sign in to access Lose It');
        setTimeout(() => {
            window.location.href = '/auth';
        }, 1500);
        return;
    }
    
    currentUserId = userId;
    
    // Update greeting
    const greeting = document.getElementById('userGreeting');
    if (greeting) {
        greeting.textContent = `Hello, ${username}!`;
    }
    
    // Load initial data
    loadDailySummary();
    loadFoodLogs();
    loadWeightLogs();
}

// Sign out
function signOut() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('is_authenticated');
    window.location.href = '/auth';
}

// Get authentication headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-ID': currentUserId
    };
}

// Load daily summary
async function loadDailySummary() {
    try {
        const response = await fetch('/api/loseit/daily-summary', {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.summary) {
            const summary = data.summary;
            
            // Update calories
            document.getElementById('caloriesConsumed').textContent = Math.round(summary.calories);
            document.getElementById('caloriesGoal').textContent = summary.calorie_goal || 2000;
            const caloriesPercent = Math.min((summary.calories / (summary.calorie_goal || 2000)) * 100, 100);
            document.getElementById('caloriesProgress').style.width = caloriesPercent + '%';
            
            // Update protein
            document.getElementById('proteinConsumed').textContent = Math.round(summary.protein_g);
            document.getElementById('proteinGoal').textContent = Math.round(summary.protein_goal || 0);
            const proteinPercent = summary.protein_goal > 0 ? Math.min((summary.protein_g / summary.protein_goal) * 100, 100) : 0;
            document.getElementById('proteinProgress').style.width = proteinPercent + '%';
            
            // Update water
            document.getElementById('waterConsumed').textContent = summary.water_ml;
            document.getElementById('waterGoal').textContent = 2000;
            const waterPercent = Math.min((summary.water_ml / 2000) * 100, 100);
            document.getElementById('waterProgress').style.width = waterPercent + '%';
        }
    } catch (error) {
        console.error('Error loading daily summary:', error);
    }
}

// Load food logs
async function loadFoodLogs() {
    try {
        const response = await fetch('/api/loseit/food-logs', {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.logs) {
            displayFoodLogs(data.logs);
        }
    } catch (error) {
        console.error('Error loading food logs:', error);
    }
}

// Display food logs
function displayFoodLogs(logs) {
    const mealsList = document.getElementById('mealsList');
    if (!mealsList) return;
    
    if (logs.length === 0) {
        mealsList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--gray);">
                <i class="fas fa-utensils" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <div>No meals logged today. Start by logging your first meal!</div>
            </div>
        `;
        return;
    }
    
    // Filter by meal type if needed
    let filteredLogs = logs;
    if (currentMealType !== 'all') {
        filteredLogs = logs.filter(log => log.meal_type === currentMealType);
    }
    
    mealsList.innerHTML = filteredLogs.map(log => {
        const mealType = log.meal_type || 'snack';
        return `
            <div class="meal-item">
                <div class="meal-item-info">
                    <span class="meal-badge ${mealType}">${mealType}</span>
                    <div class="meal-item-name">${escapeHtml(log.food_name)}</div>
                    <div class="meal-item-details">
                        ${log.quantity_g ? `<span><i class="fas fa-weight"></i> ${log.quantity_g}g</span>` : ''}
                        ${log.calories ? `<span><i class="fas fa-fire"></i> ${Math.round(log.calories)} cal</span>` : ''}
                        ${log.protein_g ? `<span><i class="fas fa-dumbbell"></i> ${Math.round(log.protein_g)}g protein</span>` : ''}
                    </div>
                </div>
                <div class="meal-item-actions">
                    <button class="btn btn-sm btn-outline" onclick="deleteFoodLog(${log.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Show meal type
function showMealType(type) {
    currentMealType = type;
    
    // Update tabs
    document.querySelectorAll('.meal-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload logs
    loadFoodLogs();
}

// Show food modal
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
    
    // Clear form
    document.getElementById('foodInput').value = '';
    document.getElementById('foodQuantity').value = '100';
    document.getElementById('foodNotes').value = '';
    document.getElementById('foodAnalysis').style.display = 'none';
    
    modal.classList.add('active');
}

// Close food modal
function closeFoodModal() {
    document.getElementById('foodModal').classList.remove('active');
}

// Debounced food analysis
function debounceAnalyzeFood() {
    clearTimeout(analyzeFoodTimeout);
    analyzeFoodTimeout = setTimeout(() => {
        const foodInput = document.getElementById('foodInput').value;
        if (foodInput.length > 3) {
            analyzeFood();
        }
    }, 1000);
}

// Analyze food with AI
async function analyzeFood() {
    const foodInput = document.getElementById('foodInput').value;
    const quantityInput = document.getElementById('foodQuantity').value;
    
    if (!foodInput) {
        Toast.warning('Please enter a food item');
        return;
    }
    
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
            // Update quantity if AI detected it
            if (data.quantity_g && !quantityInput) {
                document.getElementById('foodQuantity').value = Math.round(data.quantity_g);
            }
            
            // Display analysis
            analysisDiv.innerHTML = `
                <div class="food-analysis-title">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i> Analysis Complete
                </div>
                <div class="food-analysis-grid">
                    <div class="food-analysis-item">
                        <div class="food-analysis-value">${Math.round(data.calories || 0)}</div>
                        <div class="food-analysis-label">Calories</div>
                    </div>
                    <div class="food-analysis-item">
                        <div class="food-analysis-value">${Math.round(data.protein_g || 0)}g</div>
                        <div class="food-analysis-label">Protein</div>
                    </div>
                    <div class="food-analysis-item">
                        <div class="food-analysis-value">${Math.round(data.carbs_g || 0)}g</div>
                        <div class="food-analysis-label">Carbs</div>
                    </div>
                    <div class="food-analysis-item">
                        <div class="food-analysis-value">${Math.round(data.fats_g || 0)}g</div>
                        <div class="food-analysis-label">Fats</div>
                    </div>
                </div>
            `;
            
            // Store analysis data for logging
            analysisDiv.dataset.analysis = JSON.stringify(data);
        } else {
            analysisDiv.innerHTML = `
                <div style="color: var(--warning); padding: 1rem;">
                    <i class="fas fa-exclamation-triangle"></i> ${data.error || 'Could not analyze food'}
                </div>
            `;
        }
    } catch (error) {
        analysisDiv.innerHTML = `
            <div style="color: var(--jordan-red); padding: 1rem;">
                <i class="fas fa-times-circle"></i> Error: ${error.message}
            </div>
        `;
    }
}

// Log food
async function logFood() {
    const foodInput = document.getElementById('foodInput').value;
    const quantity = parseFloat(document.getElementById('foodQuantity').value);
    const mealType = document.getElementById('mealType').value;
    const notes = document.getElementById('foodNotes').value;
    const analysisDiv = document.getElementById('foodAnalysis');
    
    if (!foodInput) {
        Toast.error('Please enter a food item');
        return;
    }
    
    // Get analysis data if available
    let analysisData = null;
    if (analysisDiv.dataset.analysis) {
        analysisData = JSON.parse(analysisDiv.dataset.analysis);
    }
    
    try {
        const response = await fetch('/api/loseit/log-food', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                food_name: foodInput,
                meal_type: mealType,
                quantity_g: quantity,
                calories: analysisData?.calories,
                protein_g: analysisData?.protein_g,
                carbs_g: analysisData?.carbs_g,
                fats_g: analysisData?.fats_g,
                fiber_g: analysisData?.fiber_g,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Food logged successfully!');
            closeFoodModal();
            loadDailySummary();
            loadFoodLogs();
        } else {
            Toast.error(data.error || 'Error logging food');
        }
    } catch (error) {
        Toast.error('Error: ' + error.message);
    }
}

// Delete food log
async function deleteFoodLog(logId) {
    if (!confirm('Are you sure you want to delete this food log?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/loseit/delete-food-log', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ log_id: logId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Food log deleted');
            loadDailySummary();
            loadFoodLogs();
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

// Show weight modal
function showWeightModal() {
    document.getElementById('weightModal').classList.add('active');
    document.getElementById('weightInput').value = '';
    document.getElementById('weightNotes').value = '';
}

// Close weight modal
function closeWeightModal() {
    document.getElementById('weightModal').classList.remove('active');
}

// Log weight
async function logWeight() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    const notes = document.getElementById('weightNotes').value;
    
    if (!weight || weight <= 0) {
        Toast.error('Please enter a valid weight');
        return;
    }
    
    try {
        const response = await fetch('/api/loseit/log-weight', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ weight_kg: weight, notes: notes })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Toast.success('Weight logged successfully!');
            closeWeightModal();
            loadWeightLogs();
            loadDailySummary();
        } else {
            Toast.error(data.error || 'Error logging weight');
        }
    } catch (error) {
        Toast.error('Error: ' + error.message);
    }
}

// Load weight logs and create chart
async function loadWeightLogs() {
    try {
        const response = await fetch('/api/loseit/weight-logs?limit=30', {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && data.logs) {
            // Update current weight display
            if (data.logs.length > 0) {
                const latestWeight = data.logs[0].weight_kg;
                document.getElementById('currentWeight').textContent = `${latestWeight.toFixed(1)} kg`;
            }
            
            // Create chart
            createWeightChart(data.logs.reverse()); // Reverse to show oldest first
        }
    } catch (error) {
        console.error('Error loading weight logs:', error);
    }
}

// Create weight chart
function createWeightChart(logs) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    
    if (weightChart) {
        weightChart.destroy();
    }
    
    const labels = logs.map(log => {
        const date = new Date(log.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const weights = logs.map(log => log.weight_kg);
    
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (kg)',
                data: weights,
                borderColor: 'rgb(230, 126, 34)',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.showFoodModal = showFoodModal;
window.closeFoodModal = closeFoodModal;
window.analyzeFood = analyzeFood;
window.logFood = logFood;
window.deleteFoodLog = deleteFoodLog;
window.addWater = addWater;
window.showWeightModal = showWeightModal;
window.closeWeightModal = closeWeightModal;
window.logWeight = logWeight;
window.showMealType = showMealType;
window.signOut = signOut;


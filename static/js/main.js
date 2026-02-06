document.addEventListener('DOMContentLoaded', () => {
    const activityForm = document.getElementById('activityForm');
    const wellnessForm = document.getElementById('wellnessForm');
    const activityList = document.getElementById('activityList');
    let wellnessChart = null;

    // Fetch initial data
    loadActivities();
    loadWellnessData();

    // Activities
    activityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            type: document.getElementById('actType').value,
            duration: parseInt(document.getElementById('actDuration').value),
            intensity: document.getElementById('actIntensity').value,
            notes: document.getElementById('actNotes').value
        };

        const res = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            activityForm.reset();
            loadActivities();
        }
    });

    // Wellness
    wellnessForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            energy_level: parseInt(document.getElementById('wellEnergy').value),
            sleep_hours: parseFloat(document.getElementById('wellSleep').value),
            mood_score: parseInt(document.getElementById('wellMood').value)
        };

        const res = await fetch('/api/wellness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            loadWellnessData();
            alert('Daily pulse saved!');
        }
    });

    async function loadActivities() {
        const res = await fetch('/api/activities');
        const activities = await res.json();

        activityList.innerHTML = activities.map(act => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${act.type}</h4>
                    <p>${act.timestamp} • ${act.notes || 'No notes'}</p>
                </div>
                <div style="text-align: right">
                    <div class="tag tag-blue">${act.duration} mins</div>
                    <div style="font-size: 0.7rem; color: #8b949e; margin-top: 4px;">${act.intensity}</div>
                </div>
            </div>
        `).join('') || '<p style="text-align:center; color: #8b949e;">No activities logged yet.</p>';
    }

    async function loadWellnessData() {
        const res = await fetch('/api/wellness');
        const data = await res.json();

        const labels = data.map(d => d.date);
        const sleepData = data.map(d => d.sleep_hours);
        const energyData = data.map(d => d.energy_level);

        if (wellnessChart) wellnessChart.destroy();

        const ctx = document.getElementById('wellnessChart').getContext('2d');
        wellnessChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sleep Hours',
                        data: sleepData,
                        borderColor: '#58a6ff',
                        backgroundColor: 'rgba(88, 166, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Energy Level',
                        data: energyData,
                        borderColor: '#3fb950',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#1e293b' } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0' },
                        ticks: { color: '#1e293b' }
                    },
                    x: {
                        grid: { color: '#e2e8f0' },
                        ticks: { color: '#1e293b' }
                    }
                }
            }
        });
    }
});

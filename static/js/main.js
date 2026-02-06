// Utility for LocalStorage (GitHub Pages Fallback)
const isStatic = window.location.hostname.includes('github.io') || !window.location.port;

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
            id: Date.now(),
            type: document.getElementById('actType').value,
            duration: parseInt(document.getElementById('actDuration').value),
            intensity: document.getElementById('actIntensity').value,
            notes: document.getElementById('actNotes').value,
            timestamp: new Date().toLocaleString()
        };

        if (isStatic) {
            let acts = JSON.parse(localStorage.getItem('activities') || '[]');
            acts.unshift(data);
            localStorage.setItem('activities', JSON.stringify(acts));
            activityForm.reset();
            loadActivities();
        } else {
            const res = await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                activityForm.reset();
                loadActivities();
            }
        }
    });

    // Wellness
    wellnessForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            energy_level: parseInt(document.getElementById('wellEnergy').value),
            sleep_hours: parseFloat(document.getElementById('wellSleep').value),
            mood_score: parseInt(document.getElementById('wellMood').value),
            date: new Date().toISOString().split('T')[0]
        };

        if (isStatic) {
            let wells = JSON.parse(localStorage.getItem('wellness') || '[]');
            // Upsert
            const idx = wells.findIndex(w => w.date === data.date);
            if (idx > -1) wells[idx] = data; else wells.push(data);
            localStorage.setItem('wellness', JSON.stringify(wells));
            loadWellnessData();
            alert('Daily pulse saved to browser!');
        } else {
            const res = await fetch('/api/wellness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                loadWellnessData();
                alert('Daily pulse saved!');
            }
        }
    });

    async function loadActivities() {
        let activities = [];
        if (isStatic) {
            activities = JSON.parse(localStorage.getItem('activities') || '[]');
        } else {
            const res = await fetch('/api/activities');
            activities = await res.json();
        }

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
        let data = [];
        if (isStatic) {
            data = JSON.parse(localStorage.getItem('wellness') || '[]');
            data.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
        } else {
            const res = await fetch('/api/wellness');
            data = await res.json();
        }

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
                        label: 'Sleep',
                        data: sleepData,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Energy',
                        data: energyData,
                        borderColor: '#059669',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#1e293b' } } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { color: '#1e293b' } },
                    x: { grid: { color: '#e2e8f0' }, ticks: { color: '#1e293b' } }
                }
            }
        });
    }
});

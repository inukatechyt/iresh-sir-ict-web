// 1. Supabase සම්බන්ධ කිරීම
const SUPABASE_URL = '[https://ercowsldngxxzpvpevxa.supabase.co]';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o
';

// මෙතන නම supabaseClient කියලා වෙනස් කළා
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Chart.js එක සෑදීම
const ctx = document.getElementById('progressChart').getContext('2d');
let progressChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [], 
        datasets: [{
            label: 'වැඩ කළ පැය ගණන',
            data: [], 
            backgroundColor: '#2563EB',
            borderRadius: 5,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, suggestedMax: 10 }
        }
    }
});

// 3. Database එකට දත්ත යැවීම
document.getElementById('saveDataBtn').addEventListener('click', async () => {
    const dateInput = document.getElementById('studyDate').value;
    const hoursInput = document.getElementById('studyHours').value;
    
    if(!dateInput || !hoursInput) {
        alert("කරුණාකර දිනය සහ පැය ගණන ඇතුළත් කරන්න!");
        return;
    }

    // දත්ත යැවීම (මෙතනත් supabaseClient කියලා දැම්මා)
    const { data, error } = await supabaseClient
        .from('study_progress')
        .insert([
            { student_name: 'Test Student', date: dateInput, hours: parseInt(hoursInput) }
        ]);

    if (error) {
        console.error("Error saving data:", error);
        alert("දත්ත සුරැකීමේදී දෝෂයක් මතු විය!");
    } else {
        const statusMsg = document.getElementById('statusMsg');
        statusMsg.classList.remove('hidden');
        setTimeout(() => statusMsg.classList.add('hidden'), 3000);
        
        fetchProgressData();
    }
});

// 4. Database එකෙන් දත්ත ගැනීම
async function fetchProgressData() {
    const { data, error } = await supabaseClient
        .from('study_progress')
        .select('date, hours')
        .order('date', { ascending: true })
        .limit(7);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    const dates = data.map(record => record.date);
    const hours = data.map(record => record.hours);

    progressChart.data.labels = dates;
    progressChart.data.datasets[0].data = hours;
    progressChart.update();
}

fetchProgressData();
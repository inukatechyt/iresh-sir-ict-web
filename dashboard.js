// 1. Supabase සම්බන්ධ කිරීම (ඔබේ විස්තර මෙතැනට දාන්න)
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o
';

// Supabase Client එක සෑදීම
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Chart.js එක සෑදීම (මුලික හිස් ප්‍රස්ථාරය)
const ctx = document.getElementById('progressChart').getContext('2d');
let progressChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [], // දවස් ටික මෙතනට එනවා
        datasets: [{
            label: 'වැඩ කළ පැය ගණන',
            data: [], // පැය ගණන් ටික මෙතනට එනවා
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

// 3. Database එකට දත්ත යැවීම (Save Button Logic)
document.getElementById('saveDataBtn').addEventListener('click', async () => {
    const dateInput = document.getElementById('studyDate').value;
    const hoursInput = document.getElementById('studyHours').value;
    
    if(!dateInput || !hoursInput) {
        alert("කරුණාකර දිනය සහ පැය ගණන ඇතුළත් කරන්න!");
        return;
    }

    // Supabase එකට Data යැවීම
    const { data, error } = await supabase
        .from('study_progress')
        .insert([
            { student_name: 'Test Student', date: dateInput, hours: parseInt(hoursInput) }
        ]);

    if (error) {
        console.error("Error saving data:", error);
        alert("දත්ත සුරැකීමේදී දෝෂයක් මතු විය!");
    } else {
        // සාර්ථකව සේව් වුණාම පෙන්වන මැසේජ් එක
        const statusMsg = document.getElementById('statusMsg');
        statusMsg.classList.remove('hidden');
        setTimeout(() => statusMsg.classList.add('hidden'), 3000);
        
        // අලුත් දත්ත එක්ක ප්‍රස්ථාරය Update කිරීම
        fetchProgressData();
    }
});

// 4. Database එකෙන් දත්ත ගෙනැවිත් ප්‍රස්ථාරයේ පෙන්වීම
async function fetchProgressData() {
    const { data, error } = await supabase
        .from('study_progress')
        .select('date, hours')
        .order('date', { ascending: true })
        .limit(7); // අන්තිම දවස් 7 පමණක් ගන්නවා

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    // Chart එකට ගැළපෙන විදිහට දත්ත වෙන් කිරීම
    const dates = data.map(record => record.date);
    const hours = data.map(record => record.hours);

    // Chart එක Update කිරීම
    progressChart.data.labels = dates;
    progressChart.data.datasets[0].data = hours;
    progressChart.update();
}

// පිටුව Load වෙද්දිම කලින් තියෙන දත්ත Chart එකට ගන්නවා
fetchProgressData();
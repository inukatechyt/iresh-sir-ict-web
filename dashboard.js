// 1. Supabase සම්බන්ධ කිරීම (ඔබේ විස්තර මෙතැනට දාන්න)
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null; // ලොග් වෙලා ඉන්න ළමයාගේ විස්තර මෙතන තියාගන්නවා

// 2. පිටුව Load වෙද්දි ලොග් වෙලාද බලනවා
async function checkUserSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (!session) {
        // ලොග් වෙලා නැත්නම් ආයෙත් Login පිටුවට යවනවා
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user; // ලොග් වෙලා නම් User ව සේව් කරගන්නවා
    
    // Chart එකේ දත්ත ගන්න Function එක Call කරනවා
    fetchProgressData();
}

checkUserSession();

// 3. Chart.js එක සෑදීම
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
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, suggestedMax: 10 } } }
});

// 4. Database එකට දත්ත යැවීම
document.getElementById('saveDataBtn').addEventListener('click', async () => {
    if (!currentUser) return; // User කෙනෙක් නැත්නම් වැඩ කරන්නේ නෑ

    const dateInput = document.getElementById('studyDate').value;
    const hoursInput = document.getElementById('studyHours').value;
    
    if(!dateInput || !hoursInput) {
        alert("කරුණාකර දිනය සහ පැය ගණන ඇතුළත් කරන්න!");
        return;
    }

    // දත්ත යැවීම (දැන් user_id එකත් යවනවා!)
    const { data, error } = await supabaseClient
        .from('study_progress')
        .insert([
            { 
                user_id: currentUser.id, 
                student_name: currentUser.user_metadata?.full_name || 'Student', 
                date: dateInput, 
                hours: parseInt(hoursInput) 
            }
        ]);

    if (error) {
        console.error("Error saving data:", error);
        alert("දත්ත සුරැකීමේදී දෝෂයක් මතු විය!");
    } else {
        const statusMsg = document.getElementById('statusMsg');
        statusMsg.classList.remove('hidden');
        setTimeout(() => statusMsg.classList.add('hidden'), 3000);
        
        fetchProgressData(); // Chart එක අප්ඩේට් කරනවා
    }
});

// 5. Database එකෙන් තමන්ගේ දත්ත විතරක් ගැනීම
async function fetchProgressData() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from('study_progress')
        .select('date, hours')
        .eq('user_id', currentUser.id) // මෙතනින් තමයි අනිත් ළමයින්ගේ දත්ත කලවම් වෙන එක නවත්තන්නේ!
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

// 6. Log Out වීම
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html'; // ලොග් අවුට් වුණාම ලොගින් පිටුවට යවනවා
});
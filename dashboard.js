// 1. Supabase සම්බන්ධ කිරීම (ඔබේ විස්තර මෙතැනට දාන්න)
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// 2. පිටුව Load වෙද්දි ලොග් වෙලාද බලනවා
async function checkUserSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user; 
    
    // නම සහ ID එක පෙන්වීම
    document.getElementById('displayName').innerText = currentUser.user_metadata?.full_name || 'Student';
    document.getElementById('displayStudentId').innerText = currentUser.user_metadata?.student_id || 'N/A';
    
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

// 4. Progress Database එකට දත්ත යැවීම
document.getElementById('saveDataBtn').addEventListener('click', async () => {
    if (!currentUser) return;

    const dateInput = document.getElementById('studyDate').value;
    const hoursInput = document.getElementById('studyHours').value;
    
    if(!dateInput || !hoursInput) {
        alert("කරුණාකර දිනය සහ පැය ගණන ඇතුළත් කරන්න!");
        return;
    }

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
        
        fetchProgressData();
    }
});

// 5. Database එකෙන් දත්ත ගැනීම (තමන්ගේ දත්ත පමණක්)
async function fetchProgressData() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from('study_progress')
        .select('date, hours')
        .eq('user_id', currentUser.id) 
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

// 6. Payment Slip Upload කිරීම
document.getElementById('uploadSlipBtn').addEventListener('click', async () => {
    if (!currentUser) return;

    const paymentFor = document.getElementById('paymentFor').value;
    const amount = document.getElementById('paymentAmount').value;
    const fileInput = document.getElementById('slipFile');
    const file = fileInput.files[0];

    if (!paymentFor || !amount || !file) {
        alert("කරුණාකර සියලුම විස්තර සහ ඡායාරූපය ඇතුළත් කරන්න.");
        return;
    }

    const statusMsg = document.getElementById('uploadStatusMsg');
    statusMsg.innerText = "Slip එක Upload වෙමින් පවතී... කරුණාකර රැඳී සිටින්න. ⏳";
    statusMsg.classList.remove('hidden', 'text-green-500', 'text-red-500');
    statusMsg.classList.add('text-primaryBlue');

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('payment_slips')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseClient
            .storage
            .from('payment_slips')
            .getPublicUrl(fileName);

        const slipUrl = publicUrlData.publicUrl;

        const { error: dbError } = await supabaseClient
            .from('payments')
            .insert([
                {
                    user_id: currentUser.id,
                    payment_for: paymentFor,
                    amount: parseInt(amount),
                    slip_url: slipUrl,
                    status: 'Pending'
                }
            ]);

        if (dbError) throw dbError;

        statusMsg.innerText = "Slip එක සාර්ථකව Upload කරන ලදී! Admin විසින් Verify කරන තෙක් රැඳී සිටින්න. ✅";
        statusMsg.classList.remove('text-primaryBlue');
        statusMsg.classList.add('text-green-500');

        document.getElementById('paymentFor').value = '';
        document.getElementById('paymentAmount').value = '';
        fileInput.value = '';

    } catch (error) {
        console.error("Error uploading slip:", error);
        statusMsg.innerText = "Upload කිරීම අසාර්ථකයි! නැවත උත්සාහ කරන්න. ❌";
        statusMsg.classList.remove('text-primaryBlue');
        statusMsg.classList.add('text-red-500');
    }
});

// 7. Sidebar Menu Tabs මාරු කිරීම
const menuProgress = document.getElementById('menuProgress');
const menuUpload = document.getElementById('menuUpload');
const progressSection = document.getElementById('progressSection');
const uploadSection = document.getElementById('uploadSection');

// My Progress Click
menuProgress.addEventListener('click', (e) => {
    e.preventDefault();
    progressSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
    
    // Highlight menu item 
    menuProgress.classList.add('bg-primaryBlue', 'text-white');
    menuProgress.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    
    menuUpload.classList.remove('bg-primaryBlue', 'text-white');
    menuUpload.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
});

// Upload Slip Click
menuUpload.addEventListener('click', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('hidden');
    progressSection.classList.add('hidden');
    
    // Highlight menu item 
    menuUpload.classList.add('bg-primaryBlue', 'text-white');
    menuUpload.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    
    menuProgress.classList.remove('bg-primaryBlue', 'text-white');
    menuProgress.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
});

// 8. Log Out වීම
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});
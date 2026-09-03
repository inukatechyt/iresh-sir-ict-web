// 1. Supabase සම්බන්ධ කිරීම (ඔබේ විස්තර මෙතැනට දාන්න)
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// ==========================================
// A. Sidebar & Hamburger Menu Logic (ALUTHTHIN WENAS KALA)
// ==========================================
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('openSidebarBtn');
const closeBtn = document.getElementById('closeSidebarBtn');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if (window.innerWidth >= 768) {
        // Desktop View එකේදී අයිකන් සහ Text මාරු කරනවා
        sidebar.classList.toggle('is-expanded');
    } else {
        // Phone View එකේදී පැත්තෙන් එළියට එනවා
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }
}

openBtn.addEventListener('click', toggleSidebar);
closeBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// ==========================================
// B. Dynamic Page Navigation Logic
// ==========================================
const navLinks = [
    { btnId: 'menu_dashboard', secId: 'sec_dashboard' },
    { btnId: 'menu_myclass', secId: 'sec_myclass' },
    { btnId: 'menu_lessonstore', secId: 'sec_lessonstore' },
    { btnId: 'menu_payments', secId: 'sec_payments' },
    { btnId: 'menu_profile', secId: 'sec_profile' },
    { btnId: 'menu_help', secId: 'sec_help' }
];

navLinks.forEach(link => {
    const button = document.getElementById(link.btnId);
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // අනිත් ඔක්කොම Pages හංගනවා
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
        
        // අනිත් ඔක්කොම Buttons වල පාට සාමාන්‍ය කරනවා
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('bg-primaryBlue', 'text-white');
            if(btn.id !== 'menu_profile' && btn.id !== 'menu_help') {
                btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            }
        });

        // ක්ලික් කරපු Page එක පෙන්වනවා
        document.getElementById(link.secId).classList.remove('hidden');
        
        // ක්ලික් කරපු Button එක නිල් පාට කරනවා
        if(link.btnId !== 'menu_profile' && link.btnId !== 'menu_help') {
            button.classList.add('bg-primaryBlue', 'text-white');
            button.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        }

        // ෆෝන් එකෙන් බලද්දී මෙනු එකක් එබුවම ස්වයංක්‍රීයව Sidebar එක වැහෙනවා
        if (window.innerWidth < 768) toggleSidebar();
    });
});


// ==========================================
// C. Authentication & User Session
// ==========================================
async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = session.user; 
    document.getElementById('displayName').innerText = currentUser.user_metadata?.full_name || 'Student';
    document.getElementById('displayStudentId').innerText = currentUser.user_metadata?.student_id || 'N/A';
    fetchProgressData();
}
checkUserSession();

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});


// ==========================================
// D. Chart.js Setup
// ==========================================
const ctx = document.getElementById('progressChart').getContext('2d');
let progressChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [], 
        datasets: [{
            label: 'වැඩ කළ පැය ගණන', data: [], backgroundColor: '#2563EB', borderRadius: 5
        }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, suggestedMax: 10 } } }
});


// ==========================================
// E. Save Progress Data
// ==========================================
document.getElementById('saveDataBtn').addEventListener('click', async () => {
    if (!currentUser) return;
    const dateInput = document.getElementById('studyDate').value;
    const hoursInput = document.getElementById('studyHours').value;
    
    if(!dateInput || !hoursInput) return alert("කරුණාකර දිනය සහ පැය ගණන ඇතුළත් කරන්න!");

    const { error } = await supabaseClient.from('study_progress').insert([
        { user_id: currentUser.id, student_name: currentUser.user_metadata?.full_name || 'Student', date: dateInput, hours: parseInt(hoursInput) }
    ]);

    if (error) {
        alert("දත්ත සුරැකීමේදී දෝෂයක් මතු විය!");
    } else {
        const statusMsg = document.getElementById('statusMsg');
        statusMsg.classList.remove('hidden');
        setTimeout(() => statusMsg.classList.add('hidden'), 3000);
        fetchProgressData();
    }
});


// ==========================================
// F. Fetch Progress Data
// ==========================================
async function fetchProgressData() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient.from('study_progress')
        .select('date, hours').eq('user_id', currentUser.id).order('date', { ascending: true }).limit(7);

    if (error) return console.error(error);
    progressChart.data.labels = data.map(r => r.date);
    progressChart.data.datasets[0].data = data.map(r => r.hours);
    progressChart.update();
}


// ==========================================
// G. Payment Slip Upload
// ==========================================
document.getElementById('uploadSlipBtn').addEventListener('click', async () => {
    if (!currentUser) return;
    const paymentFor = document.getElementById('paymentFor').value;
    const amount = document.getElementById('paymentAmount').value;
    const file = document.getElementById('slipFile').files[0];

    if (!paymentFor || !amount || !file) return alert("කරුණාකර සියලුම විස්තර සහ ඡායාරූපය ඇතුළත් කරන්න.");

    const statusMsg = document.getElementById('uploadStatusMsg');
    statusMsg.innerText = "Upload වෙමින් පවතී... ⏳";
    statusMsg.className = "text-sm font-semibold mt-3 text-primaryBlue";

    try {
        const fileName = `${currentUser.id}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabaseClient.storage.from('payment_slips').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage.from('payment_slips').getPublicUrl(fileName);

        const { error: dbError } = await supabaseClient.from('payments').insert([
            { user_id: currentUser.id, payment_for: paymentFor, amount: parseInt(amount), slip_url: publicUrl, status: 'Pending' }
        ]);
        if (dbError) throw dbError;

        statusMsg.innerText = "සාර්ථකව Upload කරන ලදී! ✅";
        statusMsg.className = "text-sm font-semibold mt-3 text-green-500";
        document.getElementById('paymentFor').value = '';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('slipFile').value = '';

    } catch (error) {
        statusMsg.innerText = "Upload කිරීම අසාර්ථකයි! ❌";
        statusMsg.className = "text-sm font-semibold mt-3 text-red-500";
    }
});
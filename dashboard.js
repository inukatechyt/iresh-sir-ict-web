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
// B. Dynamic Page Navigation Logic (අලුත් Premium ක්‍රමය)
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
        
        // 1. අනිත් ඔක්කොම Pages හංගනවා
        document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
        
        // 2. අනිත් ඔක්කොම Buttons වල Active ගතිය අයින් කරනවා
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-primaryBlue/10', 'text-primaryBlue', 'font-bold');
            btn.classList.add('text-slate-500', 'font-semibold');
        });

        // 3. ක්ලික් කරපු Page එක පෙන්වනවා
        document.getElementById(link.secId).classList.remove('hidden');
        
        // 4. ක්ලික් කරපු Button එකට විතරක් Active ගතිය (නිල් ඉර සහ Background) දෙනවා
        button.classList.add('active', 'bg-primaryBlue/10', 'text-primaryBlue', 'font-bold');
        button.classList.remove('text-slate-500', 'font-semibold');

        // ෆෝන් එකෙන් බලද්දී මෙනු එකක් එබුවම ස්වයංක්‍රීයව Sidebar එක වැහෙනවා
        if (window.innerWidth < 768) toggleSidebar();
    });
});


// ==========================================
// C. Authentication & User Session
// =========================================
async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = session.user; 
    
    // Topbar Update
    document.getElementById('displayName').innerText = currentUser.user_metadata?.full_name || 'Student';
    document.getElementById('displayStudentId').innerText = currentUser.user_metadata?.student_id || 'N/A';
    
    // Data Fetch Functions
    fetchProgressData();
    loadProfileData(); // මේ පේළියෙන් තමයි Profile එකේ දත්ත අදින්නේ!
}


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

// ==========================================
// H. Profile Management Logic
// ==========================================

// 1. Load Data to Profile Fields
async function loadProfileData() {
    if (!currentUser) return;
    
    // Auth එකෙන් එන ඊමේල් එක සහ ID එක සෙට් කිරීම
    document.getElementById('profEmail').value = currentUser.email;
    document.getElementById('profTopId').innerText = currentUser.user_metadata?.student_id || 'N/A';
    document.getElementById('profTopName').innerText = currentUser.user_metadata?.full_name || 'Student';

    // DB එකේ students table එකෙන් දත්ත ගැනීම
    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('user_id', currentUser.id)
        .single(); // එක්කෙනෙකුගේ දත්ත පමණක් නිසා single()

    if (data) {
        // දත්ත තියෙනවා නම් Form එකට පුරවනවා
        document.getElementById('profGrade').value = data.grade || '';
        document.getElementById('profFullName').value = data.full_name || '';
        document.getElementById('profFirstName').value = data.first_name || '';
        document.getElementById('profLastName').value = data.last_name || '';
        document.getElementById('profPhone1').value = data.phone_1 || '';
        document.getElementById('profPhone2').value = data.phone_2 || '';
        document.getElementById('profNic').value = data.nic || '';
        document.getElementById('profWhatsapp').value = data.whatsapp || '';
        document.getElementById('profDob').value = data.dob || '';
        document.getElementById('profDistrict').value = data.district || '';
        document.getElementById('profInstitute').value = data.institute || '';
        document.getElementById('profSchool').value = data.school || '';
        document.getElementById('profGuardianName').value = data.guardian_name || '';
        document.getElementById('profGuardianPhone').value = data.guardian_phone || '';
        document.getElementById('profAddress').value = data.address || '';
        
        // Top Card එකේ අකුරු අප්ඩේට් කිරීම
        if(data.grade) document.getElementById('profTopGrade').innerText = data.grade;
        if(data.first_name) {
            document.getElementById('profAvatarText').innerText = data.first_name.charAt(0).toUpperCase();
        }
    }
}

// 2. Save Profile Data
document.getElementById('profSaveBtn').addEventListener('click', async () => {
    if (!currentUser) return;

    const statusMsg = document.getElementById('profStatusMsg');
    statusMsg.innerText = "Saving... ⏳";
    statusMsg.className = "font-bold text-sm text-primaryBlue mt-4";
    statusMsg.classList.remove('hidden');

    const profileData = {
        user_id: currentUser.id,
        student_id: currentUser.user_metadata?.student_id,
        grade: document.getElementById('profGrade').value,
        full_name: document.getElementById('profFullName').value,
        first_name: document.getElementById('profFirstName').value,
        last_name: document.getElementById('profLastName').value,
        phone_1: document.getElementById('profPhone1').value,
        phone_2: document.getElementById('profPhone2').value,
        nic: document.getElementById('profNic').value,
        whatsapp: document.getElementById('profWhatsapp').value,
        dob: document.getElementById('profDob').value,
        district: document.getElementById('profDistrict').value,
        institute: document.getElementById('profInstitute').value,
        school: document.getElementById('profSchool').value,
        guardian_name: document.getElementById('profGuardianName').value,
        guardian_phone: document.getElementById('profGuardianPhone').value,
        address: document.getElementById('profAddress').value
    };

    // Upsert (දත්ත නැත්නම් අලුතින් දානවා, තියෙනවා නම් අප්ඩේට් කරනවා)
    const { error } = await supabaseClient
        .from('students')
        .upsert(profileData, { onConflict: 'user_id' });

    if (error) {
        console.error(error);
        statusMsg.innerText = "Error saving profile! ❌";
        statusMsg.className = "font-bold text-sm text-red-500 mt-4";
    } else {
        statusMsg.innerText = "Profile Saved Successfully! ✅";
        statusMsg.className = "font-bold text-sm text-green-500 mt-4";
        
        // Top Card එකේ Grade එක අප්ඩේට් කිරීම
        if(profileData.grade) document.getElementById('profTopGrade').innerText = profileData.grade;
        
        setTimeout(() => statusMsg.classList.add('hidden'), 3000);
    }
});

// 3. ලොග් වුණ ගමන් Profile Data Load කරන්න `checkUserSession` එක ඇතුළට කෝඩ් එක දාමු
// (ඔයාගේ කලින් තියෙන checkUserSession function එක ඇතුළේ යටින්ම loadProfileData(); කියලා දාන්න).
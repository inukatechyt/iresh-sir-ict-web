// 1. Supabase සම්බන්ධ කිරීම
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// ==========================================
// A. Sidebar & Hamburger Menu Logic
// ==========================================
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('openSidebarBtn');
const closeBtn = document.getElementById('closeSidebarBtn');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if (window.innerWidth >= 768) {
        sidebar.classList.toggle('is-expanded');
    } else {
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
    if(button) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-primaryBlue/10', 'text-primaryBlue', 'font-bold');
                btn.classList.add('text-slate-500', 'font-semibold');
            });

            document.getElementById(link.secId).classList.remove('hidden');
            button.classList.add('active', 'bg-primaryBlue/10', 'text-primaryBlue', 'font-bold');
            button.classList.remove('text-slate-500', 'font-semibold');

            if (window.innerWidth < 768) toggleSidebar();
        });
    }
});


// ==========================================
// C. Authentication & User Session
// ==========================================
async function checkUserSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user; 
    
    // Topbar Update (මෙතනින් තමයි උඩ බාර් එකට නමයි ID එකයි එන්නේ)
    document.getElementById('displayName').innerText = currentUser.user_metadata?.full_name || 'Student';
    document.getElementById('displayStudentId').innerText = currentUser.user_metadata?.student_id || 'N/A';
    
    // දත්ත අදින Functions කෝල් කිරීම
    fetchProgressData();
    loadProfileData(); // Profile දත්ත අදින්නේ මෙතනින්!
}

checkUserSession();

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});


// ==========================================
// D. Chart Setup & Progress Logic
// ==========================================
const ctx = document.getElementById('progressChart')?.getContext('2d');
let progressChart = null;
if(ctx) {
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'වැඩ කළ පැය ගණන', data: [], backgroundColor: '#3B82F6', borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, suggestedMax: 10 } } }
    });
}

document.getElementById('saveDataBtn')?.addEventListener('click', async () => {
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

async function fetchProgressData() {
    if (!currentUser || !progressChart) return;
    const { data, error } = await supabaseClient.from('study_progress')
        .select('date, hours').eq('user_id', currentUser.id).order('date', { ascending: true }).limit(7);

    if (!error && data) {
        progressChart.data.labels = data.map(r => r.date);
        progressChart.data.datasets[0].data = data.map(r => r.hours);
        progressChart.update();
    }
}

// ==========================================
// E. Payment Slip Upload
// ==========================================
document.getElementById('uploadSlipBtn')?.addEventListener('click', async () => {
    if (!currentUser) return;
    const paymentFor = document.getElementById('paymentFor').value;
    const amount = document.getElementById('paymentAmount').value;
    const file = document.getElementById('slipFile').files[0];

    if (!paymentFor || !amount || !file) return alert("කරුණාකර සියලුම විස්තර සහ ඡායාරූපය ඇතුළත් කරන්න.");

    const statusMsg = document.getElementById('uploadStatusMsg');
    statusMsg.innerText = "Upload වෙමින් පවතී... ⏳";
    statusMsg.className = "text-sm font-bold mt-4 text-primaryBlue block";

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
        statusMsg.className = "text-sm font-bold mt-4 text-green-500 block";
        document.getElementById('paymentFor').value = '';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('slipFile').value = '';

    } catch (error) {
        statusMsg.innerText = "Upload කිරීම අසාර්ථකයි! ❌";
        statusMsg.className = "text-sm font-bold mt-4 text-red-500 block";
    }
});

// ==========================================
// F. Profile Management Logic
// ==========================================
async function loadProfileData() {
    if (!currentUser) return;

    const emailField = document.getElementById('profEmail');
    if(emailField) emailField.value = currentUser.email || '';
    
    document.getElementById('profTopId').innerText = currentUser.user_metadata?.student_id || 'N/A';

    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle(); 

    if (error) {
        console.error("Profile load error:", error);
        return;
    }

    if (data) {
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
        
        // 🔥 Database එකෙන් නම අරගෙන UI එක අප්ඩේට් කිරීම 🔥
        const dbFullName = data.full_name || currentUser.user_metadata?.full_name || 'Student';
        const dbFirstName = data.first_name || dbFullName;

        document.getElementById('profTopName').innerText = dbFullName; // Profile එකේ ලොකු නම
        document.getElementById('displayName').innerText = dbFirstName; // Topbar එකේ "Good Afternoon, Inuka!"

        if(data.grade) document.getElementById('profTopGrade').innerText = data.grade;
        
        if(dbFirstName) {
            const firstLetter = dbFirstName.charAt(0).toUpperCase();
            document.getElementById('profAvatarText').innerText = firstLetter;
            const topAvatar = document.getElementById('topAvatarText');
            if(topAvatar) topAvatar.innerText = firstLetter;
        }
    } else {
        // දත්ත නැත්නම් Sign Up වුණ නම පෙන්නනවා
        const authName = currentUser.user_metadata?.full_name || 'Student';
        document.getElementById('profTopName').innerText = authName;
        document.getElementById('displayName').innerText = authName;
    }
}

document.getElementById('profSaveBtn')?.addEventListener('click', async () => {
    if (!currentUser) return;

    const statusMsg = document.getElementById('profStatusMsg');
    statusMsg.innerText = "Saving... ⏳";
    statusMsg.className = "font-bold text-sm text-primaryBlue block mt-4";
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

    const { error } = await supabaseClient
        .from('students')
        .upsert(profileData, { onConflict: 'user_id' });

    if (error) {
        console.error(error);
        statusMsg.innerText = "Error saving profile! ❌";
        statusMsg.className = "font-bold text-sm text-red-500 block mt-4";
    } else {
        statusMsg.innerText = "Profile Saved Successfully! ✅";
        statusMsg.className = "font-bold text-sm text-green-600 block mt-4 bg-green-50 p-2 rounded-lg text-center";
        
        // 🔥 Save කරපු ගමන් අලුත් නම UI එකට දැමීම 🔥
        const newFullName = profileData.full_name || 'Student';
        const newFirstName = profileData.first_name || newFullName;

        document.getElementById('profTopName').innerText = newFullName;
        document.getElementById('displayName').innerText = newFirstName;

        if(profileData.grade) document.getElementById('profTopGrade').innerText = profileData.grade;
        
        if(newFirstName) {
            const newFirstLetter = newFirstName.charAt(0).toUpperCase();
            document.getElementById('profAvatarText').innerText = newFirstLetter;
            const topAvatar = document.getElementById('topAvatarText');
            if(topAvatar) topAvatar.innerText = newFirstLetter;
        }
        
        setTimeout(() => { statusMsg.classList.add('hidden'); }, 3000);
    }
});
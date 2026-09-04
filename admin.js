// 1. Supabase සම්බන්ධ කිරීම 
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// ==========================================
// 🚨 ADMIN SECURITY GUARD 🚨
// ==========================================

const ADMIN_EMAILS = [
    'test3@gmail.com', 'ireshdweb@gmail.com' , 'inukatech10@gmail.com'
];

async function checkAdminSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    // 1. ලොග් වෙලා නැත්නම් Login එකට යවනවා
    if (!session || error) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    
    // 2. ලොග් වුණ කෙනා Admin කෙනෙක්ද කියලා බලනවා
    if (!ADMIN_EMAILS.includes(currentUser.email)) {
        alert("Access Denied! You are not authorized to view this page.");
        window.location.href = 'dashboard.html'; // ළමයෙක් නම් ආපහු Student Dashboard එකට විසි කරනවා
        return;
    }
    
    // Admin කෙනෙක් නම් විතරක් නම පෙන්නනවා
    document.getElementById('adminName').innerText = currentUser.user_metadata?.full_name || currentUser.email;
    
    // මෙතනින් යටට අපි පස්සේ දත්ත අදින Functions කෝල් කරනවා
}

checkAdminSession();

// ==========================================
// Menu Logic & Navigation
// ==========================================
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('openSidebarBtn');
const closeBtn = document.getElementById('closeSidebarBtn');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

openBtn.addEventListener('click', toggleSidebar);
closeBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

const navLinks = [
    { btnId: 'menu_overview', secId: 'sec_overview' },
    { btnId: 'menu_payments', secId: 'sec_payments' },
    { btnId: 'menu_students', secId: 'sec_students' },
    { btnId: 'menu_lessons', secId: 'sec_lessons' }
];

navLinks.forEach(link => {
    const button = document.getElementById(link.btnId);
    if(button) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(link.secId).classList.remove('hidden');
            button.classList.add('active');

            if (window.innerWidth < 1024) toggleSidebar();
        });
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});
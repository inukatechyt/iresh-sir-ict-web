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
    loadPendingPayments();
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

// ==========================================
// Payment Approvals Logic
// ==========================================
window.approvePayment = async function(paymentId, userId, classId) {
    if(!confirm("Are you sure you want to approve this payment?")) return;
    
    // 1. මුලින්ම පේමන්ට් එක 'Approved' කියලා අප්ඩේට් කරනවා
    const { error: payErr } = await supabaseClient
        .from('payments')
        .update({ status: 'Approved' })
        .eq('id', paymentId);
        
    if(payErr) {
        alert("Error updating payment: " + payErr.message);
        return;
    }

    // 2. ඊටපස්සේ ළමයාව ඒ පන්තියට Enroll කරනවා (Duplicate වීම වැළැක්වීමට upsert පාවිච්චි කරමු)
    if (classId && classId !== 'null' && classId !== 'undefined' && classId !== '') {
        const { error: enrollErr } = await supabaseClient
            .from('enrollments')
            .upsert([
                { user_id: userId, class_id: parseInt(classId), status: 'Active' }
            ], { onConflict: 'user_id,class_id' });

        if (enrollErr) {
            console.error("Enrollment error:", enrollErr);
            alert("Payment Approved, but failed to enroll student: " + enrollErr.message);
            return;
        }
    } else {
        alert("Payment Approved! Note: This payment had no linked Class ID, so auto-enrollment was skipped.");
        loadPendingPayments();
        return;
    }

    alert("Payment Approved & Class Activated Successfully! ✅");
    loadPendingPayments(); // Table එක Refresh කිරීම
}

window.approvePayment = async function(paymentId, userId, classId) {
    if(!confirm("Are you sure you want to approve this payment?")) return;
    
    // 1. Payment එක 'Approved' කිරීම
    const { error: payErr } = await supabaseClient.from('payments').update({ status: 'Approved' }).eq('id', paymentId);
    if(payErr) return alert("Error: " + payErr.message);

    // 2. ළමයාව පන්තියට Enroll කිරීම (Class ID එකක් තිබුණොත් පමණක්)
    if (classId && classId !== 'null' && classId !== 'undefined') {
        await supabaseClient.from('enrollments').insert([{ user_id: userId, class_id: parseInt(classId) }]);
    }

    alert("Payment Approved & Class Activated! ✅");
    loadPendingPayments();
}


// ==========================================
// Lesson Manager Logic (Add New Class)
// ==========================================

document.getElementById('saveClassBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('classTitle').value;
    const desc = document.getElementById('classDesc').value;
    const type = document.getElementById('classType').value;
    const price = document.getElementById('classPrice').value;
    const file = document.getElementById('classCover').files[0];

    if (!title || !price || !file) {
        alert("කරුණාකර මාතෘකාව, මිල සහ කවරයේ පින්තූරය අනිවාර්යයෙන් ඇතුළත් කරන්න!");
        return;
    }

    const statusMsg = document.getElementById('classStatusMsg');
    statusMsg.innerText = "Publishing Class... ⏳";
    statusMsg.className = "font-bold text-sm text-primaryAdmin block";
    statusMsg.classList.remove('hidden');

    try {
        // 1. Upload Cover Image to 'class_covers' bucket
        const fileName = `class_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabaseClient.storage.from('class_covers').upload(fileName, file);
        if (uploadError) throw uploadError;

        // 2. Get the Public URL of the uploaded image
        const { data: { publicUrl } } = supabaseClient.storage.from('class_covers').getPublicUrl(fileName);

        // 3. Insert class details into Database
        const { error: dbError } = await supabaseClient.from('classes').insert([
            { 
                title: title, 
                description: desc, 
                type: type, 
                price: parseInt(price), 
                cover_image: publicUrl 
            }
        ]);
        
        if (dbError) throw dbError;

        statusMsg.innerText = "Class Published Successfully! 🎉";
        statusMsg.className = "font-bold text-sm text-green-500 block";
        
        // Form එක Clear කිරීම
        document.getElementById('classTitle').value = '';
        document.getElementById('classDesc').value = '';
        document.getElementById('classPrice').value = '';
        document.getElementById('classCover').value = '';

        setTimeout(() => { statusMsg.classList.add('hidden'); }, 4000);

    } catch (error) {
        console.error(error);
        statusMsg.innerText = "Error publishing class! ❌";
        statusMsg.className = "font-bold text-sm text-red-500 block";
    }
});
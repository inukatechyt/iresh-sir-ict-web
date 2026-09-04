// Supabase Connection (සම්පූර්ණයෙන්ම අලුතින් සහ නිවැරදිව සම්බන්ධ කිරීම)
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================
// 1. ADMIN CONFIG & SECURITY
// ==========================================
const ADMIN_EMAILS = [
    'test3@gmail.com',
    'ireshsir@gmail.com',
    'inukatech10@gmail.com'
];

let currentUser = null;

// ==========================================
// 2. LOAD PENDING PAYMENTS FUNCTION (මුලින්ම දාලා තියෙනවා)
// ==========================================
// ==========================================
// SECURE & DEBUGGED LOAD PENDING PAYMENTS
// ==========================================
async function loadPendingPayments() {
    const tbody = document.getElementById('pendingPaymentsTable');
    if(!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 font-bold">Loading pending payments... ⏳</td></tr>`;

    try {
        // Supabase variable name safety check
        const client = window.supabaseClient || window.supabase;
        if (!client) {
            throw new Error("Supabase client is not initialized!");
        }

        const { data, error } = await client
            .from('payments')
            .select('*')
            .eq('status', 'Pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase Error:", error);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400 font-bold">DB Error: ${error.message}</td></tr>`;
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 font-bold">No pending payments to approve. 🎉 (Database is empty or all approved)</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        data.forEach(payment => {
            const dateStr = new Date(payment.created_at).toLocaleString();
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-800 hover:bg-slate-800/40 transition';
            tr.innerHTML = `
                <td class="py-4 px-4 text-sm font-bold text-white">${payment.payment_for || 'N/A'}</td>
                <td class="py-4 px-4 text-sm font-bold text-green-400">Rs. ${payment.amount}</td>
                <td class="py-4 px-4 text-sm text-slate-400">${dateStr}</td>
                <td class="py-4 px-4 text-sm">
                    <a href="${payment.slip_url}" target="_blank" class="text-purple-400 hover:underline font-bold flex items-center">View Slip ↗</a>
                </td>
                <td class="py-4 px-4 text-sm">
                    <button onclick="approvePayment('${payment.id}', '${payment.user_id}', '${payment.class_id || ''}')" class="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition transform hover:scale-105">Approve</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Catch Error:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400 font-bold">Error: ${err.message}</td></tr>`;
    }
}

// ==========================================
// 3. APPROVE PAYMENT LOGIC
// ==========================================
window.approvePayment = async function(paymentId, userId, classId) {
    if(!confirm("Are you sure you want to approve this payment?")) return;
    
    const { error: payErr } = await supabaseClient
        .from('payments')
        .update({ status: 'Approved' })
        .eq('id', paymentId);
        
    if(payErr) {
        alert("Error updating payment: " + payErr.message);
        return;
    }

    if (classId && classId !== 'null' && classId !== 'undefined' && classId !== '') {
        await supabaseClient
            .from('enrollments')
            .upsert([
                { user_id: userId, class_id: parseInt(classId), status: 'Active' }
            ], { onConflict: 'user_id,class_id' });
    }

    alert("Payment Approved & Class Activated Successfully! ✅");
    loadPendingPayments();
}

// ==========================================
// 4. CHECK ADMIN SESSION (අගටම දාලා තියෙනවා)
// ==========================================
async function checkAdminSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (!session || error) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    
    if (!ADMIN_EMAILS.includes(currentUser.email)) {
        alert("Access Denied! You are not authorized to view this page.");
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('adminName').innerText = currentUser.user_metadata?.full_name || currentUser.email;
    
    // දැන් Function එක උඩින් ඩිෆයින් කරලා තියෙන නිසා මේක හරියට වැඩ කරයි!
    loadPendingPayments(); 
}

checkAdminSession();

// ==========================================
// 5. SIDEBAR & NAVIGATION LOGIC
// ==========================================
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('openSidebarBtn');
const closeBtn = document.getElementById('closeSidebarBtn');
const overlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    if(sidebar) sidebar.classList.toggle('-translate-x-full');
    if(overlay) overlay.classList.toggle('hidden');
}

if(openBtn) openBtn.addEventListener('click', toggleSidebar);
if(closeBtn) closeBtn.addEventListener('click', toggleSidebar);
if(overlay) overlay.addEventListener('click', toggleSidebar);

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
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            const targetSec = document.getElementById(link.secId);
            if(targetSec) targetSec.classList.remove('hidden');
            button.classList.add('active');

            if (window.innerWidth < 1024) toggleSidebar();
        });
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });
}
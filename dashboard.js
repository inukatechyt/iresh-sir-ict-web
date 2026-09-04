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
    loadProfileData(); 
    loadLessonStore();
    loadMyClasses();// Profile දත්ත අදින්නේ මෙතනින්!
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


// ==========================================
// G. Lesson Store & Automated Payments
// ==========================================

// 1. Lesson Store එකට Database එකෙන් පන්ති ගෙන ඒම
async function loadLessonStore() {
    const storeGrid = document.querySelector('#sec_lessonstore .grid');
    if(!storeGrid) return;

    storeGrid.innerHTML = '<p class="col-span-full text-center text-textGray font-bold text-lg">Loading classes... ⏳</p>';

    const { data, error } = await supabaseClient
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) {
        storeGrid.innerHTML = '<p class="col-span-full text-center text-red-500 font-bold">Error loading store!</p>';
        return;
    }

    if (data.length === 0) {
        storeGrid.innerHTML = '<p class="col-span-full text-center text-textGray font-bold text-lg">තාමත් පන්ති ඇතුළත් කර නොමැත. කරුණාකර පසුව පැමිණෙන්න! 🛒</p>';
        return;
    }

    storeGrid.innerHTML = '';

    data.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-[2rem] shadow-card hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full border border-slate-50';
        
        const imgHtml = cls.cover_image 
            ? `<img src="${cls.cover_image}" class="w-full h-48 object-cover rounded-2xl mb-6 shadow-sm border border-slate-100">`
            : `<div class="h-48 bg-bgLight rounded-2xl mb-6 flex items-center justify-center shadow-inner"><span class="text-textGray font-bold">No Cover Image</span></div>`;

        card.innerHTML = `
            ${imgHtml}
            <div class="flex items-center mb-3">
                <span class="bg-blue-50 text-primaryBlue px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide">${cls.type}</span>
            </div>
            <h4 class="font-black text-xl text-textDark mb-2">${cls.title}</h4>
            <p class="text-sm text-textGray font-semibold mb-6 line-clamp-2">${cls.description || ''}</p>
            
            <div class="mt-auto">
                <p class="text-primaryBlue font-black text-3xl mb-4">Rs. ${cls.price}</p>
                <button onclick="buyClass('${cls.id}', '${cls.title}', ${cls.price})" class="w-full bg-bgLight hover:bg-primaryBlue hover:text-white text-textDark font-black py-4 rounded-xl transition-colors shadow-sm">
                    Buy Now 💳
                </button>
            </div>
        `;
        storeGrid.appendChild(card);
    });
}

// 2. Buy Now එබුවම Payment Form එක ඔටෝමැටික් පිරවීම
window.buyClass = function(classId, title, price) {
    // මෙනු එක Payments වලට මාරු කිරීම
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active', 'bg-slate-50', 'text-primaryBlue'));
    
    document.getElementById('sec_payments').classList.remove('hidden');
    document.getElementById('menu_payments').classList.add('active', 'bg-slate-50', 'text-primaryBlue');

    // Form එකට දත්ත පිරවීම සහ Lock කිරීම (ළමයාට වෙනස් කරන්න බැරි වෙන්න)
    const payFor = document.getElementById('paymentFor');
    const payAmount = document.getElementById('paymentAmount');
    
    payFor.value = title;
    payFor.dataset.classId = classId; // අදාළ පන්තියේ ID එක හැංගුවා 
    payFor.readOnly = true;
    payFor.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');

    payAmount.value = price;
    payAmount.readOnly = true;
    payAmount.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');
}

// 3. අලුත් ක්‍රමයට Slip එක Upload කිරීම (Class ID එකත් එක්ක)
document.getElementById('uploadSlipBtn')?.addEventListener('click', async () => {
    if (!currentUser) return;
    
    const paymentForInput = document.getElementById('paymentFor');
    const paymentFor = paymentForInput.value;
    const classId = paymentForInput.dataset.classId || null; 
    const amount = document.getElementById('paymentAmount').value;
    const file = document.getElementById('slipFile').files[0];

    if (!paymentFor || !amount || !file) {
        return alert("කරුණාකර සියලුම විස්තර සහ ඡායාරූපය ඇතුළත් කරන්න.");
    }

    const statusMsg = document.getElementById('uploadStatusMsg');
    statusMsg.innerText = "Uploading... ⏳";
    statusMsg.className = "text-sm font-bold text-primaryBlue block mt-5";
    statusMsg.classList.remove('hidden');

    try {
        const fileName = `slip_${currentUser.id}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabaseClient.storage.from('payment_slips').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage.from('payment_slips').getPublicUrl(fileName);

        // Database එකට Class ID එකත් එක්කම යවනවා
        const { error: dbError } = await supabaseClient.from('payments').insert([
            { 
                user_id: currentUser.id, 
                payment_for: paymentFor, 
                amount: parseInt(amount), 
                slip_url: publicUrl, 
                status: 'Pending',
                class_id: classId 
            }
        ]);
        
        if (dbError) throw dbError;

        statusMsg.innerText = "සාර්ථකව Upload කරන ලදී! ✅";
        statusMsg.className = "text-sm font-bold text-green-500 block mt-5 bg-green-50 p-3 rounded-xl text-center";
        
        // Form එක ආපසු Clear කිරීම
        paymentForInput.value = '';
        paymentForInput.removeAttribute('data-class-id');
        paymentForInput.readOnly = false;
        paymentForInput.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');
        
        const payAmount = document.getElementById('paymentAmount');
        payAmount.value = '';
        payAmount.readOnly = false;
        payAmount.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed');
        
        document.getElementById('slipFile').value = '';

        setTimeout(() => { statusMsg.classList.add('hidden'); }, 4000);

    } catch (error) {
        console.error(error);
        statusMsg.innerText = "Upload කිරීම අසාර්ථකයි! ❌";
        statusMsg.className = "text-sm font-bold text-red-500 block mt-5";
    }
});

// ==========================================
// H. Load Enrolled Classes ("My Class")
// ==========================================
async function loadMyClasses() {
    const myClassSec = document.getElementById('sec_myclass');
    if(!myClassSec || !currentUser) return;

    // ළමයාට අදාළ Enrollments සහ ඒකට සම්බන්ධ Class විස්තර අදිනවා
    const { data, error } = await supabaseClient
        .from('enrollments')
        .select(`id, classes ( id, title, description, cover_image, type )`)
        .eq('user_id', currentUser.id)
        .eq('status', 'Active');

    if (error || !data || data.length === 0) return; // පන්ති නැත්නම් අර කලින් තිබ්බ හිස් පණිවිඩයම තියෙනවා

    // පන්ති තියෙනවා නම් UI එක අලුතින් හදනවා
    myClassSec.innerHTML = `
        <h3 class="text-3xl font-black mb-8 pl-2 text-textDark flex items-center">
            <svg class="w-8 h-8 mr-3 text-primaryBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            My Classes
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8" id="activeClassesGrid"></div>
    `;

    const grid = document.getElementById('activeClassesGrid');
    data.forEach(enrollment => {
        const cls = enrollment.classes;
        if(!cls) return;
        const imgHtml = cls.cover_image ? `<img src="${cls.cover_image}" class="w-full h-40 object-cover rounded-2xl mb-5 shadow-sm border border-slate-100">` : ``;
        
        grid.innerHTML += `
            <div class="bg-white p-6 rounded-[2rem] shadow-card flex flex-col h-full border-t-4 border-primaryBlue">
                ${imgHtml}
                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide w-max mb-3">Active</span>
                <h4 class="font-black text-xl text-textDark mb-2">${cls.title}</h4>
                <div class="mt-auto pt-5">
                    <button class="w-full bg-primaryBlue hover:bg-blue-600 text-white font-black py-3.5 rounded-xl transition-colors shadow-sm">
                        Watch Lessons 🎬
                    </button>
                </div>
            </div>
        `;
    });
}

window.filterClasses = function(type, btnElement) {
    // Buttons වල පාට මාරු කිරීම
    document.querySelectorAll('.store-filter-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-primaryBlue', 'shadow-sm');
        btn.classList.add('text-textGray');
    });
    btnElement.classList.add('bg-white', 'text-primaryBlue', 'shadow-sm');
    btnElement.classList.remove('text-textGray');

    // Cards ෆිල්ටර් කිරීම (Title එකේ A/L හෝ O/L තියෙනවද කියලා බලනවා)
    const cards = document.querySelectorAll('.class-card-item');
    cards.forEach(card => {
        const title = card.dataset.title;
        if (type === 'All') {
            card.style.display = 'flex';
        } else if (title.includes(type)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}
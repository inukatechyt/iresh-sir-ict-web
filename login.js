// 1. Supabase සම්බන්ධ කිරීම (ඔබේ විස්තර මෙතැනට දාන්න)
const SUPABASE_URL = 'https://ercowsldngxxzpvpevxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyY293c2xkbmd4eHpwdnBldnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjA1NjksImV4cCI6MjEwMzkzNjU2OX0.BGFibu7_xRZUl9c2rkH3KA-y0kJsm8iCA2YLtnRwn9o';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Error / Success Message පෙන්වන Function එක
function showMessage(message, isError = false) {
    const msgElement = document.getElementById('authMessage');
    msgElement.innerText = message;
    msgElement.classList.remove('hidden', 'text-green-600', 'text-red-600');
    
    if (isError) {
        msgElement.classList.add('text-red-600');
    } else {
        msgElement.classList.add('text-green-600');
    }
}

// Sign Up (ලියාපදිංචි වීම) කොටස පමණක් මේ විදිහට වෙනස් කරන්න
document.getElementById('signupBtn').addEventListener('click', async () => {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showMessage("කරුණාකර සියලුම විස්තර ඇතුළත් කරන්න.", true);
        return;
    }

    if (password.length < 6) {
        showMessage("මුරපදය සඳහා අවම වශයෙන් අකුරු 6ක් අවශ්‍යයි.", true);
        return;
    }

    showMessage("ගිණුම සාදමින් පවතී...", false);

    // අලුත් Student ID එකක් හැදීම (උදා: IRESHDICT582910)
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newStudentId = "IRESHDICT" + randomNum;

    // Supabase Auth හරහා ගිණුම සෑදීම
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { 
                full_name: name,
                student_id: newStudentId // අලුත් ID එක සේව් කිරීම
            }
        }
    });

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage(`ගිණුම සාර්ථකයි! ඔබේ ID එක: ${newStudentId}`, false);
        
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        
        setTimeout(() => toggleForms(), 3000); 
    }
});

// 3. Log In (ලොග් වීම)
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage("කරුණාකර Email සහ Password ඇතුළත් කරන්න.", true);
        return;
    }

    showMessage("ලොග් වෙමින් පවතී...", false);

    // Supabase Auth හරහා ලොග් වීම
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showMessage("Email හෝ මුරපදය වැරදියි!", true);
    } else {
        showMessage("ලොග් වීම සාර්ථකයි! Dashboard එකට යමින් පවතී...", false);
        
        // ලොග් වීම සාර්ථක නම් තත්පරයකින් Dashboard එකට (dashboard.html) යැවීම
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }
});


// Google Auth Logic
async function loginWithGoogle() {
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html' // ලොග් වුණාම යන්න ඕන තැන
            }
        });

        if (error) {
            console.error("Google Auth Error:", error.message);
            alert("Google Login Error: " + error.message);
        }
    } catch (err) {
        console.error("Catch Error:", err);
    }
}


// ==========================================
// Security: Disable Right Click & Dev Tools
// ==========================================

// 1. Right Click (Context Menu) එක නැවැත්වීම
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// 2. F12, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C නැවැත්වීම
document.addEventListener('keydown', function(e) {
    // F12 Key
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
    }
    // Ctrl + Shift + I (Inspect) / J (Console) / C (Element Select)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
    }
    // Ctrl + U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
    }
    // Ctrl + S (Save Page)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
    }
});
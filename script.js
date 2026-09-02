// AOS Animations Initialize කිරීම
AOS.init({
    once: true, // Scroll කරද්දී එක පාරක් විතරක් Animation එක වෙන්න
    offset: 100, // අදාළ කොටසට ආවම Animation එක පටන් ගන්න දුර
});

// Dark / Light Mode Toggle Logic (Desktop & Mobile)
const themeToggleBtn = document.getElementById('themeToggle');
const themeToggleMobile = document.getElementById('themeToggleMobile');
const htmlElement = document.documentElement;

function toggleTheme() {
    htmlElement.classList.toggle('dark');
}

themeToggleBtn.addEventListener('click', toggleTheme);
themeToggleMobile.addEventListener('click', toggleTheme);

// Mobile Menu Toggle Logic
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    // Hidden class එක අයින් කරනවා / දානවා
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
});
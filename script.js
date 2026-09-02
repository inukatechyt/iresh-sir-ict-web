// Dark / Light Mode Toggle Logic
const themeToggleBtn = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

themeToggleBtn.addEventListener('click', () => {
    // html tag එකේ තියෙන 'dark' class එක අයින් කරනවා හෝ දානවා
    htmlElement.classList.toggle('dark');
});
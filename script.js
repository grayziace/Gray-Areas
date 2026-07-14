document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');
        document.getElementById('view-title').innerText = target.toUpperCase();
        document.getElementById('viewport-content').innerHTML = `<p>LOADING ${target}_DATA_MODULE...</p>`;
    });
});

// Dynamic Bokeh/Star Background
const container = document.getElementById('star-container');
for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
    container.appendChild(star);
}
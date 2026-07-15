document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');
        const header = document.getElementById('view-title');
        const content = document.getElementById('viewport-content');
        
        header.style.opacity = '0';
        setTimeout(() => {
            header.innerText = target.toUpperCase();
            header.style.opacity = '1';
            content.innerHTML = `<p class="boot-text">ACCESSING // ${target.toUpperCase()}_MODULE...</p>`;
        }, 200);
    });
});
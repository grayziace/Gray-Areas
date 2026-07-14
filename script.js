document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Project Shenzhen...");
    const status = document.getElementById("status-light");
    status.style.backgroundColor = "var(--neon-cyan)";
    status.style.boxShadow = "0 0 10px var(--neon-cyan)";
});

window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    const skyline = document.getElementById('skyline');
    // Moves the background slower than the scroll
    skyline.style.transform = `translateY(${scroll * 0.3}px)`;
});

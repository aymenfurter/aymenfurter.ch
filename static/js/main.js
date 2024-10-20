document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    const glitchText = document.getElementById('glitch-text');
    const words = glitchText.getAttribute('data-words').split(',');
    let currentIndex = 0;
  
    function changeWord() {
      glitchText.setAttribute('data-text', words[currentIndex]);
      glitchText.textContent = words[currentIndex];
      currentIndex = (currentIndex + 1) % words.length;
    }
  
    setInterval(changeWord, 3000); // Change word every 3 seconds
  });
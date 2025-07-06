document.addEventListener('DOMContentLoaded', function () {
    // FADE-IN SECTIONS
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(section => observer.observe(section));

    // HEADER SCROLL EFFECT
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // GLITCH TEXT EFFECT
    const glitchText = document.getElementById('glitch-text');
    if (glitchText) {
        const words = JSON.parse(glitchText.getAttribute('data-words'));
        let currentIndex = 0;
        setInterval(() => {
            currentIndex = (currentIndex + 1) % words.length;
            glitchText.textContent = words[currentIndex];
        }, 2000);
    }

    // ARTICLE FILTERING LOGIC
    const yearFilter = document.getElementById('year-filter');
    const tagFilter = document.getElementById('tag-filter');
    const clearButton = document.getElementById('clear-filters');
    const articles = document.querySelectorAll('#articles-list .article-item');
    const noResultsMessage = document.getElementById('no-results');

    if (articles.length > 0) {
        const applyFilters = () => {
            const selectedYear = yearFilter.value;
            const selectedTag = tagFilter.value;
            let resultsFound = false;

            articles.forEach(article => {
                const articleYear = article.dataset.year;
                const articleTags = JSON.parse(article.dataset.tags || '[]');

                const yearMatch = (selectedYear === 'all' || selectedYear === articleYear);
                const tagMatch = (selectedTag === 'all' || articleTags.includes(selectedTag));

                if (yearMatch && tagMatch) {
                    article.style.display = 'block';
                    resultsFound = true;
                } else {
                    article.style.display = 'none';
                }
            });
            noResultsMessage.style.display = resultsFound ? 'none' : 'block';
        };

        if (yearFilter) yearFilter.addEventListener('change', applyFilters);
        if (tagFilter) tagFilter.addEventListener('change', applyFilters);
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                yearFilter.value = 'all';
                tagFilter.value = 'all';
                applyFilters();
            });
        }
    }
});
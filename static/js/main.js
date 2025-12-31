document.addEventListener('DOMContentLoaded', function () {
    // Prevent scroll restoration issues
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // FADE-IN SECTIONS (skip hero - it's always visible)
    const sections = document.querySelectorAll('section:not(.hero)');
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
        const wordsAttr = glitchText.getAttribute('data-words');
        let words;
        try {
            words = JSON.parse(wordsAttr);
        } catch (e) {
            words = wordsAttr.split(',');
        }
        let currentIndex = 0;
        
        const animateText = () => {
            glitchText.style.opacity = '0';
            glitchText.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % words.length;
                glitchText.textContent = words[currentIndex];
                glitchText.style.opacity = '1';
                glitchText.style.transform = 'translateY(0)';
            }, 200);
        };
        
        setInterval(animateText, 2500);
    }

    // PROJECT LIST - Expand/Collapse
    const projectItems = document.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
        const header = item.querySelector('.project-header');
        
        header.addEventListener('click', function() {
            const wasActive = item.classList.contains('active');
            
            // Close all items
            projectItems.forEach(p => {
                p.classList.remove('active');
                const video = p.querySelector('.project-video');
                if (video) {
                    video.pause();
                    const playBtn = p.querySelector('.play-btn');
                    if (playBtn) playBtn.classList.remove('hidden');
                }
            });
            
            // Toggle clicked item
            if (!wasActive) {
                item.classList.add('active');
            }
        });

        // Video controls
        const video = item.querySelector('.project-video');
        const playBtn = item.querySelector('.play-btn');
        const muteBtn = item.querySelector('.mute-btn');
        const progressBar = item.querySelector('.progress-bar');
        const progressFill = item.querySelector('.progress-fill');
        const controls = item.querySelector('.video-controls');
        
        if (video && playBtn) {
            playBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                video.play();
                this.classList.add('hidden');
                if (controls) controls.classList.add('visible');
            });
            
            video.addEventListener('click', function(e) {
                e.stopPropagation();
                if (video.paused) {
                    video.play();
                    playBtn.classList.add('hidden');
                } else {
                    video.pause();
                    playBtn.classList.remove('hidden');
                }
            });
            
            video.addEventListener('ended', function() {
                playBtn.classList.remove('hidden');
                if (controls) controls.classList.remove('visible');
            });
            
            if (muteBtn) {
                muteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    video.muted = !video.muted;
                    this.classList.toggle('muted', video.muted);
                });
            }
            
            if (progressBar && progressFill) {
                video.addEventListener('timeupdate', function() {
                    const percent = (video.currentTime / video.duration) * 100;
                    progressFill.style.width = percent + '%';
                });
                
                progressBar.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const rect = this.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    video.currentTime = percent * video.duration;
                });
            }
        }
    });

    // WRITING LIST AND ACTIVITY GRAPH FILTER
    const filterButtons = document.querySelectorAll('.filter-btn');
    const writingItems = document.querySelectorAll('.writing-item');
    const activityGrids = document.querySelectorAll('.activity-grid');
    const currentYear = new Date().getFullYear().toString();
    
    // LOAD GITHUB STARS
    const starLinks = document.querySelectorAll('.github-stars-link[data-repo]');
    starLinks.forEach(link => {
        const repoUrl = link.dataset.repo;
        const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
        if (match) {
            const repo = match[1];
            fetch(`https://api.github.com/repos/${repo}`)
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => {
                    const countEl = link.querySelector('.stars-count');
                    if (countEl && data.stargazers_count !== undefined) {
                        countEl.textContent = data.stargazers_count.toLocaleString();
                    }
                })
                .catch(() => {
                    // Keep fallback value from data-fallback attribute
                });
        }
    });
    
    const applyWritingFilter = (filter) => {
        // Filter writing list items
        writingItems.forEach((item, index) => {
            if (filter === 'recent') {
                // Show only first 3 items for "Recent"
                item.classList.toggle('hidden', index >= 3);
            } else if (filter === 'all') {
                // Show all items
                item.classList.remove('hidden');
            } else {
                // Filter by year
                item.classList.toggle('hidden', item.dataset.year !== filter);
            }
        });
        
        // Switch activity grid to the target year (hide all for "all" filter)
        const targetYear = (filter === 'recent') ? currentYear : filter;
        activityGrids.forEach((grid) => {
            if (filter === 'all') {
                grid.classList.add('hidden');
            } else {
                grid.classList.toggle('hidden', grid.dataset.year !== targetYear);
            }
        });
    };
    
    // Apply initial filter (recent - shows current year graph, 3 latest entries)
    if (writingItems.length > 0 || activityGrids.length > 0) {
        applyWritingFilter('recent');
    }
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            applyWritingFilter(filter);
        });
    });
    
    // Activity day click to navigate
    document.querySelectorAll('.activity-day').forEach(day => {
        if (day.dataset.url) {
            day.addEventListener('click', () => {
                window.location.href = day.dataset.url;
            });
        }
    });

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
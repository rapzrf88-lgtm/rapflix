class StreamApp {
    constructor() {
        this.baseURL = 'https://zeldvorik.ru/apiv3/api.php';
        this.currentCategory = 'trending';
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.searchTimeout = null;
        this.heroSlideIndex = 0;
        this.heroSlides = [];
        this.heroInterval = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHeroContent();
        this.loadContent('trending', 1, true);
        this.startHeroSlider();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('nav-toggle').addEventListener('click', () => {
            document.getElementById('nav-menu').classList.toggle('active');
        });

        // Category navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCategoryChange(e.target);
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Search results click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search') && !e.target.closest('.search-results')) {
                document.getElementById('search-results').classList.remove('active');
            }
        });

        // Load more
        document.getElementById('load-more-btn').addEventListener('click', () => {
            this.loadMoreContent();
        });

        // Modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'detail-modal') {
                this.closeModal();
            }
        });

        // Hero controls
        document.getElementById('hero-prev').addEventListener('click', () => {
            this.previousHeroSlide();
        });

        document.getElementById('hero-next').addEventListener('click', () => {
            this.nextHeroSlide();
        });

        // Scroll events
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.getElementById('search-results').classList.remove('active');
            }
        });
    }

    handleCategoryChange(target) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        target.classList.add('active');

        // Load new category
        const category = target.getAttribute('data-category');
        this.currentCategory = category;
        this.currentPage = 1;
        this.hasMore = true;

        // Update section title
        const titles = {
            'trending': 'Film & Series Trending',
            'indonesian-movies': 'Film Indonesia',
            'indonesian-drama': 'Drama Indonesia',
            'kdrama': 'K-Drama',
            'anime': 'Anime',
            'short-tv': 'Short TV'
        };

        document.getElementById('section-title').textContent = titles[category] || 'Konten';
        
        this.loadContent(category, 1, true);
    }

    async loadHeroContent() {
        try {
            const response = await fetch(`${this.baseURL}?action=trending&page=1`);
            const data = await response.json();
            
            if (data.success && data.items.length > 0) {
                this.heroSlides = data.items.slice(0, 5); // Take first 5 for hero
                this.renderHeroSlides();
            }
        } catch (error) {
            console.error('Error loading hero content:', error);
        }
    }

    renderHeroSlides() {
        const heroSlider = document.getElementById('hero-slider');
        heroSlider.innerHTML = '';

        this.heroSlides.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
            slide.style.backgroundImage = `url(${item.poster})`;

            slide.innerHTML = `
                <div class="hero-overlay">
                    <div class="hero-content">
                        <h2>${item.title}</h2>
                        <div class="hero-meta">
                            <span class="hero-rating"><i class="fas fa-star"></i> ${item.rating}</span>
                            <span class="hero-year">${item.year}</span>
                            <span class="hero-genre">${item.genre}</span>
                        </div>
                        <p>Nikmati ${item.type === 'movie' ? 'film' : 'series'} terbaik dengan kualitas HD. ${item.title} menawarkan pengalaman menonton yang tak terlupakan.</p>
                        <div class="hero-actions">
                            <button class="btn-primary" onclick="streamApp.openDetail('${item.detailPath}')">
                                <i class="fas fa-play"></i> Tonton Sekarang
                            </button>
                            <button class="btn-secondary" onclick="streamApp.openDetail('${item.detailPath}')">
                                <i class="fas fa-info-circle"></i> Info Lengkap
                            </button>
                        </div>
                    </div>
                </div>
            `;

            heroSlider.appendChild(slide);
        });
    }

    startHeroSlider() {
        this.heroInterval = setInterval(() => {
            this.nextHeroSlide();
        }, 7000);
    }

    nextHeroSlide() {
        if (this.heroSlides.length <= 1) return;

        const slides = document.querySelectorAll('.hero-slide');
        slides[this.heroSlideIndex].classList.remove('active');
        
        this.heroSlideIndex = (this.heroSlideIndex + 1) % this.heroSlides.length;
        slides[this.heroSlideIndex].classList.add('active');
    }

    previousHeroSlide() {
        if (this.heroSlides.length <= 1) return;

        const slides = document.querySelectorAll('.hero-slide');
        slides[this.heroSlideIndex].classList.remove('active');
        
        this.heroSlideIndex = this.heroSlideIndex === 0 ? this.heroSlides.length - 1 : this.heroSlideIndex - 1;
        slides[this.heroSlideIndex].classList.add('active');
    }

    async loadContent(category, page = 1, replace = false) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading(replace);

        try {
            const response = await fetch(`${this.baseURL}?action=${category}&page=${page}`);
            const data = await response.json();

            if (data.success) {
                this.renderContent(data.items, replace);
                this.hasMore = data.hasMore;
                this.updateLoadMoreButton();
            } else {
                this.showError('Gagal memuat konten');
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Terjadi kesalahan saat memuat konten');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderContent(items, replace = false) {
        const contentGrid = document.getElementById('content-grid');
        
        if (replace) {
            contentGrid.innerHTML = '';
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'content-card';
            card.setAttribute('data-detail-path', item.detailPath);
            
            card.innerHTML = `
                <div class="card-poster">
                    <img src="${item.poster}" alt="${item.title}" loading="lazy">
                    <div class="card-overlay">
                        <button class="btn-primary">
                            <i class="fas fa-play"></i> Tonton
                        </button>
                    </div>
                    <div class="card-rating"><i class="fas fa-star"></i> ${item.rating}</div>
                    <div class="card-type">${item.type === 'movie' ? 'Film' : 'Series'}</div>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${item.title}</h3>
                    <div class="card-meta">
                        <span class="card-year">${item.year}</span>
                        <span class="card-genre">${item.genre}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.openDetail(item.detailPath);
            });

            contentGrid.appendChild(card);
        });
    }

    loadMoreContent() {
        if (this.hasMore && !this.isLoading) {
            this.currentPage++;
            this.loadContent(this.currentCategory, this.currentPage, false);
        }
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        const searchResults = document.getElementById('search-results');
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 500);
    }

    async performSearch(query) {
        try {
            const response = await fetch(`${this.baseURL}?action=search&q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                this.renderSearchResults(data.items);
            }
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    renderSearchResults(items) {
        const searchResults = document.getElementById('search-results');
        
        if (items.length === 0) {
            searchResults.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Tidak ada hasil ditemukan</div>';
            searchResults.classList.add('active');
            return;
        }

        const searchGrid = document.createElement('div');
        searchGrid.className = 'search-grid';

        items.slice(0, 12).forEach(item => { // Limit to 12 results
            const card = document.createElement('div');
            card.className = 'search-card';
            
            card.innerHTML = `
                <div class="search-poster">
                    <img src="${item.poster}" alt="${item.title}" loading="lazy">
                </div>
                <div class="search-info">
                    <h4 class="search-title">${item.title}</h4>
                    <div class="search-meta">
                        <span>${item.year}</span>
                        <span><i class="fas fa-star"></i> ${item.rating}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.openDetail(item.detailPath);
                searchResults.classList.remove('active');
            });

            searchGrid.appendChild(card);
        });

        searchResults.innerHTML = '';
        searchResults.appendChild(searchGrid);
        searchResults.classList.add('active');
    }

    async openDetail(detailPath) {
        if (!detailPath) return;

        const modal = document.getElementById('detail-modal');
        const content = document.getElementById('detail-content');
        
        // Show loading
        content.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 400px;">
                <div class="loading-spinner active"></div>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`${this.baseURL}?action=detail&detailPath=${encodeURIComponent(detailPath)}`);
            const data = await response.json();

            if (data.success && data.detail) {
                this.renderDetailModal(data.detail);
            } else {
                this.showError('Detail tidak ditemukan');
            }
        } catch (error) {
            console.error('Error loading detail:', error);
            this.showError('Gagal memuat detail');
        }
    }

    renderDetailModal(detail) {
        const content = document.getElementById('detail-content');
        
        content.innerHTML = `
            <div class="detail-header" style="background-image: url('${detail.poster}');">
                <div class="detail-content-wrapper">
                    <div class="detail-poster">
                        <img src="${detail.poster}" alt="${detail.title}">
                    </div>
                    <div class="detail-info">
                        <h1 class="detail-title">${detail.title}</h1>
                        <div class="detail-meta">
                            <span class="detail-rating"><i class="fas fa-star"></i> ${detail.rating}</span>
                            <span class="detail-year">${detail.year}</span>
                            <span class="detail-type">${detail.type === 'movie' ? 'Film' : 'Series'}</span>
                            <span class="detail-genre">${detail.genre}</span>
                        </div>
                        <p class="detail-description">${detail.description || 'Nikmati konten berkualitas tinggi dengan pengalaman menonton yang tak terlupakan.'}</p>
                        <div class="detail-actions">
                            ${detail.playerUrl ? 
                                `<a href="${detail.playerUrl}" target="_blank" class="watch-btn">
                                    <i class="fas fa-play"></i> Tonton Sekarang
                                </a>` : 
                                '<button class="watch-btn" disabled>Player Tidak Tersedia</button>'
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            ${detail.playerUrl ? `
                <div style="padding: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: white;">Preview</h3>
                    <div class="video-player">
                        <iframe src="${detail.playerUrl}" allowfullscreen></iframe>
                    </div>
                </div>
            ` : ''}

            ${detail.episodes && detail.episodes.length > 0 ? `
                <div style="padding: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: white;">Episode</h3>
                    <div class="episodes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${detail.episodes.map(episode => `
                            <div class="episode-card" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; cursor: pointer;" 
                                 onclick="window.open('${episode.playerUrl}', '_blank')">
                                <h4 style="color: white; margin-bottom: 0.5rem;">${episode.title}</h4>
                                <p style="color: #ccc; font-size: 0.9rem;">Episode ${episode.number}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    closeModal() {
        const modal = document.getElementById('detail-modal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    showLoading(show = true) {
        const skeleton = document.getElementById('loading-skeleton');
        const grid = document.getElementById('content-grid');
        
        if (show) {
            skeleton.classList.add('active');
            grid.style.display = 'none';
        } else {
            skeleton.classList.remove('active');
            grid.style.display = 'grid';
        }
    }

    hideLoading() {
        const skeleton = document.getElementById('loading-skeleton');
        const grid = document.getElementById('content-grid');
        
        skeleton.classList.remove('active');
        grid.style.display = 'grid';
    }

    updateLoadMoreButton() {
        const button = document.getElementById('load-more-btn');
        const spinner = document.getElementById('load-spinner');
        
        if (this.isLoading) {
            button.disabled = true;
            spinner.classList.add('active');
            button.querySelector('span').textContent = 'Memuat...';
        } else {
            button.disabled = false;
            spinner.classList.remove('active');
            button.querySelector('span').textContent = this.hasMore ? 'Muat Lebih Banyak' : 'Tidak Ada Lagi';
            
            if (!this.hasMore) {
                button.style.display = 'none';
            }
        }
    }

    showError(message) {
        const grid = document.getElementById('content-grid');
        if (grid.children.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #e50914;"></i>
                    <h3 style="margin-bottom: 1rem;">Oops! ${message}</h3>
                    <button onclick="location.reload()" class="btn-primary">Coba Lagi</button>
                </div>
            `;
        }
    }

    handleScroll() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.streamApp = new StreamApp();
});

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

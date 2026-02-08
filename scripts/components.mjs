function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}

export function createHeader(activePage = 'home') {
    const header = document.createElement('div');
    header.innerHTML = `
        <nav class="navbar" role="navigation" aria-label="Main navigation">
            <div class="container">
                <div class="nav-brand">
                         <a href="${getBasePath()}index.html" class="brand-link">
                        <img src="${getBasePath()}images/cinemate.png" alt="Cinemate Logo" class="logo">
                        <h1>Cinemate</h1>
                    </a>
                </div>
                <ul class="nav-menu" id="navMenu">
                    <li>
                        <a href="${getBasePath()}index.html" 
                           class="nav-link ${activePage === 'home' ? 'active' : ''}" 
                           ${activePage === 'home' ? 'aria-current="page"' : ''}>
                            Home
                        </a>
                    </li>
                    <li>
                        <a href="${getBasePath()}pages/favorites.html" 
                           class="nav-link ${activePage === 'favorites' ? 'active' : ''}"
                           ${activePage === 'favorites' ? 'aria-current="page"' : ''}>
                            Favorites
                            <span class="nav-badge" id="favoritesBadge"></span>
                        </a>
                    </li>
                    <li>
                        <a href="${getBasePath()}pages/watchlist.html" 
                           class="nav-link ${activePage === 'watchlist' ? 'active' : ''}"
                           ${activePage === 'watchlist' ? 'aria-current="page"' : ''}>
                            Watchlist
                            <span class="nav-badge" id="watchlistBadge"></span>
                        </a>
                    </li>
                    <li>
                        <button id="randomMovieBtn" class="btn-random" aria-label="Get random movie">
                             Random Movie
                        </button>
                    </li>
                </ul>
                <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    `;

    document.body.prepend(header.firstElementChild);
    setupMobileMenu();

    return header.firstElementChild;
}

export function createFooter() {
    const footer = document.createElement('div');
    const currentYear = new Date().getFullYear();

    footer.innerHTML = `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h4>Cinemate</h4>
                        <p>Your personal movie discovery companion</p>
                    </div>
                    <div class="footer-section">
                        <h4>Quick Links</h4>
                        <ul class="footer-links">
                            <li><a href="${getBasePath()}index.html">Home</a></li>
                            <li><a href="${getBasePath()}pages/favorites.html">Favorites</a></li>
                            <li><a href="${getBasePath()}pages/watchlist.html">Watchlist</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Data Sources</h4>
                        <p>Movie data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">TMDb</a> & <a href="http://www.omdbapi.com/" target="_blank" rel="noopener">OMDb</a></p>
                    </div>
                    <div class="footer-section">
                        <h4>Statistics</h4>
                        <p id="footerStats">Loading statistics...</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${currentYear} Cinemate. Built with  for movie lovers by Tusiime Jesse.</p>
                </div>
            </div>
        </footer>
    `;

    document.body.appendChild(footer.firstElementChild);
    return footer.firstElementChild;
}

// Mobile menu toggle
function setupMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
    }
}

// Update badges in header
export function updateBadges(favoritesCount = 0, watchlistCount = 0) {
    const favoritesBadge = document.getElementById('favoritesBadge');
    const watchlistBadge = document.getElementById('watchlistBadge');

    if (favoritesBadge) {
        favoritesBadge.textContent = favoritesCount;
        favoritesBadge.style.display = favoritesCount > 0 ? 'inline-block' : 'none';
    }

    if (watchlistBadge) {
        watchlistBadge.textContent = watchlistCount;
        watchlistBadge.style.display = watchlistCount > 0 ? 'inline-block' : 'none';
    }
}

// Update footer stats
export function updateFooterStats(favoritesCount = 0, watchlistCount = 0) {
    const statsElement = document.getElementById('footerStats');
    if (statsElement) {
        statsElement.innerHTML = `
            ${favoritesCount} Favorite${favoritesCount !== 1 ? 's' : ''}<br>
            ${watchlistCount} in Watchlist
        `;
    }
}
import Storage from './storage.mjs';
import UI from './ui.mjs';
import API from './api.mjs'; 

export function setupMovieCardEvents() {
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (!card) return;

        const movieId = parseInt(card.dataset.id);

        // Handle favorite button
        if (e.target.closest('.btn-favorite')) {
            e.stopPropagation();
            const favBtn = e.target.closest('.btn-favorite');
            const movie = getMovieFromCard(card);
            toggleFavorite(movie, favBtn);
        }

        // Handle watchlist button
        if (e.target.closest('.btn-watchlist')) {
            e.stopPropagation();
            const watchBtn = e.target.closest('.btn-watchlist');
            const movie = getMovieFromCard(card);
            toggleWatchlist(movie, watchBtn);
        }
    });
}

export function setupRandomMovieButton() {
    const randomBtn = document.getElementById('randomMovieBtn');
    const modal = document.getElementById('randomModal');
    const closeBtn = document.querySelector('.modal-close');
    const getRandomBtn = document.getElementById('getRandomMovie');
    const randomGenre = document.getElementById('randomGenre');
    const randomRating = document.getElementById('randomRating');
    const randomResult = document.getElementById('randomMovieResult');
    
    if (!randomBtn) return;
    
    // Open modal
    randomBtn.addEventListener('click', async () => {
        // Populate genres if not already populated
        if (randomGenre && randomGenre.children.length <= 1) {
            await UI.populateGenres(randomGenre);
        }
        
        if (modal) modal.classList.remove('hidden');
    });
    
    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (randomResult) randomResult.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                if (randomResult) randomResult.classList.add('hidden');
            }
        });
    }
    
    // Get random movie
    if (getRandomBtn) {
        getRandomBtn.addEventListener('click', async () => {
            const genre = randomGenre?.value || '';
            const minRating = randomRating?.value || '0';
            
            getRandomBtn.disabled = true;
            getRandomBtn.textContent = 'Finding...';
            
            try {
                const filters = {
                    sort: 'popularity.desc',
                    minRating: minRating
                };
                if (genre) filters.genre = genre;
                
                // Get a random page
                const data = await API.discoverMovies(filters, Math.floor(Math.random() * 10) + 1);
                
                if (data.results && data.results.length > 0) {
                    const randomIndex = Math.floor(Math.random() * data.results.length);
                    const movie = data.results[randomIndex];
                    
                    randomResult.innerHTML = `
                        <div class="random-movie-result" onclick="window.location.href='pages/details.html?id=${movie.id}'">
                            <img src="${API.getImageUrl(movie.poster_path, 'w185') || '../images/no-poster.jpg'}" 
                                 alt="${movie.title}">
                            <div class="random-movie-info">
                                <h4>${movie.title}</h4>
                                <span>⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                                <p>${movie.overview?.substring(0, 100) || 'No description'}...</p>
                                <button class="btn-primary">View Details</button>
                            </div>
                        </div>
                    `;
                    randomResult.classList.remove('hidden');
                } else {
                    randomResult.innerHTML = '<p class="error">No movies found. Try different filters.</p>';
                    randomResult.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Random movie error:', error);
                randomResult.innerHTML = '<p class="error">Failed to get random movie. Try again.</p>';
                randomResult.classList.remove('hidden');
            } finally {
                getRandomBtn.disabled = false;
                getRandomBtn.textContent = 'Get Random Movie';
            }
        });
    }
}

function getMovieFromCard(card) {
    return {
        id: parseInt(card.dataset.id),
        title: card.querySelector('.movie-title')?.textContent || '',
        poster_path: card.querySelector('.movie-poster')?.getAttribute('src') || '',
        release_date: card.querySelector('.movie-year')?.textContent || '',
        vote_average: parseFloat(card.querySelector('.movie-rating')?.textContent?.replace('⭐ ', '') || 0)
    };
}

function toggleFavorite(movie, button) {
    const isFav = Storage.isFavorite(movie.id);

    if (isFav) {
        Storage.removeFavorite(movie.id);
        button.classList.remove('active');
        button.innerHTML = '🤍 Fav';

        // If on favorites page, remove the card
        if (window.location.pathname.includes('favorites.html')) {
            const card = button.closest('.movie-card');
            if (card) {
                card.remove();
                checkEmptyState('favoritesGrid', 'emptyState');
            }
        }
    } else {
        Storage.addFavorite(movie);
        button.classList.add('active');
        button.innerHTML = '❤️ Fav';
    }

    // Update badges
    if (typeof window.updateBadges === 'function') {
        window.updateBadges(
            Storage.getFavorites().length,
            Storage.getWatchlist().length
        );
    }
}

function toggleWatchlist(movie, button) {
    const isWatch = Storage.isInWatchlist(movie.id);

    if (isWatch) {
        Storage.removeFromWatchlist(movie.id);
        button.classList.remove('active');
        button.innerHTML = '+ List';

        // If on watchlist page, remove the card
        if (window.location.pathname.includes('watchlist.html')) {
            const card = button.closest('.movie-card');
            if (card) {
                card.remove();
                checkEmptyState('watchlistGrid', 'emptyState');
            }
        }
    } else {
        Storage.addToWatchlist(movie);
        button.classList.add('active');
        button.innerHTML = '✓ List';
    }

    // Update badges
    if (typeof window.updateBadges === 'function') {
        window.updateBadges(
            Storage.getFavorites().length,
            Storage.getWatchlist().length
        );
    }
}

function checkEmptyState(gridId, emptyStateId) {
    const grid = document.getElementById(gridId);
    const emptyState = document.getElementById(emptyStateId);

    if (grid && grid.children.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        grid.classList.add('hidden');
    }
}

// Search for a movie but stay on the same page
export function setupSearchEvents() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    if (!searchForm || !searchInput) {
        console.log('Search form not found');
        return;
    }

    // Remove existing listeners by cloning
    const newSearchForm = searchForm.cloneNode(true);
    searchForm.parentNode.replaceChild(newSearchForm, searchForm);

    const updatedForm = document.getElementById('searchForm');
    const updatedInput = document.getElementById('searchInput');

    updatedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const query = updatedInput.value.trim();

        if (!query) {
            UI.showError('Please enter a movie title');
            return;
        }

        UI.showLoading();

        try {
            const data = await API.searchMovies(query, 1);
            const moviesGrid = document.getElementById('moviesGrid');

            if (!moviesGrid) return;

            if (data.results && data.results.length > 0) {
                UI.renderMovieCards(data.results, moviesGrid);

                // Update section title
                const sectionTitle = document.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = `Search Results: "${query}"`;
                }

                // Hide pagination during search
                const pagination = document.getElementById('pagination');
                if (pagination) pagination.classList.add('hidden');

            } else {
                moviesGrid.innerHTML = `
                    <div class="no-results">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                        <h3 style="color: white; margin-bottom: 0.5rem;">No movies found for "${query}"</h3>
                        <p style="color: var(--text-secondary);">Try different keywords</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Search error:', error);
            UI.showError('Failed to search movies. Please try again.');
        } finally {
            UI.hideLoading();
        }
    });

    // Reset search when clicking on logo or home
    const brandLink = document.querySelector('.brand-link, .nav-brand a');
    if (brandLink) {
        brandLink.addEventListener('click', () => {
            setTimeout(resetToPopular, 100);
        });
    }
}

// Reset to popular movies 
export function resetToPopular() {
    const searchInput = document.getElementById('searchInput');
    const sectionTitle = document.querySelector('.section-title');

    if (searchInput) {
        searchInput.value = '';
    }

    if (sectionTitle) {
        sectionTitle.textContent = 'Featured Movies';
    }

    // Trigger filter reload
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
        const event = new Event('change');
        genreFilter.dispatchEvent(event);
    }

    // Show pagination again
    const pagination = document.getElementById('pagination');
    if (pagination) pagination.classList.remove('hidden');
}

export function setupFilterEvents(loadMoviesFunction) {
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (genreFilter) {
        genreFilter.addEventListener('change', loadMoviesFunction);
    }
    if (yearFilter) {
        yearFilter.addEventListener('change', loadMoviesFunction);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', loadMoviesFunction);
    }
}



import { createHeader, createFooter, updateBadges, updateFooterStats } from './components.mjs';
import API from './api.mjs';
import UI from './ui.mjs';
import Storage from './storage.mjs';
import { setupMovieCardEvents, setupSearchEvents, setupFilterEvents,setupRandomMovieButton } from './events.mjs';

let currentPage = 1;
let totalPages = 1;

async function initApp() {
    const path = window.location.pathname;
    let activePage = 'home';

    if (path.includes('favorites.html')) activePage = 'favorites';
    if (path.includes('watchlist.html')) activePage = 'watchlist';
    if (path.includes('details.html')) activePage = 'home';

    // Render header and footer
    createHeader(activePage);
    createFooter();

    function updateLastModified() {
        const lastModifiedElement = document.getElementById('lastModified');
        if (lastModifiedElement) {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            lastModifiedElement.textContent = `Last updated: ${formattedDate}`;
        }
    }

    // Update counts
    const favoritesCount = Storage.getFavorites().length;
    const watchlistCount = Storage.getWatchlist().length;
    updateBadges(favoritesCount, watchlistCount);
    updateFooterStats(favoritesCount, watchlistCount);

    // Setup events
    setupMovieCardEvents();
    setupSearchEvents();
    setupRandomMovieButton();

    // Load page-specific content
    await loadPageContent();

    updateLastModified();
}

async function loadPageContent() {
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        await loadHomePage();
    } else if (path.includes('favorites.html')) {
        await loadFavoritesPage();
    } else if (path.includes('watchlist.html')) {
        await loadWatchlistPage();
    } else if (path.includes('details.html')) {
        await loadDetailsPage();
    }

    async function loadDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            window.location.href = '../index.html';
            return;
        }

        UI.showLoading();

        try {
            // Fetch movie details from TMDB
            const movie = await API.getMovieDetails(movieId);

            // Update page title
            document.title = `${movie.title} - Cinemate`;

            // Fetch additional ratings from OMDb
            const year = movie.release_date?.substring(0, 4);
            const ratings = await API.getOMDbRatings(movie.title, year);


            // Render the movie details
            UI.renderMovieDetails(movie, ratings);

            // Hide spinner, show content
            document.getElementById('loadingSpinner')?.classList.add('hidden');
            document.getElementById('movieDetails')?.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading movie details:', error);
            UI.showError('Failed to load movie details. Please try again.');

            // Show error in the movie details container
            const container = document.getElementById('movieDetails');
            if (container) {
                container.innerHTML = `
                <div class="error-state">
                    <h2>Oops! Something went wrong</h2>
                    <p>We couldn't load the movie details. Please try again.</p>
                    <a href="../index.html" class="btn-primary">Back to Home</a>
                </div>
            `;
                container.classList.remove('hidden');
            }
        } finally {
            UI.hideLoading();
        }
    }
}

async function loadHomePage() {
    UI.showLoading();

    try {
        // Load genres and years into filters
        await UI.populateGenres(document.getElementById('genreFilter'));
        UI.populateYears(document.getElementById('yearFilter'));

        // Load popular movies
        const data = await API.getPopularMovies(currentPage);
        if (data.results && data.results.length > 0) {
            UI.renderMovieCards(data.results, document.getElementById('moviesGrid'));
            totalPages = data.total_pages;
            UI.updatePagination(currentPage, totalPages);
            setupPaginationEvents();
            setupFilterEvents(loadMoviesWithFilters);
        } else {
            document.getElementById('moviesGrid').innerHTML =
                '<p class="empty-message">No movies found. Try again later.</p>';
        }
    } catch (error) {
        UI.showError('Failed to load movies. Please try again.');
        console.error('Home page error:', error);
    } finally {
        UI.hideLoading();
    }
}

async function loadMoviesWithFilters() {
    UI.showLoading();

    try {
        const genre = document.getElementById('genreFilter').value;
        const year = document.getElementById('yearFilter').value;
        const sort = document.getElementById('sortFilter').value;

        const filters = {};
        if (genre) filters.genre = genre;
        if (year) filters.year = year;
        if (sort) filters.sort = sort;

        const data = await API.discoverMovies(filters, currentPage);
        if (data.results && data.results.length > 0) {
            UI.renderMovieCards(data.results, document.getElementById('moviesGrid'));
            totalPages = data.total_pages;
            UI.updatePagination(currentPage, totalPages);
        }
    } catch (error) {
        UI.showError('Failed to load filtered movies.');
        console.error('Filter error:', error);
    } finally {
        UI.hideLoading();
    }
}

async function loadFavoritesPage() {
    UI.showLoading();

    try {
        const favorites = Storage.getFavorites();
        const favoritesGrid = document.getElementById('favoritesGrid');
        const emptyState = document.getElementById('emptyState');

        if (!favoritesGrid) return;

        if (favorites.length === 0) {
            // Show empty state, hide grid
            if (emptyState) emptyState.classList.remove('hidden');
            favoritesGrid.classList.add('hidden');
            favoritesGrid.innerHTML = '';
        } else {
            // Hide empty state, show grid
            if (emptyState) emptyState.classList.add('hidden');
            favoritesGrid.classList.remove('hidden');

            // Sort favorites - newest first
            const sortedFavorites = [...favorites].sort((a, b) => {
                if (a.release_date && b.release_date) {
                    return new Date(b.release_date) - new Date(a.release_date);
                }
                return 0;
            });

            UI.renderMovieCards(sortedFavorites, favoritesGrid);
        }
    } catch (error) {
        console.error('Favorites error:', error);
        UI.showError('Failed to load favorites.');
    } finally {
        UI.hideLoading();
    }
}

async function loadWatchlistPage() {
    UI.showLoading();

    try {
        const watchlist = Storage.getWatchlist();
        const watchlistGrid = document.getElementById('watchlistGrid');
        const emptyState = document.getElementById('emptyState');

        if (!watchlistGrid) return;

        if (watchlist.length === 0) {
            // Show empty state, hide grid
            if (emptyState) emptyState.classList.remove('hidden');
            watchlistGrid.classList.add('hidden');
            watchlistGrid.innerHTML = '';
        } else {
            // Hide empty state, show grid
            if (emptyState) emptyState.classList.add('hidden');
            watchlistGrid.classList.remove('hidden');

            // Sort watchlist while newest first
            const sortedWatchlist = [...watchlist].sort((a, b) => {
                if (a.release_date && b.release_date) {
                    return new Date(b.release_date) - new Date(a.release_date);
                }
                return 0;
            });

            UI.renderMovieCards(sortedWatchlist, watchlistGrid);
        }
    } catch (error) {
        console.error('Watchlist error:', error);
        UI.showError('Failed to load watchlist.');
    } finally {
        UI.hideLoading();
    }
}

function setupPaginationEvents() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadMoviesWithFilters();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadMoviesWithFilters();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

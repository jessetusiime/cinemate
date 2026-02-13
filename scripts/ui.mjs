import { CONFIG } from "./config.mjs";
import API from "./api.mjs";
import Storage from "./storage.mjs";

const UI = (function () {
    'use strict';

    function renderMovieCards(movies, container) {
        if (!container) return;
        container.innerHTML = '';

        if (!movies || movies.length === 0) {
            container.innerHTML = '<p class="empty-message">No movies found.</p>';
            return;
        }

        movies.forEach((movie, index) => {
            const card = createMovieCard(movie, index);
            container.appendChild(card);
        });
    }

    function createMovieCard(movie, index = 0) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.animationDelay = `${index * 0.05}s`;

        const posterUrl = movie.poster_path ? API.getImageUrl(movie.poster_path, 'poster') : null;
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const isFav = Storage.isFavorite(movie.id);
        const isWatch = Storage.isInWatchlist(movie.id);

        card.innerHTML = `
            ${posterUrl
                ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">`
                : '<div class="movie-poster no-image">No Image</div>'
            }
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span class="movie-year">${year}</span>
                    <span class="movie-rating">⭐ ${rating}</span>
                </div>
                <div class="movie-actions">
                    <button class="btn-icon btn-favorite ${isFav ? 'active' : ''}" data-id="${movie.id}">
                        ${isFav ? '❤️' : '🤍'} Fav
                    </button>
                    <button class="btn-icon btn-watchlist ${isWatch ? 'active' : ''}" data-id="${movie.id}">
                        ${isWatch ? '✓' : '+'} List
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-icon')) return;
            window.location.href = `pages/details.html?id=${movie.id}`;
        });

        const favBtn = card.querySelector('.btn-favorite');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(movie, favBtn);
        });

        const watchBtn = card.querySelector('.btn-watchlist');
        watchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie, watchBtn);
        });

        return card;
    }

    function toggleFavorite(movie, button) {
        const isFav = Storage.isFavorite(movie.id);

        if (isFav) {
            Storage.removeFavorite(movie.id);
            button.classList.remove('active');
            button.innerHTML = '🤍 Fav';
        } else {
            Storage.addFavorite(movie);
            button.classList.add('active');
            button.innerHTML = '❤️ Fav';
        }
    }

    function toggleWatchlist(movie, button) {
        const isWatch = Storage.isInWatchlist(movie.id);

        if (isWatch) {
            Storage.removeFromWatchlist(movie.id);
            button.classList.remove('active');
            button.innerHTML = '+ List';
        } else {
            Storage.addToWatchlist(movie);
            button.classList.add('active');
            button.innerHTML = '✓ List';
        }
    }

    function renderMovieDetails(movie, ratings) {
        const container = document.getElementById('movieDetails');
        if (!container) return;

        const backdropUrl = movie.backdrop_path ? API.getImageUrl(movie.backdrop_path, 'backdrop') : null;
        const posterUrl = movie.poster_path ? API.getImageUrl(movie.poster_path, 'poster') : null;
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
        const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A';
        const isFav = Storage.isFavorite(movie.id);
        const isWatch = Storage.isInWatchlist(movie.id);

        // Add a tagline if available
        const tagline = movie.tagline ? `<p class="details-tagline">"${movie.tagline}"</p>` : '';

        // Add a vote count for TMDb rating
        const voteCount = movie.vote_count ? movie.vote_count.toLocaleString() : '0';

        //  Ratings with vote count and better styling 
        let ratingsHTML = '';
        if (ratings) {
            ratingsHTML = `
            <div class="ratings-comparison">
                <h3>Ratings Comparison</h3>
                <div class="ratings-grid">
                    <div class="rating-item tmdb">
                        <div class="rating-source">TMDb</div>
                        <div class="rating-value">⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}/10</div>
                        <div class="rating-count">${voteCount} votes</div>
                    </div>
                    ${ratings.imdb ? `
                        <div class="rating-item imdb">
                            <div class="rating-source">IMDb</div>
                            <div class="rating-value">⭐ ${ratings.imdb}/10</div>
                        </div>
                    ` : ''}
                    ${ratings.rottenTomatoes ? `
                        <div class="rating-item rotten">
                            <div class="rating-source">Rotten Tomatoes</div>
                            <div class="rating-value">🍅 ${ratings.rottenTomatoes}</div>
                        </div>
                    ` : ''}
                    ${ratings.metascore ? `
                        <div class="rating-item meta">
                            <div class="rating-source">Metascore</div>
                            <div class="rating-value"> ${ratings.metascore}/100</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        }

        // Cast with better image fallback
        let castHTML = '';
        if (movie.credits && movie.credits.cast) {
            const topCast = movie.credits.cast.slice(0, 8);
            castHTML = `
            <div class="cast-section">
                <h3>Top Cast</h3>
                <div class="cast-grid">
                    ${topCast.map(actor => `
                        <div class="cast-member">
                            ${actor.profile_path
                    ? `<img src="${API.getImageUrl(actor.profile_path, 'profile')}" 
                                       alt="${actor.name}" 
                                       class="cast-photo"
                                       loading="lazy"
                                       onerror="this.src='../images/no-avatar.jpg'">`
                    : '<div class="cast-photo no-image">🎭</div>'
                }
                            <div class="cast-name">${actor.name}</div>
                            <div class="cast-character">${actor.character}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        }

        // Trailer with container and proper iframe attributes
        let trailerHTML = '';
        const trailerUrl = API.getTrailerUrl(movie.videos);
        if (trailerUrl) {
            trailerHTML = `
            <div class="trailer-section">
                <h3>Trailer</h3>
                <div class="trailer-container">
                    <iframe 
                        class="trailer-video" 
                        src="${trailerUrl}" 
                        title="${movie.title} trailer"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
        }

        // Key facts (original title, language, budget, revenue)
        const factsHTML = `
        <div class="details-key-facts">
            <h3>Key Facts</h3>
            <div class="facts-grid">
                ${movie.original_title && movie.original_title !== movie.title ? `
                    <div class="fact-item">
                        <span class="fact-label">Original Title</span>
                        <span class="fact-value">${movie.original_title}</span>
                    </div>
                ` : ''}
                ${movie.original_language ? `
                    <div class="fact-item">
                        <span class="fact-label">Language</span>
                        <span class="fact-value">${movie.original_language.toUpperCase()}</span>
                    </div>
                ` : ''}
                ${movie.status ? `
                    <div class="fact-item">
                        <span class="fact-label">Status</span>
                        <span class="fact-value">${movie.status}</span>
                    </div>
                ` : ''}
                ${movie.budget > 0 ? `
                    <div class="fact-item">
                        <span class="fact-label">Budget</span>
                        <span class="fact-value">$${movie.budget.toLocaleString()}</span>
                    </div>
                ` : ''}
                ${movie.revenue > 0 ? `
                    <div class="fact-item">
                        <span class="fact-label">Revenue</span>
                        <span class="fact-value">$${movie.revenue.toLocaleString()}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

        // Collection info if movie is part of a collection
        let collectionHTML = '';
        if (movie.belongs_to_collection) {
            collectionHTML = `
            <div class="collection-section">
                <h3>Part of ${movie.belongs_to_collection.name}</h3>
                <a href="?collection=${movie.belongs_to_collection.id}" class="btn-secondary">
                    View Collection
                </a>
            </div>
        `;
        }

        // Button text to be more consistent
        container.innerHTML = `
        <div class="details-hero" style="background-image: ${backdropUrl ? `url('${backdropUrl}')` : 'none'};">
            <div class="details-overlay">
                <div class="container">
                    <div class="details-content">
                        <div class="details-poster-wrapper">
                            ${posterUrl
                ? `<img src="${posterUrl}" alt="${movie.title}" class="details-poster" loading="lazy">`
                : '<div class="details-poster no-image">🎬</div>'
            }
                        </div>
                        <div class="details-info">
                            <h2>${movie.title} <span class="release-year">(${year})</span></h2>
                            <div class="details-meta">
                                <span class="meta-item">${year}</span>
                                <span class="meta-item">⏱${runtime}</span>
                                <span class="meta-item">${genres}</span>
                            </div>
                            ${tagline}
                            <div class="details-actions">
                                <button class="btn-action btn-favorite ${isFav ? 'active' : ''}" id="detailsFavorite">
                                    <span class="btn-icon">${isFav ? '❤️' : '🤍'}</span>
                                    <span class="btn-text">${isFav ? 'Favorited' : 'Add to Favorites'}</span>
                                </button>
                                <button class="btn-action btn-watchlist ${isWatch ? 'active' : ''}" id="detailsWatchlist">
                                    <span class="btn-icon">${isWatch ? '✓' : '+'}</span>
                                    <span class="btn-text">${isWatch ? 'In Watchlist' : 'Add to Watchlist'}</span>
                                </button>
                                ${movie.homepage ? `
                                    <a href="${movie.homepage}" target="_blank" rel="noopener" class="btn-action btn-website">
                                        <span class="btn-icon">🌐</span>
                                        <span class="btn-text">Website</span>
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="details-overview">
                <h3>Overview</h3>
                <p>${movie.overview || 'No overview available.'}</p>
            </div>
            ${factsHTML}
            ${ratingsHTML}
            ${collectionHTML}
            ${castHTML}
            ${trailerHTML}
            
            <!-- Placeholder for recommendations - we'll load these separately -->
            <div id="recommendationsSection" class="recommendations-section"></div>
        </div>
    `;

        // Event listeners with better feedback
        const favBtn = document.getElementById('detailsFavorite');
        const watchBtn = document.getElementById('detailsWatchlist');

        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isFav = Storage.isFavorite(movie.id);

                if (isFav) {
                    Storage.removeFavorite(movie.id);
                    favBtn.classList.remove('active');
                    favBtn.querySelector('.btn-icon').textContent = '🤍';
                    favBtn.querySelector('.btn-text').textContent = 'Add to Favorites';
                } else {
                    Storage.addFavorite(movie);
                    favBtn.classList.add('active');
                    favBtn.querySelector('.btn-icon').textContent = '❤️';
                    favBtn.querySelector('.btn-text').textContent = 'Favorited';
                }

                // Update badges in header if function exists
                if (typeof updateBadges === 'function') {
                    updateBadges(
                        Storage.getFavorites().length,
                        Storage.getWatchlist().length
                    );
                }
            });
        }

        if (watchBtn) {
            watchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isWatch = Storage.isInWatchlist(movie.id);

                if (isWatch) {
                    Storage.removeFromWatchlist(movie.id);
                    watchBtn.classList.remove('active');
                    watchBtn.querySelector('.btn-icon').textContent = '+';
                    watchBtn.querySelector('.btn-text').textContent = 'Add to Watchlist';
                } else {
                    Storage.addToWatchlist(movie);
                    watchBtn.classList.add('active');
                    watchBtn.querySelector('.btn-icon').textContent = '✓';
                    watchBtn.querySelector('.btn-text').textContent = 'In Watchlist';
                }

                // Update badges in header if function exists
                if (typeof updateBadges === 'function') {
                    updateBadges(
                        Storage.getFavorites().length,
                        Storage.getWatchlist().length
                    );
                }
            });
        }

        // Load recommendations
        loadRecommendations(movie.id);
    }

    // function to load recommendations
    async function loadRecommendations(movieId) {
        try {
            const response = await fetch(
                `${CONFIG.TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${CONFIG.TMDB_API_KEY}`
            );
            const data = await response.json();

            const section = document.getElementById('recommendationsSection');
            if (section && data.results?.length > 0) {
                section.innerHTML = `
                <h3>You Might Also Like</h3>
                <div class="recommendations-grid">
                    ${data.results.slice(0, 6).map(movie => `
                        <div class="recommendation-card" onclick="window.location.href='details.html?id=${movie.id}'">
                            ${movie.poster_path
                        ? `<img src="${API.getImageUrl(movie.poster_path, 'w185')}" 
                                       alt="${movie.title}" 
                                       loading="lazy"
                                       onerror="this.src='../images/no-poster.jpg'">`
                        : '<div class="no-image-small">🎬</div>'
                    }
                            <div class="recommendation-info">
                                <h4>${movie.title}</h4>
                                <span>⭐ ${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    function showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('hidden');
    }

    function hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.add('hidden');
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            setTimeout(() => errorDiv.classList.add('hidden'), 5000);
        }
    }

    function updatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        if (!pagination) return;

        pagination.classList.remove('hidden');
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    async function populateGenres(selectElement) {
        if (!selectElement) return;

        try {
            const data = await API.getGenres();
            data.genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }

    function populateYears(selectElement) {
        if (!selectElement) return;

        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1900; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            selectElement.appendChild(option);
        }
    }

    return {
        renderMovieCards,
        renderMovieDetails,
        showLoading,
        hideLoading,
        showError,
        updatePagination,
        populateGenres,
        populateYears
    };
})();

export default UI;
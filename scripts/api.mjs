import { CONFIG } from "./config.mjs";
const API = (function () {
    'use strict';

    async function fetchAPI(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async function getPopularMovies(page = 1) {
        const url = `${CONFIG.TMDB_BASE_URL}/movie/popular?api_key=${CONFIG.TMDB_API_KEY}&page=${page}`;
        return fetchAPI(url);
    }

    async function searchMovies(query, page = 1) {
        const url = `${CONFIG.TMDB_BASE_URL}/search/movie?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
        return fetchAPI(url);
    }

    async function discoverMovies(filters = {}, page = 1) {
        const params = new URLSearchParams({
            api_key: CONFIG.TMDB_API_KEY,
            page: page,
            sort_by: filters.sort || 'popularity.desc'
        });

        if (filters.genre) params.append('with_genres', filters.genre);
        if (filters.year) params.append('year', filters.year);
        if (filters.minRating) params.append('vote_average.gte', filters.minRating);

        const url = `${CONFIG.TMDB_BASE_URL}/discover/movie?${params.toString()}`;
        return fetchAPI(url);
    }

    async function getMovieDetails(movieId) {
        const url = `${CONFIG.TMDB_BASE_URL}/movie/${movieId}?api_key=${CONFIG.TMDB_API_KEY}&append_to_response=credits,videos`;
        return fetchAPI(url);
    }

    async function getGenres() {
        const url = `${CONFIG.TMDB_BASE_URL}/genre/movie/list?api_key=${CONFIG.TMDB_API_KEY}`;
        return fetchAPI(url);
    }

    async function getOMDbRatings(title, year = null) {
        const params = new URLSearchParams({
            apikey: CONFIG.OMDB_API_KEY,
            t: title
        });

        if (year) params.append('y', year);

        const url = `${CONFIG.OMDB_BASE_URL}?${params.toString()}`;

        try {
            const data = await fetchAPI(url);
            if (data.Response === 'False') return null;

            return {
                imdb: data.imdbRating !== 'N/A' ? data.imdbRating : null,
                rottenTomatoes: extractRottenTomatoesRating(data.Ratings),
                metascore: data.Metascore !== 'N/A' ? data.Metascore : null
            };
        } catch (error) {
            console.error('OMDb Error:', error);
            return null;
        }
    }

    function extractRottenTomatoesRating(ratings) {
        if (!ratings || !Array.isArray(ratings)) return null;
        const rt = ratings.find(r => r.Source === 'Rotten Tomatoes');
        return rt ? rt.Value : null;
    }

    function getImageUrl(path, size = 'poster') {
        if (!path) return null;
        const imageSize = CONFIG.IMAGE_SIZES[size] || CONFIG.IMAGE_SIZES.poster;
        return `${CONFIG.TMDB_IMAGE_BASE_URL}/${imageSize}${path}`;
    }

    function getTrailerUrl(videos) {
        if (!videos || !videos.results || videos.results.length === 0) return null;
        const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.results[0];
        return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    }

    return {
        getPopularMovies,
        searchMovies,
        discoverMovies,
        getMovieDetails,
        getGenres,
        getOMDbRatings,
        getImageUrl,
        getTrailerUrl
    };
})();

export default API;
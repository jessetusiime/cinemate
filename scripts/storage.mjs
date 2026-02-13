import { CONFIG } from "./config.mjs";

const Storage = (function () {
    'use strict';

    function get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    function getFavorites() {
        return get(CONFIG.STORAGE_KEYS.favorites) || [];
    }

    function addFavorite(movie) {
        const favorites = getFavorites();
        if (favorites.some(fav => fav.id === movie.id)) return false;
        favorites.push(movie);
        return set(CONFIG.STORAGE_KEYS.favorites, favorites);
    }

    function removeFavorite(movieId) {
        const favorites = getFavorites();
        const filtered = favorites.filter(movie => movie.id !== movieId);
        return set(CONFIG.STORAGE_KEYS.favorites, filtered);
    }

    function isFavorite(movieId) {
        const favorites = getFavorites();
        return favorites.some(movie => movie.id === movieId);
    }

    function getWatchlist() {
        return get(CONFIG.STORAGE_KEYS.watchlist) || [];
    }

    function addToWatchlist(movie) {
        const watchlist = getWatchlist();
        if (watchlist.some(item => item.id === movie.id)) return false;
        watchlist.push(movie);
        return set(CONFIG.STORAGE_KEYS.watchlist, watchlist);
    }

    function removeFromWatchlist(movieId) {
        const watchlist = getWatchlist();
        const filtered = watchlist.filter(movie => movie.id !== movieId);
        return set(CONFIG.STORAGE_KEYS.watchlist, filtered);
    }

    function isInWatchlist(movieId) {
        const watchlist = getWatchlist();
        return watchlist.some(movie => movie.id === movieId);
    }

    return {
        get, set,
        getFavorites, addFavorite, removeFavorite, isFavorite,
        getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist
    };
})();

export default Storage;
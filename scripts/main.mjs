import { createHeader, createFooter, updateBadges, updateFooterStats } from './components.mjs';

function initApp() {
    const path = window.location.pathname;
    let activePage = 'home';

    if (path.includes('favorites.html')) activePage = 'favorites';
    if (path.includes('watchlist.html')) activePage = 'watchlist';

    // Render header and footer
    createHeader(activePage);
    createFooter();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

export { initApp };
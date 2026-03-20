/**
 * ADT HomePage App
 * Handles Intersection Observers for Scroll Reveals and other interactive elements.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- Scroll Reveal Animation ---

    // Select all elements with the data-reveal attribute
    const revealElements = document.querySelectorAll('[data-reveal]');

    // Configuration for the Intersection Observer
    const observerOptions = {
        root: null, // use the viewport
        rootMargin: '0px', // trigger when the element exactly enters the viewport
        threshold: 0.15 // trigger when 15% of the element is visible
    };

    // Create the Intersection Observer
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // If the element is intersecting (visible in the viewport)
            if (entry.isIntersecting) {
                // Add the 'active' class to trigger the CSS transition
                entry.target.classList.add('active');

                // Stop observing the element once it has been revealed
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Start observing each element
    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // --- Navbar Scroll Effect (Optional: add background when scrolling) ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.9)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'var(--glass-bg)';
            navbar.style.boxShadow = 'none';
        }
    });
});

// js/card_play_animations.js

function animateCardToCenter(cardElem) {
    // Get card's current position relative to the viewport
    const cardRect = cardElem.getBoundingClientRect();
    // Get the bounding rect of the center area container (the grid cell)
    // We use document.querySelector here as this element itself might not be global
    const tableCenter = document.querySelector('.center-area'); 
    const centerRect = tableCenter.getBoundingClientRect();

    // Calculate the translation needed to move the card's center to the table center's center
    const deltaX = centerRect.left + centerRect.width / 2 - (cardRect.left + cardRect.width / 2);
    const deltaY = centerRect.top + centerRect.height / 2 - (cardRect.top + cardRect.height / 2);

    // Set the card to fixed position relative to the viewport at its current location
    cardElem.style.position = 'fixed';
    cardElem.style.left = `${cardRect.left}px`;
    cardElem.style.top = `${cardRect.top}px`;
    cardElem.style.zIndex = 1001; // High z-index to ensure it's on top during animation

    // Temporarily remove from hand layout and append to body for fixed positioning animation
    cardElem.parentNode.removeChild(cardElem);
    document.body.appendChild(cardElem);

    // Set CSS custom properties for the animation to use the calculated deltas
    cardElem.style.setProperty('--center-x', `${deltaX}px`);
    cardElem.style.setProperty('--center-y', `${deltaY}px`);

    // Add the animation class which triggers the CSS animation
    cardElem.classList.add('card-spin-fly-center-animate');

    // After the animation completes (or after its duration),
    // remove animation styles and call the new utility function for final placement
    setTimeout(() => {
        // Remove animation class and reset any temporary fixed positioning styles
        cardElem.classList.remove('card-spin-fly-center-animate');
        cardElem.style.removeProperty('--center-x');
        cardElem.style.removeProperty('--center-y');
        // CRITICAL: Ensure all temporary inline positioning and transforms are cleared
        cardElem.style.position = ''; 
        cardElem.style.left = '';
        cardElem.style.top = '';
        cardElem.style.zIndex = ''; // Clear z-index as playCardToCenter will set it dynamically
        cardElem.style.transform = ''; // Clear any animation-induced transform

        // Retrieve the player associated with the card (set in script.js during dealing)
        const player = cardElem.dataset.player; 

        if (typeof window.playCardInTrick === 'function') { // Check for the new function
            // playCardInTrick will handle the final placement and game state update
            window.playCardInTrick(cardElem, player); 
        } else {
            console.error("playCardInTrick function not found. Ensure js/game_logic.js is loaded correctly and `window.playCardInTrick` is exposed.");
            // Fallback (consider removing if robust error handling is in place)
            const centerPlayedCardsFallback = document.getElementById('center-played-cards');
            if (centerPlayedCardsFallback) {
                cardElem.style.position = 'static';
                cardElem.style.transform = '';
                centerPlayedCardsFallback.appendChild(cardElem);
            }
        }
    }, 700); // Match animation duration
}

// Attach listeners to cards after they are rendered to enable click-to-play animation
function enableCardAnimations() {
  document.querySelectorAll('.hand .card').forEach(card => {
    card.classList.add('card-pop-hover'); // Add hover effect
    card.addEventListener('click', function() {
      animateCardToCenter(card); // Trigger the animation on click
    });
  });
}

// This event listener will ensure card animations are enabled once partner selection is complete
// (or whenever you decide cards become playable).
window.addEventListener('partnerSelectionComplete', enableCardAnimations);

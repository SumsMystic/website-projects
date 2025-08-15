// js/game_play.js

// Get reference to the central area where played cards will be displayed
// This element is expected to exist in starter.html
// This variable should be assigned once the DOM is ready to avoid null issues.
// We'll rely on window.centerPlayedCards which is set in game_logic.js's DOMContentLoaded.

/**
 * Handles playing a card to the center of the table, applying player-specific
 * orientation and stacking effects to form a '+' shape.
 *
 * @param {HTMLElement} cardElem - The card HTML element to be played.
 * @param {string} player - The player who played the card (e.g., 'north', 'south', 'east', 'west').
 */
function playCardToCenter(cardElem, player) {
    // Ensure the target container exists and is globally accessible.
    if (!window.centerPlayedCards) {
        console.error("Error: 'centerPlayedCards' element (via window) not found in the DOM.");
        return;
    }

    // CRITICAL: Reset all previous inline styles that might interfere with positioning and transforms.
    // This clears any fixed positioning or animation transforms applied by animateCardToCenter.
    cardElem.style.position = 'absolute'; // Position absolute within the #center-played-cards container
    cardElem.style.left = '';             // Clear any left/top from previous fixed positioning
    cardElem.style.top = '';
    cardElem.style.zIndex = '';           // z-index will be set dynamically below for stacking
    cardElem.style.transform = '';        // Clear any existing inline transforms

    // Remove old orientation classes before adding new ones
    cardElem.classList.remove('played-card-north-south', 'played-card-east-west');

    // Get the current number of cards already in the center to calculate stacking offset.
    // This assumes all cards in centerPlayedCards are from the current trick.
    const index = window.centerPlayedCards.children.length;

    let offsetX = 0;
    let offsetY = 0;
    let rotationDegrees = 0;

    // Base offset for spreading cards slightly for the '+' shape,
    // and also for visual stacking if multiple cards were played from same direction
    const spreadOffset = 30; // Distance from center for each card
    const stackOffset = 5; // Slight offset for stacking if multiple cards were played from same direction

    switch (player) {
        case 'north':
            // North card: Top of the plus, upright
            offsetX = 0;
            offsetY = -spreadOffset;
            rotationDegrees = 0;
            cardElem.classList.add('played-card-north-south');
            break;
        case 'east':
            // East card: Right of the plus, rotated 90 degrees clockwise
            offsetX = spreadOffset;
            offsetY = 0;
            rotationDegrees = 90;
            cardElem.classList.add('played-card-east-west');
            break;
        case 'south':
            // South card: Bottom of the plus, upright
            offsetX = 0;
            offsetY = spreadOffset;
            rotationDegrees = 0;
            cardElem.classList.add('played-card-north-south');
            break;
        case 'west':
            // West card: Left of the plus, rotated 90 degrees counter-clockwise
            offsetX = -spreadOffset;
            offsetY = 0;
            rotationDegrees = -90; // Or 270, whichever is clearer
            cardElem.classList.add('played-card-east-west');
            break;
        default:
            console.warn(`Unknown player direction: ${player}`);
            // Fallback to center, upright
            offsetX = 0;
            offsetY = 0;
            rotationDegrees = 0;
            break;
    }

    // Apply a subtle stacking offset so each new card is slightly further out or layered
    // This prevents perfect overlap if two cards from the same "direction" were played (unlikely in a 4-player trick, but good for robustness)
    offsetX += (index * stackOffset);
    offsetY += (index * stackOffset);


    // Set z-index to ensure new cards appear on top of older ones.
    // A base of 10 gives room for other UI elements if needed.
    cardElem.style.zIndex = 10 + index;

    // Apply the combined translation (for spreading/stacking) and rotation (for player orientation).
    // The order of operations in transform matters: translate then rotate (or vice versa depending on desired effect).
    cardElem.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotationDegrees}deg)`;

    // Append the card to the central display area.
    window.centerPlayedCards.appendChild(cardElem);
}

/**
 * Clears all played cards from the center table area.
 * Cards will briefly turn face down and fade out before being removed.
 * @param {boolean} faceDown - True if cards should turn face down before clearing.
 */
function clearCenterPlayedCards(faceDown = false) {
    if (window.centerPlayedCards) {
        const playedCards = window.centerPlayedCards.querySelectorAll('.card');
        if (faceDown) {
            playedCards.forEach((cardElem, index) => {
                // Temporarily reset position for animation to work from current spot
                cardElem.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
                // Change card image to back-side
                cardElem.style.backgroundImage = `url('./img/black_queen_backside_default.webp')`; // Use your card back image
                // Adjust transform to make them stack tightly and fade
                cardElem.style.transform = `translate(0px, 0px) scale(0.7)`; // Stack closer
                cardElem.style.opacity = '0'; // Fade out
                cardElem.style.zIndex = 100 - index; // Ensure consistent z-index for fade-out
            });
            
            // Delay clearing to allow animation to complete
            setTimeout(() => {
                window.centerPlayedCards.innerHTML = ''; // Remove all child card elements
                console.log("Center played cards cleared.");
            }, 700); // Match or slightly exceed CSS transition duration
        } else {
            // If not fading face-down, just clear immediately
            window.centerPlayedCards.innerHTML = '';
            console.log("Center played cards cleared instantly.");
        }
    }
}

// Expose these functions globally so other scripts can access them
window.playCardToCenter = playCardToCenter;
window.clearCenterPlayedCards = clearCenterPlayedCards;

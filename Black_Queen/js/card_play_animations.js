/**
 * Handles playing a card to the center of the table, applying player-specific
 * orientation and stacking effects to form a '+' shape.
 *
 * @param {HTMLElement} cardElem - The card HTML element to be played.
 * @param {string} player - The player who played the card (e.g., 'north', 'south', 'east', 'west').
 */
function animateCardToCenter(cardElem, player) {
    return new Promise(resolve => {
        // CRITICAL FIX: Ensure the card is face-up before playing.
        if (cardElem && cardElem.classList.contains('card-back')) {
            const cardSuit = cardElem.dataset.suit;
            const cardRank = cardElem.dataset.rank;
            
            cardElem.classList.remove('card-back');
            cardElem.classList.remove('card-back-theme');
            cardElem.style.backgroundImage = `url('./img/${cardRank}_of_${cardSuit}.svg')`;
        }
        
        const cardRect = cardElem.getBoundingClientRect();
        const tableCenter = document.querySelector('.center-area');
        const centerRect = tableCenter.getBoundingClientRect();

        const deltaX = centerRect.left + centerRect.width / 2 - (cardRect.left + cardRect.width / 2);
        const deltaY = centerRect.top + centerRect.height / 2 - (cardRect.top + cardRect.height / 2);

        cardElem.style.position = 'fixed';
        cardElem.style.left = `${cardRect.left}px`;
        cardElem.style.top = `${cardRect.top}px`;
        cardElem.style.zIndex = 1001;

        cardElem.parentNode.removeChild(cardElem);
        document.body.appendChild(cardElem);

        cardElem.style.setProperty('--center-x', `${deltaX}px`);
        cardElem.style.setProperty('--center-y', `${deltaY}px`);

        cardElem.addEventListener('animationend', function handler(event) {
            cardElem.removeEventListener('animationend', handler);

            if (!window.centerPlayedCards) {
                console.error("Error: 'centerPlayedCards' element (via window) not found in the DOM.");
                resolve(null);
                return;
            }

            // Reset all previous inline styles
            cardElem.style.position = 'absolute';
            cardElem.style.left = '';
            cardElem.style.top = '';
            cardElem.style.zIndex = '';
            cardElem.style.transform = '';
            cardElem.style.pointerEvents = 'none';
            cardElem.style.transition = '';

            cardElem.classList.remove('card-spin-fly-center-animate');
            cardElem.classList.remove('played-card-north-south', 'played-card-east-west');

            // Apply final styles
            const index = window.centerPlayedCards.children.length;
            const spreadOffset = 30;
            const stackOffset = 5;
            let offsetX = 0;
            let offsetY = 0;
            let rotationDegrees = 0;

            switch (player) {
                case 'north':
                    offsetX = 0;
                    offsetY = -spreadOffset;
                    rotationDegrees = 0;
                    cardElem.classList.add('played-card-north-south');
                    break;
                case 'east':
                    offsetX = spreadOffset;
                    offsetY = 0;
                    rotationDegrees = 90;
                    cardElem.classList.add('played-card-east-west');
                    break;
                case 'south':
                    offsetX = 0;
                    offsetY = spreadOffset;
                    rotationDegrees = 0;
                    cardElem.classList.add('played-card-north-south');
                    break;
                case 'west':
                    offsetX = -spreadOffset;
                    offsetY = 0;
                    rotationDegrees = -90;
                    cardElem.classList.add('played-card-east-west');
                    break;
                default:
                    console.warn(`Unknown player direction: ${player}`);
                    offsetX = 0;
                    offsetY = 0;
                    rotationDegrees = 0;
                    break;
            }

            offsetX += (index * stackOffset);
            offsetY += (index * stackOffset);
            cardElem.style.zIndex = 10 + index;
            cardElem.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotationDegrees}deg)`;

            window.centerPlayedCards.appendChild(cardElem);

            // console.log(`Card played to center from ${player}:`, cardElem);
            // console.log("Animation complete. Now resolving animation promise.");
            resolve(cardElem);
        }, {
            once: true
        });

        // Use a short timeout to ensure the browser has had time to apply initial styles
        setTimeout(() => {
            // CRITICAL FIX: Explicitly set the transition properties before adding the animation class.
            cardElem.style.transition = 'transform 0.6s ease-out';
            if (!cardElem.classList.contains('card-spin-fly-center-animate')) {
                cardElem.classList.add('card-spin-fly-center-animate');
            }
        }, 0);
    });
}
window.animateCardToCenter = animateCardToCenter;

// Attach listeners to cards after they are rendered to enable click-to-play animation
function enableCardAnimations() {
  document.querySelectorAll('.hand .card').forEach(card => {
    card.classList.add('card-pop-hover'); // Add hover effect
    /*
    card.addEventListener('click', function() {
      animateCardToCenter(card); // Trigger the animation on click
    });
    */
  });
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
window.clearCenterPlayedCards = clearCenterPlayedCards;

// This event listener will ensure card animations are enabled once partner selection is complete
// (or whenever you decide cards become playable).
window.addEventListener('partnerSelectionComplete', enableCardAnimations);

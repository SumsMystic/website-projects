function animateCardToCenter(cardElem) {
    // Get card's current position
    const cardRect = cardElem.getBoundingClientRect();
    const tableCenter = document.querySelector('.center-area');
    const centerRect = tableCenter.getBoundingClientRect();

    // Calculate translation to center of table
    const deltaX = centerRect.left + centerRect.width / 2 - (cardRect.left + cardRect.width / 2);
    const deltaY = centerRect.top + centerRect.height / 2 - (cardRect.top + cardRect.height / 2);

    // Set card to fixed position over its current location
    cardElem.style.position = 'fixed';
    cardElem.style.left = `${cardRect.left}px`;
    cardElem.style.top = `${cardRect.top}px`;
    cardElem.style.zIndex = 1001;

    // Remove from hand layout so it doesn't affect flex/grid
    cardElem.parentNode.removeChild(cardElem);
    document.body.appendChild(cardElem);

    // Set custom properties for animation
    cardElem.style.setProperty('--center-x', `${deltaX}px`);
    cardElem.style.setProperty('--center-y', `${deltaY}px`);

    // Add animation class
    cardElem.classList.add('card-spin-fly-center-animate');

    // After animation, move card to center-area and orient based on player
    setTimeout(() => {
        cardElem.classList.remove('card-spin-fly-center-animate');
        cardElem.style.position = '';
        cardElem.style.left = '';
        cardElem.style.top = '';
        cardElem.style.zIndex = '';
        cardElem.style.transform = '';
        cardElem.style.removeProperty('--center-x');
        cardElem.style.removeProperty('--center-y');

        // Determine player direction from cardElem dataset (assume data-player="north"/"south"/"east"/"west")
        const player = cardElem.dataset.player;
        if (player === 'east' || player === 'west') {
            cardElem.classList.add('card-east-west');
            cardElem.classList.remove('card-north-south');
        } else {
            cardElem.classList.add('card-north-south');
            cardElem.classList.remove('card-east-west');
        }

        // Stack cards in center-area, offset slightly so rank/suit is visible
        const playedCards = tableCenter.querySelectorAll('.card');
        const offset = playedCards.length * 20; // 20px offset per card
        cardElem.style.marginLeft = `${offset}px`;

        tableCenter.appendChild(cardElem);
    }, 700); // Match animation duration
}

// Attach listeners after cards are rendered
function enableCardAnimations() {
  document.querySelectorAll('.hand .card').forEach(card => {
    card.classList.add('card-pop-hover');
    card.addEventListener('click', function() {
      animateCardToCenter(card);
    });
  });
}

// Call enableCardAnimations() after bidding and partner selection are complete
// For example, after partner selection modal is closed:
window.addEventListener('partnerSelectionComplete', enableCardAnimations);
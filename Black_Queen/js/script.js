// Check if user is logged in, redirect to login.html if not
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    // No return here, as the rest of the script needs to initialize window globals
    // However, ensure functions depending on DOM are in DOMContentLoaded
}

// Game variables
let deck = [];
window.hands = {}; // Expose 'hands' globally.

window.cardsPerPlayer = 13; // Initialize default, will be overridden by game_logic.js on DOMContentLoaded.

// DOM Elements
let dealButton;
let playArea;

// Function to initialize the deck
function initializeDeck() {
    deck = [];
    for (let suit of window.suits) {
        for (let rank of window.ranks) {
            deck.push({ suit, rank });
        }
    }
    console.log("Deck initialized with", deck.length, "cards.");
}
window.initializeDeck = initializeDeck; // Expose globally

// Function to shuffle the deck
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // ES6 swap
    }
    console.log("Deck shuffled.");
}
window.shuffleDeck = shuffleDeck; // Expose globally

// Function to clear all cards from the display
function clearAllCards() {
    for (const player of window.players) {
        const handElement = document.querySelector(`.${player}-cards .hand`);
        // Also get the outer player-cards container
        const playerCardArea = document.querySelector(`.${player}-cards`);

        if (handElement) {
            handElement.innerHTML = ''; // Clear all child elements (cards)
        }
        // Ensure the player card area itself is visible
        if (playerCardArea) {
            playerCardArea.style.opacity = '1';
            playerCardArea.style.display = 'flex'; // Assuming they are flex containers, adjust if 'block'
        }
    }
    console.log("All cards cleared from display.");
}
window.clearAllCards = clearAllCards; // Expose globally

// Function to deal cards to players
function dealCards() {
    clearAllCards(); // Clear previous cards before dealing new ones
    window.hands = {};
    window.players.forEach(player => {
        window.hands[player] = [];
    });

    // MODIFIED: Deal only 'cardsPerPlayer' number of cards to each player
    const totalCardsToDeal = window.cardsPerPlayer * window.players.length;
    let cardsDealtCount = 0;

    let localCurrentPlayerIndex = 0;
    while (cardsDealtCount < totalCardsToDeal && deck.length > 0) {
        const player = window.players[localCurrentPlayerIndex];
        if (window.hands[player].length < window.cardsPerPlayer) { // Ensure player doesn't get more than max
            window.hands[player].push(deck.shift());
            cardsDealtCount++;
        }
        localCurrentPlayerIndex = (localCurrentPlayerIndex + 1) % window.players.length;
    }
    console.log(`Dealt ${cardsDealtCount} cards in total (${window.cardsPerPlayer} per player).`);
    displayCards();
}
window.dealCards = dealCards; // Expose globally

// Function to display cards for each player
function displayCards() {
    for (const player of window.players) {
        const handElement = document.querySelector(`.${player}-cards .hand`);
        const playerCardArea = document.querySelector(`.${player}-cards`); // Get the outer container

        if (handElement) {
            handElement.innerHTML = ''; // Clear existing cards before re-displaying

            // CRITICAL FIX: Ensure the hand element itself and its parent are visible
            handElement.style.display = 'flex'; // Or 'block', based on your CSS for .hand
            handElement.style.opacity = '1';

            if (playerCardArea) {
                playerCardArea.style.display = 'flex'; // Or 'block', based on your CSS for .player-cards
                playerCardArea.style.opacity = '1';
            }

            const suitOrder = { "diamonds": 0, "clubs": 1, "hearts": 2, "spades": 3 };
            const rankOrder = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14 };

            window.hands[player].sort((a, b) => {
                if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                    return suitOrder[a.suit] - suitOrder[b.suit];
                }
                return rankOrder[a.rank] - rankOrder[b.rank];
            });

            window.hands[player].forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card');
                cardDiv.classList.add('card-pop-hover');
                
                // Set data attributes for player, suit, and rank
                cardDiv.setAttribute('data-player', player);
                cardDiv.setAttribute('data-suit', card.suit);
                cardDiv.setAttribute('data-rank', card.rank);

                if (window.isAdminMode || player === window.loggedInPlayer) {
                    // Admin Mode: Show card face using the correct image path
                    cardDiv.style.backgroundImage = `url('./img/${card.rank}_of_${card.suit}.svg')`;
                } else {
                    // Normal Play Mode: Hide the card face with the selected theme
                    cardDiv.classList.add('card-back', `card-back-${window.cardTheme}-theme`);
                    cardDiv.style.color = 'transparent'; // Hides the rank/suit text
                }

                // cardDiv.style.backgroundImage = `url('./img/${card.rank}_of_${card.suit}.svg')`;
                cardDiv.style.setProperty('--card-index', index);
                cardDiv.style.opacity = '1'; // Ensure newly created cards are fully opaque
                cardDiv.style.pointerEvents = 'auto'; // Ensure cards are clickable (will be overridden by updatePlayerCardInteractions)
                handElement.appendChild(cardDiv);
            });
        }
    }
    console.log("Cards displayed for all players.");

    // Initial state: Disable all card interactions until a trick starts
    window.updatePlayerCardInteractions(null);
}
window.displayCards = displayCards; // Expose globally

// Main game flow function
function dealAndStartGame() {
    console.log("Shuffling and dealing cards to start a new GAME!");
    initializeDeck();
    shuffleDeck();
    dealCards();
    // Start bidding from the player who receives the first card (South in this dealing logic)
    const initialBidderIndex = window.players.indexOf("south");
    window.startBidding(initialBidderIndex);
}

/**
 * Updates the score display for all players.
 * This assumes you have score display elements like <span id="north-score">.
 */
function updateScoresDisplay() {
    for (const player in window.playersScores) {
        const scoreElement = document.getElementById(`${player}-score`);
        if (scoreElement) {
            scoreElement.textContent = `Score: ${window.playersScores[player]}`;
        }
    }
}
window.updateScoresDisplay = updateScoresDisplay; // Expose globally

// Automatically start the game after a slight delay once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    playArea = document.getElementById('play-area');
    setTimeout(dealAndStartGame, 1000); // 1000ms delay
});

window.addEventListener('beforeunload', function(event) {
    // Check if the user is closing the tab/window, not just refreshing the page
    // Note: The behavior of this event can vary slightly across browsers,
    // but this is a common and effective approach.
    if (sessionStorage.getItem('loggedInPlayer')) {
        sessionStorage.removeItem('loggedInPlayer');
        console.log("Player session data cleared.");
    }
});

// After cards are rendered, attach hover effect. Click listener is in card_play_animations.js
document.querySelectorAll('.hand .card').forEach(card => {
  card.classList.add('card-pop-hover');
});

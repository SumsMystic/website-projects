// Game variables
// Players array should be declared in game_logic.js and will be globally available
// const players = ["north", "east", "south", "west"]; // REMOVED - players array is now declared in game_logic.js
const suits = ["hearts", "diamonds", "clubs", "spades"];
// CORRECTED: Use full names for face ranks to match image file names
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
let deck = [];
window.hands = {}; // <--- MODIFIED: Expose 'hands' globally. This was already correctly done in your provided file.

// DOM Elements
let dealButton; // This variable will store the button element
let playArea; // This variable will store the play area element

// Function to initialize the deck
function initializeDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    console.log("Deck initialized with", deck.length, "cards.");
}

// Function to shuffle the deck
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // ES6 swap
    }
    console.log("Deck shuffled.");
}

// Function to clear all cards from the display
function clearAllCards() {
    for (const player of window.players) { // <--- MODIFIED: Use the globally available 'window.players'
        const handElement = document.querySelector(`.${player}-cards .hand`);
        if (handElement) {
            handElement.innerHTML = ''; // Clear all child elements (cards)
        }
    }
    console.log("All cards cleared from display.");
}

// Function to deal cards to players
function dealCards() {
    clearAllCards(); // Clear previous cards before dealing new ones
    window.hands = {}; // <--- MODIFIED: Use window.hands
    window.players.forEach(player => { // <--- MODIFIED: Use the globally available 'window.players'
        window.hands[player] = []; // <--- MODIFIED: Use window.hands
    });

    let localCurrentPlayerIndex = 0; // Local variable for dealing process
    while (deck.length > 0) {
        const player = window.players[localCurrentPlayerIndex]; // <--- MODIFIED: Use the globally available 'window.players'
        window.hands[player].push(deck.shift()); // <--- MODIFIED: Use window.hands
        localCurrentPlayerIndex = (localCurrentPlayerIndex + 1) % window.players.length; // <--- MODIFIED: Use window.players
    }
    console.log("Cards dealt.");
    displayCards();
}
window.dealCards = dealCards; // <--- ADDED: Expose globally

// Function to display cards for each player
function displayCards() {
    for (const player of window.players) { // <--- MODIFIED: Use the globally available 'window.players'
        const handElement = document.querySelector(`.${player}-cards .hand`);
        if (handElement) {
            handElement.innerHTML = ''; // Clear existing cards before re-displaying

            const suitOrder = { "diamonds": 0, "clubs": 1, "hearts": 2, "spades": 3 };
            const rankOrder = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14 };

            window.hands[player].sort((a, b) => { // <--- MODIFIED: Use window.hands
                if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                    return suitOrder[a.suit] - suitOrder[b.suit];
                }
                return rankOrder[a.rank] - rankOrder[b.rank];
            });

            window.hands[player].forEach((card, index) => { // <--- MODIFIED: Use window.hands
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card');
                cardDiv.classList.add('card-pop-hover');

                // Set data attributes for player, suit, and rank
                cardDiv.setAttribute('data-player', player);
                cardDiv.setAttribute('data-suit', card.suit); // NEW
                cardDiv.setAttribute('data-rank', card.rank); // NEW

                cardDiv.style.backgroundImage = `url('./img/${card.rank}_of_${card.suit}.svg')`;
                cardDiv.style.setProperty('--card-index', index);
                handElement.appendChild(cardDiv);
            });
        }
    }
    console.log("Cards displayed for all players.");

    // Initial state: Disable all card interactions until a trick starts
    window.updatePlayerCardInteractions(null); // <--- MODIFIED: Use window.updatePlayerCardInteractions
}
window.displayCards = displayCards; // <--- ADDED: Expose globally

// Main game flow function
function dealAndStartGame() {
    console.log("Deal and Start Game button clicked!");
    initializeDeck();
    shuffleDeck();
    dealCards();
    // Assuming game_logic.js is loaded first and startBidding is globally available
    // Start bidding from the player who receives the first card (South in this dealing logic)
    // The initial bidder index can be customized based on game rules.
    // Here, we assume South (index 2 in the players array: ["north", "east", "south", "west"]) starts bidding.
    const initialBidderIndex = window.players.indexOf("south"); // <--- MODIFIED: Use window.players
    window.startBidding(initialBidderIndex); // <--- MODIFIED: Use window.startBidding
}

/**
 * Updates the score display for all players.
 * This assumes you have score display elements like <span id="north-score">.
 */
function updateScoresDisplay() {
    for (const player in window.playersScores) { // Use window.playersScores
        const scoreElement = document.getElementById(`${player}-score`);
        if (scoreElement) {
            scoreElement.textContent = `Score: ${window.playersScores[player]}`;
        }
    }
}
window.updateScoresDisplay = updateScoresDisplay; // <--- MODIFIED: Expose globally

// Event listener for the "Deal and Start Game" button
document.addEventListener('DOMContentLoaded', () => {
    // CORRECTED: Use 'deal-cards-btn' as per starter.html
    dealButton = document.getElementById('deal-cards-btn');
    playArea = document.getElementById('play-area'); // Assuming you have a play-area div

    if (dealButton) {
        dealButton.addEventListener('click', dealAndStartGame);
    } else {
        console.error("Deal button not found!");
    }
});

// After cards are rendered, attach hover effect. Click listener is in card_play_animations.js
// Note: The click listener is now enabled by enableCardAnimations in card_play_animations.js
// which is triggered by 'partnerSelectionComplete' event.
document.querySelectorAll('.hand .card').forEach(card => {
  card.classList.add('card-pop-hover');
});

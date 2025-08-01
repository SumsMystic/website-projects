// Game variables
// Players array should be declared in game_logic.js and will be globally available
// const players = ["north", "east", "south", "west"]; // REMOVED - players array is now declared in game_logic.js
const suits = ["hearts", "diamonds", "clubs", "spades"];
// CORRECTED: Use full names for face ranks to match image file names
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
let deck = [];
let hands = {}; // To store cards for each player

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
    for (const player of players) { // Use the globally available 'players'
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
    hands = {};
    players.forEach(player => { // Use the globally available 'players'
        hands[player] = [];
    });

    let currentPlayerIndex = 0;
    while (deck.length > 0) {
        const player = players[currentPlayerIndex]; // Use the globally available 'players'
        hands[player].push(deck.shift());
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    console.log("Cards dealt.");
    displayCards();
}

// Function to display cards for each player
function displayCards() {
    for (const player of players) { // Use the globally available 'players'
        const handElement = document.querySelector(`.${player}-cards .hand`);
        if (handElement) {
            handElement.innerHTML = ''; // Clear existing cards before re-displaying

            // Sort cards for better display (e.g., by suit then rank) - optional
            // CORRECTED: Updated rankOrder to use full names
            const suitOrder = { "diamonds": 0, "clubs": 1, "hearts": 2, "spades": 3 };
            const rankOrder = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14 };


            hands[player].sort((a, b) => {
                if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                    return suitOrder[a.suit] - suitOrder[b.suit];
                }
                return rankOrder[a.rank] - rankOrder[b.rank];
            });

            hands[player].forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card');
                // CORRECTED: Use .svg extension and full rank name
                cardDiv.style.backgroundImage = `url('./img/${card.rank}_of_${card.suit}.svg')`;
                cardDiv.style.setProperty('--card-index', index); // Set custom property for z-index
                handElement.appendChild(cardDiv);
            });
        }
    }
    console.log("Cards displayed for all players.");
}

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
    const initialBidderIndex = players.indexOf("south"); // Find index of "south"
    startBidding(initialBidderIndex);
}

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
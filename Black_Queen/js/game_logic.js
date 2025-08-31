// Ensure players array is globally accessible
const players = ["north", "east", "south", "west"];
window.players = players; // Expose globally

// MODIFIED: Define global suits and ranks arrays
const suits = ["hearts", "diamonds", "clubs", "spades"];
window.suits = suits; // Expose globally

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
window.ranks = ranks; // Expose globally

let currentPlayerIndex;
window.currentPlayerIndex = currentPlayerIndex; // Expose globally

let highestBid = 0;
window.highestBid = highestBid; // Expose globally

let highestBidder = null;
window.highestBidder = highestBidder; // Expose globally

let currentTrumpSuit = null;
window.currentTrumpSuit = currentTrumpSuit; // Expose globally

const MIN_BID = 170;
window.MIN_BID = MIN_BID
const MAX_BID = 280;
window.MAX_BID = MAX_BID;
const BID_INCREMENT = 5;
window.BID_INCREMENT = BID_INCREMENT;

let passedPlayers = new Set();
window.passedPlayers = passedPlayers; // Expose globally

// --- New Game Play State Variables ---
// --- Retrieve game parameters from sessionStorage ---
window.isAdminMode = sessionStorage.getItem('isAdminLogin') === 'true'; // Get admin flag
window.cardTheme = sessionStorage.getItem('cardTheme') || 'def'; // Get selected theme
window.gameMode = sessionStorage.getItem('gameMode') || 'multiplayer'; // Get selected game mode
let assignedPlayer = sessionStorage.getItem('loggedInPlayer'); // Check if player was already assigned in a previous session
let availableSeats = JSON.parse(sessionStorage.getItem('availableSeats'));

// Initialize availableSeats if not present or empty (new game session or full reset)
if (!availableSeats || availableSeats.length === 0 || !Array.isArray(availableSeats)) { // Added Array.isArray check for robustness
    availableSeats = ["north", "east", "south", "west"];
    sessionStorage.setItem('availableSeats', JSON.stringify(availableSeats)); // Persist initial state
    // If we just reset availableSeats, also clear any stale assignedPlayer
    sessionStorage.removeItem('loggedInPlayer');
    assignedPlayer = null; 
}

if (!assignedPlayer) { // If no player has been assigned yet in this session
    if (window.isAdminMode || window.gameMode === 'single-player') {
        // Admin Mode OR Single Player Mode: current user always takes 'south'
        if (availableSeats.includes('south')) {
            assignedPlayer = 'south';
        } else {
            // Fallback: if 'south' is somehow unavailable (e.g., manually tampered sessionStorage), take first available
            assignedPlayer = availableSeats[0];
            console.warn("South seat was not available for single player/admin mode, assigning first available seat.");
        }
    } else { // Multiplayer mode - assign random available seat
        // In multiplayer, new users get a random unassigned seat.
        if (availableSeats.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableSeats.length);
            assignedPlayer = availableSeats[randomIndex];
        } else {
            // This case indicates all seats are taken, or an error.
            // For now, log an error and assign a random seat after resetting availableSeats.
            console.error("No available seats for multiplayer. Resetting available seats and assigning a random one.");
            availableSeats = ["north", "east", "south", "west"]; // Reset for a fresh attempt
            assignedPlayer = availableSeats[Math.floor(Math.random() * availableSeats.length)];
            sessionStorage.setItem('availableSeats', JSON.stringify(availableSeats)); // Persist reset
        }
    }

    if (assignedPlayer) {
        // Remove the assigned seat from the list of available seats for future assignments
        availableSeats = availableSeats.filter(seat => seat !== assignedPlayer);
        sessionStorage.setItem('availableSeats', JSON.stringify(availableSeats)); // Persist updated available seats
        sessionStorage.setItem('loggedInPlayer', assignedPlayer); // Persist the assigned player for the session
    }
}

// Set the global variable for the current client's assigned player seat
window.loggedInPlayer = assignedPlayer; 

console.log(`Admin Mode: ${window.isAdminMode ? 'ENABLED' : 'DISABLED'}`);
console.log(`Card Back Theme: ${window.cardTheme}`);
console.log(`Game Mode: ${window.gameMode}`);
console.log(`Logged-in Player (Assigned Seat): ${window.loggedInPlayer || 'Not assigned'}`);

let currentTrick = []; // Stores cards played in the current trick: [{card: cardElem, player: playerName}, ...]
window.currentTrick = currentTrick; // Expose globally

let trickCount = 0;    // Tracks the number of tricks played in the CURRENT ROUND
window.trickCount = trickCount; // Expose globally

let trickWinner = null; // Stores the player who won the last trick
window.trickWinner = trickWinner; // Expose globally

let playersScores = {}; // Object to store scores for each player for the CURRENT ROUND
window.playersScores = playersScores; // Expose globally

let currentTrickLeadPlayer = null; // The player who led the current trick
window.currentTrickLeadPlayer = currentTrickLeadPlayer; // Expose globally

let cardsInCurrentTrick = 0; // Counter for cards played in the current trick (max 4)
window.cardsInCurrentTrick = cardsInCurrentTrick; // Expose globally

let leadSuitForTrick = null;
window.leadSuitForTrick = leadSuitForTrick; // Expose globally

let trumpBroken = false;
window.trumpBroken = trumpBroken; // Expose globally

// ADDED: New global variables for persistent game info (displayed in sidebar)
let bidWinnerName = null;
window.bidWinnerName = bidWinnerName;
let finalBidAmount = null;
window.finalBidAmount = finalBidAmount;
let partnerPlayerName = null;
window.partnerPlayerName = partnerPlayerName;
let partnerRevealed = false;
window.partnerRevealed = partnerRevealed;

let currentRound = 0; // Track the current game round (1 to totalRounds)
window.currentRound = currentRound; // Expose globally

let totalRounds = 10; // Default total rounds for a full game
window.totalRounds = totalRounds; // Expose globally (will be updated from sessionStorage)

let cardsPerPlayer = 13; // DEFAULT: Tricks per round (equal to cards dealt per player)
window.cardsPerPlayer = cardsPerPlayer; // Expose globally (will be updated from sessionStorage)


let gameTotalScores = {}; // Stores cumulative scores across rounds
window.gameTotalScores = gameTotalScores; // Expose globally

let roundScoresHistory = []; // Stores scores for each round for the table
window.roundScoresHistory = roundScoresHistory; // Expose globally


// DOM Elements (These are locally scoped to game_logic.js's DOMContentLoaded for assignment)
let biddingStatusDisplay;
let currentPlayerTurnDisplay;
let highestBidDisplay;
let highestBidderNameDisplay;
let messageBox;

// Modals and their elements
let bidModal;
let bidDropdown;
let confirmBidBtn;
let cancelBidBtn;

let passConfirmModal;
let confirmPassBtn;
let cancelPassBtn;

// New Trump Modal Elements
let trumpModal;
let suitSelectionContainer;
let confirmTrumpBtn;

// Player-specific bid control elements
let bidButtons = {};
let passButtons = {};

/**
 * Formats a player's name for display.
 * @param {string} name - The player's internal name.
 * @returns {string} The display-friendly name.
 */
function formatPlayerDisplayName(name) {
    // Check if name is null, undefined, or an empty string.
    // If it is, return a default placeholder string to prevent charAt error.
    if (name === null || typeof name === 'undefined' || name === '') {
        return "Bid Winner"; // Provide a default string when name is not available
    }
    if (name === "south") {
        return "You (South)";
    }
    // For other valid names, format them as usual.
    return name.charAt(0).toUpperCase() + name.slice(1);
}
window.formatPlayerDisplayName = formatPlayerDisplayName; // <--- Expose globally


/**
 * Displays a message in a specified HTML element.
 * @param {string} msg - The message to display.
 * @param {string} elementId - The ID of the HTML element to display the message in.
 */
function displayMessage(msg, elementId) {
  const msgBox = document.getElementById(elementId);
  if (msgBox) {
    msgBox.textContent = msg;
  }
}
// Expose displayMessage globally
window.displayMessage = displayMessage;

/**
 * Hides a message or element in the UI.
 * @param {string} elementId - The ID of the HTML element to hide.
 */
function hideMessage(elementId) {
    const msgBox = document.getElementById(elementId);
    if (msgBox) {
        msgBox.textContent = ''; // Clear the text content
        // Depending on your CSS/design, you might also want to hide it completely
        // For example: msgBox.style.display = 'none';
        // For this specific case, clearing the text is enough to make it appear hidden.
    }
}
window.hideMessage = hideMessage; // <--- Expose globally

/**
 * Updates the persistent game info displays in the sidebar (desktop) and mobile area.
 */
function updateGameInfoDisplays() {
    const desktopBidWinner = document.getElementById('desktop-bid-winner');
    const desktopFinalBid = document.getElementById('desktop-final-bid');
    const desktopPartnerCard = document.getElementById('desktop-partner-card');

    const mobileBidWinner = document.getElementById('mobile-bid-winner');
    const mobileFinalBid = document.getElementById('mobile-final-bid');
    const mobilePartnerCard = document.getElementById('mobile-partner-card');

    const bidWinnerText = window.bidWinnerName ? window.formatPlayerDisplayName(window.bidWinnerName) : 'N/A';
    const finalBidText = window.finalBidAmount ? window.finalBidAmount.toString() : 'N/A';
    const partnerCardText = (window.selectedPartnerRank && window.selectedPartnerSuit) ? 
                            `${window.selectedPartnerRank.toUpperCase()} of ${window.selectedPartnerSuit.toUpperCase()}` : 'N/A';

    if (desktopBidWinner) desktopBidWinner.textContent = bidWinnerText;
    if (desktopFinalBid) desktopFinalBid.textContent = finalBidText;
    if (desktopPartnerCard) desktopPartnerCard.textContent = partnerCardText;

    if (mobileBidWinner) mobileBidWinner.textContent = bidWinnerText;
    if (mobileFinalBid) mobileFinalBid.textContent = finalBidText;
    if (mobilePartnerCard) mobilePartnerCard.textContent = partnerCardText;
}
window.updateGameInfoDisplays = updateGameInfoDisplays; // Expose globally

function startBidding(initialBidderIndex) {
    console.log("Bidding started!");
    window.highestBid = 0;
    window.highestBidder = null;
    window.passedPlayers.clear();
    window.currentPlayerIndex = initialBidderIndex;

    // --- CRITICAL: Ensure ALL trick-related game state is reset for a NEW ROUND ---
    window.trumpBroken = false;
    window.trickCount = 0; // Reset trick count for the new round
    window.trickWinner = null; // Reset trick winner
    window.currentTrick = []; // Clear current trick cards
    window.cardsInCurrentTrick = 0; // Reset card counter for new trick
    window.leadSuitForTrick = null; // Reset lead suit for new trick
    
    // Reset persistent game info variables for the new round
    window.bidWinnerName = null;
    window.finalBidAmount = null;
    window.selectedPartnerSuit = null; // Reset partner info
    window.selectedPartnerRank = null; // Reset partner info
    window.partnerPlayerName = null; // Reset actual partner player
    window.partnerRevealed = false; // Reset partner reveal flag

    // CRITICAL FIX: Increment currentRound ONLY at the end of a round, not here.
    // This function is for *starting* a new round, not concluding the previous one.
    // The only exception is the very first time starting the game.
    if (window.currentRound === 0) { // If it's the very initial game start
        window.currentRound = 1; // Start at Round 1
    }

    // Reset playersScores (current round's trick points) to 0 for the new round
    window.players.forEach(player => {
        window.playersScores[player] = 0;
        // Initialize gameTotalScores if it's the very beginning of a NEW GAME (Round 1)
        if (window.currentRound === 1) { // Only reset total game scores at the very start of a new game
             window.gameTotalScores[player] = 0;
        }
    });

    // Reset roundScoresHistory only if starting a brand new game (full restart via 'Restart Game' button)
    // If currentRound is 1 (meaning a new game just started), clear history.
    if (window.currentRound === 1) { 
        window.roundScoresHistory = [];
    }

    // --- CRITICAL FIX: Ensure the center playing area is cleared for a new round's cards ---
    if (typeof window.clearCenterPlayedCards === 'function') {
        window.clearCenterPlayedCards(false); // Clear any lingering played cards instantly
    }

    // Ensure bidding interface is visible at the start of bidding (if it's not already)
    const biddingInterface = document.getElementById('bidding-interface');
    const centerPlayedCardsContainer = document.getElementById('center-played-cards');

    if (biddingInterface) biddingInterface.style.display = 'flex';
    if (centerPlayedCardsContainer) centerPlayedCardsContainer.style.display = 'none'; // Hide played cards area initially for bidding

    updateBiddingUI();
    window.updatePlayerBidControls(window.players[window.currentPlayerIndex]);
    window.displayMessage("Bidding has begun!", "message-box");
    
    // --- CRITICAL FIX: Update the visual score display to 0 for the new round ---
    window.updateScoresDisplay(); // Call this to reset scores visually to 0 on player panels

    // Clear the persistent game info displays in sidebar/mobile
    window.updateGameInfoDisplays();

    // MODIFIED: Check if current player is AI and trigger AI bid
    window.handleCurrentPlayerTurn(); // This function will now handle AI turns
}
window.startBidding = startBidding; // Expose globally

/**
 * Updates the central bidding display and player turn indicator.
 */
function updateBiddingUI() {
    if (biddingStatusDisplay) biddingStatusDisplay.textContent = "Bidding in Progress";
    if (currentPlayerTurnDisplay) currentPlayerTurnDisplay.textContent = `It's ${window.formatPlayerDisplayName(window.players[window.currentPlayerIndex])}'s turn to bid.`;
    if (highestBidDisplay) highestBidDisplay.textContent = window.highestBidder ? window.highestBid.toString() : "0";
    if (highestBidderNameDisplay) highestBidderNameDisplay.textContent = window.highestBidder ? `(${window.formatPlayerDisplayName(window.highestBidder).substring(0, 15)})` : "";
}
window.updateBiddingUI = updateBiddingUI;

/**
 * Updates the disabled status of bid/pass buttons for all players.
 * Only the current player's buttons will be enabled.
 * @param {string} activePlayerId - The identifier of the player whose turn it is.
 */
function updatePlayerBidControls(activePlayerId) {
    const bidControls = document.getElementById('bid-controls');
    const passBtn = document.getElementById('pass-btn');

    // Check for the "Pass Out" scenario: three players have passed, and no one has bid.
    // This happens when the highestBid is still 0.
    if (window.passedPlayers.size === 3 && window.highestBid === 0) {
        // This player is the last one in the bidding round, they must bid.
        if (passBtn) {
            passBtn.disabled = true;
            passBtn.classList.add('disabled');
            window.displayMessage("You must bid. Passing is not allowed as you are the last player to bid.", "message-box");
        }
    } else {
        const isForcedBidder = window.passedPlayers.size === window.players.length - 1;

        for (const player of window.players) {
            const bidBtn = bidButtons[player];
            const passBtn = passButtons[player];

            if (bidBtn && passBtn) {
                // MODIFIED CONDITION: Only enable buttons if it's the active player's turn AND they are the logged-in (human) player
                if (player === activePlayerId && player === window.loggedInPlayer && !window.passedPlayers.has(player)) {
                    bidBtn.removeAttribute('disabled');                
                    if (isForcedBidder) {
                        passBtn.setAttribute('disabled', 'true');
                    } else {
                        passBtn.removeAttribute('disabled');
                    }

                } else {
                    bidBtn.setAttribute('disabled', 'true');
                    passBtn.setAttribute('disabled', 'true');
                }
            }
        }
    }
}
window.updatePlayerBidControls = updatePlayerBidControls;


/**
 * Populates the bid dropdown with valid bid amounts.
 */
function populateBidDropdown() {
    bidDropdown.innerHTML = '';
    let startBid = window.highestBid;
    
    if (!window.highestBidder) {
        startBid = MIN_BID;
    } else {
        startBid = window.highestBid + BID_INCREMENT;
    }

    let hasValidBids = false;
    for (let bid = startBid; bid <= MAX_BID; bid += BID_INCREMENT) {
        const option = document.createElement('option');
        option.value = bid;
        option.textContent = bid;
        bidDropdown.appendChild(option);
        hasValidBids = true;
    }

    if (hasValidBids) {
        bidDropdown.value = bidDropdown.options[0].value;
    } else {
        window.displayMessage("No higher bids possible. You must pass.", "message-box");
        hideBidModal();
    }
}

/**
 * Shows the bid dropdown modal.
 */
function showBidModal() {
    populateBidDropdown();
    if (bidDropdown.options.length > 0) {
        bidModal.style.display = 'flex';
    }
}

/**
 * Hides the bid dropdown modal.
 */
function hideBidModal() {
    bidModal.style.display = 'none';
}

/**
 * Shows the pass confirmation modal.
 */
function showPassConfirmModal() {
    passConfirmModal.style.display = 'flex';
}

/**
 * Hides the pass confirmation modal.
 */
function hidePassConfirmModal() {
    passConfirmModal.style.display = 'none';
}

/**
 * Shows the trump selection modal.
 */
function showTrumpSelectionModal() {
    trumpModal.style.display = 'flex';
}
window.showTrumpSelectionModal = showTrumpSelectionModal;

/**
 * Hides the trump selection modal.
 */
function hideTrumpSelectionModal() {
    trumpModal.style.display = 'none';
}

// Add this new function to game_logic.js
/**
 * Initiates the trump selection phase.
 * @param {string} bidWinner - The player who won the bid.
 */
function startTrumpSelection(bidWinner) {
    window.currentPlayerIndex = window.players.indexOf(bidWinner); // Set current player to bid winner
    window.displayMessage(`${window.formatPlayerDisplayName(bidWinner)}, choose the trump suit.`, "message-box");
    
    // MODIFIED: Check if bid winner is AI and trigger AI trump choice AND partner choice
    if (window.gameMode === 'single-player' && bidWinner !== window.loggedInPlayer) {
        setTimeout(() => {
            // 1. AI chooses Trump
            const aiChosenTrump = window.ai.aiChooseTrump(bidWinner, window.hands[bidWinner]);
            window.currentTrumpSuit = aiChosenTrump;
            window.displayMessage(`${window.formatPlayerDisplayName(bidWinner)} has selected ${aiChosenTrump} as trump!`, "message-box");
            
            // 2. AI chooses Partner (NEW)
            const aiPartnerCard = window.ai.aiChoosePartner(bidWinner, window.hands[bidWinner]);
            window.selectedPartnerSuit = aiPartnerCard.suit;
            window.selectedPartnerRank = aiPartnerCard.rank;
            
            // 3. Identify the actual partner player (will also set up teams: bidWinningTeam, opponentTeam)
            // This function is in partner_selection.js and needs to be exposed if not already
            window.identifyPartnerPlayer(); // Ensure this function is called
            
            // 4. Show partner reveal message (visual feedback)
            // window.showPartnerRevealMessage();  This function should be in trick_logics.js or game_play.js

            // 5. Proceed to start the trick after AI trump/partner selection and brief display
            setTimeout(() => {
                // Hide bidding interface (and partner reveal message if still visible)
                if (window.biddingInterface) {
                    window.biddingInterface.style.display = 'none';
                }
                window.hideMessage('partner-reveal-message'); // Explicitly hide after display duration

                if (typeof window.startTrick === 'function') {
                    // AI's turn to play first card after bidding
                    // Explicitly set the current player to the highest bidder before starting the trick
                    window.currentPlayerIndex = window.players.indexOf(window.highestBidder);
                    window.currentPlayer = window.highestBidder;
                    window.startTrick();
                } else {
                    console.error("startTrick function not found. Cannot begin game play after AI trump/partner selection.");
                }
            }, 2500); // Longer delay to allow human to read trump and partner reveal messages
        }, 1500); // AI "thinking" delay for trump selection
    } else {
        // Human player (or multiplayer)
        window.showTrumpSelectionModal(); // Show the human UI for trump selection
    }
}
window.startTrumpSelection = startTrumpSelection; // Expose globally

/**
 * Handles a player placing a bid.
 * @param {string} player - The name of the player placing the bid.
 * @param {number} bidAmount - The amount the player wants to bid.
 */
function placeBid(player, bidAmount) {
    if (bidAmount > window.highestBid) {
        window.highestBid = bidAmount;
        window.highestBidder = player;
        window.displayMessage(`${window.formatPlayerDisplayName(player)} bids ${bidAmount}!`, "message-box");
        updateGameInfoDisplays(); // Update game info after bid
        advanceTurn();
    } else {
        window.displayMessage("Bid must be higher than current highest bid.", "message-box");
        
        // MODIFIED: Differentiate behavior for human vs. AI on invalid bid
        if (player === window.loggedInPlayer) {
            // If the human player made an invalid bid, show the modal again for them to correct.
            showBidModal(); 
        } else {
            // If an AI player made an invalid bid, they should automatically pass.
            // This prevents the modal from appearing for AI turns.
            window.passBid(player); 
        }
    }
}
window.placeBid = placeBid;

/**
 * Handles a player choosing to pass.
 * @param {string} player - The name of the player passing.
 */
function passBid(player) {
    if (window.passedPlayers.size === window.players.length - 1 && player === window.players[window.currentPlayerIndex]) {
        window.displayMessage(`You must bid. Passing is not allowed as you are the last player.`, "message-box");
        hidePassConfirmModal();
        return;
    }

    window.passedPlayers.add(player);
    window.displayMessage(`${window.formatPlayerDisplayName(player)} passes.`, "message-box");
    
    if (window.passedPlayers.size === window.players.length - 1 && window.highestBidder) {
        window.displayMessage(`${window.formatPlayerDisplayName(window.highestBidder)} wins the bid with ${window.highestBid}!`, "message-box");
        endBiddingRound();
    } else if (window.passedPlayers.size === window.players.length && !window.highestBidder) {
        window.displayMessage("All players passed on the minimum bid. Redealing cards...", "message-box");
        endBiddingRound(true);
    } else {
        advanceTurn();
    }
}
window.passBid = passBid;

// Add this new function to game_logic.js
/**
 * Handles the current player's turn (human or AI).
 * This function will be called whenever the turn changes.
 */
function handleCurrentPlayerTurn() {
    const currentPlayer = window.players[window.currentPlayerIndex];
    window.updatePlayerBidControls(currentPlayer); // Always update controls

    // If it's a single-player game AND the current player is an AI bot
    if (window.gameMode === 'single-player' && (window.isAdminMode || currentPlayer !== window.loggedInPlayer)) {
        window.displayMessage(`${window.formatPlayerDisplayName(currentPlayer)} is thinking...`, "message-box");
        setTimeout(() => {
            // Trigger AI to make a bid
            const aiBid = window.ai.aiMakeBid(currentPlayer, window.highestBid, window.hands[currentPlayer]);
            window.placeBid(currentPlayer, aiBid); // AI makes its bid
        }, 1500); // Simulate AI thinking time
    } else {
        // It's a human player's turn (or multiplayer setup)
        window.displayMessage(`${window.formatPlayerDisplayName(currentPlayer)}'s turn to bid.`, "message-box");
        /* For bidding, show the bid modal only for the human player BUT only when the user clicks 
            .. on bid button so this part of the code was commented out to avoid auto-opening:
        if (currentPlayer === window.loggedInPlayer) { // Ensure modal only opens for logged-in player
            window.showBidModal();
        } */
    }
}
window.handleCurrentPlayerTurn = handleCurrentPlayerTurn; // Expose globally

/**
 * Advances the turn to the next player in the bidding sequence.
 */
function advanceTurn() {
        const activePlayers = window.players.filter(player => !window.passedPlayers.has(player));
        const nextPlayerIndex = (window.players.indexOf(window.players[window.currentPlayerIndex]) + 1) % window.players.length;
        let nextPlayerId = window.players[nextPlayerIndex];

        while (window.passedPlayers.has(nextPlayerId) && window.players.indexOf(nextPlayerId) !== window.players.indexOf(window.players[window.currentPlayerIndex])) {
            nextPlayerId = window.players[(window.players.indexOf(nextPlayerId) + 1) % window.players.length];
        }
        
        if (activePlayers.length === 1 && window.highestBidder) {
            endBiddingRound();
        } else {
            window.currentPlayerIndex = window.players.indexOf(nextPlayerId);
            updateBiddingUI();
            updatePlayerBidControls(window.players[window.currentPlayerIndex]);
            window.handleCurrentPlayerTurn(); 
        }
}

/**
 * Identifies the partner player based on the selected partner card.
 * This should be called after `confirmPartnerCard` in `partner_selection.js`.
 
function identifyPartnerPlayer() {
    // Iterate through all players' hands to find the selected partner card
    for (const player in window.hands) {
        const hand = window.hands[player];
        const foundCard = hand.find(card => 
            card.suit === window.selectedPartnerSuit && card.rank === window.selectedPartnerRank
        );

        if (foundCard) {
            window.partnerPlayerName = player; // Set the global partner player name
            window.displayMessage(`${window.formatPlayerDisplayName(player)} is your partner!`, "message-box");
            console.log(`Partner is: ${player}`);
            break; // Found the partner, exit loop
        }
    }
}
window.identifyPartnerPlayer = identifyPartnerPlayer; // Expose globally
*/

/**
 * Starts a new trick. Determines the lead player and prepares the UI.
 */
function startTrick() {
    console.log("Starting a new trick...");

    // Hide the bidding interface
    if (window.biddingInterface) {
        window.biddingInterface.style.display = 'none';
    }

    // Make the new played cards area visible and interactive
    if (window.centerPlayedCards) {
        window.centerPlayedCards.style.display = 'flex';
        window.centerPlayedCards.style.opacity = '1';
        window.centerPlayedCards.style.pointerEvents = 'auto';
    }

    // Determine the lead player for this trick
    // Use the highest bidder for the first trick, otherwise the winner of the last trick
    window.currentTrickLeadPlayer = window.trickCount === 0 ? window.highestBidder : window.trickWinner;

    // Find the index of the lead player and set the current player
    window.currentPlayerIndex = window.players.indexOf(window.currentTrickLeadPlayer);
    window.currentPlayer = window.players[window.currentPlayerIndex];
    
    // Reset trick-specific variables
    window.currentTrick = [];
    window.cardsInCurrentTrick = 0;
    window.leadSuitForTrick = null;
    window.displayMessage(`${window.formatPlayerDisplayName(window.currentTrickLeadPlayer)} leads the trick!`, "message-box");
    
    /// 4. Update the UI to reflect the current player
    window.updatePlayerCardInteractions(window.currentPlayer);

    // 5. CRITICAL FIX: Handle the case where the bid winner is an AI player.
    // If the current player is an AI, we must programmatically trigger their turn
    // after a short delay to allow UI to render.
    const isAIPlayer = window.currentPlayer !== window.loggedInPlayer;
    if (isAIPlayer && window.gameMode === 'single-player') {
        console.log(`[startTrick] Bid winner is an AI (${window.currentPlayer}). Initiating their turn...`);
        // Use a single, controlled timeout to prevent race conditions.
        // The timeout is to allow UI to update before the AI plays.
        window.nextTurnTimeoutId = setTimeout(() => {
            // This function call should be the sole way the AI plays its first card.
            window.ai.playAiFirstCard(window.currentPlayer);
        }, 1000); // 1000ms delay to be safe
    } else {
        // If the bid winner is the human player, no timeout is needed.
        // The player's cards are already clickable due to updatePlayerCardInteractions.
        console.log(`[startTrick] Bid winner is a human player (${window.currentPlayer}). Awaiting their card play.`);
    }
}
window.startTrick = startTrick;

/**
 * Returns a numerical value for a card's rank.
 * @param {string} rank - The rank of the card (e.g., 'ace', 'king', '5').
 * @returns {number} - The numerical value of the rank.
 */
function getCardRankValue(rank) {
    const rankOrder = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14 };
    return rankOrder[rank] || 0;
}
window.getCardRankValue = getCardRankValue;

/**
 * Calculates the points for a given card based on the game's scoring rules.
 * @param {object} card - The card object {suit: string, rank: string}.
 * @returns {number} The point value of the card.
 */
function getCardPoints(card) {
    const { rank, suit } = card;
    if (rank === 'ace') {
        return 20;
    } else if (rank === 'jack' || rank === 'king') {
        return 10;
    } else if (rank === 'queen') {
        if (suit === 'spades') { // Queen of Spades (Black Queen)
            return 30;
        }
        return 10; // Other Queens
    } else if (rank === '10') {
        return 10;
    } else if (rank === '5') {
        return 5;
    }
    return 0; // All other cards (2,3,4,6,7,8,9)
}

/**
 * Determines the numerical value of a card based on its suit and rank.
 * Used for comparing cards in a trick.
 * @param {Object} card - The card object {suit, rank}.
 * @param {string} leadSuit - The suit of the first card played in the trick.
 * @param {string} trumpSuit - The current trump suit.
 * @returns {number} - A numerical value for comparison.
 */
function getCardValue(card, leadSuit, trumpSuit) {
    const rankValue = window.getCardRankValue(card.rank);
    if (card.suit === trumpSuit) {
        return rankValue + 1000; // Trumps are always higher
    }
    if (card.suit === leadSuit) {
        return rankValue + 100; // Cards of the lead suit are next highest
    }
    return rankValue; // All other cards
}
window.getCardValue = getCardValue;

/**
 * Compares two cards to determine which one is higher in a trick.
 * @param {Object} cardA - The first card object {suit, rank}.
 * @param {Object} cardB - The second card object {suit, rank}.
 * @param {string} leadSuit - The suit of the first card played in the trick.
 * @param {string} trumpSuit - The current trump suit.
 * @returns {number} - 1 if cardA wins, -1 if cardB wins, 0 if they are equal (shouldn't happen).
 */
function compareCards(cardA, cardB, leadSuit, trumpSuit) {
    const valueA = window.getCardValue(cardA, leadSuit, trumpSuit);
    const valueB = window.getCardValue(cardB, leadSuit, trumpSuit);
    return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
}
window.compareCards = compareCards;

/**
 * Finds the highest card in the current trick.
 * @param {Array<Object>} trick - The array of cards played in the trick.
 * @param {string} leadSuit - The suit of the first card played in the trick.
 * @param {string} trumpSuit - The current trump suit.
 * @returns {Object} - The highest card object in the trick.
 */
function getHighestCardInTrick(trick, leadSuit, trumpSuit) {
    if (trick.length === 0) {
        return null;
    }
    let highestCard = trick[0];
    for (let i = 1; i < trick.length; i++) {
        if (window.compareCards(trick[i], highestCard, leadSuit, trumpSuit) > 0) {
            highestCard = trick[i];
        }
    }
    return highestCard;
}
window.getHighestCardInTrick = getHighestCardInTrick;

/**
 * Determines the winning card and player for a trick.
 * @param {Array<Object>} trick - An array of card/player objects played in the trick.
 * @returns {Object} - The winning trick object {card, player, playerIndex}.
 */
function determineTrickWinner(trick) {
    if (trick.length === 0) return null;

    const leadSuit = trick[0].card.suit;
    let highestCardValue = window.getCardValue(trick[0].card, leadSuit, window.currentTrumpSuit);
    let winningTrick = trick[0];

    for (let i = 1; i < trick.length; i++) {
        const currentCardValue = window.getCardValue(trick[i].card, leadSuit, window.currentTrumpSuit);
        if (currentCardValue > highestCardValue) {
            highestCardValue = currentCardValue;
            winningTrick = trick[i];
        }
    }
    return winningTrick;
}
window.determineTrickWinner = determineTrickWinner;

/**
 * Determines which cards in a player's hand are legally playable.
 * @param {Array<Object>} playerHand - The player's hand.
 * @param {string|null} leadSuit - The suit of the first card played in the trick. Null if player is leading.
 * @param {string} trumpSuit - The current trump suit.
 * @returns {Array<Object>} - An array of playable card objects.
 */
function getPlayableCards(playerHand, leadSuit, trumpSuit) {
    // Rule 1 & 2: Logic for when the AI is leading the trick
    if (!leadSuit) {
        // Find all non-trump cards in the hand
        const nonTrumpCards = playerHand.filter(card => card.suit !== trumpSuit);

        // Rule 2: If the AI has NO non-trump cards OR if trump is already broken,
        // they can lead with any card.
        if (nonTrumpCards.length === 0 || window.isTrumpBroken) {
            return playerHand;
        } else {
            // Rule 1: Trump is not broken and the AI has non-trump cards,
            // so they cannot lead with a trump.
            return nonTrumpCards;
        }
    }

    // Rule 4: If the player has cards of the lead suit, they must follow suit.
    const cardsOfLeadSuit = playerHand.filter(card => card.suit === leadSuit);
    if (cardsOfLeadSuit.length > 0) {
        return cardsOfLeadSuit;
    }

    // At this point, the AI does not have a card of the lead suit.

    // Bonus Ruffing Logic: Check if the trick already has a trump card.
    const trickHasTrumps = window.currentTrick.some(trickCard => trickCard.suit === trumpSuit);

    // If the trick has trumps and the player has trump cards...
    if (trickHasTrumps) {
        // You must play a trump higher than the highest one on the table, if possible.
        const highestTrumpInTrick = window.getHighestCardInTrick(window.currentTrick, leadSuit, trumpSuit);

        // Filter for trump cards that are higher than the highest trump already played.
        const canOverTrump = playerHand.filter(card => 
            card.suit === trumpSuit && window.getCardValue(card, trumpSuit) > window.getCardValue(highestTrumpInTrick.card, trumpSuit)
        );
        
        // If there are higher trumps, return only those.
        if (canOverTrump.length > 0) {
            return canOverTrump;
        } else {
            // If they can't over-trump, they can play any trump card.
            const trumpCards = playerHand.filter(card => card.suit === trumpSuit);
            return trumpCards;
        }
    }

    // Rule 3: If the player has no lead suit cards and no trumps have been played in the trick,
    // they can play any card from their hand (a discard).
    return playerHand;
}

window.getPlayableCards = getPlayableCards; // Expose globally

/**
 * Ends the bidding round.
 * @param {boolean} [redeal=false] - Optional. If true, indicates cards need to be redealt.
 */
function endBiddingRound(redeal = false) {
    console.log("Bidding round ended. Winner:", window.highestBidder);
    window.updatePlayerBidControls(null);
    if (redeal) {
        setTimeout(() => {
            window.displayMessage("All players passed on minimum bid. Redealing cards!", "message-box");
            if (typeof window.dealCards === 'function') { // dealCards is in script.js, now globally exposed
                window.dealCards();
                window.startBidding(0);
            } else {
                console.error("dealCards function not found. Cannot redeal.");
            }
        }, 1500);
    } else {
        biddingStatusDisplay.textContent = `Bidding Concluded!`;
        if (window.highestBidder) {
            currentPlayerTurnDisplay.textContent = `${window.formatPlayerDisplayName(window.highestBidder)} won the bid with ${window.highestBid}!`;
            // Store bid winner and amount for game info display
            window.bidWinnerName = window.highestBidder;
            window.finalBidAmount = window.highestBid;
            // CRITICAL FIX: Ensure the bidding UI is updated with the final bid amount before showing the modal
            if (highestBidDisplay) {
                highestBidDisplay.textContent = window.highestBid.toString();
            }
            if (highestBidderNameDisplay) {
                highestBidderNameDisplay.textContent = `(${window.formatPlayerDisplayName(window.highestBidder).substring(0, 15)})`;
            }
            window.startTrumpSelection(window.highestBidder);
        } else {
            currentPlayerTurnDisplay.textContent = "No bids placed.";
        }
    }
}
window.endBiddingRound = endBiddingRound; // Expose globally

function endOfRoundScoring() {
    console.log("End of Round Scoring triggered.");

    let bidWinningTeamTotal = 0;
    let opponentTeamTotal = 0;

    // Calculate total points for the bid-winning team
    if (window.bidWinningTeam) {
        window.bidWinningTeam.forEach(player => {
            // Use a nullish coalescing operator to handle players who might have 0 points
            bidWinningTeamTotal += window.playersScores[player] ?? 0;
        });
    }

    // Calculate total points for the opponent team
    if (window.opponentTeam) {
        window.opponentTeam.forEach(player => {
            opponentTeamTotal += window.playersScores[player] ?? 0;
        });
    }

    // At this point, we have the total trick points for each team.
    // We will add the logic to apply the scoring rules in the next step. 
    // 2. Apply the scoring rules based on the bid
    if (bidWinningTeamTotal >= window.finalBidAmount) {
        // Bid-winning team meets or exceeds the bid.
        window.playersScores[window.highestBidder] = window.finalBidAmount * 2;
        
        // Partner's score
        const partner = window.partnerPlayerName;
        if (partner) {
            window.playersScores[partner] = window.finalBidAmount;
        }

        // Opponent team gets 0 points for this round
        if (window.opponentTeam) {
            window.opponentTeam.forEach(player => {
                window.playersScores[player] = 0;
            });
        }

    } else {
        // Bid-winning team FAILS to meet the bid.
        window.playersScores[window.highestBidder] = -window.finalBidAmount;

        // Partner's score is 0
        const partner = window.partnerPlayerName;
        if (partner) {
            window.playersScores[partner] = 0;
        }

        // Each opponent player gets the bid amount
        if (window.opponentTeam) {
            window.opponentTeam.forEach(player => {
                window.playersScores[player] = window.finalBidAmount;
            });
        }
    }
}

/**
 * Handles the end of a single game round (after all tricks for that round are played).
 * This function determines if the entire game is over or if another round should start.
 */
function endRound() {
    console.log("End of Round detected.");

    // Call the endOfRoundScoring function to calculate scores for this round
    endOfRoundScoring();

    // Add current round's scores to total game scores and record history
    const currentRoundScores = { round: window.currentRound };
    window.players.forEach(player => {
        const roundScore = window.playersScores[player]; // Score earned in this round
        window.gameTotalScores[player] = (window.gameTotalScores[player] || 0) + roundScore;
        currentRoundScores[player] = roundScore;
    });
    window.roundScoresHistory.push(currentRoundScores); // Record this round's scores

    // Reset current round's individual player scores for the next round
    window.players.forEach(player => {
        window.playersScores[player] = 0;
    });

    window.displayMessage(`Round ${window.currentRound} complete!`, "message-box");
    console.log(`Round ${window.currentRound} complete. Game Total Scores:`, window.gameTotalScores);
    console.log("Round Scores History:", window.roundScoresHistory);

    window.currentRound++; // Increment game round number for the *next* round

    // Clear the center played cards and show score table
    setTimeout(() => {
        if (typeof window.clearCenterPlayedCards === 'function') {
            window.clearCenterPlayedCards(false); // Clear without face down animation
        }

        // Check if the entire game is over (if the *incremented* currentRound is now greater than totalRounds)
        if (window.currentRound > window.totalRounds) { 
            window.endGame(); // Call the game over function
        } else {
            window.showRoundScoreTable(); // Show round scores table for intermediate rounds
        }

        // Hide main game controls/messages while score table is up (or before next deal)
        document.getElementById('deal-cards-btn').style.display = 'none';
        window.updatePlayerBidControls(null);
    }, 3000); // Give time for final message to be read before showing table
}
window.endRound = endRound; // Expose globally


/**
 * Handles the end of the entire game (after all totalRounds are played).
 */
function endGame() {
    window.displayMessage("Game Over!", "message-box");
    
    // Determine overall winner based on gameTotalScores
    let overallWinner = null;
    let highestScore = -Infinity; // Initialize with negative infinity for correct comparison
    for (const player in window.gameTotalScores) {
        if (window.gameTotalScores[player] > highestScore) {
            highestScore = window.gameTotalScores[player];
            overallWinner = player;
        } else if (window.gameTotalScores[player] === highestScore && overallWinner !== null) {
            // Handle ties: if current player ties with existing winner, add to overallWinner string or array
            // For now, simple tie break: first one encountered wins, or you can extend this.
            // If you want to show all tied players:
            // if (typeof overallWinner === 'string') overallWinner = [overallWinner];
            // overallWinner.push(player);
        }
    }
    
    if (overallWinner) {
        window.displayMessage(`Game Over! ${window.formatPlayerDisplayName(overallWinner)} wins the game with a total score of ${highestScore}!`, "message-box");
    } else {
        window.displayMessage("Game Over! No scores to determine a winner.", "message-box");
    }
    
    // Show final score table (it should already be visible from endRound if it was the last round)
    // Or display a dedicated "Game Over" screen/modal.
    // For now, we'll ensure the score table is shown and just has the restart button.
    setTimeout(() => {
        window.showRoundScoreTable(); // Display the score table modal with final scores
        // The showRoundScoreTable function already handles showing/hiding buttons based on currentRound vs totalRounds
    }, 2000); // Give time to read end game message
}
window.endGame = endGame; // Expose globally

/**
 * Shows the score table modal at the end of a round or game.
 */
function showRoundScoreTable() {
    const scoreTableModal = document.getElementById('score-table-modal');
    const scoreTableTitle = document.getElementById('score-table-title');
    const scoreTableHeaderRow = document.getElementById('score-table-header-row');
    const scoreTableBody = document.getElementById('score-table-body');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');

    if (!scoreTableModal || !scoreTableTitle || !scoreTableHeaderRow || !scoreTableBody || !nextRoundBtn || !restartGameBtn) {
        console.error("Score table modal elements not found. Check starter.html IDs.");
        return;
    }

    scoreTableTitle.textContent = `Game Scores (Round ${window.currentRound -1} of ${window.totalRounds})`; // Corrected: Display the round that just finished

    // Clear previous headers and body
    scoreTableHeaderRow.innerHTML = '';
    scoreTableBody.innerHTML = '';

    // Populate table header (Round No. | Player1 | Player2 | Player3 | Player4)
    const roundNoHeader = document.createElement('th');
    roundNoHeader.textContent = 'Round No.';
    scoreTableHeaderRow.appendChild(roundNoHeader);

    window.players.forEach(player => {
        const playerHeader = document.createElement('th');
        playerHeader.textContent = window.formatPlayerDisplayName(player);
        scoreTableHeaderRow.appendChild(playerHeader);
    });

    // Populate table body with historical round scores
    window.roundScoresHistory.forEach((roundData, index) => {
        const row = scoreTableBody.insertRow();
        const roundNoCell = row.insertCell();
        roundNoCell.textContent = roundData.round; // This is the round number

        window.players.forEach(player => {
            const playerScoreCell = row.insertCell();
            playerScoreCell.textContent = roundData[player] !== undefined ? roundData[player] : 0;
        });
    });

    // Add a final row for Total Scores
    const totalRow = scoreTableBody.insertRow();
    const totalLabelCell = totalRow.insertCell();
    totalLabelCell.textContent = 'TOTAL';
    totalLabelCell.colSpan = 1; // Make it span just one column
    totalLabelCell.style.fontWeight = 'bold';
    totalLabelCell.style.backgroundColor = '#1e7e34'; // Darker background for total row
    totalLabelCell.style.color = '#ffcc00';

    window.players.forEach(player => {
        const totalScoreCell = totalRow.insertCell();
        totalScoreCell.textContent = window.gameTotalScores[player] !== undefined ? window.gameTotalScores[player] : 0;
        totalScoreCell.style.fontWeight = 'bold';
        totalScoreCell.style.backgroundColor = '#1e7e34';
        totalScoreCell.style.color = '#ffcc00';
    });


    // Control button visibility based on game state
    // If the current round number (which is the *next* round to be played) is less than or equal to totalRounds, allow next round.
    if (window.currentRound <= window.totalRounds) { // Corrected: Use <= to allow "Next Round" for the final intermediate round
        nextRoundBtn.style.display = 'block';
        restartGameBtn.style.display = 'none'; 
    } else {
        // If currentRound is now greater than totalRounds, it means the game is truly over.
        scoreTableTitle.textContent = `Final Game Scores - Game Over!`;
        nextRoundBtn.style.display = 'none'; 
        restartGameBtn.style.display = 'block'; 
    }

    scoreTableModal.style.display = 'flex'; 


    // Add event listeners for buttons within the modal
    // It's safer to re-assign these to ensure they're always active after modal is shown
    nextRoundBtn.onclick = () => {
        console.log("Proceeding to next round...");
        scoreTableModal.style.display = 'none';
        
        // window.playersScores is already reset in startBidding, but ensure the UI reflects it.
        // The game state resets are now primarily handled by startBidding,
        // which will be called right after dealing.
        
        window.shuffleDeck();
        window.dealCards(); // This will also call displayCards()
        window.startBidding(0); // Start new bidding phase (South leads by default)
    };

    restartGameBtn.onclick = () => {
        console.log("Restarting game...");
        scoreTableModal.style.display = 'none';
        // Completely reset game state for a brand new game
        window.currentRound = 0; // Reset round counter to 0, which will make startBidding increment it to 1
        window.players.forEach(player => {
            window.playersScores[player] = 0;   // Reset individual round scores
            window.gameTotalScores[player] = 0; // Reset total game scores
        });
        window.roundScoresHistory = []; // Clear all historical round scores
        
        window.shuffleDeck(); // Shuffle the deck
        window.dealCards(); // This will also call displayCards()
        window.startBidding(0); // Start new bidding phase from scratch
    };
}
window.showRoundScoreTable = showRoundScoreTable; // Expose globally

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Retrieve game parameters from sessionStorage
    const storedTotalRounds = sessionStorage.getItem('totalRounds');
    const storedCardsPerPlayer = sessionStorage.getItem('cardsPerPlayer'); // ADDED

    if (storedTotalRounds) {
        window.totalRounds = parseInt(storedTotalRounds, 10);
    }
    if (storedCardsPerPlayer) { // ADDED
        window.cardsPerPlayer = parseInt(storedCardsPerPlayer, 10); // ADDED
    } else { // ADDED: Default for cardsPerPlayer if not set
        window.cardsPerPlayer = 13; // Default for a standard game
    }


    // Assign DOM elements to window object for global access
    window.biddingInterface = document.getElementById('bidding-interface');
    window.centerPlayedCards = document.getElementById('center-played-cards');
    // Ensure initial display state: bidding visible, played cards hidden
    if (window.centerPlayedCards) {
        window.centerPlayedCards.style.display = 'none'; // Hide it initially
        window.centerPlayedCards.style.opacity = '0'; // Ensure opacity is also 0 if you want fade-in
    }
    if (window.biddingInterface) {
        window.biddingInterface.style.display = 'flex'; // Ensure bidding interface is visible
    }

    biddingStatusDisplay = document.getElementById('bidding-status');
    currentPlayerTurnDisplay = document.getElementById('current-player-turn');
    highestBidDisplay = document.getElementById('highest-bid-display');
    highestBidderNameDisplay = document.getElementById('highest-bidder-name');
    messageBox = document.getElementById('message-box');

    // Partner Selection Modal references
    window.partnerModal = document.getElementById('partner-modal');
    window.partnerStep1 = document.getElementById('partner-step1');
    window.partnerStep2 = document.getElementById('partner-step2');
    window.partnerSuitSelection = document.getElementById('partner-suit-selection');
    window.partnerRankSelection = document.getElementById('partner-rank-selection');
    window.nextToRankBtn = document.getElementById('next-to-rank-btn');
    window.backToSuitBtn = document.getElementById('back-to-suit-btn');
    window.confirmPartnerBtn = document.getElementById('confirm-partner-btn');
    window.suitNameDisplay = document.getElementById('suit-name');


    bidModal = document.getElementById('bid-modal');
    bidDropdown = document.getElementById('bid-dropdown');
    confirmBidBtn = document.getElementById('confirm-bid-btn');
    cancelBidBtn = document.getElementById('cancel-bid-btn');

    passConfirmModal = document.getElementById('pass-confirm-modal');
    confirmPassBtn = document.getElementById('confirm-pass-btn');
    cancelPassBtn = document.getElementById('cancel-pass-btn');

    // New Trump Modal Element Assignments
    trumpModal = document.getElementById('trump-modal');
    suitSelectionContainer = document.getElementById('suit-selection-container');
    confirmTrumpBtn = document.getElementById('confirm-trump-btn');

    // Populate player-specific button references by ID
    for (const player of window.players) {
        const bidBtn = document.getElementById(`${player}-bid-btn`);
        const passBtn = document.getElementById(`${player}-pass-btn`);

        if (bidBtn && passBtn) {
            bidButtons[player] = bidBtn;
            passButtons[player] = passBtn;
        } else {
            console.error(`Could not find bid/pass buttons for player: ${player}`);
        }
    }

    // Attach event listeners to all player Bid/Pass buttons
    window.players.forEach(player => {
        const bidBtn = bidButtons[player];
        const passBtn = passButtons[player];

        if (bidBtn) {
            bidBtn.addEventListener('click', () => {
                // MODIFIED: Only allow loggedInPlayer to trigger the modal via their OWN button
                if (player === window.loggedInPlayer && player === window.players[window.currentPlayerIndex]) {
                    showBidModal();
                } else if (player === window.loggedInPlayer && player !== window.players[window.currentPlayerIndex]) {
                    // Human player clicked their button when it's not their turn
                    window.displayMessage(`Please wait, it's not your turn to bid.`, "message-box");
                } else {
                    // This branch should theoretically not be hit for AI players if buttons are disabled,
                    // but it's a safe fallback. AI will bid programmatically.
                    window.displayMessage(`It's not ${window.formatPlayerDisplayName(player)}'s turn.`, "message-box");
                }
            });
        }
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                // MODIFIED: Only allow loggedInPlayer to trigger the modal via their OWN button
                if (player === window.loggedInPlayer && player === window.players[window.currentPlayerIndex]) {
                    showPassConfirmModal();
                } else if (player === window.loggedInPlayer && player !== window.players[window.currentPlayerIndex]) {
                    // Human player clicked their button when it's not their turn
                    window.displayMessage(`Please wait, it's not your turn to pass.`, "message-box");
                } else {
                    // This branch should theoretically not be hit for AI players if buttons are disabled.
                    window.displayMessage(`It's not ${window.formatPlayerDisplayName(player)}'s turn.`, "message-box");
                }
            });
        }
    });

    // Modal button event listeners
    if (confirmBidBtn) {
        confirmBidBtn.addEventListener('click', () => {
            const bidAmount = parseInt(bidDropdown.value, 10);
            if (!isNaN(bidAmount)) {
                window.placeBid(window.players[window.currentPlayerIndex], bidAmount);
                hideBidModal();
            } else {
                window.displayMessage("Please select a valid bid.", "message-box");
            }
        });
    }

    if (cancelBidBtn) {
        cancelBidBtn.addEventListener('click', () => {
            hideBidModal();
            window.displayMessage("Bid cancelled.", "message-box");
        });
    }

    if (confirmPassBtn) {
        confirmPassBtn.addEventListener('click', () => {
            window.passBid(window.players[window.currentPlayerIndex]);
            hidePassConfirmModal();
        });
    }

    if (cancelPassBtn) {
        cancelPassBtn.addEventListener('click', () => {
            hidePassConfirmModal();
            window.displayMessage("Pass cancelled.", "message-box");
        });
    }

    // NEW LOGIC FOR TRUMP MODAL
    if (suitSelectionContainer) {
        suitSelectionContainer.addEventListener('click', (event) => {
            let target = event.target;
            while (target && !target.classList.contains('suit-option')) {
                target = target.parentNode;
            }

            if (target) {
                document.querySelectorAll('.suit-option').forEach(suit => {
                    suit.classList.remove('selected');
                });
                target.classList.add('selected');
                
                const selectedSuit = target.getAttribute('data-suit');
                window.currentTrumpSuit = selectedSuit;
                confirmTrumpBtn.removeAttribute('disabled');
            }
        });
    }

    if (confirmTrumpBtn) {
        confirmTrumpBtn.addEventListener('click', () => {
            if (window.currentTrumpSuit) {
                window.displayMessage(`${window.formatPlayerDisplayName(window.highestBidder)} has selected ${window.currentTrumpSuit} as trump!`, "message-box");
                hideTrumpSelectionModal();
                
                // Show partner selection modal after a brief delay
                setTimeout(() => {
                    window.showPartnerSelectionModal(); // This function is in partner_selection.js
                }, 1000);
            } else {
                window.displayMessage("Please select a trump suit.", "message-box");
            }
        });
    }

    // ADD this to your existing DOMContentLoaded event listener
    // Add this line inside the existing DOMContentLoaded event listener, after the trump modal initialization:
    window.initializePartnerSelectionEvents(); // This function is in partner_selection.js

    // Initial state: Disable all controls until bidding starts
    window.updatePlayerBidControls(null);
});

// Explicitly expose functions as necessary for other scripts
// window.endBiddingRound = endBiddingRound; // Already handled by direct assignment
// window.evaluateTrick = evaluateTrick; // Already handled by direct assignment
// window.showRoundScoreTable = showRoundScoreTable; // Already handled by direct assignment

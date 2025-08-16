// Ensure players array is globally accessible
// MODIFIED: Expose 'players' directly on the window object
const players = ["north", "east", "south", "west"];
window.players = players; // <--- ADDED: Expose globally

let currentPlayerIndex;
// MODIFIED: Expose 'currentPlayerIndex' directly on the window object
window.currentPlayerIndex = currentPlayerIndex; // <--- ADDED: Expose globally

let highestBid = 0;
let highestBidder = null;
window.highestBidder = highestBidder;
// ADDED: New global variables for persistent game info
let bidWinnerName = null;
window.bidWinnerName = bidWinnerName;
let finalBidAmount = null;
window.finalBidAmount = finalBidAmount;

let currentTrumpSuit = null;
// MODIFIED: Expose 'currentTrumpSuit' directly on the window object
window.currentTrumpSuit = currentTrumpSuit; // <--- ADDED: Expose globally

const MIN_BID = 170;
const MAX_BID = 280;
const BID_INCREMENT = 5;

let passedPlayers = new Set();
// MODIFIED: Expose 'passedPlayers' directly on the window object
window.passedPlayers = passedPlayers; // <--- ADDED: Expose globally

// --- New Game Play State Variables ---
let currentTrick = [];
// MODIFIED: Expose 'currentTrick' directly on the window object
window.currentTrick = currentTrick; // <--- ADDED: Expose globally

let trickCount = 0;    // Tracks the number of tricks played
// MODIFIED: Expose 'trickCount' directly on the window object
window.trickCount = trickCount; // <--- ADDED: Expose globally

let trickWinner = null; // Stores the player who won the last trick
// MODIFIED: Expose 'trickWinner' directly on the window object
window.trickWinner = trickWinner; // <--- ADDED: Expose globally

let playersScores = {};
// MODIFIED: Expose 'playersScores' directly on the window object
window.playersScores = playersScores; // <--- ADDED: Expose globally - PRIMARY FIX FOR YOUR ERROR

let currentTrickLeadPlayer = null; // The player who led the current trick
// MODIFIED: Expose 'currentTrickLeadPlayer' directly on the window object
window.currentTrickLeadPlayer = currentTrickLeadPlayer; // <--- ADDED: Expose globally

let cardsInCurrentTrick = 0; // The actual name of the variable here
// MODIFIED: Expose 'cardsInCurrentTrick' directly on the window object
window.cardsInCurrentTrick = cardsInCurrentTrick; // <--- ADDED: Expose globally

// MODIFIED: This variable was referenced as `window.leadSuitForTrick` in trick_logics.js.
// It needs to be initialized here as well.
let leadSuitForTrick = null;
window.leadSuitForTrick = leadSuitForTrick; // <--- ADDED: Expose globally

// MODIFIED: Add trumpBroken here as it's a global state.
let trumpBroken = false;
window.trumpBroken = trumpBroken; // <--- ADDED: Expose globally

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

// Player-specific bid control elements (These are locally scoped to game_logic.js's DOMContentLoaded for assignment)
let bidButtons = {};
let passButtons = {};

/**
 * Formats a player's name for display.
 * @param {string | null | undefined} name - The player's internal name.
 * @returns {string} The display-friendly name, or a default string if name is null/undefined.
 */
function formatPlayerDisplayName(name) {
    if (name === null || typeof name === 'undefined' || name === '') { // <--- MODIFIED: Add check for null/undefined/empty string
        return "Bid Winner"; // Provide a default string when name is not available
    }
    if (name === "south") {
        return "You (South)";
    }
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
window.displayMessage = displayMessage; // <--- Expose globally

/**
 * Updates the persistent game information displays (desktop sidebar and mobile bottom).
 * Reads information from global variables.
 */
function updateGameInfoDisplays() {
    const desktopBidWinnerSpan = document.getElementById('desktop-bid-winner');
    const desktopFinalBidSpan = document.getElementById('desktop-final-bid');
    const desktopPartnerCardSpan = document.getElementById('desktop-partner-card');

    const mobileBidWinnerSpan = document.getElementById('mobile-bid-winner');
    const mobileFinalBidSpan = document.getElementById('mobile-final-bid');
    const mobilePartnerCardSpan = document.getElementById('mobile-partner-card');

    // Set bid winner and final bid (always available after bidding)
    const formattedBidWinner = window.bidWinnerName ? window.formatPlayerDisplayName(window.bidWinnerName) : "N/A";
    const formattedFinalBid = window.finalBidAmount ? window.finalBidAmount.toString() : "N/A";

    if (desktopBidWinnerSpan) desktopBidWinnerSpan.textContent = formattedBidWinner;
    if (desktopFinalBidSpan) desktopFinalBidSpan.textContent = formattedFinalBid;
    if (mobileBidWinnerSpan) mobileBidWinnerSpan.textContent = formattedBidWinner;
    if (mobileFinalBidSpan) mobileFinalBidSpan.textContent = formattedFinalBid;

    // Set partner card (only available after partner selection is complete)
    if (window.selectedPartnerSuit && window.selectedPartnerRank) {
        const partnerCardText = `${window.selectedPartnerRank.charAt(0).toUpperCase() + window.selectedPartnerRank.slice(1)} of ${window.selectedPartnerSuit.charAt(0).toUpperCase() + window.selectedPartnerSuit.slice(1)}`;
        if (desktopPartnerCardSpan) desktopPartnerCardSpan.textContent = partnerCardText;
        if (mobilePartnerCardSpan) mobilePartnerCardSpan.textContent = partnerCardText;
    } else {
        if (desktopPartnerCardSpan) desktopPartnerCardSpan.textContent = "N/A";
        if (mobilePartnerCardSpan) mobilePartnerCardSpan.textContent = "N/A";
    }
}
window.updateGameInfoDisplays = updateGameInfoDisplays; // ADDED: Expose globally

function startBidding(initialBidderIndex) {
    console.log("Bidding started!");
    window.highestBid = 0; // <--- Use window.highestBid
    window.highestBidder = null; // <--- Use window.highestBidder
    window.passedPlayers.clear();
    window.currentPlayerIndex = initialBidderIndex;

    // --- Game Reset for New Game ---
    window.trumpBroken = false; // Initialize to false for a new game
    window.trickCount = 0;
    window.trickWinner = null;
    window.currentTrick = [];
    window.cardsInCurrentTrick = 0; // Corrected variable name, use window.cardsInCurrentTrick
    window.leadSuitForTrick = null; // Initialize lead suit to null for a new trick

    // ADDED: Reset persistent game info variables
    window.bidWinnerName = null;
    window.finalBidAmount = null;
    window.selectedPartnerSuit = null; // Reset partner info too
    window.selectedPartnerRank = null; // Reset partner info too

    // Initialize all player scores to 0 using the global players array
    window.players.forEach(player => {
        window.playersScores[player] = 0;
    });

    updateBiddingUI();
    updatePlayerBidControls(window.players[window.currentPlayerIndex]);
    window.displayMessage("Bidding has begun!", "message-box");
}
window.startBidding = startBidding; // <--- Expose globally

/**
 * Updates the central bidding display and player turn indicator.
 */
function updateBiddingUI() {
    if (biddingStatusDisplay) biddingStatusDisplay.textContent = "Bidding in Progress";
    if (currentPlayerTurnDisplay) currentPlayerTurnDisplay.textContent = `It's ${window.formatPlayerDisplayName(window.players[window.currentPlayerIndex])}'s turn to bid.`; // <--- Use window.formatPlayerDisplayName and window.players[window.currentPlayerIndex]
    if (highestBidDisplay) highestBidDisplay.textContent = window.highestBidder ? window.highestBid.toString() : "0"; // <--- Use window.highestBidder and window.highestBid
    if (highestBidderNameDisplay) highestBidderNameDisplay.textContent = window.highestBidder ? `(${window.formatPlayerDisplayName(window.highestBidder).substring(0, 15)})` : ""; // <--- Use window.highestBidder and window.formatPlayerDisplayName
}
window.updateBiddingUI = updateBiddingUI; // <--- Expose globally

/**
 * Updates the disabled status of bid/pass buttons for all players.
 * Only the current player's buttons will be enabled.
 * @param {string} activePlayerId - The identifier of the player whose turn it is.
 */
function updatePlayerBidControls(activePlayerId) {
    const isForcedBidder = window.passedPlayers.size === window.players.length - 1; // <--- Use window.passedPlayers and window.players

    for (const player of window.players) { // <--- Use window.players
        const bidBtn = bidButtons[player];
        const passBtn = passButtons[player];

        if (bidBtn && passBtn) {
            if (player === activePlayerId && !window.passedPlayers.has(player)) { // <--- Use window.passedPlayers
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
window.updatePlayerBidControls = updatePlayerBidControls; // <--- Expose globally


/**
 * Populates the bid dropdown with valid bid amounts.
 */
function populateBidDropdown() {
    bidDropdown.innerHTML = '';
    let startBid = window.highestBid; // <--- Use window.highestBid
    
    if (!window.highestBidder) { // <--- Use window.highestBidder
        startBid = MIN_BID;
    } else {
        startBid = window.highestBid + BID_INCREMENT; // <--- Use window.highestBid
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
        window.displayMessage("No higher bids possible. You must pass.", "message-box"); // <--- Use window.displayMessage
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
window.showTrumpSelectionModal = showTrumpSelectionModal; // <--- Expose globally

/**
 * Hides the trump selection modal.
 */
function hideTrumpSelectionModal() {
    trumpModal.style.display = 'none';
}

/**
 * Handles a player placing a bid.
 * @param {string} player - The name of the player placing the bid.
 * @param {number} bidAmount - The amount the player wants to bid.
 */
function placeBid(player, bidAmount) {
    if (bidAmount > window.highestBid) { // <--- Use window.highestBid
        window.highestBid = bidAmount; // <--- Use window.highestBid
        window.highestBidder = player; // <--- Use window.highestBidder
        window.displayMessage(`${window.formatPlayerDisplayName(player)} bids ${bidAmount}!`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName
        advanceTurn();
    } else {
        window.displayMessage("Bid must be higher than current highest bid.", "message-box"); // <--- Use window.displayMessage
        if (player === window.players[window.currentPlayerIndex]) { // <--- Use window.players and window.currentPlayerIndex
            showBidModal();
        }
    }
}
window.placeBid = placeBid; // <--- Expose globally

/**
 * Handles a player choosing to pass.
 * @param {string} player - The name of the player passing.
 */
function passBid(player) {
    if (window.passedPlayers.size === window.players.length - 1 && player === window.players[window.currentPlayerIndex]) { // <--- Use window.passedPlayers and window.players and window.currentPlayerIndex
        window.displayMessage(`You must bid. Passing is not allowed as you are the last player.`, "message-box"); // <--- Use window.displayMessage
        hidePassConfirmModal();
        return;
    }

    window.passedPlayers.add(player); // <--- Use window.passedPlayers
    window.displayMessage(`${window.formatPlayerDisplayName(player)} passes.`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName
    
    if (window.passedPlayers.size === window.players.length - 1 && window.highestBidder) { // <--- Use window.passedPlayers and window.players and window.highestBidder
        window.displayMessage(`${window.formatPlayerDisplayName(window.highestBidder)} wins the bid with ${window.highestBid}!`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName and window.highestBidder and window.highestBid
        endBiddingRound();
    } else if (window.passedPlayers.size === window.players.length && !window.highestBidder) { // <--- Use window.passedPlayers and window.players and window.highestBidder
        window.displayMessage("All players passed on the minimum bid. Redealing cards...", "message-box"); // <--- Use window.displayMessage
        endBiddingRound(true);
    } else {
        advanceTurn();
    }
}
window.passBid = passBid; // <--- Expose globally

/**
 * Advances the turn to the next player in the bidding sequence.
 */
function advanceTurn() {
    const activePlayers = window.players.filter(player => !window.passedPlayers.has(player)); // <--- Use window.players and window.passedPlayers
    const nextPlayerIndex = (window.players.indexOf(window.players[window.currentPlayerIndex]) + 1) % window.players.length; // <--- Use window.players and window.currentPlayerIndex
    let nextPlayerId = window.players[nextPlayerIndex]; // <--- Use window.players

    while (window.passedPlayers.has(nextPlayerId) && window.players.indexOf(nextPlayerId) !== window.players.indexOf(window.players[window.currentPlayerIndex])) { // <--- Use window.passedPlayers and window.players and window.currentPlayerIndex
        nextPlayerId = window.players[(window.players.indexOf(nextPlayerId) + 1) % window.players.length]; // <--- Use window.players
    }
    
    if (activePlayers.length === 1 && window.highestBidder) { // <--- Use window.highestBidder
        endBiddingRound();
    } else {
        window.currentPlayerIndex = window.players.indexOf(nextPlayerId); // <--- Update global currentPlayerIndex
        updateBiddingUI();
        updatePlayerBidControls(window.players[window.currentPlayerIndex]); // <--- Use window.players and window.currentPlayerIndex
    }
}

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
    // If it's the very first trick, the highest bidder leads
    // Otherwise, the winner of the previous trick leads
    window.currentTrickLeadPlayer = window.trickCount === 0 ? window.highestBidder : window.trickWinner; // <--- Use window.trickCount, window.highestBidder, window.trickWinner

    // Find the index of the lead player
    window.currentPlayerIndex = window.players.indexOf(window.currentTrickLeadPlayer); // <--- Use window.players and window.currentTrickLeadPlayer

    window.currentTrick = []; // Clear cards from previous trick for the new one
    window.cardsInCurrentTrick = 0; // Reset cards played in current trick, use window.cardsInCurrentTrick
    window.leadSuitForTrick = null; // Reset lead suit for new trick

    window.displayMessage(`${window.formatPlayerDisplayName(window.currentTrickLeadPlayer)} leads the trick!`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName and window.currentTrickLeadPlayer

    // Enable only the lead player's cards for interaction
    window.updatePlayerCardInteractions(window.currentTrickLeadPlayer, null); // <--- Use window.updatePlayerCardInteractions and window.currentTrickLeadPlayer
}
window.startTrick = startTrick; // <--- Expose globally

/**
 * Ends the bidding round.
 * @param {boolean} [redeal=false] - Optional. If true, indicates cards need to be redealt.
 */
function endBiddingRound(redeal = false) {
    console.log("Bidding round ended. Winner:", window.highestBidder); // <--- Use window.highestBidder
    window.updatePlayerBidControls(null); // <--- Use window.updatePlayerBidControls
    if (redeal) {
        setTimeout(() => {
            // alert("All players passed on minimum bid. Redealing cards!"); // Original alert
            window.displayMessage("All players passed on minimum bid. Redealing cards!", "message-box"); // <--- Use window.displayMessage
            if (typeof dealCards === 'function') { // dealCards is in script.js
                dealCards();
                window.startBidding(0); // <--- Use window.startBidding
            } else {
                console.error("dealCards function not found. Cannot redeal.");
            }
        }, 1500);
    } else {
        biddingStatusDisplay.textContent = `Bidding Concluded!`;
        if (window.highestBidder) { // <--- Use window.highestBidder
            currentPlayerTurnDisplay.textContent = `${window.formatPlayerDisplayName(window.highestBidder)} won the bid with ${window.highestBid}!`; // <--- Use window.formatPlayerDisplayName, window.highestBidder, window.highestBid
            // CRITICAL FIX: Ensure the bidding UI is updated with the final bid amount before showing the modal
            if (highestBidDisplay) {
                highestBidDisplay.textContent = window.highestBid.toString(); // <--- Use window.highestBid
            }
            if (highestBidderNameDisplay) {
                highestBidderNameDisplay.textContent = `(${window.formatPlayerDisplayName(window.highestBidder).substring(0, 15)})`; // <--- Use window.formatPlayerDisplayName and window.highestBidder
            }

            // ADDED: Store the bid winner and final bid globally
            window.bidWinnerName = window.highestBidder;
            window.finalBidAmount = window.highestBid;

            showTrumpSelectionModal();
        } else {
            currentPlayerTurnDisplay.textContent = "No bids placed.";
        }
    }
    // IMPORTANT: The call to startTrick() should be triggered *after* partner selection is confirmed.
    // It's currently called unconditionally here. We'll move the actual game start after partner selection in partner_selection.js.
}

/**
 * Handles the end of the entire game.
 */
function endGame() {
    window.displayMessage("Game Over!", "message-box"); // <--- Use window.displayMessage
    // Determine overall winner based on playersScores
    let overallWinner = null;
    let highestScore = -1;
    for (const player in window.playersScores) { // <--- Use window.playersScores
        if (window.playersScores[player] > highestScore) { // <--- Use window.playersScores
            highestScore = window.playersScores[player]; // <--- Use window.playersScores
            overallWinner = player;
        } else if (window.playersScores[player] === highestScore) { // <--- Use window.playersScores
            // Handle ties, if necessary
        }
    }
    // Ensure overallWinner is not null before using formatPlayerDisplayName
    if (overallWinner) {
        window.displayMessage(`Game Over! ${window.formatPlayerDisplayName(overallWinner)} wins the game with ${highestScore} tricks!`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName
    } else {
        window.displayMessage("Game Over! No clear winner or scores to display.", "message-box"); // <--- Use window.displayMessage
    }
    
    // Potentially show a game over modal, or reset game for new round
    // For now, just display message.
    setTimeout(() => {
        window.displayMessage("Click 'Deal & Start Game' to play again!", "message-box"); // <--- Use window.displayMessage
        const dealButton = document.getElementById('deal-cards-btn');
        if (dealButton) dealButton.removeAttribute('disabled');
    }, 3000); // Give time to read end game message
}
window.endGame = endGame; // <--- Expose globally


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
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
    for (const player of window.players) { // <--- Use window.players
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
    window.players.forEach(player => { // <--- Use window.players
        const bidBtn = bidButtons[player];
        const passBtn = passButtons[player];

        if (bidBtn) {
            bidBtn.addEventListener('click', () => {
                if (player === window.players[window.currentPlayerIndex]) { // <--- Use window.players and window.currentPlayerIndex
                    showBidModal();
                } else {
                    window.displayMessage(`It's not ${window.formatPlayerDisplayName(player)}'s turn.`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName
                }
            });
        }
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                if (player === window.players[window.currentPlayerIndex]) { // <--- Use window.players and window.currentPlayerIndex
                    showPassConfirmModal();
                } else {
                    window.displayMessage(`It's not ${window.formatPlayerDisplayName(player)}'s turn.`, "message-box"); // <--- Use window.displayMessage and window.formatPlayerDisplayName
                }
            });
        }
    });

    // Modal button event listeners
    if (confirmBidBtn) {
        confirmBidBtn.addEventListener('click', () => {
            const bidAmount = parseInt(bidDropdown.value, 10);
            if (!isNaN(bidAmount)) {
                window.placeBid(window.players[window.currentPlayerIndex], bidAmount); // <--- Use window.placeBid and window.players and window.currentPlayerIndex
                hideBidModal();
            } else {
                window.displayMessage("Please select a valid bid.", "message-box"); // <--- Use window.displayMessage
            }
        });
    }

    if (cancelBidBtn) {
        cancelBidBtn.addEventListener('click', () => {
            hideBidModal();
            window.displayMessage("Bid cancelled.", "message-box"); // <--- Use window.displayMessage
        });
    }

    if (confirmPassBtn) {
        confirmPassBtn.addEventListener('click', () => {
            window.passBid(window.players[window.currentPlayerIndex]); // <--- Use window.passBid and window.players and window.currentPlayerIndex
            hidePassConfirmModal();
        });
    }

    if (cancelPassBtn) {
        cancelPassBtn.addEventListener('click', () => {
            hidePassConfirmModal();
            window.displayMessage("Pass cancelled.", "message-box"); // <--- Use window.displayMessage
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
                window.currentTrumpSuit = selectedSuit; // <--- Update global currentTrumpSuit
                confirmTrumpBtn.removeAttribute('disabled');
            }
        });
    }

    if (confirmTrumpBtn) {
        confirmTrumpBtn.addEventListener('click', () => {
            if (window.currentTrumpSuit) { // <--- Use window.currentTrumpSuit
                // MODIFIED: Use the more robust formatPlayerDisplayName
                window.displayMessage(`${window.formatPlayerDisplayName(window.highestBidder)} has selected ${window.currentTrumpSuit} as trump!`, "message-box"); 
                hideTrumpSelectionModal();
                
                // Show partner selection modal after a brief delay
                setTimeout(() => {
                    showPartnerSelectionModal(); // This function is in partner_selection.js
                }, 1500);
            } else {
                window.displayMessage("Please select a trump suit.", "message-box"); // <--- Use window.displayMessage
            }
        });
    }

    // ADD this to your existing DOMContentLoaded event listener
    // Add this line inside the existing DOMContentLoaded event listener, after the trump modal initialization:
    initializePartnerSelectionEvents(); // This function is in partner_selection.js

    // Initial state: Disable all controls until bidding starts
    window.updatePlayerBidControls(null);
});

// Explicitly expose functions as necessary for other scripts
// These were already done, but adding here for clarity if they were missed.
// window.startBidding = startBidding; // Already handled by direct assignment
// window.updateBiddingUI = updateBiddingUI; // Already handled by direct assignment
// window.placeBid = placeBid; // Already handled by direct assignment
// window.passBid = passBid; // Already handled by direct assignment
// window.showTrumpSelectionModal = showTrumpSelectionModal; // Already handled by direct assignment
// window.updatePlayerBidControls = updatePlayerBidControls; // Already handled by direct assignment
// window.formatPlayerDisplayName = formatPlayerDisplayName; // Already handled by direct assignment
// window.displayMessage = displayMessage; // Already handled by direct assignment
// window.startTrick = startTrick; // Already handled by direct assignment
// window.endGame = endGame; // Already handled by direct assignment

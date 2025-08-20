// Ensure players array is globally accessible
const players = ["north", "east", "south", "west"];
window.players = players; // Expose globally

let currentPlayerIndex;
window.currentPlayerIndex = currentPlayerIndex; // Expose globally

let highestBid = 0;
window.highestBid = highestBid; // Expose globally

let highestBidder = null;
window.highestBidder = highestBidder; // Expose globally

let currentTrumpSuit = null;
window.currentTrumpSuit = currentTrumpSuit; // Expose globally

const MIN_BID = 170;
const MAX_BID = 280;
const BID_INCREMENT = 5;

let passedPlayers = new Set();
window.passedPlayers = passedPlayers; // Expose globally

// --- New Game Play State Variables ---
// --- Retrieve game parameters from sessionStorage ---
window.isAdminMode = sessionStorage.getItem('isAdminLogin') === 'true'; // Get admin flag
window.cardTheme = sessionStorage.getItem('cardTheme') || 'def'; // Get selected theme
window.gameMode = sessionStorage.getItem('gameMode') || 'multiplayer'; // Get selected game mode
// loggedInPlayer will still come from URL params for now, until full multiplayer is implemented
const urlParams = new URLSearchParams(window.location.search);
window.loggedInPlayer = urlParams.get('player') || null; 
console.log(`Admin Mode: ${window.isAdminMode ? 'ENABLED' : 'DISABLED'}`);
console.log(`Card Back Theme: ${window.cardTheme}`);
console.log(`Game Mode: ${window.gameMode}`);
console.log(`Logged-in Player: ${window.loggedInPlayer || 'Not set'}`);

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
    const isForcedBidder = window.passedPlayers.size === window.players.length - 1;

    for (const player of window.players) {
        const bidBtn = bidButtons[player];
        const passBtn = passButtons[player];

        if (bidBtn && passBtn) {
            if (player === activePlayerId && !window.passedPlayers.has(player)) {
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
        if (player === window.players[window.currentPlayerIndex]) {
            showBidModal();
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
    window.currentTrickLeadPlayer = window.trickCount === 0 ? window.highestBidder : window.trickWinner;

    // Find the index of the lead player
    window.currentPlayerIndex = window.players.indexOf(window.currentTrickLeadPlayer);

    window.currentTrick = []; // Clear cards from previous trick for the new one
    window.cardsInCurrentTrick = 0; // Reset cards played in current trick
    window.leadSuitForTrick = null; // Reset lead suit for new trick

    window.displayMessage(`${window.formatPlayerDisplayName(window.currentTrickLeadPlayer)} leads the trick!`, "message-box");

    // Enable only the lead player's cards for interaction
    window.updatePlayerCardInteractions(window.currentTrickLeadPlayer, null); // New function to be added in script.js
}
window.startTrick = startTrick;

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
            window.showTrumpSelectionModal();
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
                if (player === window.players[window.currentPlayerIndex]) {
                    showBidModal();
                } else {
                    window.displayMessage(`It's not ${window.formatPlayerDisplayName(player)}'s turn.`, "message-box");
                }
            });
        }
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                if (player === window.players[window.currentPlayerIndex]) {
                    showPassConfirmModal();
                } else {
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

// Ensure players array is accessible (from script.js)
const players = ["north", "east", "south", "west"];

let currentPlayerIndex;
let highestBid = 170;
let highestBidder = null;
const MIN_BID = 170;
const MAX_BID = 280;
const BID_INCREMENT = 5;
let passedPlayers = new Set();

// DOM Elements
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

// Player-specific bid control elements
let bidButtons = {};
let passButtons = {};

/**
 * Formats a player's name for display.
 * @param {string} name - The player's internal name.
 * @returns {string} The display-friendly name.
 */
function formatPlayerDisplayName(name) {
    if (name === "south") {
        return "You (South)";
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
}

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

/**
 * Initializes the bidding process after cards are dealt.
 * @param {number} initialBidderIndex - The index of the player who gets the first bid.
 */
function startBidding(initialBidderIndex) {
    console.log("Bidding started!");
    highestBid = MIN_BID;
    highestBidder = null;
    passedPlayers.clear(); // Clear passed players for a NEW bidding round
    currentPlayerIndex = initialBidderIndex;
    updateBiddingUI();
    updatePlayerBidControls(players[currentPlayerIndex]);
    displayMessage("Bidding has begun!", "message-box");
}

/**
 * Updates the central bidding display and player turn indicator.
 */
function updateBiddingUI() {
    if (biddingStatusDisplay) biddingStatusDisplay.textContent = "Bidding in Progress";
    if (currentPlayerTurnDisplay) currentPlayerTurnDisplay.textContent = `It's ${formatPlayerDisplayName(players[currentPlayerIndex])}'s turn to bid.`;
    if (highestBidDisplay) highestBidDisplay.textContent = highestBid.toString();
    if (highestBidderNameDisplay) highestBidderNameDisplay.textContent = highestBidder ? `(${formatPlayerDisplayName(highestBidder).substring(0, 15)})` : "";
}

/**
 * Updates the disabled status of bid/pass buttons for all players.
 * Only the current player's buttons will be enabled.
 * @param {string} activePlayerId - The identifier of the player whose turn it is.
 */
function updatePlayerBidControls(activePlayerId) {
    // Determine if the current player is the last one in the bidding
    const isForcedBidder = passedPlayers.size === players.length - 1;

    for (const player of players) {
        const bidBtn = bidButtons[player];
        const passBtn = passButtons[player];

        if (bidBtn && passBtn) {
            // Check if it's the current player's turn and they haven't passed
            if (player === activePlayerId && !passedPlayers.has(player)) {
                bidBtn.removeAttribute('disabled');
                
                // If this player is the only one left, disable their Pass button
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

/**
 * Populates the bid dropdown with valid bid amounts.
 */
function populateBidDropdown() {
    bidDropdown.innerHTML = '';
    let hasValidBids = false;
    for (let bid = highestBid + BID_INCREMENT; bid <= MAX_BID; bid += BID_INCREMENT) {
        const option = document.createElement('option');
        option.value = bid;
        option.textContent = bid;
        bidDropdown.appendChild(option);
        hasValidBids = true;
    }
    if (hasValidBids) {
        bidDropdown.value = bidDropdown.options[0].value;
    } else {
        displayMessage("No higher bids possible. You must pass.", "message-box");
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
 * Handles a player placing a bid.
 * @param {string} player - The name of the player placing the bid.
 * @param {number} bidAmount - The amount the player wants to bid.
 */
function placeBid(player, bidAmount) {
    if (bidAmount > highestBid) {
        highestBid = bidAmount;
        highestBidder = player;
        displayMessage(`${formatPlayerDisplayName(player)} bids ${bidAmount}!`, "message-box");
        advanceTurn();
    } else {
        displayMessage("Bid must be higher than current highest bid.", "message-box");
        if (player === players[currentPlayerIndex]) {
            showBidModal();
        }
    }
}

/**
 * Handles a player choosing to pass.
 * @param {string} player - The name of the player passing.
 */
function passBid(player) {
    // Check if the player is the forced bidder
    if (passedPlayers.size === players.length - 1 && player === players[currentPlayerIndex]) {
        displayMessage(`You must bid. Passing is not allowed as you are the last player.`, "message-box");
        hidePassConfirmModal();
        return; // Exit the function to prevent the pass
    }

    passedPlayers.add(player);
    displayMessage(`${formatPlayerDisplayName(player)} passes.`, "message-box");
    
    // Check if bidding is over BEFORE advancing the turn.
    if (passedPlayers.size === players.length - 1 && highestBidder) {
        displayMessage(`${formatPlayerDisplayName(highestBidder)} wins the bid with ${highestBid}!`, "message-box");
        endBiddingRound();
    } else if (passedPlayers.size === players.length && !highestBidder) {
        displayMessage("All players passed on the minimum bid. Redealing cards...", "message-box");
        endBiddingRound(true);
    } else {
        advanceTurn();
    }
}

/**
 * Advances the turn to the next player in the bidding sequence.
 */
function advanceTurn() {
    let nextPlayerFound = false;
    let originalCurrentPlayerIndex = currentPlayerIndex;

    for (let i = 0; i < players.length; i++) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayer = players[currentPlayerIndex];

        if (!passedPlayers.has(nextPlayer)) {
            nextPlayerFound = true;
            break;
        }

        if (currentPlayerIndex === originalCurrentPlayerIndex) {
            break;
        }
    }

    if (!nextPlayerFound) {
        console.log("No next active player found. Bidding should be concluded.");
        endBiddingRound();
    } else {
        updateBiddingUI();
        updatePlayerBidControls(players[currentPlayerIndex]);
    }
}

/**
 * Ends the bidding round.
 * @param {boolean} [redeal=false] - Optional. If true, indicates cards need to be redealt.
 */
function endBiddingRound(redeal = false) {
    console.log("Bidding round ended.");
    // Disable all controls
    updatePlayerBidControls(null);
    if (redeal) {
        setTimeout(() => {
            alert("All players passed on minimum bid. Redealing cards!");
            if (typeof dealCards === 'function') {
                dealCards();
                startBidding(0);
            } else {
                console.error("dealCards function not found. Cannot redeal.");
            }
        }, 1500);
    } else {
        biddingStatusDisplay.textContent = `Bidding Concluded!`;
        if (highestBidder) {
            currentPlayerTurnDisplay.textContent = `${formatPlayerDisplayName(highestBidder)} won the bid with ${highestBid}!`;
        } else {
            currentPlayerTurnDisplay.textContent = "No bids placed.";
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements
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

    // Populate player-specific button references by ID
    for (const player of players) {
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
    players.forEach(player => {
        const bidBtn = bidButtons[player];
        const passBtn = passButtons[player];

        if (bidBtn) {
            bidBtn.addEventListener('click', () => {
                if (player === players[currentPlayerIndex]) {
                    showBidModal();
                } else {
                    displayMessage(`It's not ${formatPlayerDisplayName(player)}'s turn.`, "message-box");
                }
            });
        }
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                if (player === players[currentPlayerIndex]) {
                    showPassConfirmModal();
                } else {
                    displayMessage(`It's not ${formatPlayerDisplayName(player)}'s turn.`, "message-box");
                }
            });
        }
    });

    // Modal button event listeners
    if (confirmBidBtn) {
        confirmBidBtn.addEventListener('click', () => {
            const bidAmount = parseInt(bidDropdown.value, 10);
            if (!isNaN(bidAmount)) {
                placeBid(players[currentPlayerIndex], bidAmount);
                hideBidModal();
            } else {
                displayMessage("Please select a valid bid.", "message-box");
            }
        });
    }

    if (cancelBidBtn) {
        cancelBidBtn.addEventListener('click', () => {
            hideBidModal();
            displayMessage("Bid cancelled.", "message-box");
        });
    }

    if (confirmPassBtn) {
        confirmPassBtn.addEventListener('click', () => {
            passBid(players[currentPlayerIndex]);
            hidePassConfirmModal();
        });
    }

    if (cancelPassBtn) {
        cancelPassBtn.addEventListener('click', () => {
            hidePassConfirmModal();
            displayMessage("Pass cancelled.", "message-box");
        });
    }

    // Initial state: Disable all controls until bidding starts
    updatePlayerBidControls(null);
});

// Expose functions globally
window.startBidding = startBidding;
window.updateBiddingUI = updateBiddingUI;
window.placeBid = placeBid;
window.passBid = passBid;
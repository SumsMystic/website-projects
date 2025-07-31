// Ensure players array is accessible (from script.js)
// Assuming script.js is loaded first and `players` is global.
// If not, you might need to export/import or pass it.
const players = ["north", "east", "south", "west"]; // Explicitly define players array here

let currentPlayerIndex; // Will be set by startBidding
let highestBid = 170;
let highestBidder = null;
const MIN_BID = 170;
const MAX_BID = 280; // Total game points
const BID_INCREMENT = 5;
let passedPlayers = new Set(); // To keep track of who has passed in the current bidding round

// DOM Elements - Declared globally, but assigned inside DOMContentLoaded
let biddingStatusDisplay;
let currentPlayerTurnDisplay;
let highestBidDisplay;
let highestBidderNameDisplay;
let messageBox;

// Modals and their elements - Declared globally, but assigned inside DOMContentLoaded
let bidModal;
let bidDropdown;
let confirmBidBtn;
let cancelBidBtn;

let passConfirmModal;
let confirmPassBtn;
let cancelPassBtn;

// Player-specific bid control elements - Declared globally, but assigned inside DOMContentLoaded
let playerBidControls = {};
let bidButtons = {};
let passButtons = {};


/**
 * Formats a player's name for display.
 * For hardcoded players, it capitalizes the first letter.
 * For "south", it returns "You (South)".
 * When custom player names are implemented, this function will simply return the name as-is.
 * @param {string} name - The player's internal name (e.g., "north", "south", or a custom name like "SuMeet").
 * @returns {string} The display-friendly name.
 */
function formatPlayerDisplayName(name) {
    // This logic is for the current hardcoded player names.
    // When custom player names are implemented, we will store them as-is
    // and this function would simply return `name` directly.
    if (name === "south") {
        return "You (South)";
    }
    // For now, capitalize first letter if it's a simple direction name
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Displays a message in a specified HTML element.
 * This function is crucial for providing feedback to the user.
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
    passedPlayers.clear(); // Clear passed players for new round
    currentPlayerIndex = initialBidderIndex; // Set initial bidder
    updateBiddingUI();
    activatePlayerControls();
    displayMessage("Bidding has begun!", "message-box");
}

/**
 * Updates the central bidding display and player turn indicator.
 */
function updateBiddingUI() {
    if (biddingStatusDisplay) biddingStatusDisplay.textContent = "Bidding in Progress";
    if (currentPlayerTurnDisplay) currentPlayerTurnDisplay.textContent = `It's ${formatPlayerDisplayName(players[currentPlayerIndex])}'s turn to bid.`;
    if (highestBidDisplay) highestBidDisplay.textContent = highestBid.toString();
    if (highestBidderNameDisplay) highestBidderNameDisplay.textContent = highestBidder ? `(${formatPlayerDisplayName(highestBidder).substring(0, 15)})` : ""; // Truncate to 15 chars
}

/**
 * Activates the bid/pass controls for the current player and hides others.
 * This function relies on the 'active' class in CSS to show/hide controls.
 */
function activatePlayerControls() {
    // Modified: Make all bid/pass controls always visible and enabled.
    for (const player of players) {
        const controls = playerBidControls[player];
        if (controls) {
            controls.classList.add('active'); // Always add 'active' to show
            bidButtons[player].disabled = false; // Always enable
            passButtons[player].disabled = false; // Always enable
        }
    }
}

/**
 * Populates the bid dropdown with valid bid amounts based on the highest bid.
 */
function populateBidDropdown() {
    bidDropdown.innerHTML = ''; // Clear previous options
    let hasValidBids = false;
    for (let bid = highestBid + BID_INCREMENT; bid <= MAX_BID; bid += BID_INCREMENT) {
        const option = document.createElement('option');
        option.value = bid;
        option.textContent = bid;
        bidDropdown.appendChild(option);
        hasValidBids = true;
    }
    // Select the first valid bid by default
    if (hasValidBids) {
        bidDropdown.value = bidDropdown.options[0].value;
    } else {
        // If no valid bids are possible (e.g., highestBid is already MAX_BID - 5)
        displayMessage("No higher bids possible. You must pass.", "message-box");
        hideBidModal(); // Hide the modal if it was shown
        // Optionally, automatically trigger a pass for this player
        // passBid(players[currentPlayerIndex]);
    }
}

/**
 * Shows the bid dropdown modal.
 */
function showBidModal() {
    populateBidDropdown();
    if (bidDropdown.options.length > 0) { // Only show if there are valid bids
        bidModal.style.display = 'flex'; // Use flex to center the modal
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
    passConfirmModal.style.display = 'flex'; // Use flex to center the modal
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
    if (player !== players[currentPlayerIndex]) {
        displayMessage("It's not your turn!", "message-box");
        return;
    }

    // Validate bid amount (should already be valid from dropdown, but good for safety)
    if (bidAmount < highestBid + BID_INCREMENT || bidAmount % BID_INCREMENT !== 0 || bidAmount > MAX_BID) {
        displayMessage(`Invalid bid. Must be between ${highestBid + BID_INCREMENT} and ${MAX_BID}, and a multiple of ${BID_INCREMENT}.`, "message-box");
        return;
    }

    highestBid = bidAmount;
    highestBidder = player;
    passedPlayers.clear(); // A new bid resets the "pass" state for all players
    displayMessage(`${formatPlayerDisplayName(player)} bids ${bidAmount}.`, "message-box");
    hideBidModal(); // Hide modal after bid

    moveToNextPlayer();
}

/**
 * Handles a player passing their turn.
 * @param {string} player - The name of the player passing.
 */
function passBid(player) {
    if (player !== players[currentPlayerIndex]) {
        displayMessage("It's not your turn!", "message-box");
        return;
    }

    passedPlayers.add(player); // Add player to the set of passed players
    displayMessage(`${formatPlayerDisplayName(player)} passes.`, "message-box");
    hidePassConfirmModal(); // Hide modal after pass

    // Modified: Do not disable the passed player's buttons immediately
    /*
    const controls = playerBidControls[player];
    if (controls) {
        controls.classList.remove('active');
        bidButtons[player].disabled = true;
        passButtons[player].disabled = true;
    }
    */

    const activePlayers = players.filter(p => !passedPlayers.has(p));

    if (activePlayers.length === 1) {
        // One player remaining, they win
        highestBidder = activePlayers[0];
        // If no one ever bid higher than MIN_BID, the winner is forced to take MIN_BID
        if (highestBidder === null || highestBid === MIN_BID) { // Check if highestBidder is null OR if bid is still MIN_BID
             highestBid = MIN_BID; // Ensure it's MIN_BID if no one actually bid higher
        }
        biddingStatusDisplay.textContent = `Bidding ends! ${formatPlayerDisplayName(highestBidder)} wins with ${highestBid}.`;
        displayMessage(`${formatPlayerDisplayName(highestBidder)} wins the bid!`, "message-box");
        endBiddingPhase();
    } else if (activePlayers.length === 0) {
        // All players have passed (this scenario should be caught by activePlayers.length === 1 if highestBidder is set)
        // This specific case handles if ALL players passed without anyone making a bid above MIN_BID.
        highestBid = MIN_BID; // Forced bid
        highestBidder = players[currentPlayerIndex]; // The player who just passed is forced
        displayMessage(`${formatPlayerDisplayName(highestBidder)} is forced to bid ${MIN_BID}.`, "message-box");
        biddingStatusDisplay.textContent = `All passed. ${formatPlayerDisplayName(highestBidder)} wins with ${highestBid}.`;
        endBiddingPhase();
    } else {
        moveToNextPlayer();
    }
}


/**
 * Moves the turn to the next player in a clockwise direction, skipping passed players.
 */
function moveToNextPlayer() {
    let nextPlayerFound = false;
    let loopCount = 0; // To prevent infinite loops in case of logic error

    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        loopCount++;

        // If we've checked all players and none are active, bidding should end.
        if (loopCount > players.length) {
            // This scenario means everyone has passed, and the endBiddingPhase should have been called.
            // This is a failsafe.
            console.warn("moveToNextPlayer: No active players found after full loop. Ending bidding.");
            endBiddingPhase(); // Force end bidding if no active player is found
            return;
        }

        if (!passedPlayers.has(players[currentPlayerIndex])) {
            nextPlayerFound = true;
        }
    } while (!nextPlayerFound);

    updateBiddingUI();
    activatePlayerControls(); // Re-activate controls to ensure all are visible
}


/**
 * Ends the bidding phase and prepares for the next game phase.
 * (Placeholder for future game logic)
 */
function endBiddingPhase() {
    console.log("Bidding phase ended.");
    // Modified: Do not hide or disable all bidding controls
    /*
    for (const player of players) {
        const controls = playerBidControls[player];
        if (controls) {
            controls.classList.remove('active');
            bidButtons[player].disabled = true;
            passButtons[player].disabled = true;
        }
    }
    */
    biddingStatusDisplay.textContent = `Bid winner: ${formatPlayerDisplayName(highestBidder)} with ${highestBid}.`;
    currentPlayerTurnDisplay.textContent = "Time to declare Trump and Partner!";
    // Further logic for Trump/Partner declaration will go here
}

// Event Listeners for bidding buttons and modals
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements once the document is loaded
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

    playerBidControls = {
        north: document.querySelector('.north-controls'),
        east: document.querySelector('.east-controls'),
        south: document.querySelector('.south-controls'),
        west: document.querySelector('.west-controls')
    };

    bidButtons = {
        north: document.getElementById('north-bid-btn'),
        east: document.getElementById('east-bid-btn'),
        south: document.getElementById('south-bid-btn'),
        west: document.getElementById('west-bid-btn')
    };

    passButtons = {
        north: document.getElementById('north-pass-btn'),
        east: document.getElementById('east-pass-btn'),
        south: document.getElementById('south-pass-btn'),
        west: document.getElementById('west-pass-btn')
    };

    // Attach event listeners to all player bid/pass buttons
    for (const player of players) {
        if (bidButtons[player]) {
            bidButtons[player].addEventListener('click', () => {
                // Only show modal if it's their turn - this can remain as it controls modal, not button visibility
                if (player === players[currentPlayerIndex]) {
                    showBidModal();
                } else {
                    displayMessage("It's not your turn!", "message-box");
                }
            });
        }
        if (passButtons[player]) {
            passButtons[player].addEventListener('click', () => {
                // Only show modal if it's their turn - this can remain as it controls modal, not button visibility
                if (player === players[currentPlayerIndex]) {
                    showPassConfirmModal();
                } else {
                    displayMessage("It's not your turn!!", "message-box");
                }
            });
        }
    }

    // Modal button event listeners
    if (confirmBidBtn) confirmBidBtn.addEventListener('click', () => {
        const selectedBid = parseInt(bidDropdown.value, 10);
        placeBid(players[currentPlayerIndex], selectedBid);
    });

    if (cancelBidBtn) cancelBidBtn.addEventListener('click', () => {
        hideBidModal();
        displayMessage("Bid cancelled.", "message-box");
    });

    if (confirmPassBtn) confirmPassBtn.addEventListener('click', () => {
        passBid(players[currentPlayerIndex]);
    });

    if (cancelPassBtn) cancelPassBtn.addEventListener('click', () => {
        hidePassConfirmModal();
        displayMessage("Pass cancelled.", "message-box");
    });

    // Ensure initial state shows all controls
    activatePlayerControls();
});
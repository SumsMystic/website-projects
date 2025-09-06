/**
 * A utility function to create a delay using a Promise.
 * This is a clean way to replace setTimeout for sequential operations.
 * @param {number} ms - The delay in milliseconds.
 * @returns {Promise<void>} - A Promise that resolves after the delay.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
window.delay = delay;   // Expose globally

/**
 * A Promise-based function that waits for a human player to click a card.
 * This is crucial for correctly pausing the game flow for human interaction.
 * @returns {Promise<HTMLElement>} - A Promise that resolves with the HTML element of the card that was clicked.
 */
function waitForHumanCardClick() {
    return new Promise(resolve => {
        // Correctly gets the player's hand container by its ID.
        // const humanPlayerHand = document.getElementById('player-hand');
        const humanPlayerHand = document.querySelector(`.${window.loggedInPlayer}-cards .hand`);
        if (!humanPlayerHand) {
            console.error("Human player hand element not found.");
            // Resolve immediately to prevent an infinite loop in case of a missing element
            resolve(null); 
            return;
        }

        // Event listener to wait for a valid card click
        const clickHandler = (event) => {
            // .closest('.card:not(.disabled)') correctly ensures it only
            // resolves if a valid, non-disabled card was clicked.
            const clickedCard = event.target.closest('.card:not(.disabled)');
            if (clickedCard) {
                console.log("Card clicked player name:", clickedCard.dataset.player);
                console.log("Card clicked:", clickedCard.dataset.rank, "of", clickedCard.dataset.suit);
                // Remove the listener after the first valid click
                humanPlayerHand.removeEventListener('click', clickHandler);
                // Resolve the promise with the clicked card element
                resolve(clickedCard);
            }
        };

        // Attach the listener to the hand container
        humanPlayerHand.addEventListener('click', clickHandler);
    });
}
window.waitForHumanCardClick = waitForHumanCardClick; // Expose globally

/**
 * Handles a player playing a card during a trick.
 * @param {HTMLElement} cardElem - The HTML element of the card played.
 * @param {string} player - The name of the player who played the card.
 */
async function playCardInTrick(cardElem, player) {
    // console.log(`${window.formatPlayerDisplayName(player)} played: ${cardElem.dataset.rank} of ${cardElem.dataset.suit}`);

    // Call animateCardToCenter from card_play_animations.js to move the card
    // from temporary body placement to the center played cards area
    // and apply its final styling (position: absolute, transforms).
    if (typeof window.animateCardToCenter === 'function') {
        await window.animateCardToCenter(cardElem, player);
    } else {
        console.error("animateCardToCenter function not found. Cannot place card on table.");
        // Fallback: If animateCardToCenter is missing, at least try to append it.
        const centerPlayedCardsFallback = document.getElementById('center-played-cards');
        if (centerPlayedCardsFallback) {
            cardElem.style.position = 'static';
            cardElem.style.transform = '';
            centerPlayedCardsFallback.appendChild(cardElem);
        }
    }

    const playedCardSuit = cardElem.dataset.suit;
    const playedCardRank = cardElem.dataset.rank;

    // --- CRITICAL FIXES FOR TRICK LOGIC ---
    // These checks should happen after the animation and placement of the card.
    console.log(`Inside playCardInTrickFunction: Card played: ${playedCardRank} of ${playedCardSuit} by ${player}`);
    console.log(`Current Trick State:`, window.currentTrick);

    // If it's the first card of the trick, set the lead suit
    if (window.cardsInCurrentTrick === 0) {
        window.leadSuitForTrick = playedCardSuit;
        console.log(`Trick lead suit is: ${window.leadSuitForTrick}`);
    }

    // Rule: Check if trump is broken
    if (!window.trumpBroken) {
        if (playedCardSuit === window.currentTrumpSuit && window.leadSuitForTrick !== window.currentTrumpSuit) {
            window.trumpBroken = true;
            window.displayMessage("Trump has been broken!", "message-box");
        }
    }

    // Remove the played card from the player's hands array
    if (window.hands && window.hands[player]) {
        window.hands[player] = window.hands[player].filter(card => !(card.rank === playedCardRank && card.suit === playedCardSuit));
    } else {
        console.warn(`window.hands or window.hands[${player}] is undefined. Cannot remove card from hand array.`);
    }

    // Add the card to the current trick's array
    window.currentTrick.push({
        card: {
            rank: playedCardRank,
            suit: playedCardSuit
        },
        player: player,
        element: cardElem
    });
    window.cardsInCurrentTrick++;

    // Disable current player's cards immediately after playing
    window.updatePlayerCardInteractions(null, null);

    // CRITICAL FIX: The turn progression is now managed by a single function
    // that is called after a card is played.
    // The advanceTurnInTrick function must be updated to be async and handle the turn progression
    // using awaits.
    // await window.advanceTurnInTrick();
}
window.playCardInTrick = playCardInTrick; // Expose globally


/**
 * The new function to manage the flow of the trick.
 * This is the sole function that manages turn progression.
 */
// A new global variable to store the timeout ID for the next player's turn

let nextTurnTimeoutId = null;
window.nextTurnTimeoutId = nextTurnTimeoutId; // Expose globally

/**
 * The sole function to manage the flow of the trick, called after a card is played.
 */
async function advanceTurnInTrick() {
    if (window.nextTurnTimeoutId) {
        clearTimeout(window.nextTurnTimeoutId);
        window.nextTurnTimeoutId = null;
    }

    const players = window.players;

    // A for loop that runs for all four players' turns.
    for (let i = 0; i < players.length; i++) {
        // Set the current player for this turn using the global index
        window.currentPlayer = players[window.currentPlayerIndex];
        window.updatePlayerCardInteractions(window.currentPlayer);
        
        const isHumanPlayer = window.currentPlayer === window.loggedInPlayer;
        
        if (isHumanPlayer) {
            window.displayMessage(`It's your turn to play!`, "message-box");
            
            // PAUSE THE GAME LOOP: Await the promise from the click listener
            const clickedCard = await window.waitForHumanCardClick();
            
            if (clickedCard) {
                // The next function in the chain is called here
                await window.playCardInTrick(clickedCard, window.currentPlayer);
                // Check if the selected card is the Bid partner card
                if (clickedCard.dataset.rank === window.selectedPartnerRank && clickedCard.dataset.suit === window.selectedPartnerSuit) {
                    window.partnerPlayerName = window.currentPlayer;
                    console.log(`Partner identified: ${window.partnerPlayerName} with rank ${window.selectedPartnerRank}`);
                    await window.showPartnerRevealMessage()
                    await window.delay(500); // Slight delay to ensure message is seen before proceeding
                    window.hideMessage('partner-reveal-message'); // Explicitly hide after display duration
                }
            } else {
                console.error("Human player card click promise resolved with null. Check for errors.");
            }
            
        } else {
            // AI's turn
            window.displayMessage(`${window.formatPlayerDisplayName(window.currentPlayer)} is thinking...`, "message-box");
            await window.delay(1500);
            const cardElem = window.ai.aiPlayCard(
                window.currentPlayer, 
                window.hands[window.currentPlayer], 
                window.currentTrick, 
                window.leadSuitForTrick, 
                window.currentTrumpSuit
            );
            if (cardElem) {
                window.updatePlayerCardInteractions(window.currentPlayer);
                await window.playCardInTrick(cardElem, window.currentPlayer);
                if (cardElem.dataset.rank === window.selectedPartnerRank && cardElem.dataset.suit === window.selectedPartnerSuit) {
                    window.partnerPlayerName = window.currentPlayer;
                    console.log(`Partner identified: ${window.partnerPlayerName} with rank ${window.selectedPartnerRank}`);
                    await window.showPartnerRevealMessage()
                    await window.delay(500); // Slight delay to ensure message is seen before proceeding
                    window.hideMessage('partner-reveal-message'); // Explicitly hide after display duration
                }
            }
        }
        
        // This is the CRITICAL FIX to advance the player to the next person for the next turn in the trick
        window.currentPlayerIndex = (window.currentPlayerIndex + 1) % players.length;
    }
    
    // Check if the trick is complete after all four turns
    if (window.cardsInCurrentTrick === players.length) {
        window.displayMessage("All cards played for the trick!", "message-box");
        await window.delay(1000);
        
        // CRITICAL FIX #1: The `evaluateTrick` function must be called and its result stored to set up the next trick.
        await window.evaluateTrick();
        console.log(`${window.formatPlayerDisplayName(window.trickWinner)} won the trick!`);

        // CRITICAL FIX #2: The global 'currentPlayerIndex' must be set to the trick winner to determine who leads the next trick.
        const winnerIndex = players.indexOf(window.trickWinner);
        if (winnerIndex !== -1) {
            window.currentPlayerIndex = winnerIndex;
        }

        await window.delay(1500);
        window.clearCenterPlayedCards(true);
        if (window.trickCount < window.cardsPerPlayer) {
            window.cardsInCurrentTrick = 0;
            window.startTrick(window.trickWinner);
        } else {
            window.endRound();
        }
    }
}
window.advanceTurnInTrick = advanceTurnInTrick; // Expose globally

/**
 * Evaluates the current trick to determine the winner based on Black Queen rules.
 * Rules: Aces > Kings > Queens > Jacks > 10...2. Trump cards beat non-trump cards.
 * If no trump, highest card of lead suit wins.
 *
 * IMPORTANT: This evaluation also handles points for specific cards like Black Queen.
 */
async function evaluateTrick() {
    console.log("Evaluating trick:", window.currentTrick);

    let winningCardInfo = window.currentTrick[0];
    const leadSuit = window.currentTrick[0].card.suit;
    const trumpSuit = window.currentTrumpSuit;

    // Iterate through played cards to find the winner
    for (let i = 1; i < window.currentTrick.length; i++) {
        const currentCardInfo = window.currentTrick[i];
        const currentCard = currentCardInfo.card;
        const winningCard = winningCardInfo.card;

        // Step 1: Check for Trump Suit
        const isCurrentTrump = (currentCard.suit === trumpSuit);
        const isWinningTrump = (winningCard.suit === trumpSuit);

        if (isCurrentTrump && !isWinningTrump) {
            // Current card is trump, winning card is not => Current card wins
            winningCardInfo = currentCardInfo;
        } else if (!isCurrentTrump && isWinningTrump) {
            // Current card is not trump, winning card is trump => Winning card keeps winning
            // No change needed
        } else if (isCurrentTrump && isWinningTrump) {
            // Both are trump => Compare ranks
            if (window.getCardRankValue(currentCard.rank) > window.getCardRankValue(winningCard.rank)) {
                winningCardInfo = currentCardInfo;
            }
        } else { // Neither are trump
            // Step 2: Check for Lead Suit
            const isCurrentLeadSuit = (currentCard.suit === leadSuit);
            const isWinningLeadSuit = (winningCard.suit === leadSuit);

            if (isCurrentLeadSuit && !isWinningLeadSuit) {
                // Current card follows lead suit, winning card does not (and is not trump) => Current card wins
                winningCardInfo = currentCardInfo;
            } else if (!isCurrentLeadSuit && isWinningLeadSuit) {
                // Current card does not follow lead suit, winning card does => Winning card keeps winning
                // No change needed
            } else if (isCurrentLeadSuit && isWinningLeadSuit) {
                // Both follow lead suit => Compare ranks
                if (window.getCardRankValue(currentCard.rank) > window.getCardRankValue(winningCard.rank)) {
                    winningCardInfo = currentCardInfo;
                }
            }
            // If neither are trump and neither follow lead suit, the first card (lead suit) still wins
            // unless it was beaten by a trump or a higher card of the lead suit.
            // This scenario means currentCard sluffed and cannot win unless winningCard also sluffed and was lower.
            // Given the rules of play, this 'else' block implies both are non-winning suits, so winningCardInfo remains.
        }
    }

    // CRITICAL FIX: Add this line to set the global winner for the next trick to use
    window.trickWinner = winningCardInfo.player;

    // Highlight the winning card to show who won.
    const winningCardElem = winningCardInfo.element;
    if (winningCardElem) {
        winningCardElem.classList.add('winning-card');
    }

    // CRITICAL FIX: Wait for a moment to let the user see the result and message.
    await delay(3000);

    let trickPointsEarned = 0; // Initialize points for this trick

    // Calculate total points from all cards in the current trick
    window.currentTrick.forEach(playedCard => {
        trickPointsEarned += getCardPoints(playedCard.card); // Use the new getCardPoints function
    });

    window.playersScores[window.trickWinner] += trickPointsEarned; // Add the accumulated points to the trick winner's score

    window.displayMessage(`${window.formatPlayerDisplayName(window.trickWinner)} won Trick ${window.trickCount + 1} and gained ${trickPointsEarned} points! Total: ${window.playersScores[window.trickWinner]}`, "message-box");

    window.trickCount++;

    window.updateScoresDisplay();
}

/**
 * Enables hover and click interactions only for the specified active player's cards,
 * enforcing trump-breaking and suit-following rules.
 * Also adds/removes a visual glow feedback for the active player's hand area.
 * @param {string | null} activePlayer - The player whose cards should be active, or null to disable all.
 * @param {string | null} leadSuit - The suit led in the current trick, or null if it's the lead player's turn.
 */
function updatePlayerCardInteractions(activePlayer, leadSuit) {
    window.players.forEach(player => {
        // MODIFIED: Select the outer player card container for the glow
        const playerCardArea = document.querySelector(`.${player}-cards`); 
        // Keep selecting the inner handElement for individual card interaction logic
        const handElement = playerCardArea ? playerCardArea.querySelector('.hand') : null; // Get the inner hand for card logic
        const isHumanPlayer = (activePlayer === window.loggedInPlayer);
        const humanHand = document.getElementById(window.loggedInPlayer);

        if (playerCardArea && handElement) { // Ensure both elements exist
            // Apply/remove glow effect to the outer player card area
            if (player === activePlayer) {
                playerCardArea.classList.add('active-player-glow'); // Apply glow to the outer div
            } else {
                playerCardArea.classList.remove('active-player-glow'); // Remove glow from the outer div
            }

            // Get the actual cards in the player's hand (from JS hands object)
            const cardsInHand = window.hands ? window.hands[player] : [];
            const hasLeadSuit = leadSuit ? cardsInHand.some(card => card.suit === leadSuit) : false;
            const hasTrump = cardsInHand.some(card => card.suit === window.currentTrumpSuit);

            handElement.querySelectorAll('.card').forEach(cardElem => {
                const cardSuit = cardElem.dataset.suit;
                const cardRank = cardElem.dataset.rank;

                if (player === activePlayer) {
                    // Assume card is playable by default, then disable if rules are violated
                    cardElem.classList.add('card-playable');
                    cardElem.style.pointerEvents = 'auto';
                    cardElem.addEventListener('click', function() {
                        window.animateCardToCenter(cardElem, player);
                    });

                    // Rule 2: Suit Following
                    if (leadSuit !== null) { // If it's not the lead player's turn
                        if (hasLeadSuit && cardSuit !== leadSuit) {
                            // Player has lead suit, but trying to play a different suit -> Disable
                            cardElem.style.pointerEvents = 'none';
                            cardElem.classList.remove('card-playable');
                        }
                        // If player doesn't have lead suit (hasLeadSuit is false), they can play any card.
                        // If player has lead suit and playing lead suit, it's allowed.
                    } else { // It's the lead player's turn (leadSuit is null)
                        // Rule 1: Cannot lead with trump if trump is not broken AND player has non-trump cards.
                        if (cardSuit === window.currentTrumpSuit && !window.trumpBroken && hasTrump && (cardsInHand.length > 1 || !isBlackQueen)) {
                            // If the player only has trump cards, they must lead with trump.
                            // If player has non-trump cards, they cannot lead with trump unless trump is broken.
                            // The check for "hasTrump" is important to distinguish from a player having ONLY non-trump.
                            const hasNonTrumpCards = cardsInHand.some(card => card.suit !== window.currentTrumpSuit);
                            if (hasNonTrumpCards) { // Cannot lead with trump if non-trump available and trump not broken
                                cardElem.style.pointerEvents = 'none';
                                cardElem.classList.remove('card-playable');
                            }
                        }
                    }
                    

                } else {
                    // Disable all cards for inactive players
                    cardElem.classList.remove('card-playable');
                    cardElem.style.pointerEvents = 'none';
                }
            });
        }
    });
}

/**
 * Displays the partner revealed message temporarily.
 * Also updates the persistent game info displays with team information.
 */
async function showPartnerRevealMessage() {
    const partnerRevealMessageDiv = document.getElementById('partner-reveal-message');
    const partnerRevealNameSpan = document.getElementById('partner-reveal-name');

    // NEW: Get references to the persistent game info display spans
    const desktopBidWinningTeamSpan = document.getElementById('desktop-bid-winner-team');
    const desktopOpponentTeamSpan = document.getElementById('desktop-opponent-team');
    const desktopTrumpSuitSpan = document.getElementById('desktop-trump-suit');
    const mobileBidWinningTeamSpan = document.getElementById('mobile-bid-winner-team');
    const mobileOpponentTeamSpan = document.getElementById('mobile-opponent-team');
    const mobileTrumpSuitSpan = document.getElementById('mobile-trump-suit');

    if (partnerRevealMessageDiv && partnerRevealNameSpan && window.partnerPlayerName) {
        partnerRevealNameSpan.textContent = " " + window.formatPlayerDisplayName(window.partnerPlayerName);
        partnerRevealMessageDiv.classList.add('visible'); // Show the message

        // NEW: Update persistent game info displays with team details
        if (window.bidWinningTeam && window.opponentTeam) {
            // Format player names (max 10 chars, capitalized)
            const formatTeamNames = (team) => {
                return team.map(player => {
                    let displayName = window.formatPlayerDisplayName(player);
                    return displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName;
                }).join(', ');
            };

            const bidWinningTeamNames = formatTeamNames(window.bidWinningTeam);
            const opponentTeamNames = formatTeamNames(window.opponentTeam);

            // Update desktop display
            if (desktopBidWinningTeamSpan) {
                desktopBidWinningTeamSpan.textContent = bidWinningTeamNames;
            }
            if (desktopOpponentTeamSpan) {
                desktopOpponentTeamSpan.textContent = opponentTeamNames;
            }

            if (desktopTrumpSuitSpan) {
                // Make trump suit first letter uppercase for display. e.g. 'hearts' -> 'Hearts'
                desktopTrumpSuitSpan.textContent = window.currentTrumpSuit.charAt(0).toUpperCase() + window.currentTrumpSuit.slice(1);
            }

            // Update mobile display
            if (mobileBidWinningTeamSpan) {
                mobileBidWinningTeamSpan.textContent = bidWinningTeamNames;
            }
            if (mobileOpponentTeamSpan) {
                mobileOpponentTeamSpan.textContent = opponentTeamNames;
            }
            if (mobileTrumpSuitSpan) {
                mobileTrumpSuitSpan.textContent = window.currentTrumpSuit.charAt(0).toUpperCase() + window.currentTrumpSuit.slice(1);
            }

        } else {
            console.warn("showPartnerRevealMessage: Team arrays (bidWinningTeam or opponentTeam) are not available.");
        }

        // Fix: Use await delay() to pause the game flow for 3 seconds
        await delay(3000);

        partnerRevealMessageDiv.classList.remove('visible'); // Hide after the delay
    } else {
        console.log("Bid Winning Team:", window.bidWinningTeam ? window.bidWinningTeam.map(window.formatPlayerDisplayName).join(', ') : "N/A");
        console.log("Opponent Team:", window.opponentTeam ? window.opponentTeam.map(window.formatPlayerDisplayName).join(', ') : "N/A");
        console.warn("showPartnerRevealMessage() called but partner reveal message elements or partnerPlayerName not found.");
        console.log("Elements:", partnerRevealMessageDiv, partnerRevealNameSpan, window.partnerPlayerName);
    }
}
window.showPartnerRevealMessage = showPartnerRevealMessage; // Expose globally

// Expose globally
window.updatePlayerCardInteractions = updatePlayerCardInteractions;
window.playCardInTrick = playCardInTrick;

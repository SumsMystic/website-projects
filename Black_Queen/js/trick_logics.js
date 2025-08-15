
/**
 * Handles a player playing a card during a trick.
 * @param {HTMLElement} cardElem - The HTML element of the card played.
 * @param {string} player - The name of the player who played the card.
 */
function playCardInTrick(cardElem, player) {
    console.log(`${window.formatPlayerDisplayName(player)} played: ${cardElem.dataset.rank} of ${cardElem.dataset.suit}`); // <--- MODIFIED: Use window.formatPlayerDisplayName

    // CRITICAL: Call playCardToCenter from game_play.js to move the card
    // from temporary body placement to the center played cards area
    // and apply its final styling (position: absolute, transforms).
    if (typeof window.playCardToCenter === 'function') {
        window.playCardToCenter(cardElem, player); // This moves and styles the card
    } else {
        console.error("playCardToCenter function not found. Cannot place card on table.");
        // Fallback: If playCardToCenter is missing, at least try to append it.
        const centerPlayedCardsFallback = document.getElementById('center-played-cards');
        if (centerPlayedCardsFallback) {
            cardElem.style.position = 'static';
            cardElem.style.transform = '';
            centerPlayedCardsFallback.appendChild(cardElem);
        }
    }

    const playedCardSuit = cardElem.dataset.suit;
    const playedCardRank = cardElem.dataset.rank;

    // If it's the first card of the trick, set the lead suit
    if (window.cardsInCurrentTrick === 0) { // <--- MODIFIED: Use window.cardsInCurrentTrick
        window.leadSuitForTrick = playedCardSuit; // <--- MODIFIED: Use window.leadSuitForTrick
    }

    // Rule: Check if trump is broken
    // Trump is broken if a trump card is played when the lead suit is NOT trump,
    // and the player HAD a card of the lead suit but chose to play trump (sluffing trump).
    // OR if a player *leads* with trump after it was previously broken.
    if (!window.trumpBroken) { // <--- MODIFIED: Use window.trumpBroken
        if (playedCardSuit === window.currentTrumpSuit && window.leadSuitForTrick !== window.currentTrumpSuit) { // <--- MODIFIED: Use window.currentTrumpSuit and window.leadSuitForTrick
            // If a trump card is played, and it's not the lead suit, trump is now broken.
            // This assumes the play was valid (i.e., player didn't have lead suit, or it's allowed to play trump)
            window.trumpBroken = true; // <--- MODIFIED: Update global trumpBroken
            window.displayMessage("Trump has been broken!", "message-box"); // <--- MODIFIED: Use window.displayMessage
        }
    }


    // Remove the played card from the player's hand DOM.
    // This removeChild call was likely intended for the initial removal from the player's hand before the animation, ...
    // ... but the animation function (animateCardToCenter) already handles that.
    // cardElem.parentNode.removeChild(cardElem);

    // Remove the played card from the player's hands array
    // (This part is crucial for AI and game state accuracy)
    // IMPORTANT: window.hands is assumed to be initialized in script.js
    if (window.hands && window.hands[player]) { // <--- MODIFIED: Use window.hands
        window.hands[player] = window.hands[player].filter(card => !(card.rank === playedCardRank && card.suit === playedCardSuit)); // <--- MODIFIED: Use window.hands
    } else {
        console.warn(`window.hands or window.hands[${player}] is undefined. Cannot remove card from hand array.`);
    }


    // Add the card to the current trick's array
    window.currentTrick.push({ // <--- MODIFIED: Use window.currentTrick
        card: {
            rank: playedCardRank,
            suit: playedCardSuit
        },
        player: player,
        element: cardElem // Keep a reference to the element for trick evaluation/collection
    });
    window.cardsInCurrentTrick++; // <--- MODIFIED: Use window.cardsInCurrentTrick

    // Disable current player's cards immediately after playing
    window.updatePlayerCardInteractions(null, null); // <--- MODIFIED: Use window.updatePlayerCardInteractions

    // Check if the trick is complete (all 4 players have played)
    if (window.cardsInCurrentTrick === window.players.length) { // <--- MODIFIED: Use window.cardsInCurrentTrick and window.players
        window.displayMessage("All cards played for the trick!", "message-box"); // <--- MODIFIED: Use window.displayMessage
        // Evaluate trick winner after a short delay to let the last card animation settle
        setTimeout(evaluateTrick, 700);
    } else {
        // Advance to the next player's turn in the trick
        advanceTrickTurn();
        const nextPlayer = window.players[window.currentPlayerIndex]; // <--- MODIFIED: Use window.players and window.currentPlayerIndex
        window.displayMessage(`${window.formatPlayerDisplayName(nextPlayer)}'s turn to play.`, "message-box"); // <--- MODIFIED: Use window.displayMessage and window.formatPlayerDisplayName
        
        // Enable next player's cards, passing the lead suit for suit-following rule
        window.updatePlayerCardInteractions(nextPlayer, window.leadSuitForTrick); // <--- MODIFIED: Use window.updatePlayerCardInteractions and window.leadSuitForTrick
    }
}


/**
 * Advances the turn to the next player in the trick sequence.
 */
function advanceTrickTurn() {
    // This is a simplified turn order. In a real game, it follows lead player.
    // For now, it just goes clockwise from the previous player.
    window.currentPlayerIndex = (window.currentPlayerIndex + 1) % window.players.length; // <--- MODIFIED: Use window.currentPlayerIndex and window.players
    // Skip players who have already played in this trick (if logic becomes more complex)
    // For a simple 4-card trick, this sequential advance is usually fine.
}

/**
 * Evaluates the current trick to determine the winner based on Black Queen rules.
 * Rules: Aces > Kings > Queens > Jacks > 10...2. Trump cards beat non-trump cards.
 * If no trump, highest card of lead suit wins.
 *
 * IMPORTANT: This evaluation also handles points for specific cards like Black Queen.
 */
function evaluateTrick() {
    console.log("Evaluating trick:", window.currentTrick); // <--- MODIFIED: Use window.currentTrick

    let winningCardInfo = window.currentTrick[0]; // <--- MODIFIED: Use window.currentTrick
    const leadSuit = window.currentTrick[0].card.suit; // <--- MODIFIED: Use window.currentTrick
    const trumpSuit = window.currentTrumpSuit; // <--- MODIFIED: Use window.currentTrumpSuit

    // Define card rank order for comparison (higher number is better)
    const rankOrder = {
        "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
        "jack": 11, "queen": 12, "king": 13, "ace": 14
    };

    // Iterate through played cards to find the winner
    for (let i = 1; i < window.currentTrick.length; i++) { // <--- MODIFIED: Use window.currentTrick
        const currentCardInfo = window.currentTrick[i]; // <--- MODIFIED: Use window.currentTrick
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
            if (rankOrder[currentCard.rank] > rankOrder[winningCard.rank]) {
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
                if (rankOrder[currentCard.rank] > rankOrder[winningCard.rank]) {
                    winningCardInfo = currentCardInfo;
                }
            }
            // If neither are trump and neither follow lead suit, the first card (lead suit) still wins
            // unless it was beaten by a trump or a higher card of the lead suit.
            // This scenario means currentCard sluffed and cannot win unless winningCard also sluffed and was lower.
            // Given the rules of play, this 'else' block implies both are non-winning suits, so winningCardInfo remains.
        }
    }

    window.trickWinner = winningCardInfo.player; // <--- MODIFIED: Use window.trickWinner
    let trickPoints = 1; // Base points for winning a trick

    // Check for special cards for scoring (e.g., Black Queen)
    // Assuming Black Queen (Queen of Spades) costs 13 points if taken.
    const blackQueenCard = { rank: 'queen', suit: 'spades' };
    let blackQueenWasPlayed = false;

    window.currentTrick.forEach(playedCard => { // <--- MODIFIED: Use window.currentTrick
        if (playedCard.card.rank === blackQueenCard.rank && playedCard.card.suit === blackQueenCard.suit) {
            blackQueenWasPlayed = true;
            // Black Queen points are usually assigned to the *winner of the trick* if they take it.
            // Or to the player who *played* it if they don't take it (if that's a rule).
            // In many games, the person who *takes* the Black Queen gets 13 penalty points.
            // For simplicity, let's say the winner of the trick receives the Black Queen points/penalties.
            // Adjust this based on actual Black Queen game scoring rules.
            // Here, we'll assign the 13 points to the winner, making them a "bad" trick to win.
            // If it's a penalty, the score would *decrease*
            // If the game is "points-based" and Black Queen is +13 to winner, then:
            // trickPoints += 13;
        }
    });

    // For games like Hearts, the Queen of Spades (Black Queen) is typically -13 points for the person who *takes* it.
    // Let's implement it as a penalty for the trick winner.
    if (blackQueenWasPlayed) {
        trickPoints = -13; // Penalty for taking the trick with Black Queen
        window.displayMessage(`Oh no! ${window.formatPlayerDisplayName(window.trickWinner)} took the Black Queen and gets ${trickPoints} points!`, "message-box"); // <--- MODIFIED: Use window.displayMessage and window.formatPlayerDisplayName and window.trickWinner
    } else {
        window.displayMessage(`${window.formatPlayerDisplayName(window.trickWinner)} won Trick ${window.trickCount + 1} with the ${winningCardInfo.card.rank} of ${winningCardInfo.card.suit}!`, "message-box"); // <--- MODIFIED: Use window.displayMessage, window.formatPlayerDisplayName, window.trickWinner, window.trickCount
    }

    window.playersScores[window.trickWinner] += trickPoints; // <--- MODIFIED: Use window.playersScores and window.trickWinner
    window.trickCount++; // <--- MODIFIED: Use window.trickCount

    window.updateScoresDisplay(); // <--- MODIFIED: Use window.updateScoresDisplay

    // Clear center cards (face down) and start next trick after a delay
    setTimeout(() => {
        if (typeof window.clearCenterPlayedCards === 'function') {
            window.clearCenterPlayedCards(true);
        }

        if (window.trickCount < 13) { // <--- MODIFIED: Use window.trickCount
            window.startTrick(); // Call the global startTrick
        } else {
            window.endGame(); // Call the global endGame
        }
    }, 1000);
}

/**
 * Enables hover and click interactions only for the specified active player's cards,
 * enforcing trump-breaking and suit-following rules.
 * Also adds/removes a visual glow feedback for the active player's hand area.
 * @param {string | null} activePlayer - The player whose cards should be active, or null to disable all.
 * @param {string | null} leadSuit - The suit led in the current trick, or null if it's the lead player's turn.
 */
function updatePlayerCardInteractions(activePlayer, leadSuit) {
    window.players.forEach(player => { // <--- MODIFIED: Use window.players
        const handElement = document.querySelector(`.${player}-cards .hand`);
        if (handElement) {
            // Apply/remove glow effect to the hand container
            if (player === activePlayer) {
                handElement.classList.add('active-player-glow'); // Add glow
            } else {
                handElement.classList.remove('active-player-glow'); // Remove glow
            }

            // Get the actual cards in the player's hand (from JS hands object)
            const cardsInHand = window.hands ? window.hands[player] : []; // <--- MODIFIED: Use window.hands, add fallback
            const hasLeadSuit = leadSuit ? cardsInHand.some(card => card.suit === leadSuit) : false;
            const hasTrump = cardsInHand.some(card => card.suit === window.currentTrumpSuit); // <--- MODIFIED: Use window.currentTrumpSuit

            handElement.querySelectorAll('.card').forEach(cardElem => {
                const cardSuit = cardElem.dataset.suit;
                const cardRank = cardElem.dataset.rank;
                const isBlackQueen = (cardRank === 'queen' && cardSuit === 'spades'); // The Black Queen

                if (player === activePlayer) {
                    // Assume card is playable by default, then disable if rules are violated
                    cardElem.classList.add('card-playable');
                    cardElem.style.pointerEvents = 'auto';

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
                        // The Black Queen (Queen of Spades) is an exception: it can ALWAYS be played.
                        if (cardSuit === window.currentTrumpSuit && !window.trumpBroken && hasTrump && (cardsInHand.length > 1 || !isBlackQueen)) { // <--- MODIFIED: Use window.currentTrumpSuit and window.trumpBroken
                            // If the player only has trump cards, they must lead with trump.
                            // If player has non-trump cards, they cannot lead with trump unless trump is broken.
                            // The check for "hasTrump" is important to distinguish from a player having ONLY non-trump.
                            const hasNonTrumpCards = cardsInHand.some(card => card.suit !== window.currentTrumpSuit); // <--- MODIFIED: Use window.currentTrumpSuit
                            if (hasNonTrumpCards && !isBlackQueen) { // Cannot lead with trump if non-trump available and trump not broken (unless it's the Black Queen)
                                cardElem.style.pointerEvents = 'none';
                                cardElem.classList.remove('card-playable');
                            }
                        }
                    }

                    // Rule: Black Queen (Queen of Spades) can always be played, overriding other restrictions.
                    if (isBlackQueen) {
                        cardElem.style.pointerEvents = 'auto';
                        cardElem.classList.add('card-playable');
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

// Expose globally
window.updatePlayerCardInteractions = updatePlayerCardInteractions;
window.playCardInTrick = playCardInTrick;

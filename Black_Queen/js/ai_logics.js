// ai_logic.js

// Expose AI functions globally for game_logic.js to call
window.ai = {};

/**
 * A helper function to evaluate the "strength" of a player's hand for bidding.
 * This is a simplified logic. More advanced AIs would use complex algorithms.
 * @param {Array<Object>} hand - The player's hand.
 * @returns {number} - A numerical representation of hand strength.
 */
function getHandStrength(hand) {
    let strength = 0;
    const suitCounts = {};
    const cardPoints = { // Re-using card points logic from trick_logics.js (ensure it's consistent)
        'ace': 20, 'king': 10, 'queen': 10, 'jack': 10, '10': 10, '5': 5
    };

    hand.forEach(card => {
        // Accumulate points for high-value cards
        strength += cardPoints[card.rank] || 0;

        // Count cards per suit for potential long suits
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    // Add bonus for long suits (potential for trumps)
    for (const suit in suitCounts) {
        if (suitCounts[suit] >= 5) { // Bonus for 5 or more cards in a suit
            strength += (suitCounts[suit] - 4) * 5; // +5 for 5th card, +10 for 6th, etc.
        }
    }

    return strength;
}

/**
 * AI logic for making a bid during the bidding phase.
 * @param {string} player - The name of the AI player (e.g., 'north', 'east', 'west').
 * @param {number} currentHighestBid - The current highest bid placed.
 * @param {Array<Object>} playerHand - The AI player's hand.
 * @returns {number|string} - The AI's bid amount, or 'pass'.
 */
window.ai.aiMakeBid = function(player, currentHighestBid, playerHand) {
    const handStrength = getHandStrength(playerHand);
    console.log(`${window.formatPlayerDisplayName(player)}'s hand strength: ${handStrength}`);

    const MIN_BID = window.MIN_BID || 170; // Use global MIN_BID from game_logic.js
    const BID_INCREMENT = window.BID_INCREMENT || 5; // Use global BID_INCREMENT

    // Simple bidding strategy:
    // If very strong hand, bid aggressively (higher than current, or initial high bid)
    if (handStrength >= 70 && currentHighestBid < 250) { // Example threshold
        const bid = Math.max(currentHighestBid + BID_INCREMENT, MIN_BID);
        return Math.min(bid, 280); // Cap bid at max possible score
    }
    // If moderately strong hand, bid incrementally
    else if (handStrength >= 40 && currentHighestBid < 200) { // Example threshold
        const bid = Math.max(currentHighestBid + BID_INCREMENT, MIN_BID);
        return Math.min(bid, 280);
    }
    // Otherwise, pass
    else {
        return 'pass';
    }
};

/**
 * AI logic for choosing the trump suit after winning the bid.
 * @param {string} player - The AI player who won the bid.
 * @param {Array<Object>} playerHand - The AI player's hand.
 * @returns {string} - The chosen trump suit.
 */
window.ai.aiChooseTrump = function(player, playerHand) {
    const suitCounts = {};
    window.suits.forEach(suit => suitCounts[suit] = 0); // Initialize counts for all suits

    playerHand.forEach(card => {
        suitCounts[card.suit]++;
    });

    // Find the suit with the most cards (longest suit)
    let chosenTrump = null;
    let maxCount = -1;
    for (const suit in suitCounts) {
        if (suitCounts[suit] > maxCount) {
            maxCount = suitCounts[suit];
            chosenTrump = suit;
        }
    }
    console.log(`${window.formatPlayerDisplayName(player)} chose ${chosenTrump} as trump.`);
    return chosenTrump;
};

/**
 * AI logic for choosing a partner card.
 * A very simple strategy: pick the Ace of a suit that the AI itself does NOT hold,
 * or if it holds all Aces, pick a King of a suit it doesn't hold.
 * Or if all high cards are in its hand, it goes solo by picking one of its own cards.
 * @param {string} player - The AI player who won the bid.
 * @param {Array<Object>} playerHand - The AI player's hand.
 * @returns {Object} - An object {suit: string, rank: string} representing the partner card.
 */
window.ai.aiChoosePartner = function(player, playerHand) {
    const aiHasCard = (suit, rank) => playerHand.some(c => c.suit === suit && c.rank === rank);

    // Try to pick an Ace not in hand
    for (const suit of window.suits) {
        if (!aiHasCard(suit, 'ace')) {
            console.log(`${window.formatPlayerDisplayName(player)} chose Ace of ${suit} as partner.`);
            return { suit: suit, rank: 'ace' };
        }
    }

    // If all Aces are in AI's hand, try to pick a King not in hand
    for (const suit of window.suits) {
        if (!aiHasCard(suit, 'king')) {
            console.log(`${window.formatPlayerDisplayName(player)} chose King of ${suit} as partner.`);
            return { suit: suit, rank: 'king' };
        }
    }

    // If AI has all Aces and Kings (highly unlikely but possible in debug small hands), or
    // if a more complex situation arises where it can't find a high card outside its hand,
    // it will pick its highest card to 'go solo' (partner with itself).
    // This part ensures a valid card is always returned.
    const highestRankedCardInHand = playerHand.reduce((prev, current) => {
        const rankOrder = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "jack": 11, "queen": 12, "king": 13, "ace": 14 };
        return (rankOrder[current.rank] > rankOrder[prev.rank]) ? current : prev;
    }, playerHand[0]);

    if (highestRankedCardInHand) {
        console.log(`${window.formatPlayerDisplayName(player)} decided to go solo with ${highestRankedCardInHand.rank} of ${highestRankedCardInHand.suit}.`);
        return highestRankedCardInHand;
    }

    // Fallback: This should ideally not be reached if hand is not empty
    console.warn(`${window.formatPlayerDisplayName(player)} could not find a suitable partner card, choosing first card in hand.`);
    return playerHand[0];
};

/**
 * AI logic for playing a card during a trick.
 * @param {string} player - The name of the AI player.
 * @param {Array<Object>} playerHand - The AI player's current hand.
 * @param {Array<Object>} currentTrick - Cards already played in the current trick: [{cardElem, player}].
 * @param {string|null} leadSuit - The suit of the first card played in the trick.
 * @param {string|null} trumpSuit - The current trump suit.
 * @returns {HTMLElement} - The HTML element of the card the AI decided to play.
 */
window.ai.aiPlayCard = function(player, playerHand, currentTrick, leadSuit, trumpSuit) {
    const playableCards = window.getPlayableCards(playerHand, leadSuit, trumpSuit);
    let cardToPlay = null;

    if (playableCards.length === 0) {
        console.error(`${window.formatPlayerDisplayName(player)}: No playable cards! This should not happen.`);
        // Fallback: play any card if no playable cards are found (emergency)
        return playerHand[0] ? document.querySelector(`.hand[data-player="${player}"] .card[data-suit="${playerHand[0].suit}"][data-rank="${playerHand[0].rank}"]`) : null;
    }

    // Convert hand objects to card elements for selection
    const handElements = Array.from(document.querySelectorAll(`.hand[data-player="${player}"] .card`));
    const getCardElement = (card) => {
        return handElements.find(elem => elem.dataset.suit === card.suit && elem.dataset.rank === card.rank);
    };

    // --- Strategy for playing a card ---

    // 1. If leading the trick: Play a low card to save high cards, or a high card to establish lead.
    if (!leadSuit) { // AI is leading the trick
        // Simple strategy: Play the lowest non-trump card first if available,
        // otherwise lowest trump. Conserve high cards.
        const nonTrumpCards = playableCards.filter(c => c.suit !== trumpSuit);
        if (nonTrumpCards.length > 0) {
            cardToPlay = nonTrumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
        } else {
            // Only trumps left, play the lowest trump
            cardToPlay = playableCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
        }
    } else { // AI is not leading, must follow suit or trump/slough
        const cardsOfLeadSuit = playableCards.filter(card => card.suit === leadSuit);
        const trumpCards = playableCards.filter(card => card.suit === trumpSuit);

        // Determine if current winning card is beatable by a non-trump lead suit card
        const currentWinningCardInfo = window.determineTrickWinner(currentTrick, trumpSuit);
        const canBeatWithLeadSuit = cardsOfLeadSuit.some(card => 
            window.compareCards(card, currentWinningCardInfo.card, leadSuit, trumpSuit) > 0
        );
        const canBeatWithTrump = trumpCards.some(card => 
            window.compareCards(card, currentWinningCardInfo.card, leadSuit, trumpSuit) > 0
        );

        if (cardsOfLeadSuit.length > 0) { // Has cards of the lead suit
            if (canBeatWithLeadSuit) {
                // Play lowest card of lead suit that can win the trick
                const winningLeadCards = cardsOfLeadSuit.filter(card => 
                    window.compareCards(card, currentWinningCardInfo.card, leadSuit, trumpSuit) > 0
                );
                cardToPlay = winningLeadCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
            } else {
                // Cannot win with lead suit, play lowest card of lead suit to save high cards
                cardToPlay = cardsOfLeadSuit.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
            }
        } else { // Cannot follow suit
            if (trumpCards.length > 0) { // Has trumps
                if (canBeatWithTrump) {
                    // Play lowest trump that can win, if it's a valuable trick
                    // For basic AI, just trump if it can win and if trick value is high (e.g., > 10 points already)
                    const trickValue = currentTrick.reduce((sum, c) => sum + window.getCardPoints(c.card), 0);
                    if (trickValue >= 10 || currentWinningCardInfo.player === window.partnerPlayerName) { // Trump if trick is valuable or partner is winning
                         const winningTrumps = trumpCards.filter(card => 
                            window.compareCards(card, currentWinningCardInfo.card, leadSuit, trumpSuit) > 0
                        );
                        if (winningTrumps.length > 0) {
                           cardToPlay = winningTrumps.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                        } else {
                           // Can't win with trumps, just play lowest trump to save high trumps
                           cardToPlay = trumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                        }
                    } else {
                        // Play lowest trump to save higher trumps if trick is not valuable
                        cardToPlay = trumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                    }
                } else {
                    // Cannot win with trump, play lowest trump to save higher trumps
                    cardToPlay = trumpCards.sort((a, b) => window.getCardRankValue(a.rank) - window.getCardRankValue(b.rank))[0];
                }
            } else { // No cards of lead suit, no trumps - must slough
                // Play the lowest value card (non-scoring if possible)
                cardToPlay = playableCards.sort((a, b) => window.getCardPoints(getCardElement(a)) - window.getCardPoints(getCardElement(b)))[0];
            }
        }
    }

    // Ensure cardToPlay is never null and is one of the playable cards
    if (!cardToPlay && playableCards.length > 0) {
        cardToPlay = playableCards[0]; // Fallback to first playable card
    } else if (!cardToPlay && playerHand.length > 0) {
         // Ultimate fallback: if getPlayableCards returns nothing valid, just play the first card in hand
        cardToPlay = playerHand[0];
    }
     // Return the actual HTML element
    return getCardElement(cardToPlay);
};


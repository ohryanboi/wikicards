// WikiCards - Wikipedia Trading Card Game
// ==========================================

// Game State
const gameState = {
    tickets: 10, // Start with 10 free packs
    packsOpened: 0, // Track total packs opened for golden pack
    totalPacksOpened: 0, // Lifetime packs opened
    battlesWon: 0, // Track battle wins
    cards: [],
    deck: [],
    currentBattle: null,
    playerHealth: 30,
    playerEnergy: 0,
    opponentHealth: 30,
    opponentEnergy: 0,
    playerField: [],
    opponentField: [],
    playerHand: [],
    opponentHand: [],
    turn: 'player',
    bossBattle: null,
    achievements: {
        firstWin: false,
        collector: false,
        goldenTouch: false,
        wikiScholar: false
    }
};

// Achievement Definitions
const ACHIEVEMENTS = {
    firstWin: {
        id: 'firstWin',
        name: 'First Victory',
        description: 'Win your first battle',
        icon: '🏆',
        check: () => gameState.battlesWon >= 1
    },
    collector: {
        id: 'collector',
        name: 'Card Collector',
        description: 'Own 50 cards',
        icon: '📚',
        check: () => gameState.cards.length >= 50
    },
    goldenTouch: {
        id: 'goldenTouch',
        name: 'Golden Touch',
        description: 'Open your first Golden Pack',
        icon: '👑',
        check: () => gameState.totalPacksOpened >= 10
    },
    wikiScholar: {
        id: 'wikiScholar',
        name: 'Wikipedia Scholar',
        description: 'Have cards from 10 different categories',
        icon: '🎓',
        check: () => {
            const categories = new Set(gameState.cards.map(c => c.category || 'Unknown'));
            return categories.size >= 10;
        }
    }
};

// ==========================================
// VIDEO AD SYSTEM
// ==========================================
// Add your video URLs here - the system will randomly select one
const VIDEO_ADS = [
    "videoplayback.mp4",
    "videoad2.mp4",
    "videoad3.mp4",
    "videoad4.mp4",
    "videoad5.mp4",
    "videoad6.mp4",
    "videoad7.mp4",
    // Add more video URLs here like:
    // "https://example.com/video1.mp4",
    // "https://example.com/video2.mp4",
];

const videoAdState = {
    isPlaying: false,
    countdown: 10,
    interval: null,
    pendingPackType: null,
    onComplete: null
};

function showVideoAd(packType) {
    // Clear any existing interval
    if (videoAdState.interval) {
        clearInterval(videoAdState.interval);
    }

    videoAdState.pendingPackType = packType;
    videoAdState.countdown = 10;
    videoAdState.isPlaying = true;

    const modal = document.getElementById('video-ad-modal');
    const video = document.getElementById('ad-video');
    const placeholder = document.getElementById('video-placeholder');
    const progressFill = document.getElementById('video-progress-fill');
    const countdownEl = document.getElementById('video-countdown');
    const skipBtn = document.getElementById('skip-video-btn');

    // Reset UI
    progressFill.style.width = '0%';
    countdownEl.textContent = '10';
    skipBtn.disabled = true;
    skipBtn.textContent = 'Please wait...';

    // Check if we have videos configured
    if (VIDEO_ADS.length > 0) {
        const randomVideo = VIDEO_ADS[Math.floor(Math.random() * VIDEO_ADS.length)];
        video.querySelector('source').src = randomVideo;
        video.load();
        video.style.display = 'block';
        placeholder.style.display = 'none';
        video.play().catch(() => {
            // Video failed, use placeholder
            video.style.display = 'none';
            placeholder.style.display = 'flex';
        });
    } else {
        // Use placeholder
        video.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    modal.classList.remove('hidden');

    // Start countdown
    videoAdState.interval = setInterval(() => {
        videoAdState.countdown--;
        countdownEl.textContent = videoAdState.countdown;

        const progress = ((10 - videoAdState.countdown) / 10) * 100;
        progressFill.style.width = `${progress}%`;

        if (videoAdState.countdown <= 0) {
            clearInterval(videoAdState.interval);
            skipBtn.disabled = false;
            skipBtn.textContent = '✓ Open Pack!';
        } else {
            skipBtn.textContent = `Wait ${videoAdState.countdown}s...`;
        }
    }, 1000);
}

function skipVideo() {
    if (videoAdState.countdown > 0) return;

    clearInterval(videoAdState.interval);

    const modal = document.getElementById('video-ad-modal');
    const video = document.getElementById('ad-video');

    video.pause();
    video.currentTime = 0; // Reset video for next time
    modal.classList.add('hidden');

    // Reset video ad state BEFORE opening pack
    videoAdState.isPlaying = false;
    videoAdState.pendingPackType = null;
    videoAdState.countdown = 10;

    // Give player 10 tickets for watching the ad
    gameState.tickets += 10;
    saveGameState();
    updateUI();

    // Show reward notification
    showNotification('🎉 +10 Pack Tickets!');

    // Then open the pack immediately
    actuallyOpenPack();
}

function showNotification(message, isAchievement = false) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = message;

    const bgStyle = isAchievement
        ? 'background: linear-gradient(135deg, #9c27b0, #e91e63);'
        : 'background: linear-gradient(135deg, var(--gold), #ffed4a);';
    const colorStyle = isAchievement ? 'color: #fff;' : 'color: #000;';

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        ${bgStyle}
        ${colorStyle}
        padding: 15px 30px;
        border-radius: 10px;
        font-weight: bold;
        font-size: 1.2rem;
        z-index: 2000;
        animation: slideDown 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
        box-shadow: 0 5px 20px rgba(156, 39, 176, 0.5);
        text-align: center;
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Achievement System
function checkAchievements() {
    let newAchievements = [];

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!gameState.achievements[key] && achievement.check()) {
            gameState.achievements[key] = true;
            newAchievements.push(achievement);
        }
    }

    // Show notifications for new achievements
    newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
            showNotification(
                `${achievement.icon} Achievement Unlocked!<br><strong>${achievement.name}</strong>`,
                true
            );
        }, index * 1500);
    });

    if (newAchievements.length > 0) {
        saveGameState();
        updateAchievementsDisplay();
    }
}

function updateAchievementsDisplay() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    container.innerHTML = '';

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        const isUnlocked = gameState.achievements[key];
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
        badge.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-info">
                <span class="achievement-name">${achievement.name}</span>
                <span class="achievement-desc">${achievement.description}</span>
            </div>
        `;
        container.appendChild(badge);
    }
}

// Rarity thresholds based on article length
const RARITY_THRESHOLDS = {
    common: { min: 0, max: 3000, color: '#9e9e9e' },
    uncommon: { min: 3000, max: 10000, color: '#4caf50' },
    rare: { min: 10000, max: 25000, color: '#2196f3' },
    epic: { min: 25000, max: 50000, color: '#9c27b0' },
    legendary: { min: 50000, max: Infinity, color: '#ff9800' }
};

// Rarity drop chances (in percentage) - much rarer now!
const RARITY_CHANCES = {
    legendary: 1,    // 1% chance
    epic: 4,         // 4% chance
    rare: 10,        // 10% chance
    uncommon: 25,    // 25% chance
    common: 60       // 60% chance
};

// Energy costs by rarity
const ENERGY_COSTS = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
};

// Boss articles - longest Wikipedia articles
const BOSS_ARTICLES = [
    { title: 'World_War_II', name: 'World War II', description: 'The deadliest conflict in human history' },
    { title: 'United_States', name: 'United States', description: 'A superpower nation of knowledge' },
    { title: 'List_of_compositions_by_Franz_Schubert', name: 'Franz Schubert', description: 'Master of musical compositions' },
    { title: 'History_of_India', name: 'History of India', description: 'Ancient civilization of wisdom' },
    { title: 'List_of_Unicode_characters', name: 'Unicode Master', description: 'The keeper of all characters' }
];

// Ability keywords and their effects
const ABILITY_KEYWORDS = {
    science: { name: 'Scientific Breakthrough', effect: 'Gain +2 Knowledge each turn', keywords: ['science', 'physics', 'chemistry', 'biology', 'research', 'experiment', 'theory'] },
    history: { name: 'Historical Impact', effect: 'Deal +3 bonus damage when played', keywords: ['history', 'war', 'battle', 'ancient', 'century', 'historical', 'empire'] },
    person: { name: 'Hero\'s Legacy', effect: 'Inspire: +1 Attack to adjacent cards', keywords: ['born', 'politician', 'actor', 'singer', 'president', 'leader', 'famous'] },
    animal: { name: 'Natural Defense', effect: 'Reduce incoming damage by 2', keywords: ['species', 'animal', 'mammal', 'bird', 'fish', 'wildlife', 'habitat'] },
    technology: { name: 'Tech Boost', effect: 'Buff all friendly cards +1/+1', keywords: ['technology', 'computer', 'software', 'digital', 'internet', 'electronic'] },
    geography: { name: 'Territorial Advantage', effect: 'Cannot be targeted for 1 turn', keywords: ['country', 'city', 'located', 'population', 'capital', 'region'] },
    art: { name: 'Creative Inspiration', effect: 'Draw an extra card', keywords: ['art', 'music', 'painting', 'artist', 'composer', 'film', 'movie'] },
    sport: { name: 'Athletic Power', effect: '+2 Attack when attacking', keywords: ['sport', 'player', 'team', 'championship', 'game', 'football', 'basketball'] }
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    updateUI();
    initializeBosses();
});

// ==========================================
// Wikipedia API Functions
// ==========================================

async function fetchRandomArticle() {
    try {
        const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
        if (!response.ok) throw new Error('Failed to fetch article');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching random article:', error);
        return null;
    }
}

async function fetchArticleDetails(title) {
    try {
        const encodedTitle = encodeURIComponent(title);
        
        // Fetch summary
        const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`);
        const summaryData = await summaryResponse.json();
        
        // Fetch full article info for more stats
        const infoResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=info|categories|links&pllimit=500&cllimit=50&format=json&origin=*`);
        const infoData = await infoResponse.json();
        
        const pages = infoData.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageInfo = pages[pageId];
        
        return {
            title: summaryData.title,
            extract: summaryData.extract || 'No description available',
            image: summaryData.thumbnail?.source || null,
            length: pageInfo?.length || summaryData.extract?.length || 1000,
            links: pageInfo?.links?.length || 0,
            categories: pageInfo?.categories?.length || 0
        };
    } catch (error) {
        console.error('Error fetching article details:', error);
        return null;
    }
}

async function fetchTrendingArticles() {
    try {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        
        const response = await fetch(
            `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch trending');
        const data = await response.json();
        
        // Filter out main page and special pages
        const articles = data.items[0].articles
            .filter(a => !a.article.includes(':') && a.article !== 'Main_Page')
            .slice(0, 20);
        
        return articles;
    } catch (error) {
        console.error('Error fetching trending:', error);
        return [];
    }
}

// ==========================================
// Card Generation
// ==========================================

function determineRarity(articleLength) {
    // Use random chance system for rarity (article length gives small bonus)
    const roll = Math.random() * 100;

    // Longer articles get a slight bonus to rarity roll
    const lengthBonus = Math.min(articleLength / 10000, 5); // Max 5% bonus
    const adjustedRoll = roll - lengthBonus;

    // Cumulative chance check (lower roll = rarer)
    if (adjustedRoll < RARITY_CHANCES.legendary) return 'legendary';        // 1%
    if (adjustedRoll < RARITY_CHANCES.legendary + RARITY_CHANCES.epic) return 'epic';  // 1-5%
    if (adjustedRoll < RARITY_CHANCES.legendary + RARITY_CHANCES.epic + RARITY_CHANCES.rare) return 'rare';  // 5-15%
    if (adjustedRoll < RARITY_CHANCES.legendary + RARITY_CHANCES.epic + RARITY_CHANCES.rare + RARITY_CHANCES.uncommon) return 'uncommon';  // 15-40%
    return 'common';  // 60%
}

function generateAbility(extract, categories) {
    const text = (extract + ' ' + (categories || '')).toLowerCase();
    
    for (const [type, abilityData] of Object.entries(ABILITY_KEYWORDS)) {
        for (const keyword of abilityData.keywords) {
            if (text.includes(keyword)) {
                return {
                    name: abilityData.name,
                    effect: abilityData.effect,
                    type: type
                };
            }
        }
    }
    
    // Default ability
    return {
        name: 'Knowledge Power',
        effect: '+1 to all stats',
        type: 'default'
    };
}

// Rarity stat bonuses - higher rarity = much better stats
const RARITY_STAT_BONUSES = {
    common:    { attack: 0,  defense: 0,  knowledge: 0,  minAttack: 1,  maxAttack: 5 },
    uncommon:  { attack: 4,  defense: 3,  knowledge: 2,  minAttack: 5,  maxAttack: 10 },
    rare:      { attack: 10, defense: 8,  knowledge: 6,  minAttack: 12, maxAttack: 18 },
    epic:      { attack: 18, defense: 15, knowledge: 12, minAttack: 22, maxAttack: 30 },
    legendary: { attack: 30, defense: 25, knowledge: 20, minAttack: 35, maxAttack: 50 }
};

function calculateStats(articleData, rarity) {
    const { length, links, categories } = articleData;
    const bonus = RARITY_STAT_BONUSES[rarity] || RARITY_STAT_BONUSES.common;

    // Base stats from article data (small contribution)
    const baseAttack = Math.floor(Math.log10(length + 1) * 1.5) + Math.floor(Math.random() * 2);
    const baseDefense = Math.floor((categories || 1) * 0.3) + Math.floor(Math.random() * 2);
    const baseKnowledge = Math.floor((links || 1) * 0.05) + Math.floor(Math.random() * 2);

    // Apply rarity bonuses (major contribution)
    let attack = baseAttack + bonus.attack + Math.floor(Math.random() * 3);
    let defense = baseDefense + bonus.defense + Math.floor(Math.random() * 2);
    let knowledge = baseKnowledge + bonus.knowledge + Math.floor(Math.random() * 2);

    // Ensure stats are within rarity-appropriate ranges
    attack = Math.min(Math.max(attack, bonus.minAttack), bonus.maxAttack + 3);
    defense = Math.min(Math.max(defense, 1), bonus.maxAttack);
    knowledge = Math.min(Math.max(knowledge, 1), bonus.maxAttack);

    return { attack, defense, knowledge };
}

// Category keywords for card classification
const CATEGORY_KEYWORDS = {
    'Science': ['science', 'physics', 'chemistry', 'biology', 'mathematics', 'astronomy', 'theory', 'experiment'],
    'History': ['history', 'war', 'ancient', 'century', 'empire', 'dynasty', 'battle', 'revolution'],
    'Technology': ['technology', 'computer', 'software', 'internet', 'digital', 'electronic', 'robot', 'ai'],
    'Nature': ['animal', 'plant', 'species', 'habitat', 'ecosystem', 'wildlife', 'ocean', 'forest'],
    'Arts': ['art', 'music', 'painting', 'sculpture', 'artist', 'composer', 'film', 'theater'],
    'Sports': ['sport', 'football', 'basketball', 'olympic', 'championship', 'athlete', 'team', 'league'],
    'Geography': ['country', 'city', 'mountain', 'river', 'island', 'continent', 'capital', 'population'],
    'People': ['born', 'died', 'politician', 'actor', 'singer', 'author', 'president', 'leader'],
    'Culture': ['culture', 'tradition', 'festival', 'religion', 'language', 'cuisine', 'mythology'],
    'Medicine': ['disease', 'treatment', 'medical', 'hospital', 'doctor', 'health', 'symptom', 'drug']
};

function determineCategory(text) {
    const lowerText = (text || '').toLowerCase();
    let bestCategory = 'Miscellaneous';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const score = keywords.filter(kw => lowerText.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
}

async function generateCard(articleData = null) {
    if (!articleData) {
        const randomArticle = await fetchRandomArticle();
        if (!randomArticle) return null;

        articleData = await fetchArticleDetails(randomArticle.title);
        if (!articleData) return null;
    }

    const rarity = determineRarity(articleData.length);
    const stats = calculateStats(articleData, rarity);
    const ability = generateAbility(articleData.extract, '');
    const category = determineCategory(articleData.extract + ' ' + articleData.title);

    const card = {
        id: Date.now() + Math.random().toString(36).substring(2, 11),
        name: articleData.title,
        wikiTitle: articleData.title, // Store original title for Wikipedia link
        description: articleData.extract?.substring(0, 150) + '...' || 'A mysterious Wikipedia article.',
        image: articleData.image,
        rarity: rarity,
        attack: stats.attack,
        defense: stats.defense,
        knowledge: stats.knowledge,
        cost: ENERGY_COSTS[rarity],
        ability: ability,
        category: category,
        articleLength: articleData.length,
        createdAt: Date.now()
    };

    return card;
}

// ==========================================
// Card Display
// ==========================================

function createCardElement(card, options = {}) {
    const { small = false, clickable = true, inDeck = false, onField = false } = options;

    const cardEl = document.createElement('div');
    const isHolo = card.rarity === 'legendary' || card.rarity === 'epic';
    cardEl.className = `card ${card.rarity} ${small ? 'small' : ''} ${onField ? 'on-field' : ''} ${isHolo ? 'holo-card' : ''}`;
    cardEl.dataset.cardId = card.id;

    const imageStyle = card.image
        ? `background-image: url('${card.image}'); background-size: cover; background-position: center;`
        : `background: linear-gradient(135deg, ${RARITY_THRESHOLDS[card.rarity].color}, #1a1a2e);`;

    // Add holographic overlay for legendary/epic cards
    const holoOverlay = isHolo ? '<div class="holo-overlay"></div><div class="holo-shine"></div>' : '';
    const categoryBadge = card.category ? `<span class="category-badge">${card.category}</span>` : '';

    cardEl.innerHTML = `
        <div class="card-inner">
            ${holoOverlay}
            <div class="card-image" style="${imageStyle}"></div>
            <span class="rarity-badge ${card.rarity}">${card.rarity}</span>
            ${categoryBadge}
            <span class="card-cost">${card.cost}</span>
            <div class="card-content">
                <div class="card-name" title="${card.name}">${card.name}</div>
                <div class="card-description">${small ? '' : card.description}</div>
                <div class="card-ability">${card.ability.name}</div>
                <div class="card-stats">
                    <span class="stat">⚔️ ${card.attack}</span>
                    <span class="stat">🛡️ ${card.defense}</span>
                    <span class="stat">📚 ${card.knowledge}</span>
                </div>
            </div>
        </div>
    `;

    if (clickable) {
        cardEl.addEventListener('click', () => handleCardClick(card, options));
    }

    return cardEl;
}

function handleCardClick(card, options) {
    if (options.inDeck) {
        removeFromDeck(card);
    } else if (options.inCollection) {
        addToDeck(card);
    } else if (options.inHand && gameState.currentBattle) {
        playCard(card);
    } else if (options.onField && gameState.currentBattle) {
        selectCardForAttack(card);
    } else {
        showCardModal(card);
    }
}

function showCardModal(card) {
    const modal = document.getElementById('card-modal');
    const display = document.getElementById('modal-card-display');
    const info = document.getElementById('modal-card-info');

    display.innerHTML = '';
    display.appendChild(createCardElement(card, { clickable: false }));

    // Create Wikipedia URL from title
    const wikiTitle = card.wikiTitle || card.name;
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}`;

    info.innerHTML = `
        <h3>${card.name}</h3>
        <p><strong>Rarity:</strong> ${card.rarity.toUpperCase()}</p>
        <p><strong>Article Length:</strong> ${card.articleLength?.toLocaleString() || 'Unknown'} characters</p>
        <p>${card.description}</p>
        <div class="ability-detail">
            <strong>${card.ability.name}</strong>
            <p>${card.ability.effect}</p>
        </div>
        <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="wiki-link-btn">
            📖 View on Wikipedia
        </a>
    `;

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('card-modal').classList.add('hidden');
}

// ==========================================
// Pack Opening System (Premium Animation)
// ==========================================

// Pack opening state
const packState = {
    isOpening: false,
    currentPackType: null,
    cardsToReveal: [],
    currentCardIndex: 0,
    phase: 'idle' // idle, shake, burst, reveal, final
};

async function openPack(packType) {
    if (packState.isOpening || videoAdState.isPlaying) return;

    // Check if player has free tickets
    if (gameState.tickets > 0) {
        gameState.tickets--;
        updateUI();
        actuallyOpenPack();
    } else {
        // Show video ad
        showVideoAd(packType);
    }
}

async function actuallyOpenPack() {
    packState.isOpening = true;

    // Increment pack counters
    gameState.packsOpened++;
    gameState.totalPacksOpened++;
    const isGoldenPack = gameState.packsOpened % 10 === 0;

    packState.currentPackType = isGoldenPack ? 'golden' : 'standard';

    // Update golden pack progress immediately
    updateGoldenPackProgress();
    saveGameState();

    // Check achievements
    checkAchievements();

    // Start animation IMMEDIATELY - cards load in background
    packState.cardsToReveal = null; // Will be loaded
    packState.currentCardIndex = 0;
    startPremiumPackAnimation(packState.currentPackType, isGoldenPack);
}

function updateGoldenPackProgress() {
    const packsUntilGolden = 10 - (gameState.packsOpened % 10);
    const progress = ((gameState.packsOpened % 10) / 10) * 100;

    const progressText = document.getElementById('packs-until-golden');
    const progressBar = document.getElementById('golden-bar-fill');
    const packVisual = document.getElementById('pack-visual');
    const packIcon = document.getElementById('pack-icon');
    const packTitle = document.getElementById('pack-title');
    const packOdds = document.getElementById('pack-odds');

    if (progressText) progressText.textContent = packsUntilGolden === 10 ? 10 : packsUntilGolden;
    if (progressBar) progressBar.style.width = `${progress}%`;

    // Update pack appearance if next pack is golden
    if (packsUntilGolden === 10 && gameState.packsOpened > 0) {
        // Just opened a golden pack, reset to standard look
        if (packVisual) packVisual.className = 'pack-visual standard-pack';
        if (packIcon) packIcon.textContent = '📦';
        if (packTitle) packTitle.textContent = 'Standard Pack';
        if (packOdds) packOdds.textContent = '3 Common, 1+ Uncommon';
    } else if (packsUntilGolden === 1) {
        // Next pack is golden!
        if (packVisual) packVisual.className = 'pack-visual golden-pack';
        if (packIcon) packIcon.textContent = '👑';
        if (packTitle) packTitle.textContent = '✨ GOLDEN PACK ✨';
        if (packOdds) packOdds.textContent = 'Guaranteed Rare+, Higher Epic/Legendary!';
    }
}

async function openStandardPack(isGolden) {
    const cards = [];
    const totalCards = 5;

    for (let i = 0; i < totalCards; i++) {
        let card = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (!card && attempts < maxAttempts) {
            card = await generateCard();

            if (isGolden && card) {
                // GOLDEN PACK: Much better odds!
                const roll = Math.random();
                if (i === 4) {
                    // Last card: guaranteed epic or legendary
                    if (roll < 0.4) {
                        card.rarity = 'legendary';
                        card.cost = ENERGY_COSTS.legendary;
                        card.attack += 4;
                        card.defense += 3;
                    } else {
                        card.rarity = 'epic';
                        card.cost = ENERGY_COSTS.epic;
                        card.attack += 2;
                        card.defense += 2;
                    }
                } else {
                    // Other cards: at least rare
                    if (card.rarity === 'common' || card.rarity === 'uncommon') {
                        if (roll < 0.3) {
                            card.rarity = 'epic';
                            card.cost = ENERGY_COSTS.epic;
                            card.attack += 2;
                            card.defense += 1;
                        } else {
                            card.rarity = 'rare';
                            card.cost = ENERGY_COSTS.rare;
                            card.attack += 1;
                        }
                    }
                }
            } else if (i === 3 && card && card.rarity === 'common') {
                // Standard pack: 4th card guaranteed uncommon+
                card.rarity = 'uncommon';
                card.cost = ENERGY_COSTS.uncommon;
            }
            attempts++;
        }

        if (card) cards.push(card);
    }

    return cards;
}

async function openTrendingPack() {
    const trending = await fetchTrendingArticles();
    const cards = [];
    const shuffled = trending.sort(() => Math.random() - 0.5).slice(0, 5);

    for (const article of shuffled) {
        const details = await fetchArticleDetails(article.article);
        if (details) {
            const card = await generateCard(details);
            if (card) cards.push(card);
        }
    }

    while (cards.length < 5) {
        const card = await generateCard();
        if (card) cards.push(card);
    }

    return cards;
}

// Premium Pack Opening Animation
function startPremiumPackAnimation(packType, isGolden) {
    // Start loading cards in background immediately
    let cardsPromise = openStandardPack(isGolden);
    let loadedCards = null;

    cardsPromise.then(cards => {
        loadedCards = cards;
        packState.cardsToReveal = cards;
    }).catch(err => {
        console.error('Error loading cards:', err);
        loadedCards = [];
    });

    // Create overlay IMMEDIATELY
    const overlay = document.createElement('div');
    overlay.className = 'pack-opening-overlay';
    overlay.id = 'premium-pack-overlay';

    // Particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    overlay.appendChild(particlesContainer);

    // Pack wrapper
    const packWrapper = document.createElement('div');
    packWrapper.className = 'pack-wrapper';

    // 3D Pack
    const pack3d = document.createElement('div');
    pack3d.className = 'pack-3d-premium pack-idle';

    const packFront = document.createElement('div');
    packFront.className = `pack-face-premium pack-front-premium ${packType}`;

    const packIcon = { standard: '📦', premium: '✨', trending: '🔥', golden: '👑' };
    const packName = { standard: 'Standard Pack', premium: 'Premium Pack', trending: 'Trending Pack', golden: '✨ GOLDEN PACK ✨' };

    packFront.innerHTML = `
        <div class="pack-shine"></div>
        <span class="pack-logo">${packIcon[packType] || '📦'}</span>
        <span class="pack-title">${packName[packType] || 'Pack'}</span>
    `;

    pack3d.appendChild(packFront);
    packWrapper.appendChild(pack3d);
    overlay.appendChild(packWrapper);

    // Instruction text
    const instruction = document.createElement('p');
    instruction.className = 'pack-instruction';
    instruction.textContent = 'Click the pack to open!';
    overlay.appendChild(instruction);

    document.body.appendChild(overlay);

    // Single click to open - instant feel!
    packWrapper.onclick = async () => {
        packWrapper.onclick = null; // Prevent double clicks

        // Quick shake animation
        pack3d.classList.remove('pack-idle');
        pack3d.classList.add('pack-shake');
        instruction.textContent = 'Opening...';

        // After brief shake, burst open
        setTimeout(async () => {
            pack3d.classList.remove('pack-shake');
            pack3d.classList.add('pack-burst');
            instruction.style.display = 'none';

            // Create burst particles
            createBurstParticles(particlesContainer, packType);

            setTimeout(async () => {
                packWrapper.style.display = 'none';

                // Wait for cards if not loaded yet
                if (!loadedCards) {
                    instruction.style.display = 'block';
                    instruction.textContent = 'Loading cards...';
                    try {
                        loadedCards = await cardsPromise;
                    } catch (e) {
                        loadedCards = [];
                    }
                    instruction.style.display = 'none';
                }

                startCardRevealSequence(overlay, loadedCards);
            }, 300);
        }, 200);
    };
}

function createBurstParticles(container, packType) {
    const colors = {
        standard: ['#3a7bd5', '#5a9bff', '#ffffff'],
        premium: ['#9b59b6', '#bb8fce', '#ffffff', '#ffd700'],
        trending: ['#e74c3c', '#f39c12', '#ffffff'],
        golden: ['#ffd700', '#ffed4a', '#ffffff', '#ffc107', '#ff9800']
    };

    const particleColors = colors[packType] || colors.standard;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        const angle = (Math.PI * 2 * i) / 50;
        const velocity = 100 + Math.random() * 200;
        const size = 4 + Math.random() * 8;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            box-shadow: 0 0 ${size}px ${color};
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        `;

        container.appendChild(particle);

        // Animate particle
        const duration = 800 + Math.random() * 400;
        particle.animate([
            {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(
                    calc(-50% + ${Math.cos(angle) * velocity}px),
                    calc(-50% + ${Math.sin(angle) * velocity}px)
                ) scale(0)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0, 0.5, 0.5, 1)',
            fill: 'forwards'
        });

        setTimeout(() => particle.remove(), duration);
    }
}

function startCardRevealSequence(overlay, cards) {
    // Clear and set up for card reveal
    const existingContent = overlay.querySelectorAll('.pack-wrapper, .particles-container');
    existingContent.forEach(el => el.remove());

    // Counter
    const counter = document.createElement('div');
    counter.className = 'reveal-counter';
    counter.textContent = `Card 1 of ${cards.length}`;
    overlay.appendChild(counter);

    // Cards stack area
    const cardsStack = document.createElement('div');
    cardsStack.className = 'cards-stack';
    overlay.appendChild(cardsStack);

    // Instruction
    const instruction = document.createElement('p');
    instruction.className = 'pack-instruction';
    instruction.textContent = 'Click to reveal card!';
    overlay.appendChild(instruction);

    packState.currentCardIndex = 0;
    showNextCard(overlay, cardsStack, counter, instruction, cards);
}

function showNextCard(overlay, cardsStack, counter, instruction, cards) {
    if (packState.currentCardIndex >= cards.length) {
        showFinalCardsDisplay(overlay, cards);
        return;
    }

    const card = cards[packState.currentCardIndex];
    counter.textContent = `Card ${packState.currentCardIndex + 1} of ${cards.length}`;

    // Clear previous card
    cardsStack.innerHTML = '';

    // Create 3D card
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-reveal-wrapper card-slide-in';

    const card3d = document.createElement('div');
    card3d.className = 'card-3d';

    // Back face
    const backFace = document.createElement('div');
    backFace.className = 'card-face card-back-face';
    backFace.innerHTML = `
        <div class="card-back-pattern">
            <span>?</span>
        </div>
    `;

    // Front face
    const frontFace = document.createElement('div');
    frontFace.className = 'card-face card-front-face';
    const cardEl = createCardElement(card, { clickable: false });
    frontFace.appendChild(cardEl);

    card3d.appendChild(backFace);
    card3d.appendChild(frontFace);
    cardWrapper.appendChild(card3d);
    cardsStack.appendChild(cardWrapper);

    // Click to flip
    cardWrapper.onclick = () => {
        if (card3d.classList.contains('flipped')) return;

        card3d.classList.add('flipped');
        cardWrapper.onclick = null;

        // Apply rarity effect after flip (reduced delays)
        setTimeout(() => {
            cardEl.classList.add(`reveal-${card.rarity}`);

            // Special effects for epic/legendary
            if (card.rarity === 'epic' || card.rarity === 'legendary') {
                const particlesContainer = overlay.querySelector('.particles-container') ||
                    (() => {
                        const pc = document.createElement('div');
                        pc.className = 'particles-container';
                        overlay.appendChild(pc);
                        return pc;
                    })();

                if (card.rarity === 'legendary') {
                    const flash = document.createElement('div');
                    flash.className = 'screen-flash';
                    document.body.appendChild(flash);
                    setTimeout(() => flash.remove(), 200);
                    createBurstParticles(particlesContainer, 'premium');
                } else {
                    createBurstParticles(particlesContainer, 'standard');
                }
            }

            // Add to collection
            gameState.cards.push(card);
            saveGameState();

            // Next card - immediate click available
            instruction.textContent = packState.currentCardIndex < cards.length - 1
                ? 'Click for next card!'
                : 'Click to finish!';

            // Allow immediate click for next card
            setTimeout(() => {
                cardWrapper.onclick = () => {
                    packState.currentCardIndex++;
                    showNextCard(overlay, cardsStack, counter, instruction, cards);
                };
            }, 200); // Reduced from 500
        }, 250); // Reduced from 400
    };
}

function showFinalCardsDisplay(overlay, cards) {
    overlay.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Cards Collected!';
    title.style.cssText = 'margin-bottom: 30px; font-size: 2rem; color: var(--gold);';
    overlay.appendChild(title);

    const finalDisplay = document.createElement('div');
    finalDisplay.className = 'final-cards-display';

    cards.forEach((card, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'final-card-wrapper';
        wrapper.style.setProperty('--delay', `${index * 0.1}s`);

        const cardEl = createCardElement(card, { clickable: false });
        wrapper.appendChild(cardEl);
        finalDisplay.appendChild(wrapper);
    });

    overlay.appendChild(finalDisplay);

    const collectBtn = document.createElement('button');
    collectBtn.className = 'menu-btn';
    collectBtn.textContent = 'Collect All';
    collectBtn.style.marginTop = '30px';
    collectBtn.onclick = () => {
        overlay.remove();
        packState.isOpening = false;
        packState.cardsToReveal = [];
        packState.currentCardIndex = 0;
        updateUI();
    };
    overlay.appendChild(collectBtn);
}

function closePackReveal() {
    const overlay = document.getElementById('premium-pack-overlay');
    if (overlay) overlay.remove();

    document.getElementById('cards-reveal').classList.add('hidden');
    packState.isOpening = false;
    updateUI();
}

// ==========================================
// Collection & Deck Building
// ==========================================

function filterCollection() {
    const rarityFilter = document.getElementById('rarity-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;

    let filteredCards = [...gameState.cards];

    // Filter by rarity
    if (rarityFilter !== 'all') {
        filteredCards = filteredCards.filter(c => c.rarity === rarityFilter);
    }

    // Sort
    switch (sortFilter) {
        case 'newest':
            filteredCards.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case 'rarity':
            const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
            filteredCards.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
            break;
        case 'attack':
            filteredCards.sort((a, b) => b.attack - a.attack);
            break;
        case 'defense':
            filteredCards.sort((a, b) => b.defense - a.defense);
            break;
        case 'knowledge':
            filteredCards.sort((a, b) => b.knowledge - a.knowledge);
            break;
    }

    renderCollection(filteredCards);
}

function renderCollection(cards = null) {
    const grid = document.getElementById('collection-grid');
    const cardsToRender = cards || gameState.cards;

    grid.innerHTML = '';

    if (cardsToRender.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No cards yet! Open some packs to start your collection.</p>';
        return;
    }

    cardsToRender.forEach(card => {
        grid.appendChild(createCardElement(card));
    });
}

function renderDeckBuilder() {
    const deckCards = document.getElementById('deck-cards');
    const availableGrid = document.getElementById('available-cards-grid');

    // Render current deck
    deckCards.innerHTML = '';
    gameState.deck.forEach(card => {
        const cardEl = createCardElement(card, { small: true, inDeck: true });
        deckCards.appendChild(cardEl);
    });

    // Update deck count
    document.getElementById('deck-count').textContent = gameState.deck.length;

    // Render available cards (not in deck)
    availableGrid.innerHTML = '';
    const deckIds = gameState.deck.map(c => c.id);
    const availableCards = gameState.cards.filter(c => !deckIds.includes(c.id));

    availableCards.forEach(card => {
        const cardEl = createCardElement(card, { small: true, inCollection: true });
        availableGrid.appendChild(cardEl);
    });
}

function addToDeck(card) {
    if (gameState.deck.length >= 20) {
        alert('Deck is full! (20 cards max)');
        return;
    }

    if (gameState.deck.find(c => c.id === card.id)) {
        alert('Card already in deck!');
        return;
    }

    gameState.deck.push(card);
    renderDeckBuilder();
    saveGameState();
}

function removeFromDeck(card) {
    gameState.deck = gameState.deck.filter(c => c.id !== card.id);
    renderDeckBuilder();
    saveGameState();
}

function saveDeck() {
    if (gameState.deck.length < 5) {
        alert('You need at least 5 cards in your deck!');
        return;
    }
    saveGameState();
    alert('Deck saved!');
}

// ==========================================
// Battle System (Enhanced)
// ==========================================

// Battle state
const battleState = {
    selectedAttacker: null,
    isAnimating: false,
    actionQueue: []
};

// AI opponent card names for variety
const AI_CARD_NAMES = [
    'Shadow Scholar', 'Data Phantom', 'Binary Beast', 'Logic Lord',
    'Syntax Specter', 'Algorithm Knight', 'Cache Crawler', 'Byte Bandit',
    'Protocol Paladin', 'Cipher Sentinel', 'Debug Dragon', 'Memory Mage'
];

function startBattle(mode) {
    if (gameState.deck.length < 5) {
        alert('You need at least 5 cards in your deck to battle!');
        showScreen('deck-builder');
        return;
    }

    // Initialize battle state
    gameState.currentBattle = {
        mode: mode,
        turn: 'player',
        turnNumber: 1,
        maxEnergy: 10
    };

    gameState.playerHealth = 30;
    gameState.opponentHealth = 30;
    gameState.playerEnergy = 1;
    gameState.opponentEnergy = 1;
    gameState.playerField = [];
    gameState.opponentField = [];

    // Create shuffled deck copy for drawing
    gameState.playerDeck = shuffleArray([...gameState.deck]);

    // Draw initial hands
    gameState.playerHand = gameState.playerDeck.splice(0, 4);
    gameState.opponentHand = generateOpponentHand(4);

    battleState.selectedAttacker = null;
    battleState.isAnimating = false;

    showScreen('battle-arena');
    renderBattle();

    // Show turn indicator
    showTurnIndicator('player');
    addBattleLog('⚔️ Battle started! Your turn.');
}

function generateOpponentHand(count) {
    const cards = [];
    const rarities = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare'];

    for (let i = 0; i < count; i++) {
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const name = AI_CARD_NAMES[Math.floor(Math.random() * AI_CARD_NAMES.length)];
        const bonus = RARITY_STAT_BONUSES[rarity] || RARITY_STAT_BONUSES.common;

        // Generate stats based on rarity (same system as player cards)
        const attack = bonus.minAttack + Math.floor(Math.random() * (bonus.maxAttack - bonus.minAttack + 1));
        const defense = Math.floor(bonus.defense * 0.8) + Math.floor(Math.random() * 3) + 1;
        const knowledge = Math.floor(bonus.knowledge * 0.8) + Math.floor(Math.random() * 2) + 1;

        cards.push({
            id: 'opp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            name: name,
            attack: attack,
            defense: defense,
            knowledge: knowledge,
            cost: ENERGY_COSTS[rarity],
            rarity: rarity,
            ability: { name: 'AI Protocol', effect: 'Standard combat', type: 'default' }
        });
    }

    return cards;
}

function showTurnIndicator(turn) {
    const existing = document.querySelector('.turn-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = `turn-indicator ${turn}-turn`;
    indicator.textContent = turn === 'player' ? 'Your Turn' : 'Enemy Turn';
    document.body.appendChild(indicator);

    setTimeout(() => indicator.remove(), 1500);
}

function renderBattle() {
    // Update health bars with animation
    updateHealthBar('player', gameState.playerHealth, 30);
    updateHealthBar('opponent', gameState.opponentHealth, 30);

    // Update energy display
    renderEnergyDisplay('player', gameState.playerEnergy, gameState.currentBattle.maxEnergy);
    renderEnergyDisplay('opponent', gameState.opponentEnergy, gameState.currentBattle.maxEnergy);

    // Render player hand
    renderPlayerHand();

    // Render opponent hand (face down)
    renderOpponentHand();

    // Render fields
    renderField('player');
    renderField('opponent');

    // Update end turn button state
    updateEndTurnButton();

    // Update phase indicator and action hint
    updateBattlePhase();
}

function updateBattlePhase() {
    const phaseIndicator = document.getElementById('phase-indicator');
    const phaseText = document.getElementById('phase-text');
    const hintText = document.getElementById('hint-text');

    if (!phaseIndicator || !phaseText || !hintText) return;

    if (gameState.currentBattle.turn === 'player') {
        phaseIndicator.classList.remove('opponent-phase');
        phaseText.textContent = '🎮 Your Turn';

        // Dynamic hints based on game state
        const canPlayCards = gameState.playerHand.some(c => c.cost <= gameState.playerEnergy);
        const canAttack = gameState.playerField.some(c => c.canAttack && !c.hasAttacked);
        const hasFieldCards = gameState.playerField.length > 0;

        if (battleState.selectedAttacker) {
            if (gameState.opponentField.length > 0) {
                hintText.textContent = '🎯 Click an enemy card to attack it!';
            } else {
                hintText.textContent = '🎯 Click the enemy field to attack directly!';
            }
        } else if (canAttack && hasFieldCards) {
            hintText.textContent = '⚔️ Click your glowing cards to attack, or play more cards';
        } else if (canPlayCards) {
            hintText.textContent = '🃏 Click cards in your hand to play them';
        } else if (hasFieldCards) {
            hintText.textContent = '⏭️ Your cards are resting. Click End Turn to continue';
        } else {
            hintText.textContent = '⚡ Not enough energy. Click End Turn';
        }
    } else {
        phaseIndicator.classList.add('opponent-phase');
        phaseText.textContent = '🤖 Enemy Turn';
        hintText.textContent = '⏳ Wait for opponent to finish...';
    }
}

function toggleBattleHelp() {
    const helpPanel = document.getElementById('battle-help');
    if (helpPanel) {
        helpPanel.classList.toggle('visible');
    }
}

function renderEnergyDisplay(player, current, max) {
    const container = document.getElementById(`${player}-energy`);
    if (container) {
        container.textContent = `${current}/${max}`;
    }
}

function renderPlayerHand() {
    const playerHandEl = document.getElementById('player-hand');
    playerHandEl.innerHTML = '';

    gameState.playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card, { small: true, inHand: true });

        // Add playable indicator
        if (gameState.currentBattle.turn === 'player' && gameState.playerEnergy >= card.cost) {
            cardEl.classList.add('playable');
            cardEl.title = 'Click to play this card';
        } else if (gameState.playerEnergy < card.cost) {
            cardEl.style.filter = 'brightness(0.7)';
            cardEl.title = `Need ${card.cost} energy (have ${gameState.playerEnergy})`;
        }

        cardEl.style.animationDelay = `${index * 0.05}s`;
        playerHandEl.appendChild(cardEl);
    });
}

function renderOpponentHand() {
    const oppHandEl = document.getElementById('opponent-hand');
    oppHandEl.innerHTML = '';

    gameState.opponentHand.forEach((_, index) => {
        const cardBack = document.createElement('div');
        cardBack.className = 'card opponent-card-back';
        cardBack.innerHTML = '<div class="card-back-design">?</div>';
        cardBack.style.animationDelay = `${index * 0.05}s`;
        oppHandEl.appendChild(cardBack);
    });
}

function renderField(player) {
    const field = document.getElementById(`${player}-field`);
    const cards = player === 'player' ? gameState.playerField : gameState.opponentField;

    field.innerHTML = '';
    field.className = `card-field ${player}-field`;

    cards.forEach(card => {
        const cardEl = createBattleCard(card, player);
        field.appendChild(cardEl);
    });

    // Add direct attack target if applicable
    if (player === 'opponent' && battleState.selectedAttacker && gameState.opponentField.length === 0) {
        field.classList.add('targetable');
        field.onclick = () => executeDirectAttack(battleState.selectedAttacker);
    } else {
        field.classList.remove('targetable');
        field.onclick = null;
    }
}

function createBattleCard(card, owner) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity} battle-card`;
    cardEl.dataset.cardId = card.id;

    // Selected attacker styling
    if (battleState.selectedAttacker && battleState.selectedAttacker.id === card.id) {
        cardEl.classList.add('selected-attacker');
    }

    // Can attack styling
    if (card.canAttack && !card.hasAttacked && owner === 'player' && gameState.currentBattle.turn === 'player') {
        cardEl.classList.add('can-attack');
    }

    // Has attacked styling
    if (card.hasAttacked) {
        cardEl.classList.add('exhausted');
        cardEl.style.filter = 'brightness(0.6) grayscale(30%)';
    }

    // Valid target styling
    if (battleState.selectedAttacker && owner === 'opponent') {
        cardEl.classList.add('valid-target');
    }

    const imageStyle = card.image
        ? `background-image: url('${card.image}'); background-size: cover; background-position: center;`
        : `background: linear-gradient(135deg, ${RARITY_THRESHOLDS[card.rarity].color}40, #1a1a2e);`;

    cardEl.innerHTML = `
        <div class="card-inner">
            <div class="card-image" style="${imageStyle}"></div>
            <span class="card-cost">${card.cost}</span>
            <div class="card-content">
                <div class="card-name">${card.name}</div>
                <div class="card-stats">
                    <span class="stat">⚔️ ${card.attack}</span>
                    <span class="stat">🛡️ ${card.currentHealth}/${card.defense}</span>
                </div>
            </div>
            <div class="card-health">${card.currentHealth}</div>
        </div>
    `;

    // Click handlers
    if (owner === 'player' && gameState.currentBattle.turn === 'player') {
        cardEl.onclick = () => handlePlayerFieldCardClick(card);
    } else if (owner === 'opponent' && battleState.selectedAttacker) {
        cardEl.onclick = () => executeAttack(battleState.selectedAttacker, card);
    }

    return cardEl;
}

function handlePlayerFieldCardClick(card) {
    if (battleState.isAnimating) return;

    if (!card.canAttack || card.hasAttacked) {
        addBattleLog(`${card.name} cannot attack right now.`);
        return;
    }

    // Toggle selection
    if (battleState.selectedAttacker && battleState.selectedAttacker.id === card.id) {
        battleState.selectedAttacker = null;
        addBattleLog('Attack cancelled.');
    } else {
        battleState.selectedAttacker = card;

        if (gameState.opponentField.length > 0) {
            addBattleLog(`🎯 ${card.name} selected! Click an enemy card to attack.`);
        } else {
            addBattleLog(`🎯 ${card.name} selected! Click enemy area to attack directly!`);
        }
    }

    renderBattle();
}

function updateHealthBar(player, current, max) {
    const bar = document.getElementById(`${player}-health-bar`);
    const text = document.getElementById(`${player}-health`);

    const percentage = Math.max(0, (current / max) * 100);
    bar.style.width = `${percentage}%`;

    // Color based on health
    if (percentage <= 25) {
        bar.style.background = 'linear-gradient(90deg, #ff0000, #cc0000)';
    } else if (percentage <= 50) {
        bar.style.background = 'linear-gradient(90deg, #ff6600, #cc5500)';
    } else {
        bar.style.background = 'linear-gradient(90deg, var(--health), #c0392b)';
    }

    text.textContent = Math.max(0, current);
}

function updateEndTurnButton() {
    const btn = document.getElementById('end-turn-btn');
    if (gameState.currentBattle.turn === 'player' && !battleState.isAnimating) {
        btn.disabled = false;
        btn.classList.add('active');
    } else {
        btn.disabled = true;
        btn.classList.remove('active');
    }
}

// Card Playing
function playCard(card) {
    if (battleState.isAnimating) return;

    if (gameState.currentBattle.turn !== 'player') {
        addBattleLog('⏳ Wait for your turn!');
        return;
    }

    if (gameState.playerEnergy < card.cost) {
        addBattleLog(`⚡ Not enough energy! Need ${card.cost}, have ${gameState.playerEnergy}`);
        return;
    }

    if (gameState.playerField.length >= 4) {
        addBattleLog('📋 Field is full! (4 cards max)');
        return;
    }

    battleState.isAnimating = true;

    // Deduct energy and remove from hand
    gameState.playerEnergy -= card.cost;
    gameState.playerHand = gameState.playerHand.filter(c => c.id !== card.id);

    // Create field card (can't attack on play turn)
    const fieldCard = {
        ...card,
        canAttack: false,
        hasAttacked: false,
        currentHealth: card.defense
    };
    gameState.playerField.push(fieldCard);

    addBattleLog(`📤 You played ${card.name}!`);

    // Play animation
    renderBattle();

    setTimeout(() => {
        applyPlayEffect(fieldCard);
        battleState.isAnimating = false;
        renderBattle();
    }, 300);
}

function applyPlayEffect(card) {
    switch (card.ability?.type) {
        case 'history':
            if (gameState.opponentField.length > 0) {
                const target = gameState.opponentField[0];
                dealDamage(target, 3, 'opponent');
                addBattleLog(`⚡ Historical Impact deals 3 damage to ${target.name}!`);
            }
            break;
        case 'technology':
            gameState.playerField.forEach(c => {
                c.attack += 1;
                c.currentHealth += 1;
                c.defense += 1;
            });
            addBattleLog('🔧 Tech Boost: All cards gain +1/+1!');
            break;
        case 'art':
            drawCard('player');
            addBattleLog('🎨 Creative Inspiration: Drew a card!');
            break;
        case 'science':
            gameState.playerEnergy = Math.min(gameState.currentBattle.maxEnergy, gameState.playerEnergy + 2);
            addBattleLog('🔬 Scientific Breakthrough: +2 Energy!');
            break;
        case 'animal':
            card.currentHealth += 2;
            card.defense += 2;
            addBattleLog(`🦁 Natural Defense: ${card.name} gains +2 defense!`);
            break;
    }
}

// Combat System
function executeAttack(attacker, defender) {
    if (battleState.isAnimating) return;
    if (!attacker || !defender) return;

    battleState.isAnimating = true;
    battleState.selectedAttacker = null;

    // Calculate damage
    let damage = attacker.attack;

    // Ability modifiers
    if (attacker.ability?.type === 'sport') {
        damage += 2;
        addBattleLog('💪 Athletic Power: +2 attack!');
    }
    if (defender.ability?.type === 'animal') {
        damage = Math.max(1, damage - 2);
        addBattleLog('🛡️ Natural Defense reduces damage!');
    }

    // Visual attack animation
    const attackerEl = document.querySelector(`[data-card-id="${attacker.id}"]`);
    const defenderEl = document.querySelector(`[data-card-id="${defender.id}"]`);

    if (attackerEl) attackerEl.classList.add('card-attacking');

    setTimeout(() => {
        if (defenderEl) defenderEl.classList.add('card-attacked');

        // Deal damage
        dealDamage(defender, damage, 'opponent');
        showDamageNumber(defenderEl, damage);

        addBattleLog(`⚔️ ${attacker.name} attacks ${defender.name} for ${damage} damage!`);

        // Counter attack (50% of defender's attack)
        const counterDamage = Math.floor(defender.attack / 2);
        if (counterDamage > 0 && defender.currentHealth > 0) {
            dealDamage(attacker, counterDamage, 'player');
            showDamageNumber(attackerEl, counterDamage);
            addBattleLog(`↩️ ${defender.name} counters for ${counterDamage}!`);
        }

        attacker.hasAttacked = true;
        attacker.canAttack = false;

        setTimeout(() => {
            attackerEl?.classList.remove('card-attacking');
            defenderEl?.classList.remove('card-attacked');

            checkAndRemoveDeadCards();
            battleState.isAnimating = false;
            renderBattle();
        }, 400);
    }, 300);
}

function executeDirectAttack(attacker) {
    if (battleState.isAnimating) return;
    if (!attacker || gameState.opponentField.length > 0) return;

    battleState.isAnimating = true;
    battleState.selectedAttacker = null;

    const damage = attacker.attack;

    const attackerEl = document.querySelector(`[data-card-id="${attacker.id}"]`);
    if (attackerEl) attackerEl.classList.add('card-attacking');

    setTimeout(() => {
        gameState.opponentHealth -= damage;
        addBattleLog(`💥 ${attacker.name} attacks opponent directly for ${damage} damage!`);

        attacker.hasAttacked = true;
        attacker.canAttack = false;

        if (gameState.opponentHealth <= 0) {
            setTimeout(() => endBattle(true), 500);
        }

        setTimeout(() => {
            attackerEl?.classList.remove('card-attacking');
            battleState.isAnimating = false;
            renderBattle();
        }, 400);
    }, 300);
}

function dealDamage(card, amount, owner) {
    card.currentHealth -= amount;

    // Update health display
    const cardEl = document.querySelector(`[data-card-id="${card.id}"] .card-health`);
    if (cardEl) {
        cardEl.textContent = card.currentHealth;
        cardEl.classList.add('damaged');
        setTimeout(() => cardEl.classList.remove('damaged'), 300);
    }
}

function showDamageNumber(element, damage) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number';
    damageEl.textContent = `-${damage}`;
    damageEl.style.left = `${rect.left + rect.width / 2}px`;
    damageEl.style.top = `${rect.top + rect.height / 3}px`;

    document.body.appendChild(damageEl);
    setTimeout(() => damageEl.remove(), 1000);
}

function checkAndRemoveDeadCards() {
    // Check player field
    gameState.playerField = gameState.playerField.filter(card => {
        if (card.currentHealth <= 0) {
            addBattleLog(`💀 ${card.name} was destroyed!`);
            animateCardDestruction(card.id);
            return false;
        }
        return true;
    });

    // Check opponent field
    gameState.opponentField = gameState.opponentField.filter(card => {
        if (card.currentHealth <= 0) {
            addBattleLog(`💀 ${card.name} was destroyed!`);
            animateCardDestruction(card.id);
            return false;
        }
        return true;
    });
}

function animateCardDestruction(cardId) {
    const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
    if (cardEl) {
        cardEl.classList.add('card-destroying');
    }
}

function drawCard(player) {
    if (player === 'player') {
        if (gameState.playerDeck.length > 0 && gameState.playerHand.length < 8) {
            const newCard = gameState.playerDeck.shift();
            gameState.playerHand.push(newCard);
            return newCard;
        }
    }
    return null;
}

// Turn Management
function endTurn() {
    if (gameState.currentBattle.turn !== 'player' || battleState.isAnimating) return;

    battleState.selectedAttacker = null;
    gameState.currentBattle.turn = 'opponent';

    addBattleLog("⏰ Ending your turn...");

    renderBattle();
    showTurnIndicator('opponent');

    setTimeout(() => {
        executeOpponentTurn();
    }, 1500);
}

function executeOpponentTurn() {
    gameState.currentBattle.turnNumber++;
    gameState.opponentEnergy = Math.min(gameState.currentBattle.maxEnergy, Math.floor(gameState.currentBattle.turnNumber / 2) + 1);

    addBattleLog(`🤖 Opponent's turn! Energy: ${gameState.opponentEnergy}`);

    // Draw a card
    if (gameState.opponentHand.length < 6) {
        gameState.opponentHand.push(...generateOpponentHand(1));
    }

    renderBattle();

    // AI plays cards
    setTimeout(() => aiPlayCards(), 800);
}

function aiPlayCards() {
    // Sort by cost (play cheaper cards first to maximize plays)
    const playableCards = gameState.opponentHand
        .filter(c => c.cost <= gameState.opponentEnergy)
        .sort((a, b) => a.cost - b.cost);

    let cardsPlayed = 0;

    const playNext = () => {
        if (cardsPlayed >= playableCards.length || gameState.opponentField.length >= 4) {
            setTimeout(() => aiAttackPhase(), 600);
            return;
        }

        const card = playableCards[cardsPlayed];

        if (gameState.opponentEnergy >= card.cost) {
            gameState.opponentEnergy -= card.cost;
            gameState.opponentHand = gameState.opponentHand.filter(c => c.id !== card.id);

            const fieldCard = {
                ...card,
                canAttack: true,
                hasAttacked: false,
                currentHealth: card.defense
            };
            gameState.opponentField.push(fieldCard);

            addBattleLog(`🤖 Opponent played ${card.name}!`);
            renderBattle();

            cardsPlayed++;
            setTimeout(playNext, 500);
        } else {
            cardsPlayed++;
            playNext();
        }
    };

    playNext();
}

function aiAttackPhase() {
    const attackers = gameState.opponentField.filter(c => c.canAttack && !c.hasAttacked);

    if (attackers.length === 0) {
        setTimeout(() => endOpponentTurn(), 500);
        return;
    }

    let attackIndex = 0;

    const executeNextAttack = () => {
        if (attackIndex >= attackers.length) {
            setTimeout(() => endOpponentTurn(), 500);
            return;
        }

        const attacker = attackers[attackIndex];

        if (gameState.playerField.length > 0) {
            // Target weakest player card
            const target = [...gameState.playerField].sort((a, b) => a.currentHealth - b.currentHealth)[0];

            // Visual feedback
            const attackerEl = document.querySelector(`[data-card-id="${attacker.id}"]`);
            const defenderEl = document.querySelector(`[data-card-id="${target.id}"]`);

            if (attackerEl) attackerEl.classList.add('card-attacking');

            setTimeout(() => {
                if (defenderEl) defenderEl.classList.add('card-attacked');

                const damage = attacker.attack;
                dealDamage(target, damage, 'player');
                showDamageNumber(defenderEl, damage);

                const counterDamage = Math.floor(target.attack / 2);
                dealDamage(attacker, counterDamage, 'opponent');

                addBattleLog(`🤖 ${attacker.name} attacks ${target.name} for ${damage}!`);

                attacker.hasAttacked = true;
                attacker.canAttack = false;

                setTimeout(() => {
                    attackerEl?.classList.remove('card-attacking');
                    defenderEl?.classList.remove('card-attacked');
                    checkAndRemoveDeadCards();
                    renderBattle();

                    attackIndex++;
                    setTimeout(executeNextAttack, 400);
                }, 400);
            }, 300);
        } else {
            // Direct attack
            const damage = attacker.attack;
            gameState.playerHealth -= damage;
            addBattleLog(`🤖 ${attacker.name} attacks you directly for ${damage}!`);

            attacker.hasAttacked = true;
            attacker.canAttack = false;

            if (gameState.playerHealth <= 0) {
                setTimeout(() => endBattle(false), 500);
                return;
            }

            renderBattle();
            attackIndex++;
            setTimeout(executeNextAttack, 500);
        }
    };

    executeNextAttack();
}

function endOpponentTurn() {
    // Reset opponent cards for next turn
    gameState.opponentField.forEach(c => {
        c.canAttack = true;
        c.hasAttacked = false;
    });

    startPlayerTurn();
}

function startPlayerTurn() {
    gameState.currentBattle.turn = 'player';
    gameState.currentBattle.turnNumber++;
    gameState.playerEnergy = Math.min(gameState.currentBattle.maxEnergy, Math.floor(gameState.currentBattle.turnNumber / 2) + 1);

    // Enable attacks for player cards
    gameState.playerField.forEach(c => {
        c.canAttack = true;
        c.hasAttacked = false;
    });

    // Draw a card
    const drawnCard = drawCard('player');
    if (drawnCard) {
        addBattleLog(`📥 You drew ${drawnCard.name}!`);
    }

    addBattleLog(`✨ Your turn! Energy: ${gameState.playerEnergy}`);

    showTurnIndicator('player');
    renderBattle();
}

function endBattle(victory) {
    gameState.currentBattle = null;

    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    const rewards = document.getElementById('result-rewards');

    if (victory) {
        gameState.battlesWon++; // Track victories
        title.textContent = '🎉 Victory!';
        title.style.color = '#4caf50';
        message.textContent = 'You defeated your opponent!';

        const ticketReward = 1 + Math.floor(Math.random() * 2); // 1-2 tickets
        gameState.tickets += ticketReward;
        rewards.innerHTML = `<p>🎟️ +${ticketReward} Pack Ticket${ticketReward > 1 ? 's' : ''}!</p><p class="reward-hint">Use tickets to skip video ads</p>`;
    } else {
        title.textContent = '💀 Defeat';
        title.style.color = '#e74c3c';
        message.textContent = 'You were defeated...';
        rewards.innerHTML = '<p>Better luck next time!</p>';
    }

    saveGameState();
    checkAchievements(); // Check for new achievements
    modal.classList.remove('hidden');
}

function forfeitBattle() {
    if (confirm('Are you sure you want to forfeit?')) {
        endBattle(false);
    }
}

function closeResultModal() {
    document.getElementById('result-modal').classList.add('hidden');
    showScreen('main-menu');
}

function addBattleLog(message) {
    const log = document.getElementById('battle-log');
    if (log) {
        log.innerHTML = `<p>${message}</p>` + log.innerHTML;
        log.scrollTop = 0;
    }
}

// ==========================================
// Boss Battles
// ==========================================

function initializeBosses() {
    const bossGrid = document.getElementById('boss-list');
    if (!bossGrid) return;

    bossGrid.innerHTML = '';

    BOSS_ARTICLES.forEach((boss, index) => {
        const bossCard = document.createElement('div');
        bossCard.className = 'boss-card';
        bossCard.innerHTML = `
            <h3>👹 ${boss.name}</h3>
            <p>${boss.description}</p>
            <div class="boss-stats">
                <span>❤️ ???</span>
                <span>⚔️ ???</span>
            </div>
            <p style="margin-top: 10px; color: var(--legendary);">Click to challenge!</p>
        `;
        bossCard.onclick = () => startBossBattle(boss);
        bossGrid.appendChild(bossCard);
    });
}

async function startBossBattle(boss) {
    if (gameState.deck.length < 5) {
        alert('You need at least 5 cards in your deck!');
        return;
    }

    showLoading('Loading boss data...');

    try {
        const details = await fetchArticleDetails(boss.title);

        if (!details) {
            hideLoading();
            alert('Failed to load boss data. Try again!');
            return;
        }

        const bossCard = {
            name: boss.name,
            description: details.extract?.substring(0, 200) || boss.description,
            image: details.image,
            articleLength: details.length,
            health: Math.floor(details.length / 500) + 50, // Boss HP scales with article length
            attack: Math.floor(Math.log10(details.length) * 5),
            defense: Math.floor((details.categories || 5) * 2),
            currentHealth: 0
        };

        bossCard.currentHealth = bossCard.health;

        gameState.bossBattle = {
            boss: bossCard,
            playerHealth: 30,
            playerEnergy: 1,
            turn: 1,
            playerHand: shuffleArray([...gameState.deck]).slice(0, 5),
            playerField: []
        };

        hideLoading();
        showScreen('boss-battle');
        renderBossBattle();

    } catch (error) {
        hideLoading();
        alert('Error loading boss. Please try again.');
        console.error(error);
    }
}

function renderBossBattle() {
    const boss = gameState.bossBattle.boss;

    // Render boss card
    const bossDisplay = document.getElementById('boss-card-display');
    const imageStyle = boss.image
        ? `background-image: url('${boss.image}'); background-size: cover;`
        : '';

    bossDisplay.innerHTML = `
        <div class="boss-image" style="height: 200px; ${imageStyle}"></div>
        <div class="boss-info" style="padding: 20px;">
            <h2>${boss.name}</h2>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">${boss.description}</p>
            <div class="boss-card-stats" style="display: flex; gap: 15px; margin-top: 10px;">
                <span>⚔️ ${boss.attack}</span>
                <span>🛡️ ${boss.defense}</span>
            </div>
        </div>
    `;

    // Update boss health
    const healthPercent = (boss.currentHealth / boss.health) * 100;
    document.getElementById('boss-health-fill').style.width = `${healthPercent}%`;
    document.getElementById('boss-health-text').textContent = `${boss.currentHealth}/${boss.health}`;

    // Boss ability text
    document.getElementById('boss-ability-text').textContent =
        `"The weight of ${boss.articleLength.toLocaleString()} characters of knowledge crushes all who oppose!"`;

    // Player stats
    document.getElementById('boss-player-health').textContent = gameState.bossBattle.playerHealth;
    document.getElementById('boss-player-energy').textContent = gameState.bossBattle.playerEnergy;

    const playerHealthPercent = (gameState.bossBattle.playerHealth / 30) * 100;
    document.getElementById('boss-player-health-bar').style.width = `${playerHealthPercent}%`;

    // Player hand
    const handEl = document.getElementById('boss-player-hand');
    handEl.innerHTML = '';

    gameState.bossBattle.playerHand.forEach(card => {
        const cardEl = createCardElement(card, { small: true });
        cardEl.onclick = () => playBossCard(card);
        handEl.appendChild(cardEl);
    });
}

function playBossCard(card) {
    if (gameState.bossBattle.playerEnergy < card.cost) {
        alert('Not enough energy!');
        return;
    }

    gameState.bossBattle.playerEnergy -= card.cost;
    gameState.bossBattle.playerHand = gameState.bossBattle.playerHand.filter(c => c.id !== card.id);

    // Deal damage to boss
    let damage = card.attack + card.knowledge;

    // Apply ability bonuses
    if (card.ability?.type === 'science') {
        damage += 3;
    }

    gameState.bossBattle.boss.currentHealth -= damage;

    // Check if boss defeated
    if (gameState.bossBattle.boss.currentHealth <= 0) {
        endBossBattle(true);
        return;
    }

    renderBossBattle();
}

function bossTurn() {
    const boss = gameState.bossBattle.boss;

    // Boss attacks
    const damage = boss.attack;
    gameState.bossBattle.playerHealth -= damage;

    if (gameState.bossBattle.playerHealth <= 0) {
        endBossBattle(false);
        return;
    }

    // Next turn
    gameState.bossBattle.turn++;
    gameState.bossBattle.playerEnergy = Math.min(10, gameState.bossBattle.turn);

    // Draw cards
    const remainingDeck = gameState.deck.filter(c =>
        !gameState.bossBattle.playerHand.find(h => h.id === c.id)
    );

    if (remainingDeck.length > 0 && gameState.bossBattle.playerHand.length < 6) {
        const newCard = remainingDeck[Math.floor(Math.random() * remainingDeck.length)];
        gameState.bossBattle.playerHand.push(newCard);
    }

    renderBossBattle();
}

function endBossBattle(victory) {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    const rewards = document.getElementById('result-rewards');

    if (victory) {
        gameState.battlesWon++; // Track victories
        title.textContent = '👑 Boss Defeated!';
        title.style.color = '#ff9800';
        message.textContent = `You conquered ${gameState.bossBattle.boss.name}!`;

        const ticketReward = 3 + Math.floor(Math.random() * 3); // 3-5 tickets
        gameState.tickets += ticketReward;
        rewards.innerHTML = `<p>🎟️ +${ticketReward} Pack Tickets!</p><p>🏆 Boss Trophy Unlocked!</p>`;
    } else {
        title.textContent = '💀 Defeated by the Boss';
        title.style.color = '#e74c3c';
        message.textContent = 'The knowledge was too overwhelming...';
        rewards.innerHTML = '<p>Train harder and try again!</p>';
    }

    gameState.bossBattle = null;
    saveGameState();
    checkAchievements(); // Check for new achievements
    modal.classList.remove('hidden');
}

function forfeitBoss() {
    if (confirm('Retreat from the boss battle?')) {
        gameState.bossBattle = null;
        showScreen('boss-select');
    }
}

// ==========================================
// UI & Navigation
// ==========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Screen-specific initialization
    switch (screenId) {
        case 'collection':
            renderCollection();
            break;
        case 'deck-builder':
            renderDeckBuilder();
            break;
        case 'boss-select':
            initializeBosses();
            break;
    }

    updateUI();
}

function updateUI() {
    // Update tickets displays
    const ticketsDisplay = document.getElementById('tickets-display');
    const packTickets = document.getElementById('pack-tickets');

    if (ticketsDisplay) ticketsDisplay.textContent = gameState.tickets;
    if (packTickets) packTickets.textContent = gameState.tickets;

    // Update cards count
    document.getElementById('cards-count').textContent = gameState.cards.length;

    // Update golden pack progress
    updateGoldenPackProgress();
}

function showLoading(text = 'Loading...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// ==========================================
// Data Persistence
// ==========================================

function saveGameState() {
    const saveData = {
        tickets: gameState.tickets,
        packsOpened: gameState.packsOpened,
        totalPacksOpened: gameState.totalPacksOpened,
        battlesWon: gameState.battlesWon,
        cards: gameState.cards,
        deck: gameState.deck,
        achievements: gameState.achievements
    };

    localStorage.setItem('wikicards_save', JSON.stringify(saveData));
}

function loadGameState() {
    const saved = localStorage.getItem('wikicards_save');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            // If old save with 0 tickets and no packsOpened, give them 10 tickets
            if (data.packsOpened === undefined && (data.tickets === 0 || data.tickets === undefined)) {
                gameState.tickets = 10;
            } else {
                gameState.tickets = data.tickets !== undefined ? data.tickets : 10;
            }
            gameState.packsOpened = data.packsOpened || 0;
            gameState.totalPacksOpened = data.totalPacksOpened || data.packsOpened || 0;
            gameState.battlesWon = data.battlesWon || 0;
            gameState.cards = data.cards || [];
            gameState.deck = data.deck || [];
            gameState.achievements = data.achievements || {
                firstWin: false,
                collector: false,
                goldenTouch: false,
                wikiScholar: false
            };
        } catch (e) {
            console.error('Failed to load save data:', e);
            // On error, use defaults with 10 tickets
            gameState.tickets = 10;
        }
    }
    // If no saved data, keep the default 10 tickets

    // Update golden pack progress on load
    updateGoldenPackProgress();

    // Update achievements display
    updateAchievementsDisplay();
}

// ==========================================
// Utility Functions
// ==========================================

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ==========================================
// Event Listeners for Attack
// ==========================================

document.addEventListener('click', (e) => {
    // Check if clicking on opponent area to attack directly
    if (battleState.selectedAttacker && e.target.closest('#opponent-field') && gameState.opponentField.length === 0) {
        executeDirectAttack(battleState.selectedAttacker);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        document.getElementById('result-modal').classList.add('hidden');
        closeCheatMenu();
    }
});

// ==========================================
// CHEAT MENU SYSTEM (type "1234" to open)
// ==========================================

let cheatSequence = '';
const CHEAT_CODE = '1234';

document.addEventListener('keydown', (e) => {
    // Only track number keys
    if (e.key >= '0' && e.key <= '9') {
        cheatSequence += e.key;

        // Keep only last 4 characters
        if (cheatSequence.length > 4) {
            cheatSequence = cheatSequence.slice(-4);
        }

        // Check if cheat code entered
        if (cheatSequence === CHEAT_CODE) {
            cheatSequence = '';
            toggleCheatMenu();
        }
    }
});

function toggleCheatMenu() {
    let menu = document.getElementById('cheat-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    } else {
        createCheatMenu();
    }
}

function closeCheatMenu() {
    const menu = document.getElementById('cheat-menu');
    if (menu) menu.classList.add('hidden');
}

function createCheatMenu() {
    const menu = document.createElement('div');
    menu.id = 'cheat-menu';
    menu.innerHTML = `
        <div class="cheat-menu-content">
            <h2>🎮 Cheat Menu</h2>
            <p class="cheat-hint">Press ESC or 1234 to close</p>

            <div class="cheat-section">
                <h3>💰 Resources</h3>
                <button onclick="cheatAddTickets(10)">+10 Tickets</button>
                <button onclick="cheatAddTickets(100)">+100 Tickets</button>
                <button onclick="cheatAddTickets(1000)">+1000 Tickets</button>
            </div>

            <div class="cheat-section">
                <h3>🃏 Cards</h3>
                <button onclick="cheatAddRandomCards(5)">+5 Random Cards</button>
                <button onclick="cheatAddRandomCards(20)">+20 Random Cards</button>
                <button onclick="cheatGuaranteedLegendary()">Spawn Legendary</button>
                <button onclick="cheatClearCards()">Clear All Cards</button>
            </div>

            <div class="cheat-section">
                <h3>📦 Packs</h3>
                <button onclick="cheatForceGoldenPack()">Force Golden Pack</button>
                <button onclick="cheatResetPackCounter()">Reset Pack Counter</button>
            </div>

            <div class="cheat-section">
                <h3>🏆 Progress</h3>
                <button onclick="cheatUnlockAllAchievements()">Unlock All Achievements</button>
                <button onclick="cheatAddBattleWins(10)">+10 Battle Wins</button>
                <button onclick="cheatResetProgress()">⚠️ Reset All Progress</button>
            </div>

            <div class="cheat-section">
                <h3>⚔️ Battle</h3>
                <button onclick="cheatWinBattle()">Instant Win</button>
                <button onclick="cheatKillOpponent()">Kill Opponent</button>
                <button onclick="cheatFullEnergy()">Max Energy</button>
            </div>
        </div>
    `;

    menu.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: auto;
    `;

    document.body.appendChild(menu);

    // Add styles for cheat menu
    if (!document.getElementById('cheat-styles')) {
        const styles = document.createElement('style');
        styles.id = 'cheat-styles';
        styles.textContent = `
            .cheat-menu-content {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 3px solid #ff0066;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 0 50px rgba(255, 0, 102, 0.5);
            }
            .cheat-menu-content h2 {
                color: #ff0066;
                text-align: center;
                font-size: 2rem;
                margin-bottom: 5px;
                text-shadow: 0 0 10px rgba(255, 0, 102, 0.8);
            }
            .cheat-hint {
                text-align: center;
                color: #888;
                font-size: 0.8rem;
                margin-bottom: 20px;
            }
            .cheat-section {
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }
            .cheat-section h3 {
                color: #fff;
                margin-bottom: 10px;
                font-size: 1rem;
            }
            .cheat-section button {
                background: linear-gradient(135deg, #ff0066, #ff6600);
                border: none;
                color: white;
                padding: 10px 15px;
                margin: 5px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }
            .cheat-section button:hover {
                transform: scale(1.05);
                box-shadow: 0 0 15px rgba(255, 0, 102, 0.7);
            }
            .cheat-section button:active {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(styles);
    }
}

// Cheat Functions
function cheatAddTickets(amount) {
    gameState.tickets += amount;
    saveGameState();
    updateUI();
    showNotification(`🎟️ +${amount} Tickets!`);
}

function cheatAddRandomCards(count) {
    showNotification(`⏳ Generating ${count} cards...`);
    let added = 0;

    const addNext = async () => {
        if (added < count) {
            const card = await generateCard();
            if (card) {
                gameState.cards.push(card);
                added++;
            }
            setTimeout(addNext, 100);
        } else {
            saveGameState();
            updateUI();
            showNotification(`🃏 Added ${added} cards!`);
            checkAchievements();
        }
    };
    addNext();
}

async function cheatGuaranteedLegendary() {
    showNotification('⏳ Creating Legendary...');
    const card = await generateCard();
    if (card) {
        card.rarity = 'legendary';
        card.attack += 5;
        card.defense += 4;
        card.knowledge += 3;
        card.cost = ENERGY_COSTS.legendary;
        gameState.cards.push(card);
        saveGameState();
        updateUI();
        showNotification(`👑 Legendary "${card.name}" added!`);
        checkAchievements();
    }
}

function cheatClearCards() {
    if (confirm('Delete ALL cards? This cannot be undone!')) {
        gameState.cards = [];
        gameState.deck = [];
        saveGameState();
        updateUI();
        showNotification('🗑️ All cards cleared!');
    }
}

function cheatForceGoldenPack() {
    gameState.packsOpened = 9; // Next pack will be golden (10th)
    updateGoldenPackProgress();
    saveGameState();
    showNotification('✨ Next pack is GOLDEN!');
}

function cheatResetPackCounter() {
    gameState.packsOpened = 0;
    updateGoldenPackProgress();
    saveGameState();
    showNotification('📦 Pack counter reset!');
}

function cheatUnlockAllAchievements() {
    for (const key of Object.keys(gameState.achievements)) {
        gameState.achievements[key] = true;
    }
    saveGameState();
    updateAchievementsDisplay();
    showNotification('🏆 All achievements unlocked!');
}

function cheatAddBattleWins(amount) {
    gameState.battlesWon += amount;
    saveGameState();
    checkAchievements();
    showNotification(`⚔️ +${amount} battle wins!`);
}

function cheatResetProgress() {
    if (confirm('⚠️ RESET ALL PROGRESS? This deletes everything!')) {
        localStorage.removeItem('wikicards_save');
        location.reload();
    }
}

function cheatWinBattle() {
    if (gameState.currentBattle) {
        endBattle(true);
        closeCheatMenu();
        showNotification('🎉 Battle won!');
    } else if (gameState.bossBattle) {
        endBossBattle(true);
        closeCheatMenu();
        showNotification('👑 Boss defeated!');
    } else {
        showNotification('❌ Not in a battle!');
    }
}

function cheatKillOpponent() {
    if (gameState.currentBattle || gameState.bossBattle) {
        gameState.opponentHealth = 0;
        renderBattle();
        showNotification('💀 Opponent health set to 0!');
    } else {
        showNotification('❌ Not in a battle!');
    }
}

function cheatFullEnergy() {
    if (gameState.currentBattle || gameState.bossBattle) {
        gameState.playerEnergy = 10;
        renderBattle();
        showNotification('⚡ Energy maxed!');
    } else {
        showNotification('❌ Not in a battle!');
    }
}


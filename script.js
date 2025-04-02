const pokemonListElement = document.getElementById('pokemon-list');
const pokemonNameElement = document.getElementById('pokemon-name');
const pokemonImageElement = document.getElementById('pokemon-image');
const pokemonIdElement = document.getElementById('pokemon-id');
const pokemonTypesElement = document.getElementById('pokemon-types');
const pokemonStatsElement = document.getElementById('pokemon-stats');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggleButton = document.getElementById('theme-toggle'); // Get toggle button
const bodyElement = document.body; // Get body element for theme class

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const MAX_POKEMON = 50;

let pokemonList = []; // To store fetched list data

// --- Theme Toggling Logic ---

function applyTheme(theme) {
    if (theme === 'dark') {
        bodyElement.classList.add('dark-mode');
    } else {
        bodyElement.classList.remove('dark-mode');
    }
}

function toggleTheme() {
    let currentTheme = 'light';
    if (bodyElement.classList.contains('dark-mode')) {
        currentTheme = 'dark';
    }

    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    // Save preference to localStorage
    try {
        localStorage.setItem('pokedexTheme', newTheme);
    } catch (e) {
        console.warn("Could not save theme preference to localStorage:", e);
    }
}

// Check for saved theme on initial load
function loadThemePreference() {
    try {
        const savedTheme = localStorage.getItem('pokedexTheme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme('light'); // Default to light if no preference saved
        }
    } catch (e) {
        console.warn("Could not load theme preference from localStorage:", e);
        applyTheme('light'); // Default to light on error
    }
}

// Add event listener to the button
if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
}

// --- Fetching Data ---

async function fetchPokemonList() {
    try {
        const response = await fetch(`${POKEAPI_BASE_URL}?limit=${MAX_POKEMON}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        pokemonList = data.results; // Store the list
        displayPokemonList(pokemonList);
        // Optionally, load the first Pokémon details by default
        if (pokemonList.length > 0) {
            fetchAndDisplayPokemonDetails(pokemonList[0].url, pokemonList[0].name);
        }
    } catch (error) {
        console.error("Could not fetch Pokémon list:", error);
        pokemonListElement.innerHTML = '<li>Error loading Pokémon list.</li>';
    }
}

async function fetchAndDisplayPokemonDetails(url, name) {
    // Show loading state
    pokemonNameElement.textContent = 'Loading...';
    pokemonImageElement.style.display = 'none'; // Hide image
    pokemonImageElement.src = ''; // Clear previous image
    loadingSpinner.style.display = 'block'; // Show spinner
    pokemonIdElement.textContent = '';
    pokemonTypesElement.innerHTML = '';
    pokemonStatsElement.innerHTML = '';

    // Highlight selected item in the list
    highlightSelectedItem(name);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pokemon = await response.json();
        displayPokemonDetails(pokemon);
    } catch (error) {
        console.error(`Could not fetch details for ${name}:`, error);
        pokemonNameElement.textContent = `Error loading ${name}`;
        loadingSpinner.style.display = 'none';
    }
}

// --- Displaying Data ---

function displayPokemonList(pokemonData) {
    pokemonListElement.innerHTML = ''; // Clear loading message or previous list
    pokemonData.forEach(pokemon => {
        const listItem = document.createElement('li');
        listItem.textContent = pokemon.name;
        listItem.dataset.url = pokemon.url; // Store URL for easy access
        listItem.dataset.name = pokemon.name; // Store name for highlighting
        listItem.addEventListener('click', () => {
            // Don't re-fetch if already selected (optional optimization)
            if (!listItem.classList.contains('active')) {
                fetchAndDisplayPokemonDetails(pokemon.url, pokemon.name);
            }
        });
        pokemonListElement.appendChild(listItem);
    });
}

function displayPokemonDetails(pokemon) {
    loadingSpinner.style.display = 'none'; // Hide spinner
    pokemonNameElement.textContent = pokemon.name;
    pokemonIdElement.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;

    // Find the best available sprite (animated preferred)
    const animatedSprite = pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
    const defaultSprite = pokemon.sprites.front_default;
    pokemonImageElement.src = animatedSprite || defaultSprite || ''; // Use animated, fallback to default, then empty
    pokemonImageElement.alt = pokemon.name;
    pokemonImageElement.style.display = 'block'; // Show image now that it's loaded

    // Display Types
    pokemonTypesElement.innerHTML = ''; // Clear previous types
    pokemon.types.forEach(typeInfo => {
        const typeSpan = document.createElement('span');
        typeSpan.textContent = typeInfo.type.name;
        typeSpan.className = `type-badge type-${typeInfo.type.name}`; // Add class for styling
        pokemonTypesElement.appendChild(typeSpan);
    });

    // Display Stats
    pokemonStatsElement.innerHTML = ''; // Clear previous stats
    pokemon.stats.forEach(statInfo => {
        const statItem = document.createElement('li');
        // Use more specific class names if needed, e.g., replace special-attack -> spec-atk
        let statClassName = statInfo.stat.name.replace('special-', 'spec-');
        statItem.className = `stat-${statClassName}`; // Add class for potential styling

        const statName = document.createElement('span');
        statName.className = 'stat-name';
        statName.textContent = statInfo.stat.name.replace('-', ' '); // Display name nicely

        const statBarContainer = document.createElement('div');
        statBarContainer.className = 'stat-bar-container';

        const statBar = document.createElement('div');
        statBar.className = 'stat-bar';
        // Calculate width percentage (capped at a reasonable visual max, e.g., 200 base stat)
        // Max base stat is actually 255, but 200 gives a good visual range for most Pokémon
        const maxStatValue = 200;
        const statPercentage = Math.min((statInfo.base_stat / maxStatValue) * 100, 100);
        statBar.style.width = `${statPercentage}%`;
        statBar.textContent = statInfo.base_stat; // Show value inside the bar

        statBarContainer.appendChild(statBar);
        statItem.appendChild(statName);
        statItem.appendChild(statBarContainer);
        pokemonStatsElement.appendChild(statItem);
    });
}

// --- Helper Functions ---

function highlightSelectedItem(name) {
    const listItems = pokemonListElement.querySelectorAll('li');
    listItems.forEach(item => {
        if (item.dataset.name === name) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference(); // Apply saved theme as soon as DOM is ready
    fetchPokemonList(); // Start fetching the list
});
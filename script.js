// DOM Elements
const body = document.body;
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const resetKeyBtn = document.getElementById('reset-key-btn');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const introSection = document.getElementById('intro-section');
const imageGrid = document.getElementById('image-grid');
const loader = document.getElementById('loader');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const suggestionTags = document.querySelectorAll('.tag');

// State
let currentQuery = '';
let currentPage = 1;
let isLoading = false;

// API Config
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
let UNSPLASH_ACCESS_KEY = localStorage.getItem('unsplash_key');

// Initialize
function init() {
    if (!UNSPLASH_ACCESS_KEY) {
        showApiKeyModal();
    }
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    saveKeyBtn.addEventListener('click', saveApiKey);
    resetKeyBtn.addEventListener('click', showApiKeyModal);
    
    searchForm.addEventListener('submit', handleSearch);
    loadMoreBtn.addEventListener('click', loadMoreImages);
    
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.textContent;
            searchForm.dispatchEvent(new Event('submit'));
        });
    });

    // Setup input enter key in modal
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });
}

// API Key Management
function showApiKeyModal() {
    apiKeyModal.classList.add('active');
    if (UNSPLASH_ACCESS_KEY) {
        apiKeyInput.value = UNSPLASH_ACCESS_KEY;
    }
    apiKeyInput.focus();
}

function hideApiKeyModal() {
    apiKeyModal.classList.remove('active');
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        UNSPLASH_ACCESS_KEY = key;
        localStorage.setItem('unsplash_key', key);
        hideApiKeyModal();
    } else {
        apiKeyInput.style.borderColor = 'var(--error)';
        setTimeout(() => apiKeyInput.style.borderColor = '', 1000);
    }
}

// Search Logic
async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    currentQuery = query;
    currentPage = 1;
    
    // UI Transitions
    introSection.style.display = 'none';
    imageGrid.innerHTML = '';
    hideError();
    hideLoadMore();
    
    await fetchImages();
}

async function loadMoreImages() {
    currentPage++;
    await fetchImages();
}

// API Fetching
async function fetchImages() {
    if (isLoading || !UNSPLASH_ACCESS_KEY) {
        if (!UNSPLASH_ACCESS_KEY) showApiKeyModal();
        return;
    }
    
    showLoader();
    hideLoadMore();
    
    try {
        const response = await fetch(`${UNSPLASH_API_URL}?query=${encodeURIComponent(currentQuery)}&page=${currentPage}&per_page=15`, {
            headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (response.status === 401) {
            throw new Error('Invalid API Key. Please check your Access Key and try again.');
        }
        
        if (response.status === 403) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results.length === 0 && currentPage === 1) {
            throw new Error(`No images found for "${currentQuery}". Try another search.`);
        }
        
        renderImages(data.results);
        
        // Check if there are more pages
        if (currentPage < data.total_pages) {
            showLoadMore();
        }
        
    } catch (err) {
        showError(err.message);
        if (err.message.includes('Invalid API Key') || err.message.includes('Access Key')) {
            showApiKeyModal();
        }
    } finally {
        hideLoader();
    }
}

// UI Rendering
function renderImages(images) {
    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        card.innerHTML = `
            <img src="${image.urls.small}" alt="${image.alt_description || 'Unsplash image'}" loading="lazy" style="aspect-ratio: ${image.width}/${image.height}">
            <div class="image-overlay">
                <div class="image-actions">
                    <a href="${image.links.html}" target="_blank" class="action-btn" title="View on Unsplash">
                        <i class="ri-share-box-line"></i>
                    </a>
                    <a href="${image.links.download}?force=true" target="_blank" class="action-btn" title="Download">
                        <i class="ri-download-2-line"></i>
                    </a>
                </div>
                <div class="image-info">
                    <img src="${image.user.profile_image.small}" alt="${image.user.name}" class="author-img">
                    <span class="author-name">${image.user.name}</span>
                </div>
            </div>
        `;
        
        imageGrid.appendChild(card);
    });
}

// Utility UI Functions
function showLoader() {
    isLoading = true;
    loader.style.display = 'flex';
}

function hideLoader() {
    isLoading = false;
    loader.style.display = 'none';
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorState.style.display = 'block';
}

function hideError() {
    errorState.style.display = 'none';
}

function showLoadMore() {
    loadMoreContainer.style.display = 'flex';
}

function hideLoadMore() {
    loadMoreContainer.style.display = 'none';
}

// Start app
init();

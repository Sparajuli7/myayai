/**
 * MyAyai Extension Service Worker
 * Handles background tasks, extension lifecycle, and communication between content scripts and popup
 */

// Import all background scripts
importScripts('./background.js');

// Service worker setup
console.log('[MyAyAI] Service worker starting...');

// Initialize when service worker starts
try {
    console.log('[MyAyAI] Service worker initialized successfully');
} catch (error) {
    console.error('[MyAyAI] Service worker initialization failed:', error);
}

// Handle service worker activation
self.addEventListener('activate', (event) => {
    console.log('[MyAyAI] Service worker activated');
    
    // Claim all clients to ensure immediate control
    event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
    console.log('[MyAyAI] Service worker installing...');
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Keep service worker alive by handling messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // The background.js file already has a message listener, this is just to keep the service worker alive
    return false; // Let other listeners handle the message
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('[MyAyAI] Extension startup detected');
});

// Handle extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[MyAyAI] Extension installed/updated:', details.reason);
});

// Keep service worker alive with periodic heartbeat
setInterval(() => {
    console.debug('[MyAyAI] Service worker heartbeat');
}, 30000); // Every 30 seconds

'use strict';

// Global variables
let isEnabled = true;
let isSpecialSite = false;
let specialSiteConfig = null;
const SCRIPT_ID = 'dynamic-rtl-styles';
let debounceTimer = null;
let mutationQueue = [];
let processingMutations = false;

// Initialize the extension
function initExtension() {
    // Check if the page already has RTL language set
    if (document.documentElement.lang === "fa-IR" || document.documentElement.lang === "ar") {
        return;
    }

    // Check if the extension is enabled for this domain
    chrome.storage.sync.get(['disabledSites', 'enabledSites', 'defaultEnabled', 'specialSites'], function(result) {
        const currentHost = window.location.hostname;
        const defaultEnabled = result.defaultEnabled !== undefined ? result.defaultEnabled : true;
        const disabledSites = result.disabledSites || [];
        const enabledSites = result.enabledSites || [];
        const specialSites = result.specialSites || {};
        
        // Check if current site needs special handling
        if (specialSites[currentHost]) {
            isSpecialSite = true;
            specialSiteConfig = specialSites[currentHost];
        }
        
        if (defaultEnabled) {
            // Default enabled mode: site is enabled unless in disabledSites
            isEnabled = !disabledSites.includes(currentHost);
        } else {
            // Default disabled mode: site is disabled unless in enabledSites
            isEnabled = enabledSites.includes(currentHost);
        }
        
        if (isEnabled) {
            // Add styles and start processing
            addStyles();
            loadFonts();
            
            // Wait a bit to ensure DOM is ready before initial processing
            setTimeout(() => {
                setupInputObservers();
                setupObservers();
                processDocument();
            }, 500);
        }
    });
}

// Add CSS rules
function addStyles() {
    if (document.getElementById(SCRIPT_ID)) return;
    
    const style = document.createElement('style');
    style.id = SCRIPT_ID;
    
    // Base styles for all sites
    let styleContent = `
        [data-rtl="true"] {
            direction: rtl !important;
            font-family: 'Vazirmatn', Arial, sans-serif !important;
            text-align: right !important;
        }
        
        input[data-rtl="true"], textarea[data-rtl="true"] {
            direction: rtl !important;
            font-family: 'Vazirmatn', Arial, sans-serif !important;
            text-align: right !important;
        }
        
        /* Apply RTL to contenteditable elements */
        [contenteditable][data-rtl="true"] {
            direction: rtl !important;
            font-family: 'Vazirmatn', Arial, sans-serif !important;
            text-align: right !important;
        }
        
        /* Force RTL for input fields with Persian/Arabic text */
        .rtl-input-active {
            direction: rtl !important;
            font-family: 'Vazirmatn', Arial, sans-serif !important;
            text-align: right !important;
        }
    `;
    
    // Add claude.ai specific styles if on claude.ai
    if (window.location.hostname.includes('claude.ai')) {
        styleContent += `
            /* Claude.ai specific styles */
            .claude-textarea[data-rtl="true"] {
                direction: rtl !important;
                font-family: 'Vazirmatn', Arial, sans-serif !important;
                text-align: right !important;
            }
            
            /* Target Claude's main textarea */
            .prose-sm[data-rtl="true"], 
            .prose[data-rtl="true"] {
                direction: rtl !important;
                text-align: right !important;
                font-family: 'Vazirmatn', Arial, sans-serif !important;
            }
        `;
    }
    
    style.textContent = styleContent;
    document.head.appendChild(style);
}

// Load the Vazirmatn font with preloading
function loadFonts() {
    // Check if font is already loaded to avoid duplicates
    if (document.querySelector('link[href*="vazirmatn"]')) return;
    
    // Use a more reliable CDN
    const fontUrl = "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css";
    
    // Add the font to the head
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = fontUrl;
    linkEl.crossOrigin = 'anonymous';
    document.head.appendChild(linkEl);
}

// Regular expression to detect Persian or Arabic text
function isPersianOrArabic(text) {
    if (!text) return false;
    // Enhanced regex to better detect Persian/Arabic text
    const persianArabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return persianArabicRegex.test(text);
}

// Check if the first word of text is Persian or Arabic
function startsWithPersianOrArabic(text) {
    if (!text) return false;
    
    // Remove leading whitespace and get the first word
    const trimmedText = text.trim();
    const firstWord = trimmedText.split(/\s+/)[0];
    
    // Check if the first word contains Persian/Arabic characters
    return isPersianOrArabic(firstWord);
}

// Debounce function to prevent too frequent execution
function debounce(func, delay) {
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Process mutations in batches
function processMutationQueue() {
    if (processingMutations || mutationQueue.length === 0) return;
    
    processingMutations = true;
    
    // Take at most 20 mutations to process in this batch
    const batch = mutationQueue.splice(0, 20);
    
    try {
        batch.forEach(node => applyRTL(node));
    } catch (error) {
        console.error('Dynamic RTL: Error processing mutations', error);
    }
    
    processingMutations = false;
    
    // If there are still mutations in the queue, schedule next batch
    if (mutationQueue.length > 0) {
        setTimeout(processMutationQueue, 10);
    }
}

// Setup observers specifically for input fields - optimized
function setupInputObservers() {
    if (!isEnabled) return;
    
    // Function to process inputs with debouncing
    const processInputs = debounce(() => {
        if (!isEnabled) return;
        
        // Handle claude.ai's special elements first if applicable
        if (isSpecialSite && window.location.hostname.includes('claude.ai')) {
            handleClaudeAIElements();
        }
        
        // Process all input fields
        const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type]), textarea');
        inputElements.forEach(setupInputElement);
        
        // Process all contenteditable elements
        const editableElements = document.querySelectorAll('[contenteditable="true"], [contenteditable=""]');
        editableElements.forEach(setupEditableElement);
    }, 100);
    
    // Process the document when it's ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processInputs);
    } else {
        processInputs();
    }
    
    // Also process inputs when the page is fully loaded
    window.addEventListener('load', processInputs);
    
    // Create a MutationObserver with reduced priority for input elements
    const inputObserver = new MutationObserver(mutations => {
        if (!isEnabled) return;
        
        let shouldProcessInputs = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is an input or contains inputs
                        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || 
                            node.hasAttribute('contenteditable') ||
                            node.querySelector('input, textarea, [contenteditable]')) {
                            shouldProcessInputs = true;
                            break;
                        }
                    }
                }
                if (shouldProcessInputs) break;
            }
        }
        
        if (shouldProcessInputs) {
            processInputs();
        }
    });
    
    // Start observing the document with a more focused approach
    inputObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
}

// Special handler for claude.ai elements
function handleClaudeAIElements() {
    if (!window.location.hostname.includes('claude.ai')) return;
    
    // Find the main input area in claude.ai
    // These selectors may need periodic updates if claude.ai changes their DOM structure
    const claudeSelectors = [
        'textarea.w-full', // Main textarea
        '[role="textbox"]', // Contenteditable div sometimes used
        '[contenteditable="true"]', // Explicit contenteditable fields
        '.prose-sm', // Text display areas
        '.prose' // Text display areas
    ];
    
    for (const selector of claudeSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (!element.hasAttribute('data-rtl-listener')) {
                // Special setup for claude.ai elements
                element.setAttribute('data-rtl-listener', 'true');
                
                // Enhanced input event handling for claude.ai
                element.addEventListener('input', function() {
                    const text = this.value || this.textContent || '';
                    if (isPersianOrArabic(text) && startsWithPersianOrArabic(text)) {
                        this.setAttribute('data-rtl', 'true');
                        this.classList.add('rtl-input-active');
                    } else if (text.trim() === '') {
                        this.removeAttribute('data-rtl');
                        this.classList.remove('rtl-input-active');
                    } else {
                        this.removeAttribute('data-rtl');
                        this.classList.remove('rtl-input-active');
                    }
                });
                
                // Check current content
                const text = element.value || element.textContent || '';
                if (isPersianOrArabic(text) && startsWithPersianOrArabic(text)) {
                    element.setAttribute('data-rtl', 'true');
                    element.classList.add('rtl-input-active');
                }
            }
        });
    }
}

// Setup event handlers for an input element
function setupInputElement(element) {
    if (!element || element.hasAttribute('data-rtl-listener')) return;
    
    // Mark this element as processed
    element.setAttribute('data-rtl-listener', 'true');
    
    // Check if the input already has Persian/Arabic text that starts with Persian/Arabic
    if ((isPersianOrArabic(element.value) && startsWithPersianOrArabic(element.value)) || 
        (element.hasAttribute('placeholder') && isPersianOrArabic(element.getAttribute('placeholder')) && 
         startsWithPersianOrArabic(element.getAttribute('placeholder')))) {
        element.setAttribute('data-rtl', 'true');
        element.classList.add('rtl-input-active');
    }
    
    // Use a single event handler for better performance
    const handleInputChange = function() {
        if (isPersianOrArabic(this.value) && startsWithPersianOrArabic(this.value)) {
            this.setAttribute('data-rtl', 'true');
            this.classList.add('rtl-input-active');
        } else if (this.value.trim() === '') {
            // Only remove RTL if there's no placeholder with Persian/Arabic
            if (!(this.hasAttribute('placeholder') && 
                  isPersianOrArabic(this.getAttribute('placeholder')) && 
                  startsWithPersianOrArabic(this.getAttribute('placeholder')))) {
                this.removeAttribute('data-rtl');
                this.classList.remove('rtl-input-active');
            }
        } else {
            // If text doesn't start with Persian/Arabic, remove RTL
            this.removeAttribute('data-rtl');
            this.classList.remove('rtl-input-active');
        }
    };
    
    // Add debounced event listeners
    element.addEventListener('input', debounce(handleInputChange, 50));
    element.addEventListener('focus', handleInputChange);
    element.addEventListener('blur', handleInputChange);
    
    // Handle paste events
    element.addEventListener('paste', function() {
        // Use setTimeout to check the value after paste is complete
        setTimeout(handleInputChange.bind(this), 0);
    });
}

// Setup event handlers for a contenteditable element
function setupEditableElement(element) {
    if (!element || element.hasAttribute('data-rtl-listener')) return;
    
    // Mark this element as processed
    element.setAttribute('data-rtl-listener', 'true');
    
    // Check if the element already has Persian/Arabic text that starts with Persian/Arabic
    if (isPersianOrArabic(element.textContent) && startsWithPersianOrArabic(element.textContent)) {
        element.setAttribute('data-rtl', 'true');
    }
    
    // Single handler for contenteditable elements
    const handleContentChange = function() {
        if (isPersianOrArabic(this.textContent) && startsWithPersianOrArabic(this.textContent)) {
            this.setAttribute('data-rtl', 'true');
        } else if (this.textContent.trim() === '') {
            this.removeAttribute('data-rtl');
        } else {
            // If text doesn't start with Persian/Arabic, remove RTL
            this.removeAttribute('data-rtl');
        }
    };
    
    // Add debounced event listener
    element.addEventListener('input', debounce(handleContentChange, 50));
    
    // Handle paste events
    element.addEventListener('paste', function() {
        // Use setTimeout to check the content after paste is complete
        setTimeout(handleContentChange.bind(this), 0);
    });
}

// Function to check and apply RTL and font - optimized
function applyRTL(element) {
    if (!isEnabled || !element || !element.parentElement) return;

    if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent.trim();
        if (isPersianOrArabic(text) && startsWithPersianOrArabic(text)) {
            let currentElement = element.parentElement;
            
            // Special handling for input and textarea elements
            if (currentElement.tagName === 'INPUT' || currentElement.tagName === 'TEXTAREA') {
                setupInputElement(currentElement);
                return;
            }
            
            // Special handling for contenteditable elements
            if (currentElement.hasAttribute('contenteditable')) {
                setupEditableElement(currentElement);
                return;
            }
            
            // Limit the traversal to reduce performance impact
            let traverseCount = 0;
            while (currentElement && 
                  currentElement !== document.body && 
                  traverseCount < 3 && 
                  currentElement.children.length <= 1) {
                currentElement.setAttribute('data-rtl', 'true');
                currentElement = currentElement.parentElement;
                traverseCount++;
            }
            if (currentElement && currentElement !== document.body) {
                currentElement.setAttribute('data-rtl', 'true');
            }
        }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
        // Check title attribute
        if (element.hasAttribute('title') && isPersianOrArabic(element.getAttribute('title')) && 
            startsWithPersianOrArabic(element.getAttribute('title'))) {
            element.setAttribute('data-rtl', 'true');
        }
        
        // Check placeholder attribute for input elements
        if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
            setupInputElement(element);
        }
        
        // Check contenteditable elements
        if (element.hasAttribute('contenteditable')) {
            setupEditableElement(element);
        }

        // Process a limited number of child nodes to improve performance
        const childNodes = Array.from(element.childNodes);
        const maxChildNodesToProcess = 20; // Limit processing to prevent freezing
        
        for (let i = 0; i < Math.min(childNodes.length, maxChildNodesToProcess); i++) {
            const child = childNodes[i];
            // Queue child nodes for processing rather than processing immediately
            mutationQueue.push(child);
        }
        
        // Process the mutation queue
        if (!processingMutations) {
            processMutationQueue();
        }
    }
}

// Process the entire document
function processDocument() {
    if (!isEnabled) return;
    
    // Special handling for claude.ai
    if (isSpecialSite && window.location.hostname.includes('claude.ai')) {
        handleClaudeAIElements();
    }
    
    // Process in chunks to avoid freezing the UI
    const processNodes = (node, startIndex, endIndex) => {
        const childNodes = Array.from(node.childNodes).slice(startIndex, endIndex);
        childNodes.forEach(child => mutationQueue.push(child));
        
        // Process the mutation queue
        if (!processingMutations) {
            processMutationQueue();
        }
        
        // Process next chunk if any
        if (endIndex < node.childNodes.length) {
            setTimeout(() => {
                processNodes(node, endIndex, endIndex + 50);
            }, 20);
        }
    };
    
    if (document.body) {
        processNodes(document.body, 0, 50);
    }
}

// Setup MutationObserver to monitor changes in the DOM - optimized
function setupObservers() {
    const observer = new MutationObserver(mutations => {
        if (!isEnabled) return;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => mutationQueue.push(node));
            } else if (mutation.type === 'characterData') {
                mutationQueue.push(mutation.target);
            }
        }
        
        // Process in batches for better performance
        if (!processingMutations) {
            processMutationQueue();
        }
    });

    // Start observing the body with a more performance-friendly configuration
    const observerConfig = {
        childList: true,
        characterData: true,
        subtree: true,
        characterDataOldValue: false  // Don't need old value to improve performance
    };

    // Wait for body to be available
    if (document.body) {
        observer.observe(document.body, observerConfig);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, observerConfig);
        });
    }
    
    // Special handling for claude.ai - re-check periodically for new content
    if (window.location.hostname.includes('claude.ai')) {
        setInterval(() => {
            handleClaudeAIElements();
        }, 2000);
    }
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSite') {
        isEnabled = message.enabled;
        
        if (isEnabled) {
            addStyles();
            processDocument();
        } else {
            // Remove RTL attributes
            const rtlElements = document.querySelectorAll('[data-rtl="true"], .rtl-input-active');
            rtlElements.forEach(el => {
                el.removeAttribute('data-rtl');
                el.classList.remove('rtl-input-active');
            });
            
            // Remove style element
            const styleEl = document.getElementById(SCRIPT_ID);
            if (styleEl) styleEl.remove();
        }
    }
    
    sendResponse({ success: true });
});

// Initialize when the script loads - with a slight delay to ensure browser is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initExtension, 100));
} else {
    setTimeout(initExtension, 100);
}

// Handle dynamic content loading with debouncing
window.addEventListener('load', debounce(processDocument, 200));
window.addEventListener('readystatechange', debounce(processDocument, 200));

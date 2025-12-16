// Enhanced SDK initialization with conflict protection
(function() {
  'use strict';
  
  // Initialize conflict protection immediately
  function initializeProtection() {
    try {
      // Set up SVG sanitizer
      if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
        const svgObserver = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) { // Element node
                fixSVGErrors(node);
              }
            });
          });
        });
        
        function fixSVGErrors(element) {
          if (element.tagName && element.tagName.toLowerCase() === 'svg') {
            const width = element.getAttribute('width');
            const height = element.getAttribute('height');
            
            if (width === 'small' || width === 'large' || width === 'medium') {
              const numericWidth = getNumericSize(width);
              element.setAttribute('width', numericWidth.toString());
              console.log('🧹 Fixed SVG width:', width, '→', numericWidth);
            }
            
            if (height === 'small' || height === 'large' || height === 'medium') {
              const numericHeight = getNumericSize(height);
              element.setAttribute('height', numericHeight.toString());
              console.log('🧹 Fixed SVG height:', height, '→', numericHeight);
            }
          }
          
          // Fix child elements recursively
          if (element.children) {
            for (var i = 0; i < element.children.length; i++) {
              fixSVGErrors(element.children[i]);
            }
          }
        }
        
        function getNumericSize(size) {
          var sizeMap = {
            'small': 16,
            'medium': 24,
            'large': 32
          };
          return sizeMap[size] || 24;
        }
        
        svgObserver.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true
        });
        
        console.log('🛡️ SVG Sanitizer initialized');
      }
      
      // Set up wallet conflict protection
      if (typeof window !== 'undefined') {
        // Prevent external wallet injection
        var originalDefineProperty = Object.defineProperty;
        Object.defineProperty = function(obj, prop, descriptor) {
          if (obj === window && (prop === 'ethereum' || prop === 'isZerion' || String(prop).indexOf('eth_') === 0)) {
            console.warn('🛡️ Blocked external wallet property injection:', prop);
            return obj; // Silently block the redefinition
          }
          return originalDefineProperty.call(this, obj, prop, descriptor);
        };
        
        console.log('🛡️ Wallet conflict protection initialized');
      }
      
    } catch (error) {
      console.error('Protection initialization failed:', error);
    }
  }
  
  function callSDKReady() {
    try {
      if (window.farcaster && window.farcaster.sdk && window.farcaster.sdk.actions && window.farcaster.sdk.actions.ready) {
        console.log("🚀 Calling sdk.actions.ready() with protection");
        window.farcaster.sdk.actions.ready();
        return true;
      }
    } catch (err) {
      console.warn("⚠️ Error calling sdk.actions.ready():", err);
    }
    return false;
  }
  
  // Initialize protection immediately
  initializeProtection();
  
  // Try SDK ready immediately
  if (callSDKReady()) {
    return;
  }
  
  // Try again when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      callSDKReady();
    });
  }
  
  // Also try after delays to catch late-loading SDKs
  setTimeout(callSDKReady, 100);
  setTimeout(callSDKReady, 500);
  setTimeout(callSDKReady, 1000);
  setTimeout(callSDKReady, 2000);
})();
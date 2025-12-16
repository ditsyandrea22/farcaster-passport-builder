// SDK initialization for Farcaster Mini Apps
(function() {
  'use strict';
  
  // Simple SVG size fix for rendering issues
  function fixSVGSizes() {
    try {
      // Only fix text-based size attributes that are invalid
      var svgs = document.querySelectorAll('[width="small"], [width="medium"], [width="large"], [height="small"], [height="medium"], [height="large"]');
      
      var sizeMap = { 'small': 16, 'medium': 24, 'large': 32 };
      
      svgs.forEach(function(el) {
        var width = el.getAttribute('width');
        var height = el.getAttribute('height');
        
        if (width && width in sizeMap) {
          el.setAttribute('width', sizeMap[width].toString());
        }
        if (height && height in sizeMap) {
          el.setAttribute('height', sizeMap[height].toString());
        }
      });
      
      console.debug('SVG sizes normalized');
    } catch (e) {
      // Silent fail
    }
  }
  
  function callSDKReady() {
    try {
      var sdk = window.farcaster && window.farcaster.sdk;
      if (sdk && sdk.actions && sdk.actions.ready) {
        console.log("🚀 Calling sdk.actions.ready()");
        var result = sdk.actions.ready();
        
        // Handle both sync and async ready
        if (result && typeof result.then === 'function') {
          result
            .then(function() {
              console.log("✅ sdk.actions.ready() success");
              window.__miniapp_ready__ = true;
            })
            .catch(function(err) {
              console.warn("⚠️ sdk.actions.ready() error:", err.message);
            });
        } else {
          console.log("✅ sdk.actions.ready() called");
          window.__miniapp_ready__ = true;
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn("⚠️ Error calling sdk.actions.ready():", err.message);
      return false;
    }
  }
  
  // Fix SVG sizes on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixSVGSizes);
  } else {
    fixSVGSizes();
  }
  
  // Try SDK ready at various times
  if (callSDKReady()) {
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callSDKReady);
  }
  
  setTimeout(callSDKReady, 100);
  setTimeout(callSDKReady, 500);
  setTimeout(callSDKReady, 1000);
  setTimeout(callSDKReady, 2000);
})();
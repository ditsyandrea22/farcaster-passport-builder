// CRITICAL: Call sdk.actions.ready() immediately to dismiss Mini App splash screen
// According to Farcaster docs: "If you don't call ready(), users will see an infinite loading screen"
// This should be one of the FIRST things that happens on page load
(function() {
  'use strict';
  
  function callSDKReady() {
    try {
      var sdk = window.farcaster && window.farcaster.sdk;
      if (sdk && sdk.actions && sdk.actions.ready) {
        console.log("🚀 CRITICAL: Calling sdk.actions.ready() to dismiss splash screen");
        
        var result = sdk.actions.ready();
        
        // Handle both sync and async ready
        if (result && typeof result.then === 'function') {
          result
            .then(function() {
              console.log("✅ sdk.actions.ready() completed - splash screen should be dismissed");
              window.__miniapp_ready__ = true;
            })
            .catch(function(err) {
              console.warn("⚠️ sdk.actions.ready() error (app still functions):", err.message);
            });
        } else {
          console.log("✅ sdk.actions.ready() called (sync mode)");
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
  
  // Simple SVG size fix for rendering issues (non-blocking)
  function fixSVGSizes() {
    try {
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
    } catch (e) {
      // Silent fail
    }
  }
  
  // TRY IMMEDIATELY: SDK might already be injected
  if (callSDKReady()) {
    console.log("✅ SDK ready called immediately on script load");
    return;
  }
  
  // If document is still loading, wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log("→ Trying sdk.actions.ready() after DOMContentLoaded");
      callSDKReady();
    });
  }
  
  // Try at various intervals - SDK might be injected late
  setTimeout(callSDKReady, 10);
  setTimeout(callSDKReady, 50);
  setTimeout(callSDKReady, 100);
  setTimeout(callSDKReady, 200);
  setTimeout(callSDKReady, 500);
  setTimeout(callSDKReady, 1000);
  
  // Fix SVG issues after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixSVGSizes);
  } else {
    setTimeout(fixSVGSizes, 100);
  }
})();
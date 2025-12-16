// Immediately call sdk.actions.ready() when available
(function() {
  'use strict';
  
  function callSDKReady() {
    try {
      if (window.farcaster && window.farcaster.sdk && window.farcaster.sdk.actions && window.farcaster.sdk.actions.ready) {
        console.log("🚀 Calling sdk.actions.ready() immediately");
        window.farcaster.sdk.actions.ready();
        return true;
      }
    } catch (err) {
      console.warn("⚠️ Error calling sdk.actions.ready():", err);
    }
    return false;
  }
  
  // Try immediately
  if (callSDKReady()) {
    return;
  }
  
  // Try again when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      callSDKReady();
    });
  }
  
  // Also try after a short delay to catch late-loading SDKs
  setTimeout(callSDKReady, 100);
  setTimeout(callSDKReady, 500);
  setTimeout(callSDKReady, 1000);
})();
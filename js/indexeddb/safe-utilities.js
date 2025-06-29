/**
 * GridFlow - Safe Utilities for IndexedDB modules
 * Provides safe versions of utility functions that work in both main app and test environments
 */

/**
 * Safe status message that works in both main app and test environments
 * @param {string} message - Message to show
 * @param {string} type - Message type (success, error, warning, info)
 */
export function safeShowStatusMessage(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Try to use main app's showStatusMessage if available
  try {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      // Use original showStatusMessage if element exists
      const { showStatusMessage } = await import('../utilities.js');
      showStatusMessage(message, type);
      return;
    }
  } catch (error) {
    // If import fails or element doesn't exist, continue to fallback
  }
  
  // Fallback: Try to log to test page if available
  try {
    if (typeof window.log === 'function') {
      window.log(message, type);
      return;
    }
  } catch (error) {
    // If test page log doesn't exist, continue
  }
  
  // Final fallback: console only (already logged above)
}

/**
 * Safe data save function that doesn't break in test environment
 * @param {Object} appData - Data to save
 */
export function safeSaveData(appData) {
  try {
    localStorage.setItem('gridflow_data', JSON.stringify(appData));
    console.log('Data saved to localStorage');
    
    // Mark changes for cloud sync if available
    if (window.cloudSync && window.cloudSync.isEnabled) {
      window.cloudSync.markChanges();
    }
    
    // Use safe status message
    safeShowStatusMessage('Data saved successfully', 'success');
    
  } catch (error) {
    console.error('Failed to save data:', error);
    safeShowStatusMessage('Failed to save data', 'error');
    throw error;
  }
}
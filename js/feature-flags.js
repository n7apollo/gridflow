/**
 * GridFlow - Feature Flags System
 * Manages feature toggles for gradual rollout of new functionality
 */

class FeatureFlags {
  constructor() {
    this.flags = JSON.parse(localStorage.getItem('gridflow_feature_flags') || '{}');
  }
  
  isEnabled(flag) {
    return this.flags[flag] === true;
  }
  
  enable(flag) {
    this.flags[flag] = true;
    localStorage.setItem('gridflow_feature_flags', JSON.stringify(this.flags));
    console.log(`Feature flag enabled: ${flag}`);
  }
  
  disable(flag) {
    this.flags[flag] = false;
    localStorage.setItem('gridflow_feature_flags', JSON.stringify(this.flags));
    console.log(`Feature flag disabled: ${flag}`);
  }
  
  toggle(flag) {
    if (this.isEnabled(flag)) {
      this.disable(flag);
    } else {
      this.enable(flag);
    }
  }
  
  getAll() {
    return { ...this.flags };
  }
  
  reset() {
    this.flags = {};
    localStorage.removeItem('gridflow_feature_flags');
    console.log('All feature flags reset');
  }
}

// Feature flag constants
export const FLAGS = {
  INDEXEDDB_ENABLED: 'indexeddb_enabled',
  PEOPLE_SYSTEM: 'people_system',
  COLLECTIONS_VIEW: 'collections_view',
  NUDGING_SYSTEM: 'nudging_system',
  DUAL_WRITE: 'dual_write',
  PERFORMANCE_MONITORING: 'performance_monitoring'
};

// Create global instance
const featureFlags = new FeatureFlags();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.featureFlags = featureFlags;
  window.FLAGS = FLAGS;
}

export default featureFlags;
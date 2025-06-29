/**
 * GridFlow - Weekly Planning IndexedDB-First Implementation
 * Provides IndexedDB-first operations for weekly planning with localStorage fallback
 */

import * as originalWeeklyPlanning from '../weekly-planning.js';
import entityIndexedDBService from './entity-indexeddb-service.js';
import featureFlags, { FLAGS } from '../feature-flags.js';
import { getAppData } from '../core-data.js';

/**
 * Save weekly plan (IndexedDB first, then localStorage)
 * @param {string} weekKey - Week key
 * @param {Object} weeklyPlan - Weekly plan data
 * @returns {Promise<Object>} Saved weekly plan
 */
export async function saveWeeklyPlan(weekKey, weeklyPlan) {
  // Always save to localStorage for backward compatibility
  const appData = getAppData();
  appData.weeklyPlans[weekKey] = weeklyPlan;
  
  // Also save to IndexedDB if enabled
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      await entityIndexedDBService.saveWeeklyPlan({
        weekKey,
        ...weeklyPlan
      });
    } catch (error) {
      console.warn('Failed to save weekly plan to IndexedDB:', error);
    }
  }
  
  return weeklyPlan;
}

/**
 * Get weekly plan (IndexedDB first, then localStorage)
 * @param {string} weekKey - Week key
 * @returns {Promise<Object|null>} Weekly plan or null
 */
export async function getWeeklyPlan(weekKey) {
  // Try IndexedDB first if enabled
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      const plan = await entityIndexedDBService.getWeeklyPlan(weekKey);
      if (plan) {
        return plan;
      }
    } catch (error) {
      console.warn('Failed to get weekly plan from IndexedDB:', error);
    }
  }
  
  // Fallback to localStorage
  const appData = getAppData();
  return appData.weeklyPlans[weekKey] || null;
}

/**
 * Add entity to weekly plan (IndexedDB first, then localStorage)
 * @param {string} weekKey - Week key
 * @param {string} entityId - Entity ID
 * @param {string} day - Day of week
 * @returns {Promise<Object>} Created weekly item
 */
export async function addEntityToWeeklyPlan(weekKey, entityId, day) {
  // Create weekly item object
  const weeklyItem = {
    id: `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    weekKey,
    entityId,
    day,
    addedAt: new Date().toISOString()
  };
  
  // Save to localStorage
  const appData = getAppData();
  if (!appData.weeklyPlans[weekKey]) {
    appData.weeklyPlans[weekKey] = {
      weekStart: weekKey,
      goal: '',
      items: [],
      reflection: {}
    };
  }
  
  appData.weeklyPlans[weekKey].items.push(weeklyItem);
  
  // Also save to IndexedDB if enabled
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      await entityIndexedDBService.addEntityToWeeklyPlan(weekKey, entityId, day);
      await entityIndexedDBService.saveWeeklyPlan(appData.weeklyPlans[weekKey]);
    } catch (error) {
      console.warn('Failed to save weekly item to IndexedDB:', error);
    }
  }
  
  return weeklyItem;
}

/**
 * Get weekly items for a week (IndexedDB first, then localStorage)
 * @param {string} weekKey - Week key
 * @returns {Promise<Object[]>} Array of weekly items
 */
export async function getWeeklyItems(weekKey) {
  // Try IndexedDB first if enabled
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      const items = await entityIndexedDBService.getWeeklyItems(weekKey);
      if (items && items.length > 0) {
        return items;
      }
    } catch (error) {
      console.warn('Failed to get weekly items from IndexedDB:', error);
    }
  }
  
  // Fallback to localStorage
  const appData = getAppData();
  const weeklyPlan = appData.weeklyPlans[weekKey];
  return weeklyPlan ? weeklyPlan.items || [] : [];
}

// Export all original functions for backward compatibility
export const getCurrentWeekKey = originalWeeklyPlanning.getCurrentWeekKey;
export const initializeWeeklyPlanning = originalWeeklyPlanning.initializeWeeklyPlanning;
export const renderWeeklyPlan = originalWeeklyPlanning.renderWeeklyPlan;
export const loadWeeklyPlan = originalWeeklyPlanning.loadWeeklyPlan;
export const navigateWeek = originalWeeklyPlanning.navigateWeek;
export const saveWeeklyGoal = originalWeeklyPlanning.saveWeeklyGoal;
export const saveWeeklyReflection = originalWeeklyPlanning.saveWeeklyReflection;
export const addEntityToWeekly = originalWeeklyPlanning.addEntityToWeekly;
export const removeFromWeeklyPlan = originalWeeklyPlanning.removeFromWeeklyPlan;
export const getCurrentWeekItems = originalWeeklyPlanning.getCurrentWeekItems;
export const getDayItems = originalWeeklyPlanning.getDayItems;
export const moveWeeklyItem = originalWeeklyPlanning.moveWeeklyItem;

// Make enhanced functions available globally for testing
if (typeof window !== 'undefined') {
  window.weeklyPlanningIndexedDBFirst = {
    saveWeeklyPlan,
    getWeeklyPlan,
    addEntityToWeeklyPlan,
    getWeeklyItems
  };
}
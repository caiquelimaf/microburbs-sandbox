import { Injectable } from '@angular/core';

/**
 * Service wrapping sessionStorage with JSON serialization and type safety
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /**
   * Get item from sessionStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from storage for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set item in sessionStorage
   */
  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to storage for key "${key}":`, error);
    }
  }

  /**
   * Remove item from sessionStorage
   */
  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage for key "${key}":`, error);
    }
  }

  /**
   * Clear all items from sessionStorage
   */
  clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}


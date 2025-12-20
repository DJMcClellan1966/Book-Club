import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_DIARY_KEY = '@book_diary_local';

/**
 * Local Diary Storage Service
 * Stores diary entries locally on device (offline, not synced to cloud)
 * Use when user wants device-only storage or has reached cloud diary limit
 */

class LocalDiaryService {
  /**
   * Get all local diary entries for a book
   * @param {string} bookId - Book ID
   * @returns {Promise<Array>} Array of diary entries
   */
  async getEntriesForBook(bookId) {
    try {
      const allEntries = await this.getAllEntries();
      return allEntries.filter(entry => entry.book_id === bookId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Error getting local entries:', error);
      return [];
    }
  }

  /**
   * Get all local diary entries for all books
   * @returns {Promise<Array>} Array of all diary entries
   */
  async getAllEntries() {
    try {
      const jsonValue = await AsyncStorage.getItem(LOCAL_DIARY_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error reading local diary:', error);
      return [];
    }
  }

  /**
   * Get a single entry by ID
   * @param {string} entryId - Entry ID
   * @returns {Promise<Object|null>} Diary entry or null
   */
  async getEntry(entryId) {
    try {
      const allEntries = await this.getAllEntries();
      return allEntries.find(entry => entry.id === entryId) || null;
    } catch (error) {
      console.error('Error getting entry:', error);
      return null;
    }
  }

  /**
   * Create a new diary entry
   * @param {string} bookId - Book ID
   * @param {string} entryText - Entry text content
   * @param {Object} bookInfo - Book title and author for display
   * @returns {Promise<Object>} Created entry
   */
  async createEntry(bookId, entryText, bookInfo = {}) {
    try {
      const allEntries = await this.getAllEntries();
      
      const newEntry = {
        id: this.generateId(),
        book_id: bookId,
        entry_text: entryText.trim(),
        book_title: bookInfo.title || 'Unknown',
        book_author: bookInfo.author || 'Unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        storage_type: 'local'
      };

      allEntries.push(newEntry);
      await this.saveAllEntries(allEntries);
      
      return newEntry;
    } catch (error) {
      console.error('Error creating local entry:', error);
      throw error;
    }
  }

  /**
   * Update an existing diary entry
   * @param {string} entryId - Entry ID
   * @param {string} entryText - New entry text
   * @returns {Promise<Object>} Updated entry
   */
  async updateEntry(entryId, entryText) {
    try {
      const allEntries = await this.getAllEntries();
      const index = allEntries.findIndex(entry => entry.id === entryId);
      
      if (index === -1) {
        throw new Error('Entry not found');
      }

      allEntries[index].entry_text = entryText.trim();
      allEntries[index].updated_at = new Date().toISOString();
      
      await this.saveAllEntries(allEntries);
      
      return allEntries[index];
    } catch (error) {
      console.error('Error updating local entry:', error);
      throw error;
    }
  }

  /**
   * Delete a diary entry
   * @param {string} entryId - Entry ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEntry(entryId) {
    try {
      const allEntries = await this.getAllEntries();
      const filtered = allEntries.filter(entry => entry.id !== entryId);
      
      await this.saveAllEntries(filtered);
      
      return true;
    } catch (error) {
      console.error('Error deleting local entry:', error);
      throw error;
    }
  }

  /**
   * Count distinct books with local diary entries
   * @returns {Promise<number>} Number of unique books
   */
  async getBookCount() {
    try {
      const allEntries = await this.getAllEntries();
      const uniqueBookIds = [...new Set(allEntries.map(e => e.book_id))];
      return uniqueBookIds.length;
    } catch (error) {
      console.error('Error counting books:', error);
      return 0;
    }
  }

  /**
   * Get list of books with local diary entries
   * @returns {Promise<Array>} Array of book info objects
   */
  async getBooksWithEntries() {
    try {
      const allEntries = await this.getAllEntries();
      const bookMap = new Map();
      
      allEntries.forEach(entry => {
        if (!bookMap.has(entry.book_id)) {
          bookMap.set(entry.book_id, {
            id: entry.book_id,
            title: entry.book_title,
            author: entry.book_author,
            entryCount: 1,
            lastEntryDate: entry.updated_at
          });
        } else {
          const book = bookMap.get(entry.book_id);
          book.entryCount++;
          if (new Date(entry.updated_at) > new Date(book.lastEntryDate)) {
            book.lastEntryDate = entry.updated_at;
          }
        }
      });
      
      return Array.from(bookMap.values());
    } catch (error) {
      console.error('Error getting books with entries:', error);
      return [];
    }
  }

  /**
   * Delete all entries for a book
   * @param {string} bookId - Book ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAllEntriesForBook(bookId) {
    try {
      const allEntries = await this.getAllEntries();
      const filtered = allEntries.filter(entry => entry.book_id !== bookId);
      
      await this.saveAllEntries(filtered);
      
      return true;
    } catch (error) {
      console.error('Error deleting book entries:', error);
      throw error;
    }
  }

  /**
   * Clear all local diary data (use with caution!)
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    try {
      await AsyncStorage.removeItem(LOCAL_DIARY_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing local diary:', error);
      throw error;
    }
  }

  /**
   * Export all local entries as JSON (for backup)
   * @returns {Promise<string>} JSON string of all entries
   */
  async exportData() {
    try {
      const allEntries = await this.getAllEntries();
      return JSON.stringify(allEntries, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import entries from JSON (for restore)
   * @param {string} jsonData - JSON string of entries
   * @param {boolean} merge - Whether to merge with existing or replace
   * @returns {Promise<boolean>} Success status
   */
  async importData(jsonData, merge = true) {
    try {
      const importedEntries = JSON.parse(jsonData);
      
      if (merge) {
        const existingEntries = await this.getAllEntries();
        const allEntries = [...existingEntries, ...importedEntries];
        await this.saveAllEntries(allEntries);
      } else {
        await this.saveAllEntries(importedEntries);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Private helper methods

  async saveAllEntries(entries) {
    try {
      const jsonValue = JSON.stringify(entries);
      await AsyncStorage.setItem(LOCAL_DIARY_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving entries:', error);
      throw error;
    }
  }

  generateId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new LocalDiaryService();

#!/usr/bin/env node

/**
 * Test Script for AI Character Chat Feature
 * Tests the fine-tuning and chat endpoints
 * 
 * Usage:
 *   node test-ai-chat.js
 * 
 * Prerequisites:
 *   - Backend server running on http://localhost:5000
 *   - Valid JWT token (get from login)
 *   - OPENAI_API_KEY in backend/.env (optional - will test fallback mode)
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN = process.env.TEST_TOKEN || 'your-jwt-token-here';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test data
const testBook = {
  id: 'test_book_123',
  title: 'A Study in Scarlet',
  author: 'Arthur Conan Doyle',
  description: 'The first Sherlock Holmes novel featuring the brilliant detective and Dr. Watson'
};

const testCharacter = {
  name: 'Sherlock Holmes',
  description: 'Brilliant consulting detective known for deductive reasoning and keen observation'
};

let createdModelId = null;
let conversationId = null;

/**
 * Test 1: Create Author Fine-Tune
 */
async function testCreateAuthor() {
  console.log('\n📝 TEST 1: Create Author Fine-Tune');
  console.log('=====================================');
  
  try {
    const response = await api.post('/fine-tune/author', {
      authorName: testBook.author,
      bookId: testBook.id,
      bookInfo: {
        title: testBook.title,
        description: testBook.description,
        genre: 'Mystery'
      }
    });

    console.log('✅ Author fine-tune created');
    console.log('Model ID:', response.data.model.id);
    console.log('Status:', response.data.model.status);
    console.log('Estimated Time:', response.data.estimatedTime);
    
    createdModelId = response.data.model.id;
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Create Character Fine-Tune
 */
async function testCreateCharacter() {
  console.log('\n🎭 TEST 2: Create Character Fine-Tune');
  console.log('======================================');
  
  try {
    const response = await api.post('/fine-tune/character', {
      characterName: testCharacter.name,
      characterDescription: testCharacter.description,
      bookId: testBook.id,
      bookInfo: {
        title: testBook.title,
        author: testBook.author
      }
    });

    console.log('✅ Character fine-tune created');
    console.log('Model ID:', response.data.model.id);
    console.log('Status:', response.data.model.status);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 3: Quick Fine-Tune
 */
async function testQuickFineTune() {
  console.log('\n⚡ TEST 3: Quick Fine-Tune');
  console.log('==========================');
  
  try {
    const response = await api.post('/fine-tune/quick', {
      type: 'character',
      entityName: 'Dr. Watson',
      description: 'Army doctor and loyal friend of Sherlock Holmes',
      bookInfo: {
        title: testBook.title,
        author: testBook.author,
        description: testBook.description
      },
      bookId: testBook.id
    });

    console.log('✅ Quick fine-tune created');
    console.log('Model ID:', response.data.model.id);
    console.log('Quick Tune:', response.data.quickTune);
    console.log('Estimated Time:', response.data.estimatedTime);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 4: Check Model Status
 */
async function testCheckStatus() {
  console.log('\n🔍 TEST 4: Check Model Status');
  console.log('==============================');
  
  if (!createdModelId) {
    console.log('⚠️  Skipped: No model ID from previous test');
    return false;
  }
  
  try {
    const response = await api.get(`/fine-tune/status/${createdModelId}`);

    console.log('✅ Status retrieved');
    console.log('Status:', response.data.status);
    console.log('Ready:', response.data.ready);
    console.log('Model:', response.data.model.entity_name);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 5: Get All Models
 */
async function testGetModels() {
  console.log('\n📋 TEST 5: Get All Models');
  console.log('==========================');
  
  try {
    const response = await api.get('/fine-tune/models');

    console.log('✅ Models retrieved');
    console.log('Total Models:', response.data.models.length);
    
    response.data.models.forEach((model, index) => {
      console.log(`\nModel ${index + 1}:`);
      console.log('  Name:', model.entity_name);
      console.log('  Type:', model.type);
      console.log('  Status:', model.status);
      console.log('  Book:', model.books?.title || 'N/A');
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 6: Filter Models by Type
 */
async function testFilterModels() {
  console.log('\n🔎 TEST 6: Filter Models');
  console.log('=========================');
  
  try {
    const authorResponse = await api.get('/fine-tune/models', {
      params: { type: 'author' }
    });
    
    const characterResponse = await api.get('/fine-tune/models', {
      params: { type: 'character' }
    });

    console.log('✅ Filtered models retrieved');
    console.log('Authors:', authorResponse.data.models.length);
    console.log('Characters:', characterResponse.data.models.length);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 7: Chat with Model
 */
async function testChat() {
  console.log('\n💬 TEST 7: Chat with Model');
  console.log('===========================');
  
  if (!createdModelId) {
    console.log('⚠️  Skipped: No model ID from previous test');
    return false;
  }
  
  try {
    const response = await api.post(`/fine-tune/chat/${createdModelId}`, {
      message: 'What inspired you to create Sherlock Holmes?'
    });

    console.log('✅ Chat successful');
    console.log('Response:', response.data.response.substring(0, 150) + '...');
    console.log('Tokens Used:', response.data.tokensUsed);
    console.log('Using Fallback:', response.data.usingFallback);
    console.log('Conversation ID:', response.data.conversationId);
    
    conversationId = response.data.conversationId;
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 8: Continue Conversation
 */
async function testContinueConversation() {
  console.log('\n💬 TEST 8: Continue Conversation');
  console.log('=================================');
  
  if (!createdModelId || !conversationId) {
    console.log('⚠️  Skipped: No conversation ID from previous test');
    return false;
  }
  
  try {
    const response = await api.post(`/fine-tune/chat/${createdModelId}`, {
      message: 'What makes him different from other detectives?',
      conversationId
    });

    console.log('✅ Chat successful');
    console.log('Response:', response.data.response.substring(0, 150) + '...');
    console.log('Same Conversation:', response.data.conversationId === conversationId);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 9: Get Conversation History
 */
async function testGetConversations() {
  console.log('\n📜 TEST 9: Get Conversation History');
  console.log('====================================');
  
  if (!createdModelId) {
    console.log('⚠️  Skipped: No model ID from previous test');
    return false;
  }
  
  try {
    const response = await api.get(`/fine-tune/conversations/${createdModelId}`);

    console.log('✅ Conversations retrieved');
    console.log('Total Conversations:', response.data.conversations.length);
    
    if (response.data.conversations.length > 0) {
      const latest = response.data.conversations[0];
      console.log('\nLatest Conversation:');
      console.log('  ID:', latest.conversationId);
      console.log('  Messages:', latest.messages.length);
      console.log('  Started:', new Date(latest.startedAt).toLocaleString());
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 10: Delete Model (Optional - Cleanup)
 */
async function testDeleteModel() {
  console.log('\n🗑️  TEST 10: Delete Model (Optional)');
  console.log('=====================================');
  console.log('⚠️  Skipping delete to preserve test data');
  console.log('To delete manually: DELETE /api/fine-tune/' + createdModelId);
  
  return true;
  
  // Uncomment to actually delete:
  /*
  if (!createdModelId) {
    console.log('⚠️  Skipped: No model ID');
    return false;
  }
  
  try {
    const response = await api.delete(`/fine-tune/${createdModelId}`);
    console.log('✅ Model deleted');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
  */
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting AI Character Chat Tests');
  console.log('====================================');
  console.log('Base URL:', BASE_URL);
  console.log('Auth Token:', AUTH_TOKEN.substring(0, 20) + '...');
  
  if (AUTH_TOKEN === 'your-jwt-token-here') {
    console.error('\n❌ ERROR: Please set TEST_TOKEN environment variable');
    console.log('Usage: TEST_TOKEN=your-token node test-ai-chat.js');
    process.exit(1);
  }

  const tests = [
    testCreateAuthor,
    testCreateCharacter,
    testQuickFineTune,
    testCheckStatus,
    testGetModels,
    testFilterModels,
    testChat,
    testContinueConversation,
    testGetConversations,
    testDeleteModel
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n📊 Test Results');
  console.log('===============');
  console.log('✅ Passed:', passed);
  console.log('❌ Failed:', failed);
  console.log('Total:', tests.length);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check logs above.');
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testCreateAuthor,
  testCreateCharacter,
  testQuickFineTune,
  testCheckStatus,
  testGetModels,
  testFilterModels,
  testChat,
  testContinueConversation,
  testGetConversations,
  testDeleteModel
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, API_URL } from '../constants';
import { useAuth } from '../context/AuthContext.supabase';
import {
  MAX_MESSAGE_LENGTH,
  REQUEST_TIMEOUT,
  ERROR_MESSAGES,
  getUserFriendlyError,
  validateMessage,
  isAuthError
} from '../constants/appConstants';

export default function PrebuiltCharacterChatScreen({ route, navigation }) {
  const { character } = route.params;
  const { getAccessToken } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const scrollViewRef = useRef();

  useEffect(() => {
    navigation.setOptions({
      title: `${character.avatar} ${character.name}`,
    });
    loadConversationHistory();
  }, [character]);

  const loadConversationHistory = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(
        `${API_URL}/prebuilt-characters/${encodeURIComponent(character.id)}/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const conversations = await response.json();
        if (Array.isArray(conversations) && conversations.length > 0) {
          // Load most recent conversation
          const latest = conversations[0];
          setConversationId(latest.id);
          setMessages(Array.isArray(latest.messages) ? latest.messages : []);
        }
      } else if (response.status === 401) {
        Alert.alert('Session Expired', ERROR_MESSAGES.SESSION_EXPIRED, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      console.error('Load conversation error:', error);
      
      // Handle auth errors
      if (isAuthError(error)) {
        Alert.alert('Session Expired', ERROR_MESSAGES.SESSION_EXPIRED, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }
      
      // Show user-friendly error
      const userMessage = getUserFriendlyError(error);
      Alert.alert('Load Failed', userMessage);
    } finally {
      setLoadingHistory(false);
    }
  }, [character.id, getAccessToken, navigation]);

  const sendMessage = useCallback(async () => {
    if (loading) return;

    const userMessage = inputText.trim();
    
    // Validate message using centralized validation
    const validation = validateMessage(userMessage);
    if (!validation.valid) {
      Alert.alert('Invalid Message', validation.error);
      return;
    }

    setInputText('');
    setLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(
        `${API_URL}/prebuilt-characters/${encodeURIComponent(character.id)}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: conversationId
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `Server error: ${response.status}`);
        error.status = response.status;
        error.response = { data: errorData };
        throw error;
      }

      const data = await response.json();
      
      // Validate response
      if (!data.message || typeof data.message !== 'string') {
        throw new Error('Invalid response format');
      }

      // Update conversation ID if new
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Send message error:', error);
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      
      // Handle auth errors by navigating to login
      if (isAuthError(error)) {
        Alert.alert('Session Expired', ERROR_MESSAGES.SESSION_EXPIRED, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }
      
      // Get user-friendly error message
      const userMessage = getUserFriendlyError(error);
      Alert.alert('Message Failed', userMessage);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, conversationId, character.id, getAccessToken, navigation]);

  // Memoized message component for performance
  const MessageBubble = React.memo(({ message, isUser, avatar }) => {
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}
      >
        {!isUser && (
          <Text style={styles.characterAvatar}>{avatar}</Text>
        )}
        <View style={[
          styles.messageContent,
          isUser ? styles.userContent : styles.assistantContent
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  });

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    return (
      <MessageBubble 
        key={index} 
        message={message} 
        isUser={isUser} 
        avatar={character.avatar}
      />
    );
  };

  // Memoized starter prompt component
  const StarterPrompt = React.memo(({ prompt, onPress }) => (
    <TouchableOpacity
      style={styles.starterPrompt}
      onPress={() => onPress(prompt)}
    >
      <Text style={styles.starterPromptText}>{prompt}</Text>
    </TouchableOpacity>
  ));

  const starterPrompts = [
    `Tell me about yourself`,
    `What's your greatest adventure?`,
    `What advice would you give me?`,
    `Share a memory from your story`
  ];

  const handlePromptPress = useCallback((prompt) => {
    setInputText(prompt);
  }, []);

  if (loadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{character.name}</Text>
        <Text style={styles.headerSubtitle}>{character.description}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✨ Pre-built Character</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{character.avatar}</Text>
            <Text style={styles.emptyTitle}>Start a conversation with {character.name}</Text>
            <Text style={styles.emptySubtitle}>{character.background}</Text>
            
            <Text style={styles.promptsTitle}>Try asking:</Text>
            {starterPrompts.map((prompt, index) => (
              <StarterPrompt
                key={index}
                prompt={prompt}
                onPress={handlePromptPress}
              />
            ))}
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}

        {loading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.characterAvatar}>{character.avatar}</Text>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Typing...</Text>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Message ${character.name}...`}
          placeholderTextColor={COLORS.mediumGray}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          editable={!loading}
          autoCorrect
          autoCapitalize="sentences"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.lightPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  starterPrompt: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  starterPromptText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  characterAvatar: {
    fontSize: 32,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userContent: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantContent: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  typingText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
    color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
});

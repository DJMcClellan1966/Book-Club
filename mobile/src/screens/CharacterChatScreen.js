import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

/**
 * CharacterChatScreen
 * Chat interface for talking with fine-tuned AI versions of authors and characters
 */
const CharacterChatScreen = ({ route, navigation }) => {
  const { modelId, entityName, entityType, bookTitle } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Chat with ${entityName}`,
      headerRight: () => (
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Alert.alert(
            entityType === 'author' ? 'Author Chat' : 'Character Chat',
            `You're chatting with an AI version of ${entityName} from "${bookTitle}". The AI has been trained to respond in their voice and style.`
          )}
        >
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [entityName, entityType, bookTitle]);

  useEffect(() => {
    checkModelStatus();
    loadConversationHistory();
  }, [modelId]);

  /**
   * Check if model training is complete
   */
  const checkModelStatus = async () => {
    try {
      const response = await api.get(`/fine-tune/status/${modelId}`);
      setModelStatus(response.data);

      if (response.data.status === 'training' || response.data.status === 'pending') {
        // Poll status every 10 seconds if still training
        setTimeout(checkModelStatus, 10000);
      }
    } catch (error) {
      console.error('Error checking model status:', error);
    }
  };

  /**
   * Load existing conversation history
   */
  const loadConversationHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/fine-tune/conversations/${modelId}`);
      
      if (response.data.conversations && response.data.conversations.length > 0) {
        // Load most recent conversation
        const latest = response.data.conversations[0];
        setConversationId(latest.conversationId);
        
        // Format messages
        const formattedMessages = latest.messages.map((msg, index) => ([
          {
            id: `${index}-user`,
            text: msg.user,
            sender: 'user',
            timestamp: msg.timestamp,
          },
          {
            id: `${index}-ai`,
            text: msg.assistant,
            sender: 'ai',
            timestamp: msg.timestamp,
          }
        ])).flat();
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send message to AI
   */
  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    if (modelStatus?.status !== 'completed' && modelStatus?.status !== 'ready') {
      Alert.alert(
        'Model Not Ready',
        'The AI model is still training. Please wait a few minutes and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSending(true);

    try {
      const response = await api.post(`/fine-tune/chat/${modelId}`, {
        message: userMessage.text,
        conversationId,
      });

      if (!conversationId) {
        setConversationId(response.data.conversationId);
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        usingFallback: response.data.usingFallback,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.',
        [{ text: 'OK' }]
      );
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  /**
   * Render individual message
   */
  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.aiText
          ]}>
            {item.text}
          </Text>
          {item.usingFallback && (
            <Text style={styles.fallbackNote}>
              ⚠️ Using general AI (fine-tuned model unavailable)
            </Text>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render training status banner
   */
  const renderTrainingBanner = () => {
    if (!modelStatus) return null;

    if (modelStatus.status === 'training' || modelStatus.status === 'pending') {
      return (
        <View style={styles.trainingBanner}>
          <ActivityIndicator color={COLORS.white} style={styles.trainingSpinner} />
          <Text style={styles.trainingText}>
            AI model is training... This usually takes 20-40 minutes.
          </Text>
        </View>
      );
    }

    if (modelStatus.status === 'failed') {
      return (
        <View style={[styles.trainingBanner, styles.errorBanner]}>
          <Ionicons name="alert-circle" size={20} color={COLORS.white} />
          <Text style={styles.trainingText}>
            Training failed. Using general AI instead.
          </Text>
        </View>
      );
    }

    return null;
  };

  /**
   * Starter prompts for new conversations
   */
  const starterPrompts = entityType === 'author' ? [
    'What inspired you to write this book?',
    'Can you tell me about your writing process?',
    'What themes are most important in your work?',
  ] : [
    `Tell me about yourself, ${entityName}.`,
    'What do you want most in life?',
    'Who is the most important person to you?',
  ];

  const renderStarterPrompt = (prompt) => (
    <TouchableOpacity
      key={prompt}
      style={styles.starterPrompt}
      onPress={() => setInputText(prompt)}
    >
      <Text style={styles.starterPromptText}>{prompt}</Text>
    </TouchableOpacity>
  );

  if (loading) {
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderTrainingBanner()}

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={entityType === 'author' ? 'create-outline' : 'person-outline'}
            size={64}
            color={COLORS.lightGray}
          />
          <Text style={styles.emptyTitle}>
            Start chatting with {entityName}
          </Text>
          <Text style={styles.emptySubtitle}>
            {entityType === 'author' 
              ? `Ask about their writing, inspirations, and creative process.`
              : `Explore their personality, motivations, and story.`
            }
          </Text>

          <View style={styles.starterPromptsContainer}>
            <Text style={styles.starterPromptsTitle}>Try asking:</Text>
            {starterPrompts.map(renderStarterPrompt)}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Message ${entityName}...`}
          placeholderTextColor={COLORS.mediumGray}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

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
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.mediumGray,
  },
  infoButton: {
    marginRight: SPACING.md,
  },
  trainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorBanner: {
    backgroundColor: COLORS.error,
  },
  trainingSpinner: {
    marginRight: SPACING.sm,
  },
  trainingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.mediumGray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  starterPromptsContainer: {
    marginTop: SPACING.xl,
    width: '100%',
  },
  starterPromptsTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  starterPrompt: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  starterPromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  messageContainer: {
    marginVertical: SPACING.xs,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    ...TYPOGRAPHY.body,
  },
  userText: {
    color: COLORS.white,
  },
  aiText: {
    color: COLORS.text,
  },
  fallbackNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 20,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
});

export default CharacterChatScreen;

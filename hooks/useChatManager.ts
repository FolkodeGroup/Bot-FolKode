
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { Message, Language, User, AnalyticsData, MeetingDetails, ProjectScope } from '../types';
import { geminiService } from '../services/geminiService';
import { backendService } from '../services/backendService';
import { personalityService } from '../services/personalityService';
import { locales } from '../i18n/locales';
import { useSpeech } from './useSpeech';

interface UseChatManagerProps {
  language: Language | null;
  user: User | null;
  isConversationMode: boolean;
  onAnalyticsUpdate: (updater: (prev: AnalyticsData) => AnalyticsData) => void;
  onSessionRestart: () => void;
}

export const useChatManager = ({ language, user, isConversationMode, onAnalyticsUpdate, onSessionRestart }: UseChatManagerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isChatEnded, setIsChatEnded] = useState<boolean>(false);
  const [showGoodbyeScreen, setShowGoodbyeScreen] = useState<boolean>(false);
  
  // Refs to hold the latest state for use in callbacks, preventing stale closures.
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const isSummarizingRef = useRef(isSummarizing);
  isSummarizingRef.current = isSummarizing;
  const isChatEndedRef = useRef(isChatEnded);
  isChatEndedRef.current = isChatEnded;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  
  const inactivityTimerRef = useRef<number | null>(null);

  const handleEndChat = useCallback(async (meetingDetails?: MeetingDetails, finalUser?: User) => {
    const userForReport = finalUser || user;
    if (!userForReport || !language || isSummarizingRef.current || isChatEndedRef.current) return;

    setIsSummarizing(true);
    try {
      const finalMessages = messagesRef.current;
      const summaryReport = await geminiService.generateSummary(finalMessages, language);
      
      const summaryMessage: Message = {
        id: `bot-summary-${Date.now()}`,
        sender: 'bot',
        text: '',
        summaryReport,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, summaryMessage]);
      await backendService.sendFullChatReport(userForReport, [...finalMessages, summaryMessage], summaryReport, meetingDetails);

    } catch (error) {
      console.error("Failed to generate summary or send report:", error);
      await backendService.sendFullChatReport(userForReport, messages, {
        summary: `Error generating summary: ${error instanceof Error ? error.message : 'Unknown Error'}`,
        tags: ["Error"],
        temperature: "Cold"
      }, meetingDetails);
    } finally {
      setIsSummarizing(false);
      setIsChatEnded(true);
      setShowGoodbyeScreen(true);
    }
  }, [user, language]);


  const handleSendMessage = useCallback(async (text: string, file?: {name: string, dataUrl: string, mimeType: string}) => {
    if (!chatSession || !language || !user || isLoadingRef.current || isChatEndedRef.current) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      file,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = `bot-${Date.now()}`;
    let firstChunkReceived = false;
    
    const personalityPrefix = personalityService.getPersonalityPrefix(text);

    const handleMessageCompletion = (fullText: string) => {
      const schedulerRegex = /\{"component":\s*"MeetingScheduler"\}/;
      if (schedulerRegex.test(fullText)) {
        const componentMessage: Message = {
          id: `bot-component-${Date.now()}`,
          sender: 'bot',
          text: '', 
          component: 'MeetingScheduler',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, componentMessage]);
      } else {
        speak(fullText.replace(/👉\s*\[[^\]]+\]/g, ''));
      }
    };

try {
  await geminiService.sendMessageStream(chatSession, userMessage, personalityPrefix, (chunk) => {
      if (!firstChunkReceived) {
          const newBotMessage: Message = {
              id: botMessageId,
              sender: 'bot',
              text: chunk,
              timestamp: Date.now(),
          };
          setMessages(prev => [...prev, newBotMessage]);
          firstChunkReceived = true;
      } else {
          setMessages(prev => prev.map(msg => 
              msg.id === botMessageId ? { ...msg, text: (msg.text || '') + chunk } : msg
          ));
      }
  }, (fullText) => {
      setIsLoading(false);
      setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
      const finalBotMessage: Message = {
          id: botMessageId,
          sender: 'bot',
          text: fullText,
          timestamp: Date.now(),
      };
      setMessages(prev => [...prev, finalBotMessage]);
      handleMessageCompletion(fullText);
  });
} catch (error) {
  console.error('❌ Error al conectar con Gemini API:', error);
  setIsLoading(false);
  
  // Remover mensaje de loading si existe
  setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
  
  // Mostrar mensaje de error al usuario
  const errorMessage: Message = {
    id: `bot-error-${Date.now()}`,
    sender: 'bot',
    text: language ? 
      `❌ Error de conexión con la IA. Posibles causas:\n• API key inválida o expirada\n• Límite de uso excedido\n• Problema de conectividad\n\nVerifica tu GEMINI_API_KEY en .env.local` :
      `❌ AI connection error. Check your GEMINI_API_KEY in .env.local`,
    timestamp: Date.now(),
  };
  setMessages(prev => [...prev, errorMessage]);
}

  }, [chatSession, language, user]);
  
  const { isListening, startListening, speak } = useSpeech(language, handleSendMessage, isConversationMode);

  const startProjectWizard = useCallback(() => {
    if (!language) return;
    const wizardMessage: Message = {
      id: `bot-wizard-${Date.now()}`,
      sender: 'bot',
      text: '',
      component: 'ProjectScopingWizard',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev.filter(m => !m.text?.includes(locales.defineProjectSuggestion[language!])), wizardMessage]);
  }, [language]);

  const handleScopeSubmit = useCallback((scope: ProjectScope) => {
    if (!language) return;
    setMessages(prev => prev.filter(m => m.component !== 'ProjectScopingWizard'));
    
    const scopeSummary = locales.wizardSummaryForAI[language]
      .replace('{projectType}', scope.projectType)
      .replace('{audience}', scope.audience)
      .replace('{features}', scope.features.join(', '))
      .replace('{extraDetails}', scope.extraDetails || 'N/A');
      
    handleSendMessage(scopeSummary);
  }, [language, locales, handleSendMessage]);


  const handleMeetingScheduled = useCallback((details: MeetingDetails) => {
    if (!user || !language) return;

    const updatedUser: User = { ...user, contactMethod: details.contactMethod, contactInfo: details.contactInfo };

    const botResponseText = locales.schedulerBotConfirmation[language]
      .replace('{timeSlot}', details.timeSlot)
      .replace('{contactMethod}', details.contactMethod);
      
    const botResponse: Message = {
      id: `bot-confirm-${Date.now()}`,
      sender: 'bot',
      text: botResponseText,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev.filter(m => !m.component), botResponse]);
    speak(botResponseText);

    setTimeout(() => {
        handleEndChat(details, updatedUser);
    }, 1500);

  }, [user, language, locales, speak, handleEndChat]);

  // --- Effects for Initialization and Session Management ---

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('chatSession');
      if (savedState) {
        const { messages, isChatEnded, showGoodbyeScreen } = JSON.parse(savedState);
        if (messages) setMessages(messages);
        if (isChatEnded) setIsChatEnded(isChatEnded);
        if (showGoodbyeScreen) setShowGoodbyeScreen(showGoodbyeScreen);
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage", error);
    }
  }, []);

  useEffect(() => {
    const stateToSave = JSON.stringify({ language, user, messages, isChatEnded, showGoodbyeScreen });
    localStorage.setItem('chatSession', stateToSave);
  }, [messages, isChatEnded, showGoodbyeScreen, language, user]);

  useEffect(() => {
    if (user && language && !chatSession && !isChatEndedRef.current) {
      const history = messagesRef.current.filter(m => m.sender === 'user' || (m.sender === 'bot' && !m.text?.includes(locales.chatStartError[language]))).map(m => geminiService.messageToContent(m));
      const newChat = geminiService.startChat(history, language, user.name);
      setChatSession(newChat);

      if (messagesRef.current.length === 0) {
        const initialMessageText = locales.initialBotGreeting[language].replace('{name}', user.name);
        const initialMessage: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: initialMessageText,
          timestamp: Date.now(),
        };
        setMessages([initialMessage]);
        speak(initialMessageText.replace(/👉\s*\[[^\]]+\]/g, ''));
      }
    }
  }, [user, language, chatSession]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    if (isLoadingRef.current || isChatEndedRef.current || isListening) return;

    inactivityTimerRef.current = window.setTimeout(() => {
      const currentMessages = messagesRef.current;
      if (!isLoadingRef.current && currentMessages.length > 0 && currentMessages[currentMessages.length - 1].sender === 'user' && language) {
        const proactiveMessage: Message = {
          id: `bot-proactive-${Date.now()}`,
          sender: 'bot',
          text: locales.proactivePrompt[language],
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, proactiveMessage]);
        speak(locales.proactivePrompt[language]);
      }
    }, 60000); 
  }, [isListening, language, locales, speak]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    };
  }, [messages, isLoading, resetInactivityTimer]);

  const handleFeedback = useCallback((messageId: string, feedback: 'like' | 'dislike') => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.feedback === undefined) {
          onAnalyticsUpdate(prevAnalytics => ({
            ...prevAnalytics,
            feedback: {
              ...prevAnalytics.feedback,
              likes: prevAnalytics.feedback.likes + (feedback === 'like' ? 1 : 0),
              dislikes: prevAnalytics.feedback.dislikes + (feedback === 'dislike' ? 1 : 0),
            }
          }));
          return { ...msg, feedback };
        }
        return msg;
      })
    );
  }, [onAnalyticsUpdate]);

  const handleViewConversation = () => {
    setShowGoodbyeScreen(false);
  };
  
  const restartChat = () => {
    setMessages([]);
    setChatSession(null);
    setIsLoading(false);
    setIsSummarizing(false);
    setIsChatEnded(false);
    setShowGoodbyeScreen(false);
    localStorage.removeItem('chatSession');
    onSessionRestart();
  };
  
  return {
    messages,
    isLoading,
    isSummarizing,
    isChatEnded,
    isListening,
    showGoodbyeScreen,
    handleSendMessage,
    handleEndChat,
    handleFeedback,
    handleMeetingScheduled,
    startListening,
    startProjectWizard,
    handleScopeSubmit,
    handleViewConversation,
    restartChat,
  };
};

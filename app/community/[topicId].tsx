import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../utils/i18n';

interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface TopicDetail {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  category: string;
  likes: number;
  replies: Reply[];
}

export default function TopicDetailScreen() {
  const { topicId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/(public)/login');
      return;
    }

    // Simuler le chargement du détail du sujet
    setTimeout(() => {
      setTopic({
        id: topicId as string,
        title: 'Meilleures pratiques pour l\'irrigation du maïs',
        content: 'Bonjour à tous ! Je cultive du maïs depuis 5 ans et j\'aimerais partager mes expériences sur l\'irrigation efficace, surtout pendant la saison sèche. Quelles sont vos techniques préférées ?',
        author: 'Agriculteur Pro',
        timestamp: '2h',
        category: 'Irrigation',
        likes: 8,
        replies: [
          {
            id: '1',
            author: 'Expert Agro',
            content: 'Excellente question ! Je recommande l\'irrigation goutte à goutte pour économiser l\'eau.',
            timestamp: '1h',
            likes: 3
          },
          {
            id: '2',
            author: 'EcoFarmer',
            content: 'J\'utilise un système de mulching pour conserver l\'humidité du sol. Très efficace !',
            timestamp: '45min',
            likes: 5
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [currentUser, topicId]);

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;

    setSubmitting(true);
    // Simuler l'envoi de la réponse
    setTimeout(() => {
      const reply: Reply = {
        id: Date.now().toString(),
        author: currentUser?.displayName || 'Utilisateur',
        content: newReply,
        timestamp: 'maintenant',
        likes: 0
      };

      setTopic(prev => prev ? {
        ...prev,
        replies: [...prev.replies, reply]
      } : null);

      setNewReply('');
      setSubmitting(false);
    }, 1000);
  };

  const renderReply = (reply: Reply) => (
    <View key={reply.id} style={styles.replyCard}>
      <View style={styles.replyHeader}>
        <Text style={styles.replyAuthor}>{reply.author}</Text>
        <Text style={styles.replyTimestamp}>{reply.timestamp}</Text>
      </View>
      <Text style={styles.replyContent}>{reply.content}</Text>
      <TouchableOpacity style={styles.likeButton}>
        <Ionicons name="heart-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.likeCount}>{reply.likes}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement de la discussion...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!topic) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Discussion non trouvée</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {topic.title}
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          {/* Topic Content */}
          <View style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <View style={styles.authorInfo}>
                <Text style={styles.topicAuthor}>{topic.author}</Text>
                <Text style={styles.topicTimestamp}>{topic.timestamp}</Text>
              </View>
              <Text style={styles.categoryBadge}>{topic.category}</Text>
            </View>
            <Text style={styles.topicContent}>{topic.content}</Text>
            <View style={styles.topicActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.actionText}>{topic.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.actionText}>{topic.replies.length}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Replies */}
          <Text style={styles.repliesTitle}>Réponses ({topic.replies.length})</Text>
          {topic.replies.map(renderReply)}
        </ScrollView>

        {/* Reply Input */}
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Écrivez votre réponse..."
            value={newReply}
            onChangeText={setNewReply}
            multiline
            maxLength={500}
            placeholderTextColor={Colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newReply.trim() || submitting) && styles.sendButtonDisabled]}
            onPress={handleSubmitReply}
            disabled={!newReply.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginHorizontal: 8,
  },
  shareButton: {
    padding: 8,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topicCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  topicAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  topicTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topicContent: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  topicActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  replyCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  replyTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  replyContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
});
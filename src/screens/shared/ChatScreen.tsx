import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { listMessages, sendMessage } from '../../lib/api';
import { roleColors } from '../../lib/format';
import { Colors, Spacing, Typography, Radius } from '../../constants/tokens';
import { Message } from '../../types';
import { EmptyState, ErrorText, Loader, ui } from '../../components/ui';

// Used by every stack that has a `Chat: { applicationId, title }` route.
export default function ChatScreen({ navigation, route }: any) {
  const { applicationId, title } = route.params as { applicationId: string; title: string };
  const { profile, role } = useAuth();
  const accent = roleColors(role ?? 'candidate').main;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useEffect(() => {
    const addMessage = (m: Message) =>
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));

    listMessages(applicationId)
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    // Live updates when the other person sends a message.
    const channel = supabase
      .channel(`messages:${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => addMessage(payload.new as Message),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  async function handleSend() {
    const content = text.trim();
    if (!content || !profile) return;
    setSending(true);
    try {
      const m = await sendMessage(applicationId, profile.id, content);
      setText('');
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ErrorText message={error} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <EmptyState icon="chatbubbles-outline" title="No messages yet" message="Say hello 👋" />
        }
        renderItem={({ item }) => {
          const mine = item.sender_id === profile?.id;
          return (
            <View style={[styles.bubble, mine ? [styles.mine, { backgroundColor: accent }] : styles.theirs]}>
              <Text style={[styles.bubbleText, mine && { color: Colors.textInverse }]}>{item.content}</Text>
              <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.75)' }]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: accent }, !text.trim() && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {sending ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <Ionicons name="send" size={18} color={Colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: Typography.size.base, color: Colors.textPrimary },
  time: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  sendBtn: { width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
});

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface Message {
  id: number;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onClose: () => void;
  userRole: string | null;
}

export default function AIAssistant({ onClose, userRole }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: `Hello! I’m your AI assistant.\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const quickQuestions = [
    "Show my assignments",
    "Check attendance",
    "Upcoming events?",
    "Summarize today's lectures",
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        type: "ai",
        content: `You asked: "${userMsg.content}".\nAI response will be added here.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 900);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.overlay}>
      <View style={styles.chatBox}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Assistant</Text>

          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={styles.messagesArea}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.type === "user" ? styles.userRow : styles.aiRow,
              ]}
            >
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  msg.type === "ai" ? styles.aiAvatar : styles.userAvatar,
                ]}
              >
                <Feather
                  name={msg.type === "ai" ? "cpu" : "user"}
                  size={16}
                  color={msg.type === "ai" ? "#2563eb" : "#4b5563"}
                />
              </View>

              {/* Bubble */}
              <View
                style={[
                  styles.bubble,
                  msg.type === "ai" ? styles.aiBubble : styles.userBubble,
                ]}
              >
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>

              {/* Time */}
              <Text style={styles.time}>
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <View style={styles.quickContainer}>
            <Text style={styles.quickLabel}>Quick questions:</Text>

            <View style={styles.quickList}>
              {quickQuestions.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setInput(q)}
                  style={styles.quickButton}
                >
                  <Text style={styles.quickButtonText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type your question..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim()}
            style={[
              styles.sendButton,
              !input.trim() && styles.sendButtonDisabled,
            ]}
          >
            <Feather
              name="send"
              size={20}
              color={!input.trim() ? "#9ca3af" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  chatBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingBottom: 10,
    height: "85%",
    overflow: "hidden",
  },

  // Header
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  // Messages
  messagesArea: {
    flex: 1,
    padding: 16,
  },
  messageRow: {
    marginBottom: 18,
  },

  aiRow: {
    alignItems: "flex-start",
  },
  userRow: {
    alignItems: "flex-end",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  aiAvatar: {
    backgroundColor: "#dbeafe",
  },
  userAvatar: {
    backgroundColor: "#e5e7eb",
  },

  bubble: {
    padding: 12,
    borderRadius: 15,
    maxWidth: "80%",
  },
  aiBubble: {
    backgroundColor: "#f3f4f6",
  },
  userBubble: {
    backgroundColor: "#2563eb",
  },

  messageText: {
    color: "#1f2937",
    fontSize: 14,
  },
  time: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },

  // Quick Questions
  quickContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  quickLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  quickList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  quickButtonText: {
    fontSize: 13,
    color: "#374151",
  },

  // Input Area
  inputArea: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
  },

  sendButton: {
    marginLeft: 10,
    padding: 12,
    backgroundColor: "#2563eb",
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
});

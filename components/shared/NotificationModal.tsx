import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppNotification } from "../../contexts/AppDataContext";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onDelete: (id: string | number) => void;
  onClearAll: () => void;
  filterRecipient?: "all" | "students" | "teachers" | "parents";
}

export function NotificationModal({
  visible,
  onClose,
  notifications,
  onDelete,
  onClearAll,
  filterRecipient,
}: NotificationModalProps) {
  const filteredNotifications = filterRecipient
    ? notifications.filter(
        (n) =>
          !n.recipient ||
          n.recipient === "all" ||
          n.recipient === filterRecipient
      )
    : notifications;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="bell-off" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            ) : (
              filteredNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.item}
                  onPress={() => {
                    Alert.alert(notification.title, `Time: ${notification.time}`);
                  }}
                >
                  <View
                    style={[
                      styles.icon,
                      notification.type === "success" && styles.iconSuccess,
                      notification.type === "warning" && styles.iconWarning,
                    ]}
                  >
                    <Feather
                      name={
                        notification.type === "success"
                          ? "check-circle"
                          : notification.type === "warning"
                          ? "alert-triangle"
                          : "bell"
                      }
                      size={18}
                      color={
                        notification.type === "success"
                          ? "#10b981"
                          : notification.type === "warning"
                          ? "#f59e0b"
                          : "#2563eb"
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{notification.title}</Text>
                    <Text style={styles.itemTime}>{notification.time}</Text>
                    {notification.message && (
                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                    }}
                  >
                    <Feather name="x" size={14} color="#9ca3af" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {filteredNotifications.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={onClearAll}>
              <Text style={styles.clearBtnText}>Mark All as Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    maxHeight: 400,
    padding: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconSuccess: {
    backgroundColor: "#dcfce7",
  },
  iconWarning: {
    backgroundColor: "#fef3c7",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  itemMessage: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 8,
  },
  clearBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
  },
  clearBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});


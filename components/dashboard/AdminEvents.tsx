import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Event {
  id: number;
  event: string;
  date: string;
  attendees: string;
  dateValue?: Date;
}

interface AdminEventsProps {
  onCreateEvent: (event: Omit<Event, "id">) => void;
}

export function AdminEvents({ onCreateEvent }: AdminEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    event: "",
    date: "",
    attendees: "",
  });

  // Auto-cleanup past events
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) =>
        prev.filter((item) => {
          if (item.dateValue) {
            return item.dateValue > new Date();
          }
          return true;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateEvent = () => {
    if (!eventForm.event || !eventForm.date || !eventForm.attendees) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    // Parse date input - try to parse as date string first, otherwise default to tomorrow
    let dateValue = new Date();
    const dateStr = eventForm.date.toLowerCase().trim();
    
    // Check for common date keywords
    if (dateStr.includes("tomorrow")) {
      dateValue = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (dateStr.includes("today")) {
      dateValue = new Date();
    } else {
      // Try to parse as actual date
      const parsed = new Date(eventForm.date);
      if (!isNaN(parsed.getTime())) {
        dateValue = parsed;
      } else {
        // If parsing fails, default to tomorrow
        dateValue = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }

    const newEvent: Event = {
      id: Date.now(),
      event: eventForm.event,
      date: eventForm.date,
      attendees: eventForm.attendees,
      dateValue: dateValue,
    };

    setEvents((prev) => [...prev, newEvent]);
    onCreateEvent(newEvent);
    setEventForm({ event: "", date: "", attendees: "" });
    setShowEventModal(false);
    Alert.alert("Success", "Event created successfully!");
  };

  return (
    <>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>

      {events
        .filter((item) => {
          if (item.dateValue) {
            return item.dateValue > new Date();
          }
          // If no dateValue, try to parse the date string
          try {
            const parsed = new Date(item.date);
            if (!isNaN(parsed.getTime())) {
              return parsed > new Date();
            }
          } catch {
            // If parsing fails, keep the event (it might be a relative date like "tomorrow")
            return true;
          }
          return true;
        })
        .map((item) => (
          <View key={item.id} style={styles.eventBox}>
            <View style={styles.eventHeader}>
              <Feather name="calendar" size={20} color="#2563eb" />
              <Text style={styles.eventTitle}>{item.event}</Text>
            </View>
            <Text style={styles.eventDate}>{item.date}</Text>
            <Text style={styles.eventAttendees}>{item.attendees}</Text>
          </View>
        ))}

      {events.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No events scheduled</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addEventBtn}
        onPress={() => {
          setEventForm({ event: "", date: "", attendees: "" });
          setShowEventModal(true);
        }}
      >
        <Feather name="plus" size={18} color="#2563eb" />
        <Text style={styles.addEventText}>Add New Event</Text>
      </TouchableOpacity>

      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEventModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Add New Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Name"
              value={eventForm.event}
              onChangeText={(text) => setEventForm({ ...eventForm, event: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date & Time (e.g., Tomorrow, 2:00 PM)"
              value={eventForm.date}
              onChangeText={(text) => setEventForm({ ...eventForm, date: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Attendees (e.g., 45 attendees)"
              value={eventForm.attendees}
              onChangeText={(text) => setEventForm({ ...eventForm, attendees: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleCreateEvent}
              >
                <Text style={styles.modalButtonTextSave}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },
  eventBox: {
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  eventDate: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 3,
  },
  eventAttendees: {
    fontSize: 13,
    color: "#4b5563",
    marginTop: 3,
  },
  addEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  addEventText: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonSave: {
    backgroundColor: "#2563eb",
  },
  modalButtonTextCancel: {
    color: "#374151",
    fontWeight: "600",
  },
  modalButtonTextSave: {
    color: "white",
    fontWeight: "600",
  },
});


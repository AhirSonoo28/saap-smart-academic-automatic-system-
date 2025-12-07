import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@admin_events";

interface Event {
  id: number;
  event: string;
  date: string;       // original user input (for display)
  attendees: string;
  dateValue: Date;    // parsed date for logic
}

interface AdminEventsProps {
  onCreateEvent?: (event: Event) => void;
}

export function AdminEvents({ onCreateEvent }: AdminEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    event: "",
    date: "",
    attendees: "",
  });

  // ---------- Helpers ----------

  const parseDateFromInput = (input: string): Date => {
    const lower = input.toLowerCase().trim();
    const now = new Date();

    if (lower.includes("tomorrow")) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    if (lower.includes("today")) {
      return now;
    }

    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // fallback: tomorrow
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  };

  const loadEvents = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;

      const raw = JSON.parse(json) as Array<
        Omit<Event, "dateValue"> & { dateValue?: string }
      >;

      const restored: Event[] = raw.map((item) => ({
        ...item,
        dateValue: item.dateValue
          ? new Date(item.dateValue)
          : parseDateFromInput(item.date),
      }));

      setEvents(restored);
    } catch (error) {
      console.warn("Failed to load events:", error);
    }
  }, []);

  const saveEvents = useCallback(async (list: Event[]) => {
    try {
      const serializable = list.map((e) => ({
        ...e,
        dateValue: e.dateValue.toISOString(),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.warn("Failed to save events:", error);
    }
  }, []);

  // ---------- Effects ----------

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Persist whenever events change
  useEffect(() => {
    if (events.length === 0) {
      // Still save empty to clear old data
      saveEvents([]);
    } else {
      saveEvents(events);
    }
  }, [events, saveEvents]);

  // ---------- Actions ----------

  const handleCreateEvent = () => {
    if (!eventForm.event || !eventForm.date || !eventForm.attendees) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const dateValue = parseDateFromInput(eventForm.date);

    const newEvent: Event = {
      id: Date.now(),
      event: eventForm.event.trim(),
      date: eventForm.date.trim(),
      attendees: eventForm.attendees.trim(),
      dateValue,
    };

    setEvents((prev) => [...prev, newEvent]);
    onCreateEvent?.(newEvent);

    setEventForm({ event: "", date: "", attendees: "" });
    setShowEventModal(false);
    Alert.alert("Success", "Event created successfully!");
  };

  const handleDeleteEvent = (id: number) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setEvents((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  };

  // ---------- Derived lists ----------

  const now = new Date();
  const upcomingEvents = events
    .filter((e) => e.dateValue >= now)
    .sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());

  const pastEvents = events
    .filter((e) => e.dateValue < now)
    .sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime());

  // ---------- UI ----------

  return (
    <>
      {/* Upcoming Events */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>

      {upcomingEvents.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      )}

      {upcomingEvents.map((item) => (
        <EventCard
          key={item.id}
          event={item}
          onDelete={() => handleDeleteEvent(item.id)}
        />
      ))}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Past Events
          </Text>

          {pastEvents.map((item) => (
            <EventCard
              key={item.id}
              event={item}
              onDelete={() => handleDeleteEvent(item.id)}
              isPast
            />
          ))}
        </>
      )}

      {/* Add Event Button */}
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

      {/* Modal */}
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
              onChangeText={(text) =>
                setEventForm((prev) => ({ ...prev, event: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Date & Time (e.g., 25 Dec 2025, 2:00 PM / Tomorrow)"
              value={eventForm.date}
              onChangeText={(text) =>
                setEventForm((prev) => ({ ...prev, date: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Attendees (e.g., 45 attendees)"
              value={eventForm.attendees}
              onChangeText={(text) =>
                setEventForm((prev) => ({ ...prev, attendees: text }))
              }
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

// ---------- Event Card component ----------

interface EventCardProps {
  event: Event;
  onDelete: () => void;
  isPast?: boolean;
}

function EventCard({ event, onDelete, isPast }: EventCardProps) {
  return (
    <View
      style={[
        styles.eventBox,
        isPast && { backgroundColor: "#f9fafb", opacity: 0.9 },
      ]}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventHeaderLeft}>
          <Feather
            name="calendar"
            size={20}
            color={isPast ? "#6b7280" : "#2563eb"}
          />
          <Text style={styles.eventTitle}>{event.event}</Text>
        </View>

        <TouchableOpacity onPress={onDelete} hitSlop={8}>
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.eventDate}>{event.date}</Text>
      <Text style={styles.eventAttendees}>{event.attendees}</Text>
    </View>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
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
    justifyContent: "space-between",
    marginBottom: 4,
  },
  eventHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    marginTop: 16,
  },
  addEventText: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
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

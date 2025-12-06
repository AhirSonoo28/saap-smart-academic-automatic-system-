import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Course, Student } from "../../contexts/AppDataContext";

interface StudentsByYearProps {
  students: Student[];
  courses: Course[];
  onAssignCourses: (year: string) => void;
}

export function StudentsByYear({
  students,
  courses,
  onAssignCourses,
}: StudentsByYearProps) {
  const years = ["Year 1", "Year 2", "Year 3", "Year 4"];

  const getYearData = (year: string) => {
    const yearStudents = students.filter((s) => s.year === year);
    const yearCourses = courses.filter((c) => c.year === year);
    return {
      year,
      count: yearStudents.length,
      courses: yearCourses.length,
    };
  };

  return (
    <>
      <Text style={styles.sectionTitle}>Students by Year</Text>
      {years.map((year) => {
        const data = getYearData(year);
        return (
          <View key={year} style={styles.yearCard}>
            <View style={styles.yearRow}>
              <Text style={styles.yearTitle}>{data.year}</Text>
              <Text style={styles.yearCount}>{data.count} students</Text>
            </View>
            <Text style={styles.yearCourses}>
              {data.courses} courses assigned
            </Text>
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => onAssignCourses(year)}
            >
              <Feather name="link" size={14} color="#2563eb" />
              <Text style={styles.assignBtnText}>Assign Courses</Text>
            </TouchableOpacity>
          </View>
        );
      })}
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
  yearCard: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  yearRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  yearCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  yearCourses: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  assignBtnText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
});


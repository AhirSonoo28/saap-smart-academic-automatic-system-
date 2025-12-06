import React from "react";
import { StyleSheet, View } from "react-native";
import { StatCard } from "../shared/StatCard";

interface FacultyStatsProps {
  totalStudents: number;
  activeCourses: number;
}

export function FacultyStats({
  totalStudents,
  activeCourses,
}: FacultyStatsProps) {
  const stats = [
    {
      label: "Total Students",
      count: totalStudents.toString(),
      icon: "users",
      color: "#3b82f6",
    },
    {
      label: "Active Courses",
      count: activeCourses.toString(),
      icon: "check-circle",
      color: "#10b981",
    },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
});


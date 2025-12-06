import React from "react";
import { StyleSheet, View } from "react-native";
import { StatCard } from "../shared/StatCard";

interface AdminStatsProps {
  studentsCount: number;
  teachersCount: number;
  coursesCount: number;
}

export function AdminStats({
  studentsCount,
  teachersCount,
  coursesCount,
}: AdminStatsProps) {
  const stats = [
    { label: "Students", count: studentsCount.toString(), icon: "users", color: "#3b82f6" },
    { label: "Teachers", count: teachersCount.toString(), icon: "user-check", color: "#10b981" },
    { label: "Courses", count: coursesCount.toString(), icon: "book", color: "#8b5cf6" },
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
  },
});


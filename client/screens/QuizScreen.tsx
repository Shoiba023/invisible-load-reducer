import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

const QUESTIONS = [
  "I keep a mental list of things that need to be done at home",
  "I'm the one who remembers birthdays, appointments, and events",
  "I plan meals and groceries for the household",
  "I coordinate schedules for family members",
  "I notice when supplies are running low before anyone else",
  "I'm the default parent for school communications",
  "I anticipate what others need before they ask",
  "I carry worry about family members' wellbeing",
  "I'm responsible for making sure everyone has what they need",
  "I feel guilty when I take time for myself",
];

interface QuizResult {
  score: number;
  comparison: string;
  message: string;
}

export default function QuizScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, token } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = async (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (quizAnswers: number[]) => {
    setIsSubmitting(true);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/score", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: quizAnswers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quiz");
      }

      setResult({
        score: data.score,
        comparison: data.comparison,
        message: data.message,
      });
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;

    try {
      await Share.share({
        message: `I took the Invisible Load Score quiz and scored ${result.score}/100. ${result.message}. Take the quiz at Invisible Load Reducer!`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setIsComplete(false);
    setResult(null);
  };

  const renderLikertScale = () => {
    const options = [
      { value: 1, label: "Never" },
      { value: 2, label: "Rarely" },
      { value: 3, label: "Sometimes" },
      { value: 4, label: "Often" },
      { value: 5, label: "Always" },
    ];

    return (
      <View style={styles.likertContainer}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => handleAnswer(option.value)}
            style={({ pressed }) => [
              styles.likertOption,
              {
                backgroundColor: pressed
                  ? theme.primaryLight
                  : theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.likertCircle,
                {
                  backgroundColor: theme.primary,
                  width: 12 + option.value * 6,
                  height: 12 + option.value * 6,
                },
              ]}
            />
            <ThemedText type="small" style={styles.likertLabel}>
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.error;
    if (score >= 60) return theme.warning;
    if (score >= 40) return theme.accent;
    return theme.secondary;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isComplete ? (
          <>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {currentQuestion + 1} of {QUESTIONS.length}
              </ThemedText>
            </View>

            <Animated.View
              key={currentQuestion}
              entering={FadeInDown.springify()}
              style={styles.questionContainer}
            >
              <ThemedText type="h3" style={styles.questionText}>
                {QUESTIONS[currentQuestion]}
              </ThemedText>

              {renderLikertScale()}
            </Animated.View>
          </>
        ) : result ? (
          <Animated.View entering={FadeInUp.springify()} style={styles.resultContainer}>
            <Card
              style={[
                styles.resultCard,
                { borderColor: getScoreColor(result.score), borderWidth: 2 },
              ]}
            >
              <View style={styles.scoreContainer}>
                <ThemedText
                  type="h1"
                  style={[styles.scoreText, { color: getScoreColor(result.score) }]}
                >
                  {result.score}
                </ThemedText>
                <ThemedText type="h4" style={{ color: theme.textSecondary }}>
                  / 100
                </ThemedText>
              </View>

              <ThemedText type="body" style={styles.resultMessage}>
                {result.message}
              </ThemedText>

              <View
                style={[
                  styles.comparisonBadge,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <Feather
                  name={result.comparison.startsWith("+") ? "trending-up" : "trending-down"}
                  size={20}
                  color={theme.primary}
                />
                <ThemedText type="bodyMedium" style={{ color: theme.primary }}>
                  {result.comparison}% vs average
                </ThemedText>
              </View>
            </Card>

            <View style={styles.resultActions}>
              <Button onPress={handleShare} style={styles.shareButton}>
                <View style={styles.buttonContent}>
                  <Feather name="share" size={20} color={theme.buttonText} />
                  <ThemedText type="body" style={{ color: theme.buttonText, marginLeft: Spacing.sm }}>
                    Share Result
                  </ThemedText>
                </View>
              </Button>

              <Pressable onPress={handleRetake} style={styles.retakeButton}>
                <Feather name="refresh-cw" size={20} color={theme.primary} />
                <ThemedText type="body" style={{ color: theme.primary }}>
                  Take Again
                </ThemedText>
              </Pressable>
            </View>

            <Card style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Feather name="heart" size={20} color={theme.secondary} />
                <ThemedText type="h4" style={{ color: theme.secondary }}>
                  Remember
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Your worth isn't measured by how much you carry. It's okay to set
                boundaries, delegate, and let some things go.
              </ThemedText>
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  progressContainer: {
    marginBottom: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  questionContainer: {
    flex: 1,
    justifyContent: "center",
  },
  questionText: {
    textAlign: "center",
    marginBottom: Spacing["4xl"],
    lineHeight: 32,
  },
  likertContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  likertOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  likertCircle: {
    borderRadius: BorderRadius.full,
  },
  likertLabel: {
    textAlign: "center",
  },
  resultContainer: {
    flex: 1,
  },
  resultCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.lg,
  },
  scoreText: {
    fontSize: 72,
    fontWeight: "700",
  },
  resultMessage: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  comparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  resultActions: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  shareButton: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  tipCard: {
    marginTop: "auto",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});

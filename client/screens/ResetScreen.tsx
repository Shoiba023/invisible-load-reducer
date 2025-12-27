import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, FREE_RESET_LIMIT } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const TOTAL_DURATION = 120;

const RESET_STEPS = [
  { message: "Close your eyes for a moment...", duration: 10 },
  { message: "Take a deep breath in...", duration: 4 },
  { message: "Hold...", duration: 4 },
  { message: "Slowly breathe out...", duration: 6 },
  { message: "You are exactly where you need to be.", duration: 10 },
  { message: "Breathe in...", duration: 4 },
  { message: "Hold...", duration: 4 },
  { message: "Breathe out...", duration: 6 },
  { message: "You are not lazy.", duration: 10 },
  { message: "Breathe in...", duration: 4 },
  { message: "Hold...", duration: 4 },
  { message: "Breathe out...", duration: 6 },
  { message: "You are doing enough.", duration: 10 },
  { message: "Breathe in...", duration: 4 },
  { message: "Hold...", duration: 4 },
  { message: "Breathe out...", duration: 6 },
  { message: "Let go of what doesn't serve you.", duration: 10 },
  { message: "One more breath in...", duration: 4 },
  { message: "Hold...", duration: 4 },
  { message: "And release...", duration: 6 },
];

export default function ResetScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, token, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_DURATION);
  const [resetCount, setResetCount] = useState(0);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const canUseReset = user?.isPremium || (user?.resetCount || 0) < FREE_RESET_LIMIT;

  useEffect(() => {
    fetchResetCount();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

  const fetchResetCount = async () => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/reset/count", baseUrl);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setResetCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch reset count:", error);
    }
  };

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const startBreathingAnimation = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.3, { duration: 4000 }),
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 4000 }),
        withTiming(0.8, { duration: 4000 }),
        withTiming(0.5, { duration: 6000 })
      ),
      -1,
      false
    );
  };

  const stopBreathingAnimation = () => {
    scale.value = withTiming(1, { duration: 500 });
    opacity.value = withTiming(0.5, { duration: 500 });
  };

  const advanceStep = () => {
    if (currentStep < RESET_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      stepTimerRef.current = setTimeout(() => {
        advanceStep();
      }, RESET_STEPS[currentStep + 1].duration * 1000);
    }
  };

  const handleStart = () => {
    if (!canUseReset) {
      navigation.navigate("Paywall");
      return;
    }

    setIsActive(true);
    setIsComplete(false);
    setCurrentStep(0);
    setTimeRemaining(TOTAL_DURATION);

    startBreathingAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
          setIsActive(false);
          setIsComplete(true);
          stopBreathingAnimation();
          recordReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    stepTimerRef.current = setTimeout(() => {
      advanceStep();
    }, RESET_STEPS[0].duration * 1000);
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    setIsActive(false);
    stopBreathingAnimation();
  };

  const recordReset = async () => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/reset", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResetCount(data.totalResets);
        await refreshUser();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to record reset:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        {!isActive && !isComplete ? (
          <>
            <View style={styles.intro}>
              <ThemedText type="body" style={[styles.introText, { color: theme.textSecondary }]}>
                Take 2 minutes to reset your mind. You deserve this pause.
              </ThemedText>

              {!user?.isPremium && (
                <View style={[styles.usageInfo, { backgroundColor: theme.primaryLight }]}>
                  <Feather name="info" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    {canUseReset
                      ? `${FREE_RESET_LIMIT - (user?.resetCount || 0)} free reset remaining`
                      : "Unlock unlimited resets"}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.circleContainer}>
              <View
                style={[
                  styles.breathingCircle,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
              >
                <Feather name="heart" size={64} color={theme.primary} />
              </View>
            </View>

            <Card style={styles.statsCard}>
              <View style={styles.statsRow}>
                <Feather name="award" size={24} color={theme.primary} />
                <View>
                  <ThemedText type="h3">{resetCount}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Resets completed
                  </ThemedText>
                </View>
              </View>
            </Card>

            <Button onPress={handleStart} style={styles.startButton}>
              Begin 2-Minute Reset
            </Button>
          </>
        ) : isComplete ? (
          <View style={styles.completeContainer}>
            <View
              style={[
                styles.completeCircle,
                { backgroundColor: theme.secondaryLight },
              ]}
            >
              <Feather name="check" size={64} color={theme.secondary} />
            </View>

            <ThemedText type="h2" style={styles.completeTitle}>
              You did it!
            </ThemedText>

            <ThemedText
              type="body"
              style={[styles.completeText, { color: theme.textSecondary }]}
            >
              You just gave yourself the gift of pause. That takes strength.
            </ThemedText>

            <Card style={styles.completeCard}>
              <ThemedText type="h4" style={{ color: theme.secondary }}>
                Reset #{resetCount} complete
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Keep building this habit. You deserve it.
              </ThemedText>
            </Card>

            <Button onPress={() => setIsComplete(false)} style={styles.doneButton}>
              Done
            </Button>
          </View>
        ) : (
          <View style={styles.activeContainer}>
            <ThemedText type="h1" style={styles.timer}>
              {formatTime(timeRemaining)}
            </ThemedText>

            <View style={styles.animationContainer}>
              <Animated.View
                style={[
                  styles.animatedCircle,
                  { backgroundColor: theme.primary },
                  animatedCircleStyle,
                ]}
              />
              <View style={styles.messageContainer}>
                <ThemedText type="h4" style={styles.stepMessage}>
                  {RESET_STEPS[currentStep].message}
                </ThemedText>
              </View>
            </View>

            <Pressable onPress={handleStop} style={styles.stopButton}>
              <Feather name="x" size={24} color={theme.error} />
              <ThemedText type="body" style={{ color: theme.error }}>
                Stop
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  intro: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  introText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  usageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  circleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  breathingCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  startButton: {
    marginBottom: Spacing.lg,
  },
  activeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timer: {
    fontSize: 48,
    marginBottom: Spacing["3xl"],
  },
  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["4xl"],
  },
  animatedCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: "absolute",
  },
  messageContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  stepMessage: {
    textAlign: "center",
    color: "white",
    paddingHorizontal: Spacing.lg,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  completeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  completeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  completeTitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  completeText: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  completeCard: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    width: "100%",
  },
  doneButton: {
    width: "100%",
  },
});

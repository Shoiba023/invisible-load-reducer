import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, FREE_BRAIN_DUMP_LIMIT } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface BrainDumpResult {
  today: string[];
  canWait: string[];
  delegate: string[];
  ignore: string[];
}

const LOADING_MESSAGES = [
  "Sorting your thoughts...",
  "Finding clarity for you...",
  "Organizing your mental load...",
  "You're not alone in this...",
];

export default function BrainDumpScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, token, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [result, setResult] = useState<BrainDumpResult | null>(null);

  const remainingDumps = user?.isPremium ? -1 : FREE_BRAIN_DUMP_LIMIT - (user?.brainDumpCount || 0);
  const canUseBrainDump = user?.isPremium || remainingDumps > 0;

  const handleSubmit = async () => {
    if (!input.trim()) {
      Alert.alert("Oops", "Please write something first");
      return;
    }

    if (!canUseBrainDump) {
      navigation.navigate("Paywall");
      return;
    }

    setIsLoading(true);
    setResult(null);

    let messageIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 2000);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/brain-dump", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPremium) {
          navigation.navigate("Paywall");
          return;
        }
        throw new Error(data.error || "Failed to process");
      }

      setResult({
        today: data.today || [],
        canWait: data.canWait || [],
        delegate: data.delegate || [],
        ignore: data.ignore || [],
      });

      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setResult(null);
  };

  const renderSection = (
    title: string,
    icon: keyof typeof Feather.glyphMap,
    items: string[],
    color: string,
    index: number
  ) => {
    if (items.length === 0) return null;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        key={title}
      >
        <Card style={[styles.sectionCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
          <View style={styles.sectionHeader}>
            <Feather name={icon} size={20} color={color} />
            <ThemedText type="h4" style={{ color }}>
              {title}
            </ThemedText>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.taskItem}>
              <View style={[styles.taskDot, { backgroundColor: color }]} />
              <ThemedText type="body" style={styles.taskText}>
                {item}
              </ThemedText>
            </View>
          ))}
        </Card>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        {!result ? (
          <>
            <View style={styles.intro}>
              <ThemedText type="body" style={[styles.introText, { color: theme.textSecondary }]}>
                Type everything that's on your mind. Don't filter. Just dump.
              </ThemedText>
              {!user?.isPremium && (
                <View style={[styles.usageInfo, { backgroundColor: theme.primaryLight }]}>
                  <Feather name="info" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    {remainingDumps > 0
                      ? `${remainingDumps} free ${remainingDumps === 1 ? "dump" : "dumps"} remaining`
                      : "Unlock unlimited brain dumps"}
                  </ThemedText>
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="I feel overwhelmed because..."
                placeholderTextColor={theme.textSecondary}
                value={input}
                onChangeText={setInput}
                multiline
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>

            <Button
              onPress={handleSubmit}
              disabled={isLoading || !input.trim()}
              style={styles.submitButton}
            >
              {isLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color={theme.buttonText} size="small" />
                  <ThemedText type="body" style={{ color: theme.buttonText, marginLeft: Spacing.sm }}>
                    {loadingMessage}
                  </ThemedText>
                </View>
              ) : (
                "Sort My Thoughts"
              )}
            </Button>
          </>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <ThemedText type="h3">Here's what we found</ThemedText>
              <Pressable onPress={handleReset} style={styles.newDumpButton}>
                <Feather name="plus" size={20} color={theme.primary} />
                <ThemedText type="body" style={{ color: theme.primary }}>
                  New Dump
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.sections}>
              {renderSection("Today", "zap", result.today, theme.error, 0)}
              {renderSection("Can Wait", "clock", result.canWait, theme.warning, 1)}
              {renderSection("Delegate", "users", result.delegate, theme.secondary, 2)}
              {renderSection("Ignore", "x-circle", result.ignore, theme.textSecondary, 3)}
            </View>
          </>
        )}
      </KeyboardAwareScrollViewCompat>
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
  intro: {
    marginBottom: Spacing.xl,
  },
  introText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  usageInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  inputContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 200,
    marginBottom: Spacing.xl,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  submitButton: {
    marginTop: "auto",
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  newDumpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  sections: {
    gap: Spacing.lg,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  taskText: {
    flex: 1,
  },
});

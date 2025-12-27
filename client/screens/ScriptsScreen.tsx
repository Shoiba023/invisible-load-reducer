import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface ScriptsResult {
  shortScripts: string[];
  longScripts: string[];
}

const CATEGORIES = [
  { id: "partner", label: "Partner", icon: "heart" as const },
  { id: "kids", label: "Kids", icon: "users" as const },
  { id: "boss", label: "Boss", icon: "briefcase" as const },
  { id: "in-laws", label: "In-laws", icon: "home" as const },
  { id: "friends", label: "Friends", icon: "smile" as const },
];

export default function ScriptsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScriptsResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCategorySelect = async (categoryId: string) => {
    if (!user?.isPremium) {
      navigation.navigate("Paywall");
      return;
    }

    setSelectedCategory(categoryId);
    setIsLoading(true);
    setResult(null);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/scripts", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category: categoryId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPremium) {
          navigation.navigate("Paywall");
          return;
        }
        throw new Error(data.error || "Failed to generate scripts");
      }

      setResult({
        shortScripts: data.shortScripts || [],
        longScripts: data.longScripts || [],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setResult(null);
  };

  const renderScriptCard = (script: string, index: number, type: "short" | "long") => {
    const key = `${type}-${index}`;
    const isCopied = copiedIndex === key;

    return (
      <Animated.View
        key={key}
        entering={FadeInDown.delay(index * 100).springify()}
      >
        <Card style={styles.scriptCard}>
          <ThemedText type="body" style={styles.scriptText}>
            {script}
          </ThemedText>
          <Pressable
            onPress={() => handleCopy(script, key)}
            style={[styles.copyButton, { backgroundColor: theme.primaryLight }]}
          >
            <Feather
              name={isCopied ? "check" : "copy"}
              size={18}
              color={theme.primary}
            />
            <ThemedText type="small" style={{ color: theme.primary }}>
              {isCopied ? "Copied" : "Copy"}
            </ThemedText>
          </Pressable>
        </Card>
      </Animated.View>
    );
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
        {!selectedCategory ? (
          <>
            <View style={styles.intro}>
              <ThemedText type="body" style={[styles.introText, { color: theme.textSecondary }]}>
                Get guilt-free scripts to communicate your needs clearly.
              </ThemedText>
              {!user?.isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: theme.primaryLight }]}>
                  <Feather name="lock" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    Premium feature - Tap to unlock
                  </ThemedText>
                </View>
              )}
            </View>

            <ThemedText type="h4" style={styles.sectionTitle}>
              Who do you need to talk to?
            </ThemedText>

            <View style={styles.categories}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    {
                      backgroundColor: theme.backgroundCard,
                      borderColor: theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Feather name={category.icon} size={24} color={theme.primary} />
                  </View>
                  <ThemedText type="bodyMedium">{category.label}</ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Feather name="arrow-left" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ color: theme.primary }}>
                Back
              </ThemedText>
            </Pressable>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText
                  type="body"
                  style={[styles.loadingText, { color: theme.textSecondary }]}
                >
                  Generating your scripts...
                </ThemedText>
              </View>
            ) : result ? (
              <>
                <ThemedText type="h3" style={styles.resultsTitle}>
                  Scripts for {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </ThemedText>

                {result.shortScripts.length > 0 && (
                  <>
                    <ThemedText type="h4" style={styles.scriptSectionTitle}>
                      Quick Scripts
                    </ThemedText>
                    <View style={styles.scriptsContainer}>
                      {result.shortScripts.map((script, i) =>
                        renderScriptCard(script, i, "short")
                      )}
                    </View>
                  </>
                )}

                {result.longScripts.length > 0 && (
                  <>
                    <ThemedText type="h4" style={styles.scriptSectionTitle}>
                      Detailed Scripts
                    </ThemedText>
                    <View style={styles.scriptsContainer}>
                      {result.longScripts.map((script, i) =>
                        renderScriptCard(script, i, "long")
                      )}
                    </View>
                  </>
                )}
              </>
            ) : null}
          </>
        )}
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
  intro: {
    marginBottom: Spacing["2xl"],
  },
  introText: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  categoryCard: {
    width: "47%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    padding: Spacing.sm,
    alignSelf: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  loadingText: {
    marginTop: Spacing.xl,
  },
  resultsTitle: {
    marginBottom: Spacing.xl,
  },
  scriptSectionTitle: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  scriptsContainer: {
    gap: Spacing.md,
  },
  scriptCard: {
    marginBottom: 0,
  },
  scriptText: {
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
});

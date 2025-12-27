import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, PREMIUM_PRICE } from "@/constants/theme";

const FEATURES = [
  { icon: "cloud" as const, title: "Unlimited Brain Dumps", description: "Sort your thoughts anytime" },
  { icon: "message-circle" as const, title: "Guilt-Free Scripts", description: "For all your conversations" },
  { icon: "heart" as const, title: "Unlimited Resets", description: "2-minute mental resets" },
  { icon: "bar-chart-2" as const, title: "Quiz History", description: "Track your mental load over time" },
  { icon: "bookmark" as const, title: "Save Favorites", description: "Keep your best scripts" },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { token, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/purchases/checkout-session", baseUrl);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        const result = await WebBrowser.openBrowserAsync(data.url);

        if (result.type === "cancel" || result.type === "dismiss") {
          const verifyUrl = new URL("/api/verify-purchase", baseUrl);
          const verifyResponse = await fetch(verifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId: data.sessionId }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.isPremium) {
            await refreshUser();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              "Welcome to Premium!",
              "You now have access to all features.",
              [{ text: "OK", onPress: () => navigation.goBack() }]
            );
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <Feather name="unlock" size={48} color={theme.primary} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Unlock Full Access
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            One-time purchase. Lifetime access.
          </ThemedText>
        </View>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: theme.secondaryLight },
                ]}
              >
                <Feather name={feature.icon} size={20} color={theme.secondary} />
              </View>
              <View style={styles.featureText}>
                <ThemedText type="bodyMedium">{feature.title}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {feature.description}
                </ThemedText>
              </View>
              <Feather name="check" size={20} color={theme.secondary} />
            </View>
          ))}
        </View>

        <Card style={[styles.priceCard, { borderColor: theme.primary, borderWidth: 2 }]}>
          <View style={styles.priceRow}>
            <View>
              <ThemedText type="h2" style={{ color: theme.primary }}>
                ${PREMIUM_PRICE}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                One-time payment
              </ThemedText>
            </View>
            <View style={[styles.savingsBadge, { backgroundColor: theme.secondaryLight }]}>
              <ThemedText type="smallMedium" style={{ color: theme.secondary }}>
                Best Value
              </ThemedText>
            </View>
          </View>
        </Card>

        <Button
          onPress={handlePurchase}
          disabled={isLoading}
          style={styles.purchaseButton}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            `Get Full Access for $${PREMIUM_PRICE}`
          )}
        </Button>

        <ThemedText type="caption" style={[styles.terms, { color: theme.textSecondary }]}>
          Secure payment via Stripe. Cancel anytime if you change your mind
          within 24 hours.
        </ThemedText>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  featuresContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  priceCard: {
    marginBottom: Spacing.xl,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savingsBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  purchaseButton: {
    marginBottom: Spacing.lg,
  },
  terms: {
    textAlign: "center",
    lineHeight: 20,
  },
});

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type PaymentSuccessRouteProp = RouteProp<RootStackParamList, "PaymentSuccess">;

export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { token, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentSuccessRouteProp>();

  useEffect(() => {
    verifyAndUpdatePurchase();
  }, []);

  const verifyAndUpdatePurchase = async () => {
    if (route.params?.sessionId) {
      try {
        const baseUrl = getApiUrl();
        const url = new URL("/api/verify-purchase", baseUrl);
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId: route.params.sessionId }),
        });
      } catch (error) {
        console.error("Verify purchase error:", error);
      }
    }

    await refreshUser();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["5xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View
          entering={FadeInUp.springify()}
          style={[styles.iconContainer, { backgroundColor: theme.secondaryLight }]}
        >
          <Feather name="check" size={64} color={theme.secondary} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText type="h1" style={styles.title}>
            Welcome to Premium!
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            You now have unlimited access to all features. Your mental wellness
            journey just got a whole lot easier.
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.featuresUnlocked}
        >
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={24} color={theme.secondary} />
            <ThemedText type="body">Unlimited Brain Dumps</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={24} color={theme.secondary} />
            <ThemedText type="body">All Guilt-Free Scripts</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={24} color={theme.secondary} />
            <ThemedText type="body">Unlimited Mental Resets</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Feather name="check-circle" size={24} color={theme.secondary} />
            <ThemedText type="body">Quiz History & Favorites</ThemedText>
          </View>
        </Animated.View>

        <Button onPress={handleContinue} style={styles.continueButton}>
          Start Using Premium
        </Button>
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
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["3xl"],
    lineHeight: 24,
  },
  featuresUnlocked: {
    width: "100%",
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  continueButton: {
    width: "100%",
    marginTop: "auto",
  },
});

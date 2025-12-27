import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, FREE_BRAIN_DUMP_LIMIT, FREE_RESET_LIMIT, PREMIUM_PRICE } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function ProfileScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleUpgrade = () => {
    navigation.navigate("Paywall");
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
        <View style={styles.header}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <Feather name="user" size={40} color={theme.primary} />
          </View>
          <ThemedText type="h3">{user?.email}</ThemedText>
          {user?.isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: theme.secondaryLight }]}>
              <Feather name="award" size={16} color={theme.secondary} />
              <ThemedText type="smallMedium" style={{ color: theme.secondary }}>
                Premium Member
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Free Account
            </ThemedText>
          )}
        </View>

        {!user?.isPremium && (
          <Card style={[styles.upgradeCard, { borderColor: theme.primary, borderWidth: 2 }]}>
            <View style={styles.upgradeHeader}>
              <Feather name="unlock" size={24} color={theme.primary} />
              <ThemedText type="h4">Unlock Full Access</ThemedText>
            </View>
            <ThemedText type="body" style={[styles.upgradeText, { color: theme.textSecondary }]}>
              Get unlimited brain dumps, scripts, resets, and quiz history.
            </ThemedText>
            <Button onPress={handleUpgrade} style={styles.upgradeButton}>
              Upgrade for ${PREMIUM_PRICE}
            </Button>
          </Card>
        )}

        <ThemedText type="h4" style={styles.sectionTitle}>
          Your Stats
        </ThemedText>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Feather name="cloud" size={24} color={theme.primary} />
            <ThemedText type="h3">{user?.brainDumpCount || 0}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Brain Dumps
            </ThemedText>
            {!user?.isPremium && (
              <ThemedText type="caption" style={{ color: theme.warning }}>
                {Math.max(0, FREE_BRAIN_DUMP_LIMIT - (user?.brainDumpCount || 0))} free left
              </ThemedText>
            )}
          </Card>

          <Card style={styles.statCard}>
            <Feather name="heart" size={24} color={theme.secondary} />
            <ThemedText type="h3">{user?.resetCount || 0}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Resets Done
            </ThemedText>
            {!user?.isPremium && (
              <ThemedText type="caption" style={{ color: theme.warning }}>
                {Math.max(0, FREE_RESET_LIMIT - (user?.resetCount || 0))} free left
              </ThemedText>
            )}
          </Card>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Account
        </ThemedText>

        <Card style={styles.menuCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          >
            <View style={styles.menuItemLeft}>
              <Feather name="bookmark" size={20} color={theme.text} />
              <ThemedText type="body">Favorites</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert("Coming Soon", "This feature is coming soon!")}
          >
            <View style={styles.menuItemLeft}>
              <Feather name="clock" size={20} color={theme.text} />
              <ThemedText type="body">History</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert("About", "Invisible Load Reducer v1.0.0\n\nLighten your mind in 2 minutes.")}
          >
            <View style={styles.menuItemLeft}>
              <Feather name="info" size={20} color={theme.text} />
              <ThemedText type="body">About</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </Card>

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: theme.error }]}
        >
          <Feather name="log-out" size={20} color={theme.error} />
          <ThemedText type="body" style={{ color: theme.error }}>
            Log Out
          </ThemedText>
        </Pressable>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  upgradeCard: {
    marginBottom: Spacing.xl,
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  upgradeText: {
    marginBottom: Spacing.lg,
  },
  upgradeButton: {
    width: "100%",
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  menuCard: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: "auto",
  },
});

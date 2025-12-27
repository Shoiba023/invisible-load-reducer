import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      const message = error.message?.includes(":")
        ? error.message.split(": ")[1]
        : "Something went wrong";
      Alert.alert("Error", message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["4xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <Feather name="cloud" size={48} color={theme.primary} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Invisible Load Reducer
          </ThemedText>
          <ThemedText type="body" style={[styles.tagline, { color: theme.textSecondary }]}>
            Lighten your mind in 2 minutes.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText type="h3" style={styles.formTitle}>
            {isLogin ? "Welcome back" : "Create account"}
          </ThemedText>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="mail" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="lock" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <Button
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>

          <Pressable
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <ThemedText type="body" style={{ color: theme.primary }}>
                {isLogin ? "Sign Up" : "Sign In"}
              </ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
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
  tagline: {
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  inputContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  submitButton: {
    marginBottom: Spacing.xl,
  },
  switchButton: {
    alignItems: "center",
    padding: Spacing.lg,
  },
});

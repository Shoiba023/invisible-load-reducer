import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "zap",
    title: "Your brain is doing too much.",
    description:
      "Mental overload is real. The invisible tasks you carry every day deserve to be seen and sorted.",
  },
  {
    id: "2",
    icon: "cloud",
    title: "Dump it here. We'll sort it.",
    description:
      "Just type what's on your mind. Our AI will organize your thoughts into what matters now and what can wait.",
  },
  {
    id: "3",
    icon: "heart",
    title: "Feel lighter — without guilt.",
    description:
      "2-minute resets, guilt-free scripts, and permission to let go. You're doing enough.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { setHasSeenOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setHasSeenOnboarding(true);
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primaryLight },
          ]}
        >
          <Feather name={item.icon} size={80} color={theme.primary} />
        </View>
        <ThemedText type="h2" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </ThemedText>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive ? theme.primary : theme.border,
                  width: isActive ? 24 : 8,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            Skip
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {renderPagination()}
        <Button onPress={handleNext} style={styles.button}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["4xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: "100%",
  },
});

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import BrainDumpScreen from "@/screens/BrainDumpScreen";
import ScriptsScreen from "@/screens/ScriptsScreen";
import ResetScreen from "@/screens/ResetScreen";
import QuizScreen from "@/screens/QuizScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MainTabParamList = {
  BrainDumpTab: undefined;
  ScriptsTab: undefined;
  ResetTab: undefined;
  QuizTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="BrainDumpTab"
      screenOptions={{
        ...screenOptions,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="BrainDumpTab"
        component={BrainDumpScreen}
        options={{
          title: "Brain Dump",
          headerTitle: "Brain Dump",
          tabBarIcon: ({ color, size }) => (
            <Feather name="cloud" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScriptsTab"
        component={ScriptsScreen}
        options={{
          title: "Scripts",
          headerTitle: "Guilt-Free Scripts",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ResetTab"
        component={ResetScreen}
        options={{
          title: "Reset",
          headerTitle: "Mental Reset",
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizScreen}
        options={{
          title: "Quiz",
          headerTitle: "Load Score",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

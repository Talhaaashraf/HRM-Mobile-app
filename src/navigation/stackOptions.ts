import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Colors, Typography } from '../constants/tokens';

export function stackOptions(tint: string): NativeStackNavigationOptions {
  return {
    headerTintColor: tint,
    headerTitleStyle: {
      fontWeight: Typography.weight.semibold,
      color: Colors.textPrimary,
    },
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    headerStyle: { backgroundColor: Colors.background },
  };
}

export function tabBarOptions(tint: string) {
  return {
    headerShown: false,
    tabBarActiveTintColor: tint,
    tabBarInactiveTintColor: Colors.textMuted,
    tabBarStyle: {
      backgroundColor: Colors.background,
      borderTopColor: Colors.border,
    },
    tabBarLabelStyle: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.medium,
    },
  };
}

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MainTabNavigator from '../navigators/MainTabNavigator';
import { useTheme } from '../../hooks/ThemeProvider';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { theme, isDarkMode } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="MainTab"
      screenOptions={{
        drawerPosition: 'right',
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.background,
        },
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveBackgroundColor: theme.cardBackground,
      }}
    >
      <Drawer.Screen name="MainTab" component={MainTabNavigator} />
      <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />
      <Drawer.Screen name="SettingsScreen" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

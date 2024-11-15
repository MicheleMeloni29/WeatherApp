import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MainTabNavigator from '../navigators/MainTabNavigator';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="MainTab" screenOptions={{ drawerPosition: 'right', headerShown: false }}>
      <Drawer.Screen name="MainTab" component={MainTabNavigator} />
      <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />
      <Drawer.Screen name="SettingsScreen" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}


/**
 * MainTabNavigator is a functional component that sets up the main tab navigation for the application.
 * It uses a Tab.Navigator to define the initial route and screen options for the tab bar.
 * 
 * @returns {JSX.Element} The Tab.Navigator component with defined screens and options.
 * 
 * The tabBarIcon is dynamically set based on the route name:
 * - 'Home' route uses the 'home' icon.
 * - 'AddLocation' route uses the 'add-circle' icon.
 * - 'Settings' route uses the 'settings' icon.
 * 
 * The icon color changes based on whether the tab is focused or not:
 * - Focused: '#6EC1E4'
 * - Not focused: 'gray'
 * 
 * The tabBarShowLabel option is set to false to hide the labels of the tabs.
 * 
 * @component
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import AddLocation from '../screens/AddLocationScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LocationType } from '../screens/AddLocationScreen';
import { useTheme } from '../../hooks/ThemeProvider';

export type MainTabParamList = {
    Home: undefined;
    AddLocation: undefined;
    Settings: undefined;
};

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: undefined;
    Home: { location?: LocationType };
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
    const { theme, isDarkMode } = useTheme();

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    let iconName: 'home' | 'add-circle' | 'settings' | undefined;
                    let iconColor = focused ? theme.primary : theme.textSecondary;

                    switch (route.name) {
                        case 'Home':
                            iconName = 'home';
                            break;
                        case 'AddLocation':
                            iconName = 'add-circle';
                            break;
                        case 'Settings':
                            iconName = 'settings';
                            break;
                    }

                    return <Ionicons name={iconName} size={44} color={iconColor} />;
                },
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: theme.cardBackground,
                    borderTopColor: theme.border,
                },
                headerStyle: {
                    backgroundColor: theme.cardBackground,
                },
                headerTintColor: theme.text,
                headerTitleStyle: {
                    color: theme.text,
                },
            })}
        >
            <Tab.Screen name="AddLocation" component={AddLocation} />
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}
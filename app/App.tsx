import React from 'react';
import { NavigationContainer, DrawerActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AddLocation from './screens/AddLocation';
import { ParamListBase, RouteProp } from '@react-navigation/native';


// Define the types for the navigation
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Main Tab Navigator for Home, AddLocation, and Settings
function MainTabNavigator({ navigation }: { navigation: any }) {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: 'add-circle' | 'home' | 'settings' | undefined;
                    let iconColor = focused ? 'blue' : 'gray';

                    if (route.name === 'AddLocation') {
                        iconName = 'add-circle';
                    } else if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Settings') {
                        iconName = 'settings';
                    }

                    return <Ionicons name={iconName} size={44} color={iconColor} />;
                },
                tabBarShowLabel: false,
            })}
        >
            {/* AddLocation button on the left */}
            <Tab.Screen
                name="AddLocation"
                component={AddLocation}
                options={{
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            {...props}
                            style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 2 }}>
                            <Ionicons name="add-circle" size={54} color={props.accessibilityState?.selected ? 'blue' : 'gray'} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Home button in the center */}
            <Tab.Screen name="Home" component={HomeScreen} />

            {/* Drawer button on the right */}
            <Tab.Screen
                name="Settings"
                component={HomeScreen} // Placeholder, Drawer opens instead
                options={{
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            {...props}
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            style={{ justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Ionicons name="options" size={40} color={props.accessibilityState?.selected ? 'blue' : 'gray'} />
                        </TouchableOpacity>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// Drawer Navigator for the Settings
function DrawerNavigator() {
    return (
        <Drawer.Navigator initialRouteName="MainTabNavigator" screenOptions={{ drawerPosition: 'right' }}>
            <Drawer.Screen name="Back" component={MainTabNavigator} options={{ headerShown: false }} />
            <Drawer.Screen name="Profile" component={ProfileScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} />
            <Drawer.Screen name="Logout" component={LoginScreen} />
        </Drawer.Navigator>
    );
}

// Stack Navigator for Authentication and Main App
function AuthStackNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <NavigationContainer>
            <AuthStackNavigator />
        </NavigationContainer>
    );
}

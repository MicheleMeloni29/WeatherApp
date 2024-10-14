import { registerRootComponent } from 'expo';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';

// Importa le tue schermate
import HomeScreen from './app/screens/HomeScreen';
import AddLocation from './app/screens/AddLocation';
import SettingsScreen from './app/screens/SettingsScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import WrappedLoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';

// Definisci i tipi di navigazione
export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    Main: undefined;
    Home: { location: LocationType };
};

export type LocationType = {
    name: string;
    latitude: number;
    longitude: number;
    distance: number;
};

export type MainTabParamList = {
    Home: { location: { name: string; latitude: number; longitude: number; distance?: number } };
    AddLocation: undefined;
    Settings: undefined;
};

// Definisci navigatori
const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function MainTabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    let iconName: 'add-circle' | 'home' | 'settings' | undefined;
                    let iconColor = focused ? '#6EC1E4' : 'gray';

                    switch (route.name) {
                        case 'AddLocation':
                            iconName = 'add-circle';
                            break;
                        case 'Home':
                            iconName = 'home';
                            break;
                        case 'Settings':
                            iconName = 'settings';
                            break;
                    }

                    return <Ionicons name={iconName} size={44} color={iconColor} />;
                },
                tabBarShowLabel: false,
            })}
        >
            <Tab.Screen
                name="AddLocation"
                component={AddLocation}
                options={{
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            {...props}
                            style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 2 }}>
                            <Ionicons name="add-circle" size={54} color={props.accessibilityState?.selected ? '#6EC1E4' : 'gray'} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarButton: (props) => {
                        const navigation = useNavigation();
                        return (
                            <TouchableOpacity
                                {...props}
                                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                                style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="options" size={40} color={props.accessibilityState?.selected ? '#6EC1E4' : 'gray'} />
                            </TouchableOpacity>
                        );
                    },
                }}
            />
        </Tab.Navigator>
    );
}

function DrawerNavigator() {
    return (
        <Drawer.Navigator initialRouteName="MainTab" screenOptions={{ drawerPosition: 'right', headerShown: false }}>
            <Drawer.Screen name="MainTab" component={MainTabNavigator} />
            <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />
            <Drawer.Screen name="SettingsScreen" component={SettingsScreen} />
            <Drawer.Screen name="LogoutScreen" component={WrappedLoginScreen} />
        </Drawer.Navigator>
    );
}

// Stack Navigator per l'autenticazione
function AuthStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={WrappedLoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Main" component={DrawerNavigator} />
        </Stack.Navigator>
    );
}


function App() {
    return (
        <NavigationContainer>
            <AuthStackNavigator />
        </NavigationContainer>
    );
}

registerRootComponent(App);

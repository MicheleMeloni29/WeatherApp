import { registerRootComponent } from 'expo';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './hooks/Authprovider';
import { ThemeProvider } from './hooks/ThemeProvider';
import AuthStackNavigator from './app/navigators/AuthStackNavigator'; // Ensure this file exists and is correctly named
import DrawerNavigator from './app/navigators/DrawerNavigator';

function AppNavigator() {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            {user ? <DrawerNavigator /> : <AuthStackNavigator />}
        </NavigationContainer>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </ThemeProvider>
    );
}

registerRootComponent(App);

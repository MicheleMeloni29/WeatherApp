import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../hooks/Authprovider';

function SettingsScreen() {

    const { logout } = useAuth();
        // Implement logout functionality here
    return (
        <View style={styles.container}>
            <Text>Settings Screen</Text>
            <Button title="Logout" onPress={logout} />
        </View>
    );
}

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
});
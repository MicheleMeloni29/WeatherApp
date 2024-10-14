import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Text>Benvenuto nel tuo profilo</Text>
        </View>
    );
}

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
});
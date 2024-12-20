import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../index';

type Props = StackScreenProps<RootStackParamList, keyof RootStackParamList>;

export default function NotFoundScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This screen doesn't exist.</Text>
      <Button
        title="Go to home screen!"
        onPress={() => navigation.navigate('Home', { location: { name: 'defaultLocation', latitude: 0, longitude: 0, distance: 0 } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});


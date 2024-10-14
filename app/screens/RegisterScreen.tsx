import React, { useState } from 'react';
import { Text, View, TextInput, Button, StyleSheet, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../index';

type Props = StackScreenProps<RootStackParamList, 'Register'>;

function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // Registration logic
    navigation.navigate('Login');  // Use the correct route name 'Login'
  };

  return (
    <ImageBackground source={require('../../assets/images/clear_sky.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.jpg')} style={styles.logo} />
        <Text style={styles.introText}>Enter your details to register</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={'#007BFF'}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={'#007BFF'}
          value={password}
          secureTextEntry
        />
        <Button title="Register" onPress={handleRegister} />
      </View>
    </ImageBackground>
  );
}

export default RegisterScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  introText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#007BFF',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#007BFF',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
import React, { useState } from 'react';
import { StyleSheet, View, Image, ImageBackground, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';


interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {

      const userCredential = await signInWithEmailAndPassword(auth, `${userName}@example.com`, password);
      const user = userCredential.user;
      console.log('Login successful:', user.uid);
      // Naviga alla schermata principale o esegui altre azioni
      navigation.navigate('Main');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Errore di login', 'Utente non trovato. Verifica username e password.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Errore di login', 'Password errata.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Errore di login', 'Formato email non valido.');
      } else {
        Alert.alert('Errore di login', 'Si è verificato un errore. Riprova.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <ImageBackground source={require('../../assets/images/clear_sky.jpg')} style={styles.background}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.jpg')} style={styles.logo} />
        <Text style={styles.welcomeText}>Welcome to AppMeteo!</Text>
        <Text style={styles.introText}>Your weather app for the best weather forecast</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={'#6EC1E4'}
            value={userName}
            onChangeText={setUserName}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Password"
              placeholderTextColor={'#6EC1E4'}
              value={password}
              secureTextEntry={!isPasswordVisible}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={24}
                color="#6EC1E4"
              />
            </TouchableOpacity>
          </View>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {loading ? (
            <ActivityIndicator size="large" color="#6EC1E4" />
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

// Wrap the component with a higher-order component to provide the necessary props
const WrappedLoginScreen = (props: any) => {
  const onLogin = () => {
    // Callback per quando l'utente ha effettuato correttamente il login
  };

  return <LoginScreen onLogin={onLogin} {...props} />;
};

export default WrappedLoginScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    height: 40,
    borderColor: '#6EC1E4',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#6EC1E4',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  registerButton: {
    backgroundColor: '#9999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  welcomeText: {
    color: '#6EC1E4',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  introText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6EC1E4',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    color: '#6EC1E4',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#6EC1E4',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingLeft: 8,
    paddingRight: 8,
  },
  inputPassword: {
    flex: 1,
    height: 40,
  },
});

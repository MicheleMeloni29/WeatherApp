import React, { useState } from 'react';
import { StyleSheet, View, Image, ImageBackground, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';
import { useTheme } from '../../hooks/ThemeProvider';


interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { theme, isDarkMode } = useTheme();
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

  // Check if both username and password are filled
  const isFormValid = userName.trim() !== '' && password.trim() !== '';

  return (
    <ImageBackground source={require('../../assets/images/clear_sky.jpg')} style={styles.background}>
      <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.8)' }]}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={[styles.welcomeText, { color: theme.primary }]}>Welcome to AppMeteo!</Text>
        <Text style={[styles.introText, { color: theme.primary }]}>Your weather app for the best weather forecast</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, {
              borderColor: theme.primary,
              backgroundColor: theme.inputBackground,
              color: theme.text
            }]}
            placeholder="Username"
            placeholderTextColor={theme.textSecondary}
            value={userName}
            onChangeText={setUserName}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={[styles.passwordContainer, {
            borderColor: theme.primary,
            backgroundColor: theme.inputBackground
          }]}>
            <TextInput
              style={[styles.inputPassword, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              secureTextEntry={!isPasswordVisible}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
          {errorMessage ? <Text style={[styles.error, { color: theme.error }]}>{errorMessage}</Text> : null}
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: isFormValid ? theme.primary : theme.textSecondary },
                  !isFormValid && styles.disabledButton
                ]}
                onPress={handleLogin}
                disabled={!isFormValid}
              >
                <Text style={[styles.buttonText, { color: theme.buttonText }, !isFormValid && styles.disabledButtonText]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.registerButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>Register</Text>
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
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Aggiunto paddingTop per evitare sovrapposizione con la barra di stato
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 15,
    resizeMode: 'contain',
  },
  inputContainer: {
    marginTop: 15,
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
    marginTop: 20,
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
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  introText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    color: '#6EC1E4',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});

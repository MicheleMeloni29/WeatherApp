import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground, Alert, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/MainTabNavigator';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../constants/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useTheme } from '../../hooks/ThemeProvider';



type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;


function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  // Check if the form is valid
  useEffect(() => {
    if (userName && password && confirmPassword) {
      if (password === confirmPassword) {
        setIsFormValid(true);
        setErrorMessage(''); // Rimuove l'errore se le password coincidono
      } else {
        setIsFormValid(false);
        setErrorMessage('Passwords do not match'); // Set an error message if passwords do not match
      }
    } else {
      setIsFormValid(false);
      setErrorMessage('');
    }
  }, [userName, password, confirmPassword]);


  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert('Errore', 'Assicurati che tutti i campi siano compilati e le password coincidano.');
      return;
    }

    try {
      // Registrazione dell'utente con Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, `${userName}@example.com`, password);
      const user = userCredential.user;

      // Creazione del documento Firestore per l'utente
      await setDoc(doc(db, 'users', user.uid), {
        username: userName,
        createdAt: new Date().toISOString(),
      });

      console.log("User registered successfully with ID:", user.uid);

      // Navigazione alla schermata di login
      Alert.alert("Registration complete", "You can now log in!");
      navigation.navigate('Login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Username already in use. Please choose another.');
      } else {
        setErrorMessage('Registration error. Please try again.');
      }
      console.error('Registration error:', error);
    }
  };


  return (
    <ImageBackground source={require('../../assets/images/clear_sky.jpg')} style={styles.background}>
      <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.8)' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
          <Text style={[styles.backButtonText, { color: theme.primary }]}>Login</Text>
        </TouchableOpacity>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={[styles.introText, { color: theme.primary }]}>Enter your details to register</Text>
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
        />
        <TextInput
          style={[styles.input, {
            borderColor: theme.primary,
            backgroundColor: theme.inputBackground,
            color: theme.text
          }]}
          placeholder="New Password"
          placeholderTextColor={theme.textSecondary}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <TextInput
          style={[styles.input, {
            borderColor: theme.primary,
            backgroundColor: theme.inputBackground,
            color: theme.text
          }]}
          placeholder="Confirm Password"
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          secureTextEntry
          onChangeText={setConfirmPassword}
        />
        {errorMessage ? (
          <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.button,
            isFormValid ? [styles.buttonEnabled, { backgroundColor: theme.primary }] : [styles.buttonDisabled, { backgroundColor: theme.textSecondary }] // Modifica lo stile in base alla validità del form
          ]}
          onPress={handleRegister}
          disabled={!isFormValid}  // Il pulsante è disabilitato se il form non è valido
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Register</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

export default RegisterScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginTop: 80,
  },
  introText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 6,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
    marginTop: 40,
  },
  buttonDisabled: {
    // Styles will be applied inline now
  },
  buttonEnabled: {
    // Styles will be applied inline now
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorText: {
    marginBottom: 10,
    textAlign: 'center',
  },
});

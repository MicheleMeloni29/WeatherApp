import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground, Alert, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigators/MainTabNavigator';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../constants/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';



type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>;


function RegisterScreen({ navigation }: RegisterScreenProps) {
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
        setErrorMessage('Le password non coincidono');
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
      Alert.alert("Registrazione completata", "Ora puoi effettuare il login.");
      navigation.navigate('Login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Nome utente già in uso. Scegline un altro.');
      } else {
        setErrorMessage('Errore di registrazione. Riprova.');
      }
      console.error('Registration error:', error);
    }
  };


  return (
    <ImageBackground source={require('../../assets/images/clear_sky.jpg')} style={styles.background}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={24} color="#6EC1E4" />
          <Text style={styles.backButtonText}>Login</Text>
        </TouchableOpacity>
        <Image source={require('../../assets/images/logo.jpg')} style={styles.logo} />
        <Text style={styles.introText}>Enter your details to register</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="rgba(110, 193, 228, 0.5)"
          value={userName}
          onChangeText={setUserName}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="rgba(110, 193, 228, 0.5)"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="rgba(110, 193, 228, 0.5)"
          value={confirmPassword}
          secureTextEntry
          onChangeText={setConfirmPassword}
        />
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.button,
            isFormValid ? styles.buttonEnabled : styles.buttonDisabled // Modifica lo stile in base alla validità del form
          ]}
          onPress={handleRegister}
          disabled={!isFormValid}  // Il pulsante è disabilitato se il form non è valido
        >
          <Text style={styles.buttonText}>Register</Text>
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 20,
  },
  backButtonText: {
    color: '#6EC1E4',
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: 0,
  },
  introText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
    color: '#6EC1E4',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#6EC1E4',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    color: '#333',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9999',  // Grigio quando il form non è valido
  },
  buttonEnabled: {
    backgroundColor: '#6EC1E4',  // Verde quando il form è valido
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

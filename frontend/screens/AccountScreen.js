// frontend/screens/AccountScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  // Image, // <-- REMOVED standard 'Image'
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import BASE_URL from '../config'; // Assuming BASE_URL is correctly defined here
import { Image } from 'expo-image'; // <--- ADDED: Import Image from 'expo-image'

// Import your local default association logo
const DEFAULT_LOCAL_LOGO = require('../assets/images/logo.jpg'); // <-- VERIFY THIS PATH!

export default function AccountScreen({ route }) {
  const navigation = useNavigation();
  const { user } = route.params || {};

  // Initialize state for name, ensuring a default empty string if user is null
  const [name, setName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`);

  // Initialize profilePic state based on user's current picture or a default if not set/is placeholder
  const [profilePic, setProfilePic] = useState(() => {
    if (user?.profilePicture && user.profilePicture !== 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4npxB8OeM7bT-UmCD0j2_gQUJf0uvM67ikwrNmkDsZB8fS64VAw5O2qQihNMrjMntkvWsfizCeoZpl7-TNdkYyh_xt2SBtZvbZCtFz-0zGjVP0sbOsIPQmqLX-d1tXtrwBQW5JI=s1360-w1360-h1020-rw') {
      // If user has a valid profile picture from backend
      if (user.profilePicture.startsWith('/uploads/')) {
        // It's a relative path, construct full URL
        return `${BASE_URL}${user.profilePicture}`;
      }
      // It's already a full URL
      return user.profilePicture;
    }
    // Default to local logo if no valid profile picture or if it's the Google placeholder
    return DEFAULT_LOCAL_LOGO;
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]); // Added fadeAnim to dependency array

  useEffect(() => {
    (async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert("⚠️ Autorisation refusée !", "Merci d'activer l'accès à la caméra et/ou à la galerie dans les paramètres pour modifier votre photo de profil.");
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Set quality to 1 for high-quality upload, can reduce for faster uploads
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Set quality to 1 for high-quality upload, can reduce for faster uploads
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  // Function to show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      "Modifier la photo de profil",
      "Choisissez une option :",
      [
        {
          text: "Prendre une photo",
          onPress: takePhoto,
        },
        {
          text: "Choisir depuis la galerie",
          onPress: pickImage,
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const uploadProfilePicture = async (userId, imageUri) => {
    if (!imageUri || (!imageUri.startsWith('file://') && !imageUri.startsWith('content://'))) {
      console.error('❌ Invalid image URI provided for upload:', imageUri);
      Alert.alert('Erreur', 'URI de l\'image invalide.');
      return null;
    }

    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const fileType = filename.split('.').pop();
    const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;

    formData.append('profilePicture', {
      uri: imageUri,
      name: filename || 'profile.jpg',
      type: mimeType,
    });

    console.log('Sending FormData for upload. Image URI:', imageUri);

    try {
      const response = await fetch(`${BASE_URL}/api/users/upload-profile/${userId}`, {
        method: 'POST',
        body: formData,
        headers: {
          // 'Content-Type': 'multipart/form-data' is typically not needed when using FormData,
          // as FormData will set it automatically with the correct boundary.
        },
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ Profile picture uploaded successfully:', data);
        return data.user;
      } else {
        console.error('❌ Upload error from server:', data);
        Alert.alert('Erreur', data.message || 'Échec du téléchargement de la photo de profil.');
        return null;
      }
    } catch (error) {
      console.error('❌ Upload network error:', error);
      Alert.alert('Erreur réseau', 'Impossible de se connecter au serveur pour télécharger la photo de profil.');
      return null;
    }
  };

  const updateUserInfo = async (userId, { firstName, lastName }) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/update-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ User info updated successfully:', data);
        return data.user;
      } else {
        console.error('❌ Update error:', data);
        Alert.alert('Erreur', data.message || 'Échec de la mise à jour des informations de l\'utilisateur.');
        return null;
      }
    } catch (error) {
      console.error('❌ Update network error:', error);
      Alert.alert('Erreur réseau', 'Impossible de se connecter au serveur pour mettre à jour les informations.');
      return null;
    }
  };

  const handleSave = async () => {
    let updatedUser = { ...user };
    let changesMade = false;

    // Split name only if it's a string, otherwise default
    const [currentFirstName, currentLastName] = (name || '').split(' ');

    // Check for name changes
    if (currentFirstName !== user?.firstName || currentLastName !== user?.lastName) {
      changesMade = true;
      const result = await updateUserInfo(user._id, { firstName: currentFirstName, lastName: currentLastName });
      if (result) updatedUser = result;
      else return; // Stop if name update failed
    }

    // Check for profile picture changes
    // Only upload if profilePic is a local file URI (starts with 'file://' or 'content://')
    // and it's actually different from the *original* user.profilePicture passed in route.params
    // This prevents re-uploading if the user just opens AccountScreen and saves without changing image.
    if (profilePic && (profilePic.startsWith('file://') || profilePic.startsWith('content://')) && profilePic !== user?.profilePicture) {
      changesMade = true;
      console.log('Attempting to upload local image. URI:', profilePic);
      const uploadResult = await uploadProfilePicture(user._id, profilePic);
      if (uploadResult) {
        // Update updatedUser with the new profilePicture URL from the backend response
        updatedUser = { ...updatedUser, profilePicture: uploadResult.profilePicture };
      } else {
        return; // Stop if upload failed
      }
    }

    if (changesMade) {
      Alert.alert('Succès', 'Votre profil a été mis à jour !');
      // Pass the fully updated user object back to Home screen
      navigation.navigate('Home', { user: updatedUser });
    } else {
      Alert.alert('Aucun changement', 'Aucune modification à sauvegarder.');
      navigation.navigate('Home', { user }); // Pass original user if no changes
    }
  };


  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => console.log('Déconnexion annulée'),
        },
        {
          text: 'Se déconnecter',
          onPress: async () => {
            try {
              const userId = user?._id;

              if (userId) {
                console.log(`Attempting to remove deviceId from backend for userId: ${userId}`);
                try {
                  const response = await fetch(`${BASE_URL}/api/users/${userId}/remove-deviceid`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });

                  if (response.ok) {
                    console.log('✅ Device ID successfully removed from backend.');
                  } else {
                    const errorData = await response.json();
                    console.error('❌ Error removing device ID from backend:', errorData);
                    Alert.alert('Erreur backend', errorData.message || 'Échec de la déconnexion côté serveur.');
                  }
                } catch (backendError) {
                  console.error('❌ Network error when calling backend logout:', backendError);
                  Alert.alert('Erreur réseau', 'Impossible de contacter le serveur pour la déconnexion.');
                }
              } else {
                console.warn('User ID not found, skipping backend deviceId removal.');
              }

              await AsyncStorage.removeItem('deviceId');
              console.log('✅ deviceId removed from AsyncStorage.');

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès.');
            } catch (error) {
              console.error('❌ Erreur lors de la déconnexion (AsyncStorage ou navigation) :', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  // Determine the final source for the Image component
  let imageSource;
  // If profilePic state is a string (could be local file URI or backend URL)
  if (typeof profilePic === 'string') {
    // Check if it's a local file URI (from ImagePicker)
    if (profilePic.startsWith('file://') || profilePic.startsWith('content://')) {
      imageSource = { uri: profilePic };
    } else {
      // It's a backend URL (either full or relative that was converted on init)
      imageSource = { uri: profilePic };
    }
  } else {
    // If profilePic state is already the result of a require (the default local logo)
    imageSource = profilePic; // This will be `DEFAULT_LOCAL_LOGO`
  }


  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          <Text style={styles.title}>👤 Modifier ton profil</Text>

          <TouchableOpacity onPress={showImagePickerOptions}>
            {/* Use expo-image here */}
            <Image
              source={imageSource} // Use the determined imageSource here
              style={styles.profileImage}
              // Optional: Add a placeholder or blurhash
              // placeholder={DEFAULT_LOCAL_LOGO} // Shows your default logo while actual image loads
              contentFit="cover" // Ensures the image covers the area, cropping if necessary
              onError={(e) => console.log('Error loading profile image in AccountScreen:', e.nativeEvent.error)}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={showImagePickerOptions}>
             <Text style={styles.photoButtonText}>📸 Modifier la photo</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Ton nom"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>✅ Sauvegarder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home', { user: user })}>
            <Text style={styles.homeButtonText}>🏠 Retour à l'accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.canceled} onPress={handleLogout}>
            <Text style={styles.canceledText}>❌ Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, backgroundColor: '#f4faff', justifyContent: 'center', alignItems: 'center', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#007BFF', marginBottom: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderColor: '#FFD700', borderWidth: 3, marginBottom: 12 },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  input: { width: '100%', backgroundColor: '#fff', padding: 12, borderRadius: 10, borderColor: '#00BFFF', borderWidth: 1, marginVertical: 12, fontSize: 16 },
  photoButton: { backgroundColor: '#FFA500', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginBottom: 15 },
  photoButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  saveButton: { backgroundColor: '#28a745', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 10, marginTop: 10, width: '100%' },
  saveButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 17 },
  homeButton: { marginTop: 20, backgroundColor: '#007BFF', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 10, width: '100%' },
  homeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 17, textAlign: 'center' },
  canceled: { marginTop: 20, backgroundColor: '#8b0000', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 10, width: '100%' },
  canceledText: { color: 'white', textAlign: 'center', fontSize: 17, fontWeight: 'bold' },
});
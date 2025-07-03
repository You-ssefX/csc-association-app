// frontend/screens/HomeScreen.js

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Linking } from 'react-native'; // REMOVED standard 'Image'
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import BASE_URL from '../config'; // Import your BASE_URL from config.js
import { Image } from 'expo-image'; // <--- ADDED: Import Image from 'expo-image'

// Import your local default association logo
const DEFAULT_LOCAL_LOGO = require('../assets/images/logo.jpg'); // <-- VERIFY THIS PATH!

export default function HomeScreen({ route }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [currentUser, setCurrentUser] = useState(route.params?.user || null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Fade-in animation for content (runs once on component mount)
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // This useEffect hook will update `currentUser` whenever the screen comes into focus
  // OR when the `user` object in `route.params` changes (which happens when returning
  // from AccountScreen with updated user data).
  useEffect(() => {
    if (isFocused && route.params?.user) {
      setCurrentUser(route.params.user);
      console.log('HomeScreen: User data updated from route params on focus/param change.');
    }
  }, [isFocused, route.params?.user]); // Dependencies ensure it re-runs when needed

  // Bounce animation for image press
  const handleImagePress = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  // Construct full name using `currentUser`
  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`;

  // --- Logic to determine which profile picture to display based on `currentUser` ---
  let profilePictureSource;

  if (currentUser?.profilePicture && currentUser.profilePicture !== 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4npxB8OeM7bT-UmCD0j2_gQUJf0uvM67ikwrNmkDsZB8fS64VAw5O2qQihNMrjMntkvWsfizCeoZpl7-TNdkYyh_xt2SBtZvbZCtFz-0zGjVP0sbOsIPQmqLX-d1tXtrwBQW5JI=s1360-w1360-h1020-rw') {
    // If it's a custom uploaded picture, check if it's a relative path
    if (currentUser.profilePicture.startsWith('/uploads/')) {
      // Construct the full URL using your backend's BASE_URL
      profilePictureSource = { uri: `${BASE_URL}${currentUser.profilePicture}` };
    } else {
      // Assume it's already a full, valid URL (e.g., from an external service)
      profilePictureSource = { uri: currentUser.profilePicture };
    }
  } else {
    // If currentUser.profilePicture is null, undefined, empty, or the Google placeholder,
    // use your local default association logo.
    profilePictureSource = DEFAULT_LOCAL_LOGO;
  }
  // --- End of profile picture logic ---


  return (
    <LinearGradient colors={['#e3f2fd', '#FFF9C4']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePress}>
          {/* Display the determined profile picture using expo-image */}
          {/* We wrap Image in an Animated.View to apply the transform animation */}
          <Animated.View style={[{ transform: [{ scale: bounceAnim }] }]}>
            <Image
              source={profilePictureSource}
              style={styles.profileImage}
              // Optional: Add a placeholder or blurhash for better UX
              // placeholder={DEFAULT_LOCAL_LOGO} // Shows your default logo while actual image loads
              // If you ever generate blurhashes on your backend, you could use:
              // blurhash={currentUser?.profilePictureBlurhash}
              contentFit="cover" // Ensures the image covers the area, cropping if necessary
              onError={(e) => console.log('Error loading profile image:', e.nativeEvent.error)}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Pass `currentUser` when navigating to Account so AccountScreen gets the latest data */}
        <TouchableOpacity style={styles.accountButton} onPress={() => navigation.navigate('Account', { user: currentUser })}>
          <Text style={styles.buttonText}>👤 Compte</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.welcomeText}>Bienvenue, {fullName} 👋</Text>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Pass `currentUser` to other screens as well to ensure they always have the latest user info */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Historique', { user: currentUser })}>
          <Text style={styles.cardTitle}>🗂️ Historique & Notifications</Text>
          <Text style={styles.cardDesc}>🔎 Voir les événements et les mises à jour pour {currentUser?.group}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Galerie', { user: currentUser })}>
          <Text style={styles.cardTitle}>📸 Galerie Photos</Text>
          <Text style={styles.cardDesc}>🖼️ Découvre les images des activités !</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.websiteContainer}>
        <Text style={styles.websiteText}>
          🔗 Pour plus d'infos, visite notre site :{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://cscbarleduc.centres-sociaux.fr')}
          >
            www.cscbarleduc.centres-sociaux.fr
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  returnButton: { backgroundColor: '#4FC3F7', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, elevation: 4 },
  accountButton: { backgroundColor: '#FFB74D', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, elevation: 4 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  // Ensure profileImage styles are compatible with expo-image (they generally are)
  profileImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFD54F' },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#607D8B', textAlign: 'center', fontSize: 11, fontStyle: 'italic' },
  welcomeText: { fontSize: 26, fontWeight: '700', color: '#1E88E5', textAlign: 'center', marginBottom: 25 },
  content: { flex: 1, alignItems: 'center' },
  card: { backgroundColor: '#fff', width: '100%', padding: 22, borderRadius: 20, marginBottom: 22, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#37474F', marginBottom: 10 },
  cardDesc: { fontSize: 15, color: '#546E7A', lineHeight: 22 },
  websiteContainer: { marginTop: 40, alignItems: 'center', marginBottom: 20 },
  websiteText: { fontSize: 14, color: '#607D8B', textAlign: 'center' },
  link: { color: '#1E88E5', fontWeight: 'bold', textDecorationLine: 'underline' },
});
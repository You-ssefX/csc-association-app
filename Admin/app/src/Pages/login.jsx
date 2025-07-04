// On importe AsyncStorage pour stocker le token localement dans le téléphone
import AsyncStorage from "@react-native-async-storage/async-storage";

// On importe la configuration (URL de l'API) depuis le fichier config
import config from "../Component/config";

// On importe React et le hook useState pour gérer les champs de formulaire
import React, { useState } from "react";

// On importe les composants de base de React Native
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// On importe l'image bleu.png comme fond
import bleu from "../Component/assets/bleu.png";

// Composant principal Login
export default function Login({ navigation }) {
  // States pour stocker les données tapées par l’utilisateur
  const [username, setUsername] = useState(""); // Stocke le nom d'utilisateur
  const [password, setPassword] = useState(""); // Stocke le mot de passe

  // Fonction qui se déclenche quand on clique sur "Se connecter"
  const handleSubmit = async () => {
    // Vérifie que tous les champs sont remplis
    if (!username.trim() || !password.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      // Envoie une requête POST au backend avec les identifiants
      const response = await fetch(`${config.BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // On précise qu’on envoie du JSON
        },
        body: JSON.stringify({ username, password }), // On transforme les données en chaîne JSON
      });

      const data = await response.json(); // On récupère la réponse du backend en JSON
      console.log("Réponse API Login :", data); // Débogage de la réponse

      // Si la connexion est réussie et qu’on reçoit un token
      if (response.ok && data.token) {
        // On stocke le token dans le téléphone
        await AsyncStorage.setItem("authToken", data.token);
        console.log("Token stocké :", data.token); // Débogage

        // On affiche un message de succès
        Alert.alert("Succès", "Connexion réussie");

        // On redirige l’utilisateur vers la page Admin
        navigation.replace("Admin");
      } else {
        // En cas d’erreur côté identifiants ou token manquant
        Alert.alert("Erreur", data.message || "Identifiants incorrects");
      }
    } catch (error) {
      // En cas de problème de connexion avec le serveur
      console.error("Erreur de connexion :", error);
      Alert.alert("Erreur", "Impossible de se connecter au serveur.");
    }
  };

  // Affichage de l’interface de connexion avec un fond d'image et un conteneur blanc
  return (
    <ImageBackground source={bleu} style={styles.backgroundImage}>
      <View style={styles.container}>
        {/* Conteneur principal pour les éléments de connexion avec un fond blanc et un design professionnel */}
        <View style={styles.loginCard}>
          <Text style={styles.title}>Connexion Admin</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            placeholderTextColor="#9aa0a6"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none" // Empêche la première lettre de passer en majuscule automatiquement
            autoCorrect={false} // Désactive la correction automatique
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#9aa0a6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Cache le mot de passe pendant la saisie
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

// Styles pour le composant
const styles = StyleSheet.create({
  // Style pour l'image de fond, couvre tout l'écran
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover", // Ajuste l'image pour couvrir tout l'espace sans déformation
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "rgba(214, 234, 255, 0.8)", // Opacité légère pour lisibilité sur l'image
  },
  // Conteneur blanc pour les éléments de connexion avec un design professionnel
  loginCard: {
    backgroundColor: "rgba(214, 234, 255, 0.8)", // Fond semi-transparent pour lisibilité
    padding: 25, // Espacement interne
    borderRadius: 15, // Coins arrondis
    shadowColor: "#000", // Ombre pour un effet 3D
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6, // Ombre pour Android
    alignItems: "center", // Centre les éléments horizontalement
  },
  title: {
    fontSize: 32, // Taille de police augmentée pour un look pro
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "bold",
    color: "#1a2b6d",
    letterSpacing: 1.2,
  },
  input: {
    height: 55, // Hauteur augmentée pour un look moderne
    backgroundColor: "#f9f9f9", // Fond clair pour les champs
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0", // Bordure légère
    width: "90%", // Largeur ajustée pour s'intégrer au conteneur
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    width: "90%", // Largeur ajustée pour un look cohérent
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
});
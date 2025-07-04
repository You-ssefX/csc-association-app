import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import bleu from "../Component/assets/bleu.png";
import logo from '../Component/assets/logo.png';
import config from "../Component/config"; // <-- import de la config ici

export default function Admin({ navigation }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await AsyncStorage.getItem("authToken");

        if (!token) {
          navigation.replace("Login");
          return;
        }

        const response = await fetch(
          `${config.BASE_URL}/api/auth/check-auth`,  // <-- utilisation de la config ici
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          navigation.replace("Login");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Erreur d'authentification :", error);
        navigation.replace("Login");
      }
    }

    checkAuth();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      await fetch(`${config.BASE_URL}/api/logout`, {  // <-- aussi ici
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.warn("Erreur lors de la déconnexion du serveur");
    }

    await AsyncStorage.removeItem("authToken");
    navigation.replace("Login");
    Alert.alert("Déconnexion", "Vous avez été déconnecté.");
  };

  const RenderButton = ({ title, onPress, bgColor, emoji }) => (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>
        {emoji} {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ImageBackground source={bleu} style={styles.backgroundImage}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={bleu} style={styles.backgroundImage}>
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#d0e6fd" />

        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Bienvenue 👋</Text>
        <Text style={styles.subtitle}>Espace administrateur du Centre</Text>

        <View style={styles.buttonContainer}>
          <RenderButton
            title="Envoyer un message"
            emoji="✉️"
            onPress={() => navigation.navigate("Envoyer")}
            bgColor= 'rgb(242,201,76)'
          />
          <RenderButton
            title="Historique"
            emoji="📜"
            onPress={() => navigation.navigate("Historique")}
            bgColor= 'rgb(242,201,76)'
          />
          <RenderButton
            title="Liste des utilisateurs"
            emoji="👥"
            onPress={() => navigation.navigate("Utilisateurs")}
            bgColor= 'rgb(242,201,76)'
          />
          <RenderButton
            title="Déconnexion"
            emoji="🔓"
            onPress={handleLogout}
            bgColor="#eb3b5a"
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // 📸 Image de fond qui couvre toute la page
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover", // L'image couvre tout l'écran sans déformation
  },

  // 📦 Conteneur principal avec opacité légère
   container: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    backgroundColor: "rgba(214, 234, 255, 0.8)",
  },
 logo: {
    width: 220,
    height: 190,
    alignSelf: 'center',       // Centre horizontalement
    borderRadius: 100,          // Coins arrondis sur tout le logo
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#34495e",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    paddingVertical: 18,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#aaa",
    marginVertical: 4,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#2c3e50",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});

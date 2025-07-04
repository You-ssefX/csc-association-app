import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from "axios"; // Bibliothèque pour les appels API
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars"; // Composant pour le calendrier
import bleu from './assets/bleu.png'; // Image de fond
import logo from './assets/logo.png'; // Logo de l'application
import config from "./config"; // Configuration de l'application (URL de l'API)

// Composant principal pour la gestion des utilisateurs
function User() {
  // États locaux pour gérer les données et l'interface
  const [allUsers, setAllUsers] = useState([]); // Liste complète des utilisateurs pour les badges
  const [users, setUsers] = useState([]); // Utilisateurs du groupe sélectionné
  const [activeGroup, setActiveGroup] = useState(null); // Groupe actuellement sélectionné
  const [loading, setLoading] = useState(true); // Indicateur de chargement
  const [error, setError] = useState(null); // Message d'erreur en cas de problème
  const [modalVisible, setModalVisible] = useState(false); // Contrôle de la modale principale d'édition
  const [dateModalVisible, setDateModalVisible] = useState(false); // Contrôle de la modale de sélection de date
  const [yearModalVisible, setYearModalVisible] = useState(false); // Contrôle de la modale de sélection d'année
  const [imageModalVisible, setImageModalVisible] = useState(false); // Contrôle de la modale d'affichage de l'image
  const [selectedImage, setSelectedImage] = useState(null); // URL de l'image sélectionnée pour affichage en grand
  const [editingUser, setEditingUser] = useState(null); // ID de l'utilisateur en cours d'édition
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", birthdate: "" }); // Données du formulaire d'édition
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // Année sélectionnée pour le Picker
  const [contextMenuVisible, setContextMenuVisible] = useState(false); // Contrôle de la fenêtre contextuelle
  const [selectedUserId, setSelectedUserId] = useState(null); // ID de l'utilisateur sélectionné pour le menu contextuel

  const API_URL = `${config.BASE_URL}/api/users`; // URL de base pour les appels API
  const BASE_URL = config.BASE_URL; // URL de base pour construire les URLs relatives
  const DEFAULT_AVATAR_URL = `${BASE_URL}/uploads/default-avatar.png`; // URL d'image par défaut

  // Fonction utilitaire pour normaliser l'URL de l'image
  const normalizeProfilePicture = (profilePicture) => {
    if (!profilePicture) return DEFAULT_AVATAR_URL;
    return profilePicture.startsWith('http') ? profilePicture : `${BASE_URL}${profilePicture}`;
  };

  // Effet pour charger tous les utilisateurs au démarrage
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const groupsToFetch = ["Jeunesse", "Enfance", "Familles"];
        let all = [];

        // Récupère les utilisateurs pour chaque groupe
        for (const group of groupsToFetch) {
          const res = await axios.get(`${API_URL}/group/${group}`);
          all = [...all, ...res.data.map(user => ({
            ...user,
            profilePicture: normalizeProfilePicture(user.profilePicture) // Normalise l'URL de l'image
          }))];
          console.log(`Données récupérées pour le groupe ${group} :`, res.data);
        }

        setAllUsers(all);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des utilisateurs :", err);
        setError("Erreur lors du chargement des utilisateurs.");
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, []);

  // Effet pour charger les utilisateurs du groupe sélectionné
  useEffect(() => {
    const fetchGroupUsers = async () => {
      if (!activeGroup) return;

      setLoading(true);
      try {
        let fetchedUsers;
        if (activeGroup === "Générale") {
          fetchedUsers = allUsers; // Utilise tous les utilisateurs pour le groupe "Générale"
        } else {
          const res = await axios.get(`${API_URL}/group/${activeGroup}`);
          fetchedUsers = res.data.map(user => ({
            ...user,
            profilePicture: normalizeProfilePicture(user.profilePicture) // Normalise l'URL de l'image
          }));
        }
        setUsers(fetchedUsers);
        setError(null);
      } catch (err) {
        console.error(`Erreur lors du chargement des utilisateurs du groupe ${activeGroup} :`, err);
        setError("Impossible de charger les utilisateurs du groupe.");
      }
      setLoading(false);
    };

    fetchGroupUsers();
  }, [activeGroup, allUsers]);

  // Liste des groupes disponibles
  const groups = ["Générale", "Familles", "Jeunesse", "Enfance"];

  // Confirmation de suppression avec alerte
  const confirmDelete = (userId, userFullName) => {
    Alert.alert("Confirmation", `Supprimer ${userFullName} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/${userId}`);
            setUsers(users.filter((u) => u._id !== userId));
            setAllUsers(allUsers.filter((u) => u._id !== userId)); // Met à jour la liste complète
            Alert.alert("Succès", `${userFullName} a été supprimé.`);
          } catch (err) {
            setError("Erreur lors de la suppression.");
            console.error("Erreur lors de la suppression :", err);
          }
        },
      },
    ]);
  };

  // Soumission des modifications de l'utilisateur
  const handleUpdateUser = async (userId) => {
    try {
      const { firstName, lastName, birthdate } = editForm;
      const token = await AsyncStorage.getItem('token'); // Récupère le token depuis AsyncStorage
      const response = await axios.put(`${API_URL}/${userId}/update-info`, {
        firstName,
        lastName,
        birthdate,
      }, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      setUsers(users.map((u) => (u._id === userId ? response.data.user : u)));
      setAllUsers(allUsers.map((u) => (u._id === userId ? response.data.user : u))); // Met à jour la liste complète
      setModalVisible(false);
      setEditingUser(null);
      setEditForm({ firstName: "", lastName: "", birthdate: "" });
      Alert.alert("Succès", "Utilisateur mis à jour avec succès.");
    } catch (err) {
      setError("Erreur lors de la mise à jour.");
      console.error("Erreur lors de la mise à jour :", err);
    }
  };

  // Génération des années pour le Picker (1900 à 2100)
  const years = Array.from({ length: 2100 - 1900 + 1 }, (_, i) => (1900 + i).toString());

  // Affichage de la liste des groupes si aucun n'est sélectionné
  if (!activeGroup) {
    return (
      <ImageBackground source={bleu} style={styles.backgroundImage}>
        <ScrollView contentContainerStyle={styles.container}>
          <StatusBar barStyle="dark-content" />
          {/* Logo de l'application */}
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>📋 Gestion des utilisateurs</Text>

          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            groups.map((group) => {
              const count =
                group === "Générale"
                  ? allUsers.length
                  : allUsers.filter((user) => user.group === group).length;

              return (
                <TouchableOpacity
                  key={group}
                  style={styles.groupButton}
                  activeOpacity={0.8}
                  onPress={() => setActiveGroup(group)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.groupButtonText}>{group}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </ImageBackground>
    );
  }

  // Affichage des utilisateurs du groupe sélectionné
  return (
    <ImageBackground source={bleu} style={styles.backgroundImage}>
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.subtitle}>🧑‍🤝‍🧑 Groupe sélectionné : {activeGroup}</Text>

          {/* Bouton pour revenir à la liste des groupes */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveGroup(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>🔙 Retour aux groupes</Text>
          </TouchableOpacity>

          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : users.length === 0 ? (
            <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
          ) : (
            users.map((user) => (
              <TouchableOpacity
                key={user._id}
                style={styles.userItem}
                onPress={() => {
                  console.log("Photo de profil de l'utilisateur :", user.profilePicture);
                  setSelectedUserId(user._id);
                  setContextMenuVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.userInfo}>
                  <View style={styles.userTextContainer}>
                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </Text>
                    {user.birthdate && (
                      <Text style={styles.birthdateText}>
                        {new Date(user.birthdate).toISOString().split("T")[0]}
                      </Text>
                    )}
                    {!user.adhesion && user.phone && (
                      <Text style={styles.userPhone}>Tel: {user.phone}</Text>
                    )}
                    {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
                    <Text style={styles.userGroup}>{user.group}</Text>
                  </View>
                  {/* Bouton pour afficher l'image en grand */}
                  <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => {
                      setSelectedImage(normalizeProfilePicture(user.profilePicture));
                      setImageModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: normalizeProfilePicture(user.profilePicture) }}
                      style={styles.avatar}
                      resizeMode="cover"
                      onLoadStart={() => {
                        setUsers(users.map(u =>
                          u._id === user._id ? { ...u, profilePictureLoading: true } : u
                        ));
                      }}
                      onLoad={() => {
                        setUsers(users.map(u =>
                          u._id === user._id ? { ...u, profilePictureLoading: false } : u
                        ));
                      }}
                      onError={(e) => {
                        console.log("Erreur de chargement de l'image :", user.profilePicture, e.nativeEvent.error);
                        setUsers(users.map(u =>
                          u._id === user._id ? { ...u, profilePictureLoading: false, profilePicture: DEFAULT_AVATAR_URL } : u
                        ));
                      }}
                    />
                    {user.profilePictureLoading && <ActivityIndicator size="small" color="#0000ff" style={styles.loadingIndicator} />}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Modale principale pour l'édition des informations de l'utilisateur */}
        {modalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Modifier l'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={editForm.firstName}
                onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                placeholder="Prénom"
              />
              <TextInput
                style={styles.input}
                value={editForm.lastName}
                onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                placeholder="Nom"
              />
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setDateModalVisible(true)}
              >
                <Text style={styles.dateText}>
                  {editForm.birthdate || "Choisir une date de naissance"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => handleUpdateUser(editingUser)}
                activeOpacity={0.7}
              >
                <Text style={styles.updateButtonText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditingUser(null);
                  setEditForm({ firstName: "", lastName: "", birthdate: "" });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modale pour la sélection de la date de naissance */}
        {dateModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir une date</Text>
              <View style={styles.yearSelector}>
                <TouchableOpacity
                  style={styles.yearButton}
                  onPress={() => setYearModalVisible(true)}
                >
                  <Text style={styles.yearText}>{selectedYear}</Text>
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={(day) => {
                  setEditForm({ ...editForm, birthdate: day.dateString });
                  setDateModalVisible(false);
                }}
                markedDates={{
                  [editForm.birthdate]: { selected: true, selectedColor: "#45aaf2" },
                }}
                theme={{
                  calendarBackground: "#f9f9f9",
                  textSectionTitleColor: "#2a4365",
                  selectedDayBackgroundColor: "#45aaf2",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#3b82f6",
                  dayTextColor: "#1e293b",
                  textDisabledColor: "#94a3b8",
                }}
                minDate={"1900-01-01"}
                maxDate={"2100-12-31"}
                current={editForm.birthdate || `${selectedYear}-01-01`}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDateModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modale pour la sélection de l'année */}
        {yearModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir une année</Text>
              <Picker
                selectedValue={selectedYear}
                style={styles.picker}
                onValueChange={(itemValue) => {
                  setSelectedYear(itemValue);
                  const currentDate = editForm.birthdate
                    ? new Date(editForm.birthdate)
                    : new Date();
                  const newDate = new Date(
                    itemValue,
                    currentDate.getMonth(),
                    currentDate.getDate()
                  );
                  setEditForm({
                    ...editForm,
                    birthdate: newDate.toISOString().split("T")[0],
                  });
                  setYearModalVisible(false);
                }}
              >
                {years.map((year) => (
                  <Picker.Item
                    key={year}
                    label={year}
                    value={year}
                    color="#000"
                  />
                ))}
              </Picker>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setYearModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modale pour afficher l'image de profil en grand */}
        {imageModalVisible && selectedImage && (
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContent}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
                onError={(e) => {
                  console.log("Erreur de chargement de l'image en grand :", selectedImage, e.nativeEvent.error);
                  setSelectedImage(DEFAULT_AVATAR_URL);
                }}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setImageModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu contextuel pour les actions sur un utilisateur (Modifier/Supprimer) */}
        {contextMenuVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.contextMenuContent}>
              <Text style={styles.contextMenuTitle}>Actions</Text>
              <TouchableOpacity
                style={styles.contextMenuButton}
                onPress={() => {
                  const user = users.find(u => u._id === selectedUserId);
                  if (user) {
                    setModalVisible(true);
                    setEditingUser(user._id);
                    setEditForm({
                      firstName: user.firstName || "",
                      lastName: user.lastName || "",
                      birthdate: user.birthdate
                        ? new Date(user.birthdate).toISOString().split("T")[0]
                        : ""
                    });
                    setSelectedYear(
                      user.birthdate
                        ? new Date(user.birthdate).getFullYear().toString()
                        : new Date().getFullYear().toString()
                    );
                    setContextMenuVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.contextMenuButtonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contextMenuButton, styles.deleteContextButton]}
                onPress={() => {
                  const user = users.find(u => u._id === selectedUserId);
                  if (user) {
                    confirmDelete(user._id, `${user.firstName} ${user.lastName}`);
                    setContextMenuVisible(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.contextMenuButtonText}>Supprimer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setContextMenuVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

// Styles pour l'interface utilisateur
const styles = StyleSheet.create({
  // Style pour l'image de fond, couvre tout l'écran
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Conteneur principal avec padding et fond semi-transparent
  container: {
    padding: 15,
    minHeight: "100%",
    backgroundColor: 'rgba(214, 234, 255, 0.7)',
  },
  // Titre principal de la page
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#33475b",
    marginBottom: 70,
    textAlign: "center",
  },
  // Sous-titre pour le groupe sélectionné
  subtitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2a4365",
    marginBottom: 15,
    textAlign: "center",
  },
  // Style pour les boutons de groupe
  groupButton: {
    backgroundColor: 'rgb(242,201,76)',
    paddingVertical: 19,
    borderRadius: 16,
    marginBottom: 7,
    borderWidth: 2,
    borderColor: "#aaa",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  // Style pour le logo
  logo: {
    width: 300,
    height: 150,
    alignSelf: "center",
    marginBottom: 30,
    borderRadius: 16,
    shadowRadius: 6,
  },
  // Texte des boutons de groupe
  groupButtonText: {
    color: "#2c3e50",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  // Badge pour afficher le nombre d'utilisateurs dans un groupe
  countBadge: {
    backgroundColor: "#94bbff",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  // Texte à l'intérieur du badge
  countText: {
    color: "#1a237e",
    fontWeight: "700",
    fontSize: 12,
  },
  // Bouton pour revenir à la liste des groupes
  backButton: {
    backgroundColor: "#cbd5e1",
    padding: 10,
    borderRadius: 12,
    marginBottom: 25,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  // Texte du bouton de retour
  backButtonText: {
    fontSize: 16,
    color: "#33475b",
    fontWeight: "600",
  },
  // Style pour chaque élément utilisateur
  userItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 14,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#33475b",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  // Conteneur pour les informations de l'utilisateur
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  // Conteneur pour le texte des informations utilisateur
  userTextContainer: {
    flexShrink: 1,
  },
  // Conteneur pour l'avatar
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  // Style pour l'image de l'avatar
  avatar: {
    width: "100%",
    height: "100%",
  },
  // Indicateur de chargement pour l'image
  loadingIndicator: {
    position: 'absolute',
  },
  // Nom de l'utilisateur
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  // Email de l'utilisateur
  userEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  // Groupe de l'utilisateur
  userGroup: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#3b82f6",
  },
  // Date de naissance
  birthdateText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  // Numéro de téléphone
  userPhone: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  // Texte affiché si aucun utilisateur n'est trouvé
  emptyText: {
    fontStyle: "italic",
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  // Texte affiché pendant le chargement
  loadingText: {
    fontSize: 16,
    color: "#2a4365",
    textAlign: "center",
    marginTop: 20,
    backgroundColor: 'rgba(214, 234, 255, 0.7)',
  },
  // Texte pour les erreurs
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 20,
  },
  // Champs de saisie pour le formulaire
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  // Bouton pour enregistrer les modifications
  updateButton: {
    backgroundColor: "#45aaf2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  // Texte du bouton d'enregistrement
  updateButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "700",
  },
  // Bouton pour annuler
  cancelButton: {
    backgroundColor: "#cbd5e1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  // Texte du bouton d'annulation
  cancelButtonText: {
    color: "#33475b",
    fontSize: 16,
    fontWeight: "600",
  },
  // Overlay pour les modales
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Contenu des modales
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    maxHeight: "80%",
    shadowColor: "#33475b",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  // Contenu de la modale pour l'image en grand
  imageModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "90%",
    height: "80%",
    shadowColor: "#33475b",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Style pour l'image en grand
  fullImage: {
    width: "100%",
    height: "80%",
    borderRadius: 10,
  },
  // Titre des modales
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 15,
    textAlign: "center",
  },
  // Champ pour sélectionner la date
  dateInput: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  // Texte pour le champ de date
  dateText: {
    fontSize: 16,
    color: "#1e293b",
  },
  // Conteneur pour le sélecteur d'année
  yearSelector: {
    marginBottom: 10,
  },
  // Bouton pour sélectionner l'année
  yearButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  // Texte du bouton d'année
  yearText: {
    fontSize: 16,
    color: "#1e293b",
  },
  // Style pour le Picker d'année
  picker: {
    height: 200,
    width: "100%",
    color: "#000",
    backgroundColor: "#fff",
  },
  // Contenu du menu contextuel
  contextMenuContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "60%",
    shadowColor: "#33475b",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    alignItems: "center",
  },
  // Titre du menu contextuel
  contextMenuTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 15,
    textAlign: "center",
  },
  // Boutons du menu contextuel
  contextMenuButton: {
    backgroundColor: "#45aaf2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  // Bouton de suppression dans le menu contextuel
  deleteContextButton: {
    backgroundColor: "#ef4444",
  },
  // Texte des boutons du menu contextuel
  contextMenuButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default User;
// On importe les icônes Ionicons depuis Expo
import { Ionicons } from '@expo/vector-icons';
// On importe axios pour les requêtes HTTP
import axios from 'axios';
// On importe le composant Video depuis Expo AV
import { Video } from 'expo-av';
// On importe DocumentPicker pour sélectionner des fichiers
import * as DocumentPicker from 'expo-document-picker';
// On importe le composant Calendar depuis react-native-calendars
import { Calendar } from 'react-native-calendars';
// On importe la configuration (URL de l'API) depuis le fichier config
import config from './config';

// On importe React et les hooks useEffect et useState
import React, { useEffect, useState } from 'react';

// On importe les composants de base de React Native
import {
  Alert,
  Button,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// On importe l'image bleu.png comme fond
import bleu from './assets/bleu.png';
import logo from './assets/logo.png';

const Envoyer = () => {
  // État pour le titre du message
  const [title, setTitle] = useState('');
  // État pour le contenu du message
  const [message, setMessage] = useState('');
  // État pour activer/désactiver la planification
  const [isScheduled, setIsScheduled] = useState(false); // Désactivé par défaut
  // État pour afficher/masquer le calendrier
  const [showCalendar, setShowCalendar] = useState(false);
  // État pour la date sélectionnée
  const [date, setDate] = useState(new Date());
  // État pour stocker les photos/vidéos sélectionnées
  const [photos, setPhotos] = useState([]);
  // État pour l'URI de la photo/vidéo sélectionnée dans la modale
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(null);
  // État pour stocker les notifications récupérées
  const [notifications, setNotifications] = useState([]); // Ajout de l'état notifications

  // État pour gérer la sélection des groupes
  const [selectedGroups, setSelectedGroups] = useState({
    Familles: false,
    Jeunesse: false,
    Enfance: false,
  });

  // Vérifie si tous les groupes sont sélectionnés
  const allSelected = Object.values(selectedGroups).every(Boolean);

  // Fonction pour activer/désactiver la sélection de tous les groupes
  const toggleAllGroups = () => {
    const newValue = !allSelected;
    setSelectedGroups({
      Familles: newValue,
      Jeunesse: newValue,
      Enfance: newValue,
    });
  };

  // Vérifie si une date est valide (supérieure ou égale à aujourd'hui)
  const isValidDate = (selectedDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  // Supprime une photo/vidéo de la liste des fichiers sélectionnés
  const deletePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Effet pour récupérer les notifications lors du changement de groupes sélectionnés
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const groupArray = Object.entries(selectedGroups)
          .filter(([_, value]) => value)
          .map(([key]) => key);
        console.log('Groupes envoyés à l\'API :', groupArray); // Débogage

        if (groupArray.length === 0) {
          setNotifications([]); // Aucun groupe sélectionné
          return;
        }

        const allNotifications = [];
        for (const groupName of groupArray) {
          const response = await axios.get(`${config.BASE_URL}/api/notifications/group/${groupName}/history`);
          allNotifications.push(...response.data);
        }

        allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(allNotifications);
      } catch (error) {
        if (error.response) {
          console.error('Erreur serveur:', error.response.data);
        } else {
          console.error('Erreur réseau ou autre:', error.message);
        }
      }
    };

    fetchNotifications();
  }, [selectedGroups]);

  // Fonction pour envoyer le message avec les données sélectionnées
  const handleSend = async () => {
    if (!title || !message || (isScheduled && !date)) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs nécessaires !');
      return;
    }

    if (isScheduled && !isValidDate(date)) {
      Alert.alert('Erreur', '❌ Date invalide. Choisis une date d’aujourd’hui ou plus tard.');
      return;
    }

    const selected = Object.entries(selectedGroups)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    if (selected.length === 0) {
      Alert.alert('Erreur', '❌ Choisis au moins un groupe !');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('message', message);

    if (isScheduled && date) {
      formData.append('scheduledFor', date.toISOString());
    }

    selected.forEach(group => formData.append('targetGroups', group));

    photos.forEach((file, index) => {
      formData.append('images', {
        uri: file.uri,
        name: file.name || `file_${index}.jpg`,
        type: file.type || 'image/jpeg',
      });
    });

    try {
      const response = await axios.post(`${config.BASE_URL}/api/notifications/send`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Succès', `✅ Message envoyé à : ${selected.join(', ')}`);
        setTitle('');
        setMessage('');
        setDate(new Date());
        setPhotos([]);
        setIsScheduled(false);
        setShowCalendar(false);
        setSelectedGroups({
          Familles: false,
          Jeunesse: false,
          Enfance: false,
        });
      } else {
        throw new Error(`Statut inattendu: ${response.status}`);
      }
    } catch (err) {
      if (err.response) {
        console.error('Erreur serveur:', err.response.data);
        Alert.alert('Erreur serveur', err.response.data.message || JSON.stringify(err.response.data));
      } else if (err.request) {
        console.error('Pas de réponse du serveur:', err.request);
        Alert.alert('Erreur', '❌ Le serveur ne répond pas.');
      } else {
        console.error('Erreur inconnue:', err.message);
        Alert.alert('Erreur inconnue', err.message);
      }
    }
  };

  return (
    <ImageBackground source={bleu} style={styles.backgroundImage}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={logo}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerText}>centres socioculturels</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Sélectionner un groupe :</Text>
            {/* Conteneur horizontal pour Générale et Familles */}
            <View style={styles.groupRow}>
              <View style={styles.switchContainerSmall}>
                <TouchableOpacity
                  style={[styles.groupButton, allSelected && styles.groupButtonActive]}
                  onPress={toggleAllGroups}
                >
                  <Text style={styles.groupTitle}>Générale</Text>
                </TouchableOpacity>
                <Switch
                  value={allSelected}
                  onValueChange={toggleAllGroups}
                  trackColor={{ false: '#ccc', true: 'rgba(0, 255, 0, 0.5)' }}
                  thumbColor={allSelected ? 'rgba(113, 10, 110, 0.7)' : '#f4f3f4'}
                />
              </View>
              <View style={styles.switchContainerSmall}>
                <Text style={styles.groupLabel}>Familles</Text>
                <Switch
                  value={selectedGroups.Familles}
                  onValueChange={(value) =>
                    setSelectedGroups((prev) => ({ ...prev, Familles: value }))
                  }
                  trackColor={{ false: '#ccc', true: 'rgba(0, 255, 0, 0.5)' }}
                  thumbColor={selectedGroups.Familles ? 'rgba(0, 255, 0, 0.5)' : '#f4f3f4'}
                />
              </View>
            </View>
            {/* Conteneur horizontal pour Jeunesse et Enfance */}
            <View style={styles.groupRow}>
              <View style={styles.switchContainerSmall}>
                <Text style={styles.groupLabel}>Jeunesse</Text>
                <Switch
                  value={selectedGroups.Jeunesse}
                  onValueChange={(value) =>
                    setSelectedGroups((prev) => ({ ...prev, Jeunesse: value }))
                  }
                  trackColor={{ false: '#ccc', true: 'rgba(0, 255, 0, 0.5)' }}
                  thumbColor={selectedGroups.Jeunesse ? 'rgba(0, 255, 0, 0.5)' : '#f4f3f4'}
                />
              </View>
              <View style={styles.switchContainerSmall}>
                <Text style={styles.groupLabel}>Enfance</Text>
                <Switch
                  value={selectedGroups.Enfance}
                  onValueChange={(value) =>
                    setSelectedGroups((prev) => ({ ...prev, Enfance: value }))
                  }
                  trackColor={{ false: '#ccc', true: 'rgba(0, 255, 0, 0.5)' }}
                  thumbColor={selectedGroups.Enfance ? 'rgba(0, 255, 0, 0.5)' : '#f4f3f4'}
                />
              </View>
            </View>

            <Text style={styles.label}>Titre :</Text>
            <TextInput
              style={styles.inpute}
              value={title}
              onChangeText={setTitle}
              placeholder="Entrez le titre ici..."
              placeholderTextColor="#9aa0a6"
              maxLength={50}
            />

            <Text style={styles.label}>Message :</Text>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Écris ton message ici..."
              placeholderTextColor="#9aa0a6"
              multiline
            />

            <View style={styles.switchContainer}>
              <Text style={styles.groupLabel}>Planifier l’envoi ?</Text>
              <Switch
                value={isScheduled}
                onValueChange={(value) => {
                  setIsScheduled(value);
                  if (value) setShowCalendar(true);
                  else {
                    setShowCalendar(false);
                    setDate(new Date());
                  }
                }}
                trackColor={{ false: '#ccc', true: '#00ff00' }}
                thumbColor={isScheduled ? '#00ff00' : '#f4f3f4'}
              />
            </View>

            {showCalendar && (
              <>
                <Text style={styles.label}>📅 Choisis une date :</Text>
                <Calendar
                  onDayPress={(day) => {
                    const selected = new Date(day.dateString);
                    setDate(selected);
                    setShowCalendar(false);
                  }}
                  markedDates={{
                    [date.toISOString().split('T')[0]]: {
                      selected: true,
                      marked: true,
                      selectedColor: '#003366',
                    },
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#003366',
                    todayTextColor: '#00adf5',
                    arrowColor: '#003366',
                  }}
                />
              </>
            )}

            {isScheduled && date && (
              <Text style={styles.dateText}>📅 Date choisie : {date.toLocaleDateString()}</Text>
            )}

            <TouchableOpacity
              onPress={async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'video/*'],
                    multiple: true,
                    copyToCacheDirectory: true,
                  });

                  if (result?.assets && result.assets.length > 0) {
                    const selectedFiles = result.assets.map((file) => ({
                      name: file.name,
                      uri: file.uri,
                      type: file.mimeType || 'media',
                    }));
                    setPhotos((prevPhotos) => [...prevPhotos, ...selectedFiles]);
                  } else if (!result.cancelled && result.uri) {
                    setPhotos((prevPhotos) => [
                      ...prevPhotos,
                      {
                        name: result.name,
                        uri: result.uri,
                        type: result.mimeType || 'media',
                      },
                    ]);
                  }
                } catch (error) {
                  console.log('Erreur lors de la sélection des fichiers :', error);
                  Alert.alert('Erreur', 'Impossible de sélectionner les fichiers.');
                }
              }}
              style={styles.uploadButton}
            >
              <Text style={styles.uploadButtonText}>📁 Ajouter des fichiers</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#003366', marginBottom: 10 }}>
                  📷 Fichiers sélectionnés :
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {photos.map((file, index) => (
                    <View key={index} style={styles.thumbnailContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelectedPhotoUri(file.uri)}
                        style={styles.touchableThumbnail}
                      >
                        {file.type.startsWith('video') ? (
                          <View style={styles.videoThumbnail}>
                            <Image
                              source={require('./assets/video-icon.png')}
                              style={styles.videoIcon}
                            />
                            <Text style={styles.videoLabel}>Vidéo</Text>
                          </View>
                        ) : (
                          <Image
                            source={{ uri: file.uri }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                          />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePhoto(index)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                      </TouchableOpacity>
                      <Text style={styles.thumbnailText} numberOfLines={1}>
                        {file.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <Modal
              visible={selectedPhotoUri !== null}
              transparent
              animationType="fade"
              onRequestClose={() => setSelectedPhotoUri(null)}
            >
              <View style={styles.modalBackground}>
                <TouchableOpacity
                  style={styles.modalCloseArea}
                  onPress={() => setSelectedPhotoUri(null)}
                  activeOpacity={1}
                />
                <View style={styles.modalContent}>
                  {selectedPhotoUri && selectedPhotoUri.endsWith('.mp4') ? (
                    <Video
                      source={{ uri: selectedPhotoUri }}
                      style={styles.fullMedia}
                      useNativeControls
                      resizeMode="contain"
                      onError={(error) => console.log('Erreur vidéo:', error)}
                    />
                  ) : (
                    <Image source={{ uri: selectedPhotoUri }} style={styles.fullMedia} resizeMode="contain" />
                  )}
                  <Button title="Fermer" onPress={() => setSelectedPhotoUri(null)} color="#003366" />
                </View>
              </View>
            </Modal>

            <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.8}>
              <Text style={styles.sendButtonText}>📤 Envoyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Envoyer;

const styles = StyleSheet.create({
  // Style pour l'image de fond, couvre tout l'écran
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Ajuste l'image pour couvrir tout l'espace sans déformation
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'rgba(214, 234, 255, 0.7)', // Opacité légère pour lisibilité
  },
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logo: {
    width: 200,
    height: 130,
    alignSelf: 'center', // Centre horizontalement
    marginTop: 10, // ➕ monte un peu le logo (au lieu de marginBottom)
    borderRadius: 20, // Coins arrondis sur tout le logo
    overflow: 'hidden', // Nécessaire pour que borderRadius fonctionne
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFC107',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgb(244, 214, 124)', // Opacité légère pour lisibilité
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    width: '90%',
    alignSelf: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A237E',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    borderColor: '#B3CDE0',
    borderWidth: 2,
    marginBottom: 15,
    color: '#333',
    height: 120,
  },
  inpute: {
    // Style spécifique pour le champ du titre
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 9,
    fontSize: 16,
    borderColor: '#B3CDE0',
    borderWidth: 2,
    marginBottom: 9,
    color: '#333',
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#aaa',
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  switchContainerSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5, // Réduit le padding
    backgroundColor: '#FFFFFF',
    borderRadius: 10, // Coins plus petits
    borderWidth: 1,
    borderColor: '#aaa',
    width: '48%', // Réduit la largeur pour s'adapter horizontalement
  },
  groupButton: {
    backgroundColor: '#ccc',
    paddingVertical: 5, // Réduit le padding vertical
    paddingHorizontal: 10, // Réduit le padding horizontal
    borderRadius: 10, // Coins plus petits
  },
  groupButtonActive: {
    backgroundColor: 'rgba(113, 10, 110, 0.7)', // Opacité légère pour lisibilité // Violet
  },
  groupTitle: {
    fontSize: 14, // Réduit la taille du texte
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  groupLabel: {
    fontSize: 14, // Réduit la taille du texte
    color: '#1A237E',
  },
  dateText: {
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
    color: '#1A237E',
  },
  sendButton: {
    backgroundColor: '#003366', // Bleu foncé
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
    width: 110,
  },
  touchableThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 16,
    padding: 4,
    elevation: 4,
    zIndex: 10,
  },
  thumbnailText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    color: '#1A237E',
    width: 100,
    flexWrap: 'wrap',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: '100%',
    height: '85%',
    borderRadius: 12,
  },
  modalCloseArea: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  videoIcon: {
    width: 40,
    height: 40,
    tintColor: '#000',
  },
  videoLabel: {
    fontSize: 12,
    color: '#000',
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: 'rgba(214, 234, 255, 0.7)', // Opacité légère pour lisibilité
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 3, // ombre sur Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
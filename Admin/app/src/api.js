// src/api.js

// On importe la bibliothèque axios, qui sert à faire des requêtes HTTP (GET, POST, etc.) facilement depuis le frontend
import axios from 'axios';

// Ici on définit l'URL de base de notre serveur backend (Node.js) —
// Remplace cette IP par l'adresse de ton serveur (localhost ou IP locale du PC où tourne le backend)
export const SERVER_URL = 'http://172.20.10.3:5000';

// On crée une URL complète pour l'endpoint (point d'accès) qui permet d'envoyer des messages au backend.
// Cette URL est construite en ajoutant "/messages/send" à l'URL de base SERVER_URL.
// Ça évite de répéter cette chaîne partout dans le code.
export const SEND_MESSAGES_ENDPOINT = `${SERVER_URL}/api/notifications/send`;

// Cette fonction asynchrone 'sendMessages' permet d'envoyer des messages au backend.
// Elle prend en paramètre 'messages' (un objet ou tableau contenant les données à envoyer).
export const sendMessages = async (messages) => {
  try {
    // On utilise axios pour faire une requête POST vers l'endpoint SEND_MESSAGES_ENDPOINT,
    // en envoyant 'messages' dans le corps de la requête.
    // axios retourne une promesse, on attend sa réponse avec 'await'.
    const response = await axios.post(SEND_MESSAGES_ENDPOINT, messages);

    // Si tout se passe bien, on retourne les données reçues en réponse (response.data),
    // qui peuvent contenir une confirmation, un ID, etc.
    return response.data;
  } catch (error) {
    // Si une erreur arrive (par exemple, serveur inaccessible, mauvaise URL, problème réseau),
    // on affiche un message d'erreur dans la console pour aider au debug.
    console.error('Erreur lors de l\'envoi des messages:', error);

    // On relance l'erreur pour que la fonction qui a appelé sendMessages puisse aussi la gérer (afficher un message utilisateur, etc.).
    throw error;
  }
};

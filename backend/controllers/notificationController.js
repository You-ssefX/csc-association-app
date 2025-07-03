const path = require('path');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const scheduleNotification = require('../planificationDate/notificationScheduler');

// Constant array for valid user groups
const VALID_GROUPS = ['Familles', 'Jeunesse', 'Enfance'];

/**
 * Create a new notification
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, message, targetGroups, isInteractive, scheduledFor } = req.body;
    console.log('targetGroups reçus:', req.body.targetGroups);
    console.log("📨 Date de planification reçue :", req.body.scheduledFor);

    // Conversion de scheduledFor en Date
    const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
    if (scheduledDate) {
      const now = new Date();
      console.log('Date planifiée est dans le futur ?', scheduledDate > now);
    }

    // 🖼️ Récupération des images uploadées
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => {
        // Store only the relative path
        return `/uploads/notification-images/${file.filename}`;
      });
    }

    if (!title || !message || !targetGroups) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Gestion des groupes
    let groups = [];
    if (targetGroups) {
      groups = Array.isArray(targetGroups)
        ? targetGroups
        : targetGroups.split(',').map(g => g.trim());
    }

    if (!groups.every((g) => VALID_GROUPS.includes(g))) {
      return res.status(400).json({ error: 'Invalid target groups' });
    }

    // Création de la notification avec le tableau d’images
    const notification = new Notification({
      title,
      message,
      imageUrl: imageUrls,
      targetGroups: groups,
      isInteractive,
      scheduledFor: scheduledDate,
      sentAt: scheduledDate ? null : new Date(),
    });

    await notification.save();

    if (scheduledDate) {
      scheduleNotification(notification);
    }

    res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Respond to a notification
 */
exports.respondToNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, response } = req.body;

    if (!['available', 'unavailable'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingResponse = notification.responses.find((r) => r.user.toString() === userId);
    if (existingResponse) {
      existingResponse.response = response;
    } else {
      notification.responses.push({ user: userId, response });
    }

    await notification.save();
    res.status(200).json({ message: 'Response recorded', notification });
  } catch (err) {
    console.error('Error responding to notification:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Fetch notifications with optional group filtering
 */
exports.getNotifications = async (req, res) => {
  try {
    const { group } = req.query;
    let query = {};

    if (group) {
      if (!VALID_GROUPS.includes(group)) {
        return res.status(400).json({ error: 'Invalid group name' });
      }
      query = { targetGroups: group };
    }

    const notifications = await Notification.find(query).sort({ sentAt: -1 });
    const result = notifications.map((notif) => {
      const interestedCount = notif.responses?.filter((r) => r.response === 'available').length || 0;
      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        imageUrl: notif.imageUrl,
        targetGroups: notif.targetGroups,
        sentAt: notif.sentAt,
        scheduledFor: notif.scheduledFor,
        interestedCount,
      };
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Fetch photos with optional group filtering
 */
exports.getPhotos = async (req, res) => {
  try {
    const { group } = req.query;
    let query = { imageUrl: { $ne: [] } };

    if (group) {
      if (!VALID_GROUPS.includes(group)) {
        return res.status(400).json({ error: 'Invalid group name' });
      }
      query.targetGroups = group;
    }

    const notificationsWithPhotos = await Notification.find(query)
      .sort({ sentAt: -1 })
      .select('imageUrl targetGroups');
    const photoUrls = notificationsWithPhotos.map((n) => ({
      imageUrl: n.imageUrl,
      targetGroups: n.targetGroups,
    }));
    res.status(200).json(photoUrls);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get notification history for a specific group
 */
exports.getNotificationHistoryByGroup = async (req, res) => {
  try {
    const { groupName } = req.params;

    if (!VALID_GROUPS.includes(groupName)) {
      return res.status(400).json({ error: 'Invalid group name' });
    }

    const notifications = await Notification.find({ targetGroups: groupName }).sort({ sentAt: -1 });
    const result = notifications.map((notif) => {
      const interestedCount = notif.responses?.filter((r) => r.response === 'available').length || 0;
      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        imageUrl: notif.imageUrl,
        targetGroups: notif.targetGroups,
        sentAt: notif.sentAt,
        scheduledFor: notif.scheduledFor,
        interestedCount,
      };
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching notification history:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get users interested in a notification
 */
exports.getInterestedUsers = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId).populate(
      'responses.userId',
      'firstName lastName email'
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const interestedUsers = notification.responses
      .filter((r) => r.response === 'available')
      .map((r) => r.user);
    res.status(200).json(interestedUsers);
  } catch (err) {
    console.error('Error fetching interested users:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get photos for a specific group
 */
exports.getPhotosByGroup = async (req, res) => {
  try {
    const { groupName } = req.params;

    if (!VALID_GROUPS.includes(groupName)) {
      return res.status(400).json({ error: 'Invalid group name' });
    }

    const notificationsWithPhotos = await Notification.find({
      targetGroups: groupName,
      imageUrl: { $ne: [] },
    })
      .sort({ sentAt: -1 })
      .select('imageUrl targetGroups sentAt');
    const photoData = notificationsWithPhotos.map((notif) => ({
      photo: notif.imageUrl,
      sentAt: notif.sentAt,
      targetGroups: notif.targetGroups,
    }));
    res.status(200).json(photoData);
  } catch (err) {
    console.error('Error fetching photos by group:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get photos for a specific user based on their group membership
 */
exports.getPhotosForUser = async (req, res) => {
  const { userId } = req.params;
  console.log('Backend: getPhotosForUser called for userId:', userId);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log('Backend: User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userGroup = user.group;
    console.log('Backend: User found. Group:', userGroup);

    if (!userGroup) {
      console.log('Backend: User has no assigned group, returning empty photos.');
      return res.status(200).json([]);
    }

    const notificationsWithPhotos = await Notification.find({
      targetGroups: { $in: [userGroup] },
      imageUrl: { $exists: true, $ne: [] },
    })
      .sort({ sentAt: -1 })
      .select('imageUrl targetGroups');

    console.log('Backend: Notifications avec photos trouvées (brutes de la DB):', notificationsWithPhotos);

    const photoUrls = notificationsWithPhotos.map((n) => ({
      imageUrl: n.imageUrl,
      targetGroups: n.targetGroups,
    }));

    console.log('Backend: photoUrls prêtes à être envoyées à la galerie:', photoUrls);

    res.status(200).json(photoUrls);
  } catch (error) {
    console.error('Backend: Erreur dans getPhotosForUser:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des photos' });
  }
};
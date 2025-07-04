# CSC Association App

This project is a full-stack application for the Centre Socioculturel Bar-le-Duc, featuring a Node.js/Express backend (with MongoDB and Firebase integration) and a React Native frontend (Expo). It is designed for both users and administrators to manage notifications, user accounts, and media galleries.

---

## Table of Contents
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup (Expo/React Native)](#frontend-setup-expo-react-native)
- [Database Setup (MongoDB)](#database-setup-mongodb)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing Instructions](#testing-instructions)
- [Deployment/Production Notes](#deploymentproduction-notes)
- [Common Issues & Tips](#common-issues--tips)
- [Development Workflow](#development-workflow)
- [Admin Panel Usage](#admin-panel-usage)
- [Contribution Guidelines](#contribution-guidelines)
- [Known Issues / TODO](#known-issues--todo)
- [License](#license)
- [Contact](#contact)

---

## Quick Start

1. **Clone the repository.**
2. **Install backend and frontend dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Set up your `.env` file in `backend/`** (see [Environment Variables](#environment-variables)).
4. **Start MongoDB** (locally or use Atlas).
5. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```
6. **Start the frontend:**
   ```bash
   cd frontend
   npx expo start
   ```

---

## Project Structure

```
csc-association-app/
  backend/           # Node.js/Express backend API
  frontend/          # React Native (Expo) mobile app
  ...
```

---

## Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Create a `.env` file in the `backend/` directory with the following variables:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=5000 # (optional, defaults to 5000)
     ```
   - Ensure `firebaseServiceAccount.json` is present in `backend/` (do not share this file publicly).

3. **Start the backend server:**
   ```bash
   npm start
   # or
   node server.js
   ```
   The server will run on `http://localhost:5000` by default.

4. **Uploads:**
   - Uploaded images and files are stored in `backend/uploads/`.
   - Make sure this directory exists and is writable.

---

## Frontend Setup (Expo/React Native)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API URL:**
   - Edit `frontend/config.js` and set `BASE_URL` to your backend server address (e.g., `http://localhost:5000` or your LAN IP for device testing).

3. **Start the Expo app:**
   ```bash
   npx expo start
   ```
   - Use the QR code to open the app on your device (Expo Go app required), or run on an emulator with `npm run android` or `npm run ios`.

4. **Assets:**
   - All images and videos are in `frontend/assets/`.

---

## Database Setup (MongoDB)

- The backend requires a running MongoDB instance (local or cloud, e.g., MongoDB Atlas).
- Set the connection string in your `.env` file as `MONGODB_URI`.
- Example for local MongoDB:
  ```env
  MONGODB_URI=mongodb://localhost:27017/csc-association
  ```

---

## Environment Variables

- **MONGODB_URI**: MongoDB connection string (required)
- **JWT_SECRET**: Secret key for JWT authentication (required)
- **PORT**: Port for backend server (optional, default: 5000)

> **Note:** The backend also requires `firebaseServiceAccount.json` for Firebase Admin SDK (push notifications, etc.).

---

## API Endpoints

- `POST /api/auth/login` — User/admin login
- `POST /api/users/create` — Register new user
- `GET /api/users/check-device/:deviceId` — Check user by device
- `GET /api/notifications` — List notifications
- `POST /api/notifications` — Create notification (admin)
- `POST /api/users/upload-profile/:userId` — Upload user profile picture
- ... (see backend/routes/ for more)

---

## Testing Instructions

- **Automated tests:** (If available, describe how to run them. If not, add below:)
- _Currently, there are no automated tests. Please test endpoints manually using Postman, Insomnia, or similar tools._
- **Manual testing:**
  - Use the Expo app for frontend testing.
  - Use tools like Postman to test backend API endpoints.

---

## Deployment/Production Notes

- **Environment variables:** Set production values for `MONGODB_URI`, `JWT_SECRET`, and any other secrets.
- **Frontend build:**
  - To build a production version of the Expo app, follow Expo's [production build guide](https://docs.expo.dev/classic/building-standalone-apps/).
- **Backend:**
  - Use a process manager like PM2 for production.
  - Secure your `firebaseServiceAccount.json` and `.env` files.
- **CORS:** Ensure CORS settings allow your frontend domain in production.

---

## Common Issues & Tips

- **CORS errors:** Ensure the backend is running and accessible from your device/emulator. Update `BASE_URL` in the frontend accordingly.
- **Uploads not working:** Check that `backend/uploads/` exists and is writable.
- **Device testing:** Use your machine's LAN IP in `BASE_URL` for real device testing (e.g., `http://192.168.x.x:5000`).
- **Environment variables:** Never commit `.env` or `firebaseServiceAccount.json` to version control.
- **Dependencies:** Keep `npm install` up to date in both `backend/` and `frontend/`.

---

## Development Workflow

- **Backend:**
  - Main entry: `backend/server.js`
  - API endpoints: `/api/users`, `/api/notifications`, `/api/auth`
  - Middleware: authentication, file uploads, etc.
  - Uses MongoDB and Firebase Admin SDK

- **Frontend:**
  - Main entry: `frontend/App.js`
  - Navigation: React Navigation (stack)
  - Uses Expo for development and testing
  - Configure API URL in `frontend/config.js`

- **Admin Panel:**
  - If present, see `Admin/` directories for admin-specific features.

---

## Admin Panel Usage

- The `Admin/` directories are intended for admin-specific features (such as notification management, user administration, etc.).
- To use or develop the admin panel, refer to the code in `Admin/frontend-Admin/` and `Admin/backend/`.
- Setup is similar to the main backend/frontend: install dependencies and run the appropriate server or frontend as needed.
- (Add more details here as the admin panel evolves.)

---

## Contribution Guidelines

- Fork the repository and create your feature branch (`git checkout -b feature/YourFeature`).
- Commit your changes with clear messages.
- Push to your branch and open a Pull Request.
- Follow existing code style and add comments where necessary.
- For major changes, open an issue first to discuss what you would like to change.

---

## Known Issues / TODO

- No automated tests yet (manual testing required).
- Admin panel features may be incomplete.
- Add more robust error handling and validation.
- Improve documentation for API endpoints.
- (Update this section as the project evolves.)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For questions, contact the project maintainer or refer to code comments for further documentation.

---

**Please keep this README up to date as the project evolves!** 

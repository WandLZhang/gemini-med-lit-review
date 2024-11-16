# Medical Research Assistant

A React-based medical research assistant that helps analyze clinical research papers and provides insights based on user queries.

## Firebase Setup

### Prerequisites
1. Node.js and npm installed
2. Firebase CLI installed globally:
```bash
npm install -g firebase-tools
```

### Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable required services:
   - Authentication
     - Go to Authentication > Sign-in method
     - Enable Google Authentication
   - Firestore Database
     - Go to Firestore Database
     - Create database
     - Select production (or test mode)
     - Choose a location

### Firebase Configuration

1. In the Firebase Console, get your web app credentials:
   - Click the gear icon next to "Project Overview"
   - Click "Project settings"
   - Under "Your apps", click the web icon (</>)
   - Register your app
   - Note the firebaseConfig values for the next step

2. Create a `.env` file in your project root:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Local Setup

1. Clone the repository
```bash
git clone https://github.com/WandLZhang/gemini-med-lit-review-firebase.git
cd gemini-med-lit-review-firebase
```

2. Install dependencies
```bash
npm install
```

3. Initialize Firebase in your project
```bash
firebase login
firebase init
```

4. During Firebase initialization:
   - Select these features:
     - Firestore
     - Hosting
     - Authentication
   - Choose your project
   - Accept default Firestore rules
   - Choose `build` as your public directory
   - Configure as single-page app
   - Don't overwrite existing files

### Firestore Rules
Update your firestore.rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chats/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Authentication Setup
1. In Firebase Console, go to Authentication
2. Set up sign-in methods
3. Add authorized domains for OAuth redirects

### Local Development
```bash
npm start
```

### Deployment
1. Build your project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Features
- Google Authentication
- Real-time chat interface
- Document retrieval and analysis
- Template management
- Chat history persistence

## Environment Variables
Make sure these environment variables are set in your `.env` file:
```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

## Common Issues

### Deployment Issues
- Ensure `firebase.json` has the correct public directory (build)
- Verify all environment variables are set in Firebase Console
- Check hosting cache settings

### Authentication Issues
- Verify authorized domains in Firebase Console
- Check if .env variables are correct
- Ensure Google Sign-In is enabled in Firebase Console

## Security Considerations
- Keep your Firebase config private
- Use environment variables
- Implement proper Firestore security rules
- Sanitize user input
- Implement rate limiting for API calls

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
Apache 2.0

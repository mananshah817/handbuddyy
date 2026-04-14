const firebaseConfig = {
  apiKey: "AIzaSyAmmH_MzTY1wkZTm411N74h_a6p5XKrvEg",
  authDomain: "handbuddyy-4aa33.firebaseapp.com",
  projectId: "handbuddyy-4aa33",
  storageBucket: "handbuddyy-4aa33.firebasestorage.app",
  messagingSenderId: "367806101650",
  appId: "1:367806101650:web:cf155e46c112fb4fb70e4b",
  measurementId: "G-35K9LXG89G"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

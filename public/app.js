import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';

import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    fetchSignInMethodsForEmail
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB4dy-QQT4YLHCdMLF0C6vHUiwEwnQmyjs",
    authDomain: "todoapp-20241203.firebaseapp.com",
    projectId: "todoapp-20241203",
    storageBucket: "todoapp-20241203.firebasestorage.app",
    messagingSenderId: "1070704775643",
    appId: "1:1070704775643:web:d749dced778e49d4a3d7fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Firebase initialized');

// Add this temporary debug function
async function checkUserExists(email) {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        console.log('Sign in methods for', email, ':', methods);
        return methods.length > 0;
    } catch (error) {
        console.error('Error checking user:', error);
        return false;
    }
}

// Add this function definition near the top of the file, after Firebase initialization
function setupLogoutButton() {
    console.log('Setting up logout button');
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.onclick = async function() {
            try {
                await signOut(auth);
                console.log('Successfully logged out');
                // Reset UI
                document.getElementById('todoSection').style.display = 'none';
                document.getElementById('loginSection').style.display = 'block';
                document.body.classList.remove('todo-page');
                // Clear displayed todos
                document.getElementById('todoList').innerHTML = '';
                document.getElementById('databaseInfo').innerHTML = '';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out: ' + error.message);
            }
        };
    }
}

if (loginForm) {
    loginForm.onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            console.log('Attempting login with:', email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', userCredential.user);
            
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('todoSection').style.display = 'block';
            document.body.classList.add('todo-page');
            setupLogoutButton();
            await loadTodos(); // Make sure to await this
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed: ';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'No account exists with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Incorrect password';
                    break;
                default:
                    errorMessage += error.message;
            }
            alert(errorMessage);
            // Don't redirect on error
            return;
        }
    };
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Sign Up button click handler
    const signupButton = document.getElementById('switchToSignup');
    console.log('Looking for signup button:', signupButton); // Debug log

    if (signupButton) {
        signupButton.addEventListener('click', function() {
            console.log('Signup button clicked - attempting to show signup section');
            const loginSection = document.getElementById('loginSection');
            const signupSection = document.getElementById('signupSection');
            
            console.log('Login section:', loginSection);
            console.log('Signup section:', signupSection);
            
            loginSection.style.display = 'none';
            signupSection.style.display = 'block';
            
            console.log('Display styles updated');
        });
    } else {
        console.error('Signup button not found!');
    }

    // Sign Up form submission handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        console.log('Found signup form');
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Signup form submitted');
            
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                console.log('Attempting to create user:', email);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created successfully:', userCredential.user);
                
                // Hide signup, show todo section
                document.getElementById('signupSection').style.display = 'none';
                document.getElementById('todoSection').style.display = 'block';
                document.body.classList.add('todo-page');
                setupLogoutButton();
                loadTodos();
            } catch (error) {
                console.error('Signup error:', error);
                let errorMessage = 'Signup failed: ';
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage += 'An account already exists with this email';
                        break;
                    case 'auth/weak-password':
                        errorMessage += 'Password should be at least 6 characters';
                        break;
                    default:
                        errorMessage += error.message;
                }
                alert(errorMessage);
            }
        });
    }

    // Switch back to login button
    const loginButton = document.getElementById('switchToLogin');
    if (loginButton) {
        console.log('Found switch to login button');
        loginButton.addEventListener('click', function() {
            console.log('Switch to login clicked');
            document.getElementById('signupSection').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
        });
    }
}

// Make sure to call setupEventListeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Setting up event listeners');
    setupEventListeners();
});

// Also try immediate setup in case the DOM is already loaded
if (document.readyState === 'complete') {
    console.log('DOM already complete - Setting up event listeners');
    setupEventListeners();
}

// Modify the loadTodos function to handle errors better
async function loadTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    try {
        // Make sure we have a logged-in user
        if (!auth.currentUser) {
            console.error('No user logged in');
            return;
        }

        const q = query(
            collection(db, 'todos'),
            where('userId', '==', auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Found', querySnapshot.size, 'todos');
        
        if (querySnapshot.empty) {
            todoList.innerHTML = '<p>No todos found. Add your first todo!</p>';
            return;
        }

        allTodos = []; // Clear the array
        querySnapshot.forEach((docSnapshot) => {
            const todo = docSnapshot.data();
            todo.docId = docSnapshot.id;
            
            if (!todo.entryDate && todo.timestamp) {
                const timestamp = todo.timestamp.toDate();
                todo.entryDate = timestamp.toISOString().split('T')[0];
            }
            
            allTodos.push(todo);
        });

        // Apply initial sorting and display
        applySorting();
        updateDatabaseInfo();
    } catch (error) {
        console.error('Error loading todos:', error);
        todoList.innerHTML = '<p>Error loading todos. Please try again.</p>';
    }
}


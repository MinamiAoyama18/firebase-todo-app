// Import your Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

// Copy your Firebase configuration from the desktop version
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
const auth = getAuth();
const db = getFirestore();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const todoSection = document.getElementById('todoSection');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const userEmailSpan = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');

// Authentication logic
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(error.message);
    }
});

// Todo handling logic
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const status = document.getElementById('status').value;
    const deadline = document.getElementById('deadline').value;

    try {
        await addDoc(collection(db, 'todos'), {
            userId: auth.currentUser.uid,
            description,
            category,
            status,
            deadline,
            timestamp: new Date()
        });
        todoForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        loginSection.style.display = 'none';
        signupSection.style.display = 'none';
        todoSection.style.display = 'block';
        userEmailSpan.textContent = user.email;
        loadTodos();
        loadCategories();
    } else {
        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
        todoSection.style.display = 'none';
    }
});

// Load todos
function loadTodos() {
    const todosQuery = query(
        collection(db, 'todos'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
    );

    onSnapshot(todosQuery, (snapshot) => {
        todoList.innerHTML = '';
        snapshot.forEach((doc) => {
            const todo = doc.data();
            const div = document.createElement('div');
            div.className = 'todo-item';
            div.innerHTML = `
                <input type="checkbox" ${todo.status === 'complete' ? 'checked' : ''}>
                <span>${todo.description}</span>
                <span class="category">${todo.category}</span>
                <span class="deadline">${todo.deadline}</span>
                <button class="delete-btn">Delete</button>
            `;
            todoList.appendChild(div);
        });
    });
}

// Switch between login and signup
switchToSignup.addEventListener('click', () => {
    loginSection.style.display = 'none';
    signupSection.style.display = 'block';
});

switchToLogin.addEventListener('click', () => {
    loginSection.style.display = 'block';
    signupSection.style.display = 'none';
});

// Logout
logoutButton.addEventListener('click', () => {
    signOut(auth);
});

// Add mobile-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add touch event handlers where needed
    document.querySelectorAll('.todo-item').forEach(item => {
        item.addEventListener('touchstart', handleTouchStart);
        item.addEventListener('touchend', handleTouchEnd);
    });
});

// Add mobile-specific touch handlers
let touchStartY = 0;
let touchEndY = 0;

function handleTouchStart(event) {
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    touchEndY = event.changedTouches[0].clientY;
    handleSwipe();
}

function handleSwipe() {
    const swipeDistance = touchStartY - touchEndY;
    if (Math.abs(swipeDistance) > 50) {
        // Add swipe-to-delete functionality
    }
}

// Add this after initializing Firebase
const categorySelect = document.getElementById('category');

// Add this function to load categories
async function loadCategories() {
    console.log('Loading categories...');
    const categoriesQuery = query(
        collection(db, 'categories'),
        where('userId', '==', auth.currentUser.uid)
    );

    onSnapshot(categoriesQuery, (snapshot) => {
        console.log('Categories snapshot:', snapshot.size, 'categories found');
        // Clear existing options
        categorySelect.innerHTML = `
            <option value="">Select Category</option>
            <option value="add-new">+ Add New Category</option>
        `;
        
        // Add categories from Firestore
        snapshot.forEach((doc) => {
            console.log('Adding category:', doc.data().name);
            const category = doc.data().name;
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    });
}

// Add category handling
categorySelect.addEventListener('change', async function(e) {
    if (e.target.value === 'add-new') {
        const newCategory = prompt('Enter new category name:');
        if (newCategory) {
            try {
                await addDoc(collection(db, 'categories'), {
                    userId: auth.currentUser.uid,
                    name: newCategory,
                    timestamp: new Date()
                });
                // The categories will automatically update through the onSnapshot listener
            } catch (error) {
                alert('Error adding category: ' + error.message);
            }
        }
    }
}); 
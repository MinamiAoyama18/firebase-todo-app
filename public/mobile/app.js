// Import your Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

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
const todoSection = document.getElementById('todoSection');
const loginForm = document.getElementById('loginForm');
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const userEmailSpan = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const switchToSignup = document.getElementById('switchToSignup');

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
        todoSection.style.display = 'block';
        userEmailSpan.textContent = user.email;
        loadTodos();
        loadCategories();
    } else {
        loginSection.style.display = 'block';
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
                <div class="todo-line-1">
                    <input type="checkbox" ${todo.status === 'complete' ? 'checked' : ''}>
                    <span class="description">${todo.description}</span>
                </div>
                <div class="todo-line-2">
                    <span class="category">${todo.category}</span>
                    <span class="deadline">${todo.deadline}</span>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                </div>
            `;

            // Add delete functionality
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async () => {
                try {
                    if (confirm('Are you sure you want to delete this todo?')) {
                        await deleteDoc(doc(db, 'todos', doc.id));
                        console.log('Todo deleted successfully');
                    }
                } catch (error) {
                    console.error('Error deleting todo:', error);
                    alert('Error deleting todo. Please try again.');
                }
            });

            todoList.appendChild(div);
        });
    });
}

// Switch between login and signup
switchToSignup.addEventListener('click', () => {
    window.location.href = '/';
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
    
    try {
        // Get all todos to extract categories
        const todosRef = collection(db, 'todos');
        const q = query(todosRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        // Create a Set of unique categories
        const categories = new Set();
        
        querySnapshot.forEach((doc) => {
            const category = doc.data().category;
            if (category) categories.add(category);
        });

        // Update the select element with just the default option first
        categorySelect.innerHTML = `
            <option value="">Select Category</option>
        `;
        
        // Add existing categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        // Add the "Add New Category" option at the end
        const newOption = document.createElement('option');
        newOption.value = "add-new";
        newOption.textContent = "+ Add New Category";
        categorySelect.appendChild(newOption);

    } catch (error) {
        console.error('Error loading categories:', error);
    }
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

// Move this function to the top level (outside of any other function)
window.showDatePicker = function() {
    const deadlineInput = document.getElementById('deadline');
    const selectedDate = document.getElementById('selectedDate');
    
    deadlineInput.style.display = 'block';
    deadlineInput.showPicker();
    
    deadlineInput.addEventListener('change', function() {
        const date = new Date(this.value);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        selectedDate.textContent = formattedDate;
        this.style.display = 'none';
    }, { once: true });
} 
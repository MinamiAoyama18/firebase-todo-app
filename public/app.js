// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
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
    doc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB4dy-QQT4YLHCdMLF0C6vHUiwEwnQmyjs",
    authDomain: "todoapp-20241203.firebaseapp.com",
    projectId: "todoapp-20241203",
    storageBucket: "todoapp-20241203.firebasestorage.app",
    messagingSenderId: "1070704775643",
    appId: "1:1070704775643:web:d749dced778e49d4a3d7fe"
};

console.log('Script starting...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentId = 1; // To track the current ID number
updateCategoryDropdown(); // Add this line here to initialize categories

window.deleteTodoById = async function(docId) {
    try {
        await deleteDoc(doc(db, 'todos', docId));
        console.log('Todo deleted successfully');
        loadTodos(); // Refresh the todo list after deletion
    } catch (err) {
        console.log('Error deleting todo:', err);
    }
};

window.handleCategoryChange = function(select) {
    if (select.value === 'new') {
        const newCategory = prompt('Enter new category name:');
        if (newCategory) {
            const option = document.createElement('option');
            option.value = newCategory;
            option.textContent = newCategory;
            select.insertBefore(option, select.lastElementChild);
            select.value = newCategory;
        } else {
            select.selectedIndex = 0;
        }
    }
};

function setupEventListeners() {
    console.log('Setting up event listeners...');

    const logoutButton = document.getElementById('logoutButton');
    console.log('Found logout button:', !!logoutButton);

    if (logoutButton) {
        console.log('Adding click listener to logout button');
        logoutButton.onclick = async function() {
            console.log('Logout button clicked');
            try {
                await signOut(auth);
                console.log('Successfully signed out');
                document.getElementById('todoSection').style.display = 'none';
                document.getElementById('loginSection').style.display = 'block';
                document.body.classList.remove('todo-page');
                // Clear any sensitive data
                document.getElementById('todoList').innerHTML = '';
                document.getElementById('databaseInfo').innerHTML = '';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out: ' + error.message);
            }
        };
    }

    const signupButton = document.getElementById('switchToSignup');
    console.log('Found signup button:', !!signupButton);

    if (signupButton) {
        signupButton.addEventListener('click', function() {
            console.log('Signup button clicked - trying to show signup section');
            const loginSection = document.getElementById('loginSection');
            const signupSection = document.getElementById('signupSection');
            
            console.log('Login section display before:', loginSection.style.display);
            console.log('Signup section display before:', signupSection.style.display);
            
            loginSection.style.display = 'none';
            signupSection.style.display = 'block';
            
            console.log('Login section display after:', loginSection.style.display);
            console.log('Signup section display after:', signupSection.style.display);
        });
    }

    const loginButton = document.getElementById('switchToLogin');
    console.log('Found login button:', !!loginButton);

    if (loginButton) {
        loginButton.addEventListener('click', function() {
            console.log('Login button clicked - trying to show login section');
            const loginSection = document.getElementById('loginSection');
            const signupSection = document.getElementById('signupSection');
            
            console.log('Login section display before:', loginSection.style.display);
            console.log('Signup section display before:', signupSection.style.display);
            
            loginSection.style.display = 'block';
            signupSection.style.display = 'none';
            
            console.log('Login section display after:', loginSection.style.display);
            console.log('Signup section display after:', signupSection.style.display);
        });
    }

    const loginForm = document.getElementById('loginForm');
    console.log('Found login form:', !!loginForm);

    if (loginForm) {
        loginForm.onsubmit = async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('todoSection').style.display = 'block';
                document.body.classList.add('todo-page');
                setupLogoutButton();
                loadTodos();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };
    }

    const signupForm = document.getElementById('signupForm');
    console.log('Found signup form:', !!signupForm);

    if (signupForm) {
        signupForm.onsubmit = async function(e) {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User signed up successfully:', userCredential.user);
                document.getElementById('signupSection').style.display = 'none';
                document.getElementById('todoSection').style.display = 'block';
                document.body.classList.add('todo-page');
                setupLogoutButton();
            } catch (error) {
                console.error('Error signing up:', error);
                alert('Signup error: ' + error.message);
            }
        };
    }
}

// Make sure the setup runs
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    setupEventListeners();
});

// Also try immediate setup in case the DOM is already loaded
if (document.readyState === 'complete') {
    console.log('DOM already complete');
    setupEventListeners();
}

// Add Todo
document.getElementById('todoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const now = new Date();
    const todo = {
        id: currentId++,
        description: document.getElementById('description').value,
        category: document.querySelector('select[name="category"]').value,
        status: document.getElementById('status').value,
        deadline: document.getElementById('deadline').value,
        entryDate: now.toISOString().split('T')[0], // Store today's date
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid
    };

    try {
        await addDoc(collection(db, 'todos'), todo);
        document.getElementById('todoForm').reset();
        loadTodos();
        updateCategoryDropdown();
    } catch (error) {
        console.error('Error adding todo: ', error);
    }
});

// Global variable to store todos
let allTodos = [];

// Modified loadTodos function
async function loadTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    try {
        const q = query(
            collection(db, 'todos'),
            where('userId', '==', auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        allTodos = []; // Clear the array
        
        querySnapshot.forEach((docSnapshot) => {
            const todo = docSnapshot.data();
            todo.docId = docSnapshot.id; // Store the document ID
            
            // Convert Firestore timestamp to date string for legacy items
            if (!todo.entryDate && todo.timestamp) {
                const timestamp = todo.timestamp.toDate();
                todo.entryDate = timestamp.toISOString().split('T')[0];
            }
            
            allTodos.push(todo);
        });

        // Apply initial sorting
        applySorting();
        updateDatabaseInfo();
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

// Add this new function to handle sorting
window.applySorting = function() {
    const sortField = document.getElementById('sortField').value;
    const sortDirection = document.getElementById('sortDirection').value;
    
    allTodos.sort((a, b) => {
        let comparison = 0;
        
        switch(sortField) {
            case 'entryDate':
                comparison = new Date(a.entryDate) - new Date(b.entryDate);
                break;
            case 'deadline':
                comparison = new Date(a.deadline) - new Date(b.deadline);
                break;
            case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Refresh the display
    displayTodos();
}

// New function to handle displaying todos
function displayTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    allTodos.forEach((todo) => {
        const div = document.createElement('div');
        div.className = 'todo-item';
        div.innerHTML = `
            <div class="todo-line">
                <span class="todo-description">${todo.description}</span>
            </div>
            <div class="todo-line">
                <span class="todo-label">Category:</span>
                <span class="todo-category">${todo.category}</span>
                <span class="todo-label" style="margin-left: 20px;">Status:</span>
                <span class="todo-status">${todo.status}</span>
            </div>
            <div class="todo-line">
                <span class="todo-label">Entry Date:</span>
                <span class="todo-date">${todo.entryDate || 'N/A'}</span>
                <span class="todo-label" style="margin-left: 20px;">Deadline:</span>
                <span class="todo-deadline">${todo.deadline}</span>
            </div>
        `;
        
        // Create delete button in its own div
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'todo-button-line';
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => window.deleteTodoById(todo.docId));
        
        buttonDiv.appendChild(deleteButton);
        div.appendChild(buttonDiv);
        todoList.appendChild(div);
    });
}

// Update Database Info
async function updateDatabaseInfo() {
    try {
        const q = query(
            collection(db, 'todos'),
            where('userId', '==', auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const size = querySnapshot.size;
        const lastUpdate = querySnapshot.docs[0]?.data().timestamp?.toDate();
        
        document.getElementById('databaseInfo').innerHTML = `
            <p>Last Updated: ${lastUpdate ? lastUpdate.toLocaleString() : 'N/A'}</p>
            <p>Number of Items: ${size}</p>
        `;
    } catch (error) {
        console.error('Error updating database info:', error);
    }
}

// Update the addTodo function
async function addTodo(event) {
    event.preventDefault();

    const todo = {
        id: currentId++,
        title: form.title.value,
        category: form.category.value,
        dueDate: form.dueDate.value,
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'todos'), todo);
        console.log('todo added with ID:', todo.id);
        form.reset();
        updateCategoryDropdown();
    } catch (err) {
        console.log('Error adding todo:', err);
    }
}

// Update the updateCategoryDropdown function
async function updateCategoryDropdown() {
    const categorySelect = document.querySelector('select[name="category"]');
    
    try {
        const todosRef = collection(db, 'todos');
        const querySnapshot = await getDocs(todosRef);
        const categories = new Set();
        
        querySnapshot.forEach((doc) => {
            const category = doc.data().category;
            if (category) categories.add(category);
        });

        // Clear existing options
        categorySelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Select Category";
        categorySelect.appendChild(defaultOption);
        
        // Add existing categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        // Add "New Category" option
        const newCategoryOption = document.createElement('option');
        newCategoryOption.value = "new";
        newCategoryOption.textContent = "➕ Add New Category";
        categorySelect.appendChild(newCategoryOption);
    } catch (err) {
        console.error('Error updating categories:', err);
    }
}

// The handleCategoryChange function can remain the same as it doesn't use Firebase directly
function handleCategoryChange(select) {
    if (select.value === 'new') {
        const newCategory = prompt('Enter new category name:');
        if (newCategory) {
            const option = document.createElement('option');
            option.value = newCategory;
            option.textContent = newCategory;
            select.insertBefore(option, select.lastElementChild);
            select.value = newCategory;
        } else {
            select.selectedIndex = 0;
        }
    }
}

// Add this at the top level of your app.js (after the Firebase initialization)
function setupLogoutButton() {
    console.log('Setting up logout button...');
    const logoutButton = document.getElementById('logoutButton');
    console.log('Found logout button:', !!logoutButton);

    if (logoutButton) {
        console.log('Adding click listener to logout button');
        logoutButton.onclick = async function() {
            console.log('Logout button clicked');
            try {
                await signOut(auth);
                console.log('Successfully signed out');
                document.getElementById('todoSection').style.display = 'none';
                document.getElementById('loginSection').style.display = 'block';
                document.body.classList.remove('todo-page');
                // Clear any sensitive data
                document.getElementById('todoList').innerHTML = '';
                document.getElementById('databaseInfo').innerHTML = '';
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out: ' + error.message);
            }
        };
    }
}


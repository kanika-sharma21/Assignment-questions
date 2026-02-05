// Admin password
const PASSWORD = 'bca12345';

// Your web app's Firebase configuration
const firebaseConfig = {
  authDomain: "assignment-portal-99ea7.firebaseapp.com",
  databaseURL: "https://assignment-portal-99ea7-default-rtdb.firebaseio.com",
  projectId: "assignment-portal-99ea7",
  storageBucket: "assignment-portal-99ea7.firebasestorage.app",
  messagingSenderId: "538549431906",
  appId: "1:538549431906:web:f378e168c019e30c662b3b"
};

// Initialize Firebase
let db;
let useFirebase = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    useFirebase = true;
    console.log('Firebase initialized');
} catch (error) {
    console.log('Using localStorage');
    useFirebase = false;
}

// DOM Elements
const adminToggleBtn = document.getElementById('adminToggleBtn');
const adminPanel = document.getElementById('adminPanel');
const closeBtn = document.getElementById('closeBtn');
const assignmentForm = document.getElementById('assignmentForm');
const qNum = document.getElementById('qNum');
const qText = document.getElementById('qText');
const qDate = document.getElementById('qDate');
const qPass = document.getElementById('qPass');
const msgDiv = document.getElementById('msgDiv');
const assignList = document.getElementById('assignList');

let assignments = [];

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    qDate.value = today;
    
    // Load assignments
    loadAssignments();
});

// Load assignments
function loadAssignments() {
    if (useFirebase && db) {
        try {
            const dbRef = firebase.database().ref('assignments');
            // Listen for live updates from Firebase
            dbRef.on('value', (snapshot) => {
                assignments = [];
                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(key => {
                        assignments.push(data[key]);
                    });
                }

                // If Firebase is empty but there are items in localStorage, migrate them
                const localData = JSON.parse(localStorage.getItem('assignments')) || [];
                if ((!data || Object.keys(data).length === 0) && localData.length > 0) {
                    console.log('Migrating assignments from localStorage to Firebase...');
                    localData.forEach(item => {
                        try {
                            firebase.database().ref('assignments/' + item.id).set(item);
                        } catch (e) {
                            console.warn('Failed to migrate item', item, e);
                        }
                    });
                    // after migration, Firebase 'value' listener will fire again and update `assignments`
                    return;
                }

                // Merge any local items that are not present in Firebase (avoid duplicates)
                if (localData.length > 0 && data) {
                    const firebaseIds = new Set(Object.keys(data));
                    localData.forEach(item => {
                        if (!firebaseIds.has(String(item.id))) {
                            try {
                                firebase.database().ref('assignments/' + item.id).set(item);
                            } catch (e) {
                                console.warn('Failed to merge local item', item, e);
                            }
                        }
                    });
                }

                displayAssignments();
            });
        } catch (error) {
            console.log('Error:', error);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
}

// Load from localStorage
function loadFromLocalStorage() {
    assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    displayAssignments();
}

// Toggle admin panel
adminToggleBtn.addEventListener('click', function() {
    adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
    if (adminPanel.style.display === 'block') {
        qNum.focus();
    }
});

// Close admin panel
closeBtn.addEventListener('click', function() {
    adminPanel.style.display = 'none';
    assignmentForm.reset();
    const today = new Date().toISOString().split('T')[0];
    qDate.value = today;
});

// Submit form
assignmentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Check if this is an edit (form field has editId data attribute)
    const editId = qNum.dataset.editId;
    
    if (editId) {
        // This is an edit operation
        updateAssignment(parseInt(editId));
        delete qNum.dataset.editId;
    } else {
        // This is a new assignment
        // Check password
        if (qPass.value !== PASSWORD) {
            showMessage('❌ Incorrect password!', 'error');
            qPass.value = '';
            return;
        }
        
        // Create assignment object
        const newAssignment = {
            id: Date.now(),
            number: parseInt(qNum.value),
            text: qText.value.trim(),
            date: qDate.value
        };
        
        // Save to Firebase or localStorage
        if (useFirebase && db) {
            try {
                firebase.database().ref('assignments/' + newAssignment.id).set(newAssignment, (error) => {
                    if (error) {
                        showMessage('❌ Error saving!', 'error');
                    } else {
                        showMessage('✅ Assignment posted successfully!', 'success');
                    }
                });
            } catch (error) {
                saveToLocalStorage(newAssignment);
            }
        } else {
            saveToLocalStorage(newAssignment);
        }
        
        // Reset form
        assignmentForm.reset();
        const today = new Date().toISOString().split('T')[0];
        qDate.value = today;
        
        // Auto-close panel after 2 seconds
        setTimeout(() => {
            adminPanel.style.display = 'none';
        }, 2000);
    }
});

// Save to localStorage
function saveToLocalStorage(assignment) {
    assignments.unshift(assignment);
    localStorage.setItem('assignments', JSON.stringify(assignments));
    showMessage('✅ Assignment posted successfully!', 'success');
    displayAssignments();
}

// Display all assignments
function displayAssignments() {
    if (assignments.length === 0) {
        assignList.innerHTML = '<p class="empty-msg">No assignments posted yet.</p>';
        return;
    }
    
    // Sort by question number
    const sorted = [...assignments].sort((a, b) => a.number - b.number);
    
    assignList.innerHTML = sorted.map(assign => {
        const dateObj = new Date(assign.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="assignment-card" data-id="${assign.id}">
                <div class="q-number">${assign.number}</div>
                <h3>${escapeHTML(assign.text)}</h3>
                <div style="margin-top:10px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <button class="action-btn edit-btn" onclick="editAssignment('${assign.id}')">✏️ Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteAssignment('${assign.id}')">🗑️ Delete</button>
                    <div class="assignment-date">📅 Assignment Date: ${formattedDate}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Show message
function showMessage(text, type) {
    msgDiv.textContent = text;
    msgDiv.className = 'message ' + type;
    
    setTimeout(() => {
        msgDiv.classList.remove('success', 'error');
    }, 3000);
}

// Escape HTML
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Delete assignment with password protection
function deleteAssignment(id) {
    const password = prompt('Enter admin password to delete this assignment:');
    if (password === null) return; // user cancelled
    
    if (password !== PASSWORD) {
        showMessage('❌ Incorrect password!', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }
    
    // Remove from Firebase
    if (useFirebase && db) {
        try {
            firebase.database().ref('assignments/' + id).remove((error) => {
                if (error) {
                    showMessage('❌ Error deleting assignment!', 'error');
                } else {
                    showMessage('✅ Assignment deleted successfully!', 'success');
                    assignments = assignments.filter(a => a.id !== id);
                }
            });
        } catch (error) {
            deleteFromLocalStorage(id);
        }
    } else {
        deleteFromLocalStorage(id);
    }
}

// Delete from localStorage
function deleteFromLocalStorage(id) {
    assignments = assignments.filter(a => a.id !== id);
    localStorage.setItem('assignments', JSON.stringify(assignments));
    showMessage('✅ Assignment deleted successfully!', 'success');
    displayAssignments();
}

// Edit assignment with password protection
function editAssignment(id) {
    const password = prompt('Enter admin password to edit this assignment:');
    if (password === null) return; // user cancelled
    
    if (password !== PASSWORD) {
        showMessage('❌ Incorrect password!', 'error');
        return;
    }
    
    // Find the assignment
    const assign = assignments.find(a => a.id === parseInt(id));
    if (!assign) {
        showMessage('❌ Assignment not found!', 'error');
        return;
    }
    
    // Pre-fill form with assignment data
    qNum.value = assign.number;
    qText.value = assign.text;
    qDate.value = assign.date;
    qPass.value = PASSWORD; // Pre-fill password so user doesn't need to enter it again
    
    // Show admin panel
    adminPanel.style.display = 'block';
    qText.focus();
    
    // Mark this as an edit mode
    qNum.dataset.editId = id;
    
    // Change button text
    const submitBtn = adminPanel.querySelector('.btn-submit');
    submitBtn.textContent = 'Update Assignment';
}

// Update assignment in Firebase
function updateAssignment(id) {
    const updatedAssignment = {
        id: id,
        number: parseInt(qNum.value),
        text: qText.value.trim(),
        date: qDate.value
    };
    
    // Update Firebase
    if (useFirebase && db) {
        try {
            firebase.database().ref('assignments/' + id).set(updatedAssignment, (error) => {
                if (error) {
                    showMessage('❌ Error updating assignment!', 'error');
                } else {
                    showMessage('✅ Assignment updated successfully!', 'success');
                    const index = assignments.findIndex(a => a.id === id);
                    if (index !== -1) {
                        assignments[index] = updatedAssignment;
                    }
                }
            });
        } catch (error) {
            updateLocalStorage(updatedAssignment);
        }
    } else {
        updateLocalStorage(updatedAssignment);
    }
    
    // Reset form
    assignmentForm.reset();
    const today = new Date().toISOString().split('T')[0];
    qDate.value = today;
    
    // Restore button and close panel
    const submitBtn = adminPanel.querySelector('.btn-submit');
    submitBtn.textContent = 'Post Assignment';
    
    setTimeout(() => {
        adminPanel.style.display = 'none';
        displayAssignments();
    }, 1500);
}

// Update in localStorage
function updateLocalStorage(updatedAssignment) {
    const index = assignments.findIndex(a => a.id === updatedAssignment.id);
    if (index !== -1) {
        assignments[index] = updatedAssignment;
    }
    localStorage.setItem('assignments', JSON.stringify(assignments));
    showMessage('✅ Assignment updated successfully!', 'success');
    displayAssignments();
}


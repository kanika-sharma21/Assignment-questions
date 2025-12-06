// Admin password
const PASSWORD = 'bca12345';

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

// Load assignments on page load
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    qDate.value = today;
    
    // Display all assignments
    displayAssignments();
});

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
    
    // Add to array
    assignments.unshift(newAssignment);
    
    // Save to localStorage
    localStorage.setItem('assignments', JSON.stringify(assignments));
    
    // Show success message
    showMessage('✅ Assignment posted successfully!', 'success');
    
    // Reset form
    assignmentForm.reset();
    const today = new Date().toISOString().split('T')[0];
    qDate.value = today;
    
    // Refresh display
    displayAssignments();
    
    // Auto-close panel after 2 seconds
    setTimeout(() => {
        adminPanel.style.display = 'none';
    }, 2000);
});

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
            <div class="assignment-card">
                <div class="q-number">${assign.number}</div>
                <h3>${escapeHTML(assign.text)}</h3>
                <div class="assignment-date">📅 Posted on ${formattedDate}</div>
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
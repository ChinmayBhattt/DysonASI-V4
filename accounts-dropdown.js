document.addEventListener('DOMContentLoaded', function() {
    const accountBtn = document.querySelector('.account-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // Toggle dropdown when clicking account button
    accountBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Close dropdown when clicking anywhere else on the page
    document.addEventListener('click', function() {
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});
const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill editor
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'clean']
            ]
        }
    });

    // Auto-generate slug from title
    const titleInput = document.getElementById('title');
    const slugInput = document.getElementById('slug');

    titleInput.addEventListener('input', () => {
        const slug = titleInput.value
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/^-+|-+$/g, '');
        slugInput.value = slug;
    });

    // Fetch and populate categories
    fetchCategories();

    async function fetchCategories() {
        const categorySelect = document.getElementById('category');
        try {
            const response = await fetch(`${API_URL}/categories`);
            const categories = await response.json();
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }

    // Image preview
    const imageInput = document.getElementById('image');
    const preview = document.getElementById('preview');

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle form submission
    const postForm = document.getElementById('postForm');
    const statusDiv = document.getElementById('status');

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', titleInput.value);
        formData.append('slug', slugInput.value);
        formData.append('categoryId', document.getElementById('category').value);
        formData.append('content', quill.root.innerHTML);

        const imageFile = imageInput.files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            statusDiv.textContent = 'Publishing...';
            statusDiv.className = 'status-msg';
            statusDiv.style.display = 'block';

            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.textContent = 'Article published successfully! Redirecting to blog...';
                statusDiv.className = 'status-msg status-success';
                setTimeout(() => {
                    window.location.href = 'blog.html';
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to publish article');
            }
        } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.className = 'status-msg status-error';
        }
    });
});

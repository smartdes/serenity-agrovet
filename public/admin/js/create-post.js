const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Quill Editor
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Write your insights here...',
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

    // 2. Auto-generate Slug from Title
    const titleInput = document.getElementById('title');
    const slugInput = document.getElementById('slug');

    titleInput.addEventListener('input', () => {
        const slug = titleInput.value
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove non-word chars
            .replace(/[\s_]+/g, '-')   // Replace spaces formatting
            .replace(/^-+|-+$/g, '');  // Remove leading/trailing dashes
        slugInput.value = slug;
    });

    // 3. Fetch Categories for Dropdown
    const fetchCategoriesPromise = fetchCategories();

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
            const option = document.createElement('option');
            option.textContent = 'Error loading categories';
            categorySelect.appendChild(option);
        }
    }

    // 4. Handle Image Preview
    const imageInput = document.getElementById('image');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview');
    const fileNameDisplay = document.getElementById('file-name');
    const removeImageBtn = document.getElementById('remove-image');

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            clearImagePreview();
        }
    });

    removeImageBtn.addEventListener('click', () => {
        imageInput.value = ''; // Clear file input
        clearImagePreview();
    });

    function clearImagePreview() {
        fileNameDisplay.textContent = 'No file chosen';
        previewImg.src = '';
        previewContainer.classList.add('hidden');
    }

    let editingPostId = null;

    // Form elements
    const postForm = document.getElementById('postForm');
    const statusDiv = document.getElementById('status');
    const submitBtn = document.getElementById('submit-btn');

    // Check if we are editing an existing post
    const urlParams = new URLSearchParams(window.location.search);
    const editSlug = urlParams.get('slug');

    if (editSlug) {
        document.querySelector('h1').textContent = 'Edit Article';
        submitBtn.innerHTML = `
            Update Article
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        `;
        fetchPostData(editSlug);
    }

    async function fetchPostData(slug) {
        try {
            const response = await fetch(`${API_URL}/posts/${slug}`);
            if (!response.ok) throw new Error('Failed to fetch post data');

            const post = await response.json();
            editingPostId = post.id;

            // Pre-fill form
            titleInput.value = post.title;
            slugInput.value = post.slug;

            // Wait for categories to load before setting select
            await fetchCategoriesPromise;
            document.getElementById('category').value = post.categoryId;

            quill.clipboard.dangerouslyPasteHTML(0, post.content);

            if (post.imageUrl) {
                previewImg.src = `../${post.imageUrl}`;
                previewContainer.classList.remove('hidden');
                fileNameDisplay.textContent = 'Existing image loaded';
            }
        } catch (error) {
            console.error('Error loading post:', error);
            showStatus('Error loading post to edit. It may have been deleted.', 'error');
        }
    }

    // 5. Form Submission Logic
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (quill.getText().trim().length === 0) {
            showStatus('Error: Article content cannot be empty.', 'error');
            return;
        }

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
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ${editingPostId ? 'Updating...' : 'Publishing...'}
            `;

            showStatus(`${editingPostId ? 'Updating' : 'Publishing'} article...`, 'info');

            const url = editingPostId ? `${API_URL}/posts/${editingPostId}` : `${API_URL}/posts`;
            const method = editingPostId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showStatus(`Success! Article ${editingPostId ? 'updated' : 'published'}. Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'blog.html';
                }, 1500);
            } else {
                throw new Error(result.error || `Failed to ${editingPostId ? 'update' : 'publish'} article`);
            }
        } catch (error) {
            showStatus('Error: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = editingPostId ? `
                Update Article
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            ` : `
                Publish Article
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            `;
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'p-4 rounded-xl text-sm font-medium mt-6 block';

        if (type === 'error') {
            statusDiv.classList.add('bg-red-50', 'text-red-700', 'border', 'border-red-200');
        } else if (type === 'success') {
            statusDiv.classList.add('bg-emerald-50', 'text-emerald-700', 'border', 'border-emerald-200');
        } else {
            statusDiv.classList.add('bg-blue-50', 'text-blue-700', 'border', 'border-blue-200');
        }
    }
});

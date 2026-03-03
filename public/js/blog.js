const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchPosts();
    fetchCategories();
});

let allPosts = [];
let displayCount = 6;
let currentCategory = 'all';

async function fetchPosts(category = 'all') {
    const postsContainer = document.getElementById('posts-container');
    const loadMoreContainer = document.getElementById('load-more-container');

    currentCategory = category;
    displayCount = 6; // Reset on category change

    // Create skeleton loader HTML
    const skeletonCard = `
        <div class="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse border border-slate-100">
            <div class="w-full h-48 bg-slate-200"></div>
            <div class="p-6 space-y-4">
                <div class="h-4 bg-slate-200 rounded w-1/4"></div>
                <div class="h-6 bg-slate-200 rounded w-3/4"></div>
                <div class="space-y-2">
                    <div class="h-4 bg-slate-200 rounded w-full"></div>
                    <div class="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div class="h-4 bg-slate-200 rounded w-1/2 pt-4"></div>
            </div>
        </div>
    `;

    postsContainer.innerHTML = Array(6).fill(skeletonCard).join('');
    loadMoreContainer.classList.add('hidden');

    try {
        let url = `${API_URL}/posts`;
        if (category !== 'all') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(url);
        allPosts = await response.json();

        if (!Array.isArray(allPosts) || allPosts.length === 0) {
            postsContainer.innerHTML = '<div class="no-posts" style="text-align: center; grid-column: 1/-1; padding: 40px; color: #666;">No blog posts found. We are working on bringing you fresh content soon!</div>';
            return;
        }

        renderPosts();
    } catch (error) {
        console.error('Error fetching posts:', error);
        postsContainer.innerHTML = '<div class="error-message" style="text-align: center; grid-column: 1/-1; padding: 40px; color: #dc3545;">Unable to load blog posts. Please check your connection or try again later.</div>';
    }
}

function renderPosts() {
    const postsContainer = document.getElementById('posts-container');
    const loadMoreContainer = document.getElementById('load-more-container');

    const visiblePosts = allPosts.slice(0, displayCount);

    postsContainer.innerHTML = visiblePosts.map(post => {
        const excerpt = post.content.substring(0, 150) + '...';
        return `
            <article class="post-card">
                <div class="post-image-wrapper">
                    <img src="${post.imageUrl || 'assets/Serenity Agro Vet_store Heros.jfif'}" alt="${post.title}" class="post-image">
                    <span class="post-category-tag">${post.category ? post.category.name : 'Uncategorized'}</span>
                </div>
                <div class="post-body">
                    <span class="post-date">${new Date(post.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <h3 class="text-2xl font-bold text-slate-900 mt-2 mb-3 leading-snug">${post.title}</h3>
                    <p class="post-excerpt text-slate-600">${excerpt}</p>
                    <a href="post.html?slug=${post.slug}" class="read-more mt-4 inline-block font-semibold text-emerald-600 hover:text-emerald-700">Read Full Article &rarr;</a>
                </div>
            </article>
        `;
    }).join('');

    if (allPosts.length > displayCount) {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
}

// Add event listener for Load More button
document.getElementById('load-more-btn').addEventListener('click', () => {
    displayCount += 6;
    renderPosts();
});

async function fetchCategories() {
    const categoriesList = document.getElementById('categories-list');

    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();

        if (Array.isArray(categories)) {
            categories.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="category-link" data-category="${category.name}">${category.name}</a>`;
                categoriesList.appendChild(li);
            });
        }

        // Add event listeners to category links
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-link')) {
                e.preventDefault();

                // Update active state
                document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');

                const category = e.target.getAttribute('data-category');
                fetchPosts(category);
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminPosts();
});

async function fetchAdminPosts() {
    const listContainer = document.getElementById('admin-posts-list');

    try {
        // Fetch all posts including deactivated ones (admin mode)
        const response = await fetch(`${API_URL}/posts?admin=true`);
        if (!response.ok) throw new Error('Failed to fetch posts');

        const posts = await response.json();

        if (posts.length === 0) {
            listContainer.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No blog posts found.</td></tr>';
            return;
        }

        renderAdminTable(posts);
    } catch (error) {
        console.error('Error fetching admin posts:', error);
        listContainer.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading posts. Please try again.</td></tr>';
    }
}

function renderAdminTable(posts) {
    const listContainer = document.getElementById('admin-posts-list');

    listContainer.innerHTML = posts.map(post => {
        const date = new Date(post.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        // Ensure isActive exists (default to true if undefined)
        const active = post.isActive !== false;

        const statusBadge = active
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inactive</span>`;

        const imgUrl = post.imageUrl ? `../${post.imageUrl}` : '../assets/Serenity Agro Vet_store Heros.jfif';

        return `
            <tr class="hover:bg-slate-50 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3 min-w-[300px]">
                        <img src="${imgUrl}" alt="" class="w-10 h-10 rounded-lg object-cover bg-slate-100">
                        <div>
                            <p class="font-medium text-slate-800 text-wrap max-w-sm line-clamp-1 cursor-pointer hover:text-emerald-700 transition" title="${post.title}">
                                ${post.title}
                            </p>
                            <a href="../post.html?slug=${post.slug}" target="_blank" class="text-xs text-slate-400 hover:text-emerald-600 transition flex items-center gap-1 mt-0.5">
                                View Post <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            </a>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-600">${post.category ? post.category.name : '-'}</td>
                <td class="px-6 py-4 text-slate-600">${date}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="togglePostStatus(${post.id}, ${!active})" class="px-3 py-1.5 text-xs font-medium rounded-lg border ${active ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'} transition focus:outline-none focus:ring-2 focus:ring-slate-200">
                            ${active ? 'Deactivate' : 'Publish'}
                        </button>
                        <button onclick="editPost('${post.slug}')" class="p-1.5 text-slate-400 hover:text-blue-600 transition focus:outline-none rounded-lg hover:bg-blue-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deletePost(${post.id})" class="p-1.5 text-slate-400 hover:text-red-600 transition focus:outline-none rounded-lg hover:bg-red-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function togglePostStatus(id, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus ? 'publish' : 'deactivate'} this post?`)) return;

    try {
        const response = await fetch(`${API_URL}/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');

        // Refresh the list
        fetchAdminPosts();
    } catch (error) {
        console.error('Error toggling status:', error);
        alert('Failed to update status. Check console for details.');
    }
}

async function deletePost(id) {
    if (!confirm('Are you ABSOLUTELY sure you want to delete this post? This cannot be undone.')) return;

    try {
        const response = await fetch(`${API_URL}/posts/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete post');

        // Refresh the list
        fetchAdminPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Check console for details.');
    }
}

function editPost(slug) {
    window.location.href = `create-post.html?slug=${slug}`;
}

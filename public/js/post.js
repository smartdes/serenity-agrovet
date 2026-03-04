document.addEventListener('DOMContentLoaded', () => {
    const postContent = document.getElementById('post-content');
    const productsSection = document.getElementById('related-products-section');
    const productsList = document.getElementById('products-list');

    // Get slug from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        postContent.innerHTML = '<p class="error-message">Post not found. <a href="blog.html">Return to blog</a>.</p>';
        return;
    }

    async function fetchPost() {
        try {
            const response = await fetch(`/api/posts/${slug}`);
            if (!response.ok) {
                throw new Error('Post not found');
            }
            const post = await response.json();
            renderPost(post);
        } catch (error) {
            console.error('Error fetching post:', error);
            postContent.innerHTML = '<p class="error-message">Unable to load the article. Please try again later.</p>';
        }
    }

    function renderPost(post) {
        console.log('Rendering post:', post);
        // Update document title
        document.title = `${post.title} - Serenity Agrovet Stores`;

        // Format date
        const date = new Date(post.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Ensure content is formatted as HTML if it's plain text
        let contentHtml = post.content || '';
        if (!contentHtml.includes('<p>') && !contentHtml.includes('</div>')) {
            contentHtml = contentHtml.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
        }

        // Format content with image after 2nd paragraph
        let finalContent = '';
        const paragraphs = contentHtml.split('</p>');

        if (post.imageUrl && paragraphs.length > 2) {
            // Re-join with image after second paragraph
            const firstTwo = paragraphs.slice(0, 2).join('</p>') + '</p>';
            const rest = paragraphs.slice(2).join('</p>');
            const imageHtml = `
                <div class="post-injected-image" style="margin: 2rem 0;">
                    <img src="${post.imageUrl.startsWith('http') ? post.imageUrl : '/' + post.imageUrl}" alt="${post.title}" style="width: 100%; height: auto; border-radius: 12px; object-fit: cover; max-height: 500px;">
                </div>
            `;
            finalContent = firstTwo + imageHtml + rest;
        } else if (post.imageUrl) {
            // Append image at end if content is too short
            const imageHtml = `
                <div class="post-injected-image" style="margin: 2rem 0;">
                    <img src="${post.imageUrl.startsWith('http') ? post.imageUrl : '/' + post.imageUrl}" alt="${post.title}" style="width: 100%; height: auto; border-radius: 12px; object-fit: cover;">
                </div>
            `;
            finalContent = contentHtml + imageHtml;
        } else {
            finalContent = contentHtml;
        }

        if (!finalContent || finalContent === '<p></p>') {
            finalContent = '<p class="text-slate-500 italic">No content available for this article.</p>';
        }

        postContent.innerHTML = `
            <div class="post-header">
                <span class="category-badge mb-4 inline-block">${post.category ? post.category.name : 'Uncategorized'}</span>
                <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">${post.title}</h1>
                <div class="post-meta">
                    <span>${date}</span>
                    ${post.author ? `<span>By ${post.author}</span>` : ''}
                </div>
            </div>
            <div class="post-full-content">
                ${finalContent}
            </div>
        `;

        // Render products if they exist
        if (post.products && post.products.length > 0) {
            productsSection.style.display = 'block';
            productsList.innerHTML = post.products.map(item => `
                <div class="product-card-mini">
                    <div class="product-info-mini">
                        <h4>${item.product.name}</h4>
                        <p>KSh ${item.product.price.toLocaleString()}</p>
                        <a href="shop/index.html" class="btn-text">View in Shop →</a>
                    </div>
                </div>
            `).join('');
        }
    }

    async function fetchLatestArticles(currentSlug) {
        const latestContainer = document.getElementById('latest-articles-list');
        try {
            const response = await fetch(`/api/posts`);
            if (!response.ok) throw new Error('Failed to fetch latest articles');

            const allPosts = await response.json();

            // Filter out current post
            const otherPosts = allPosts.filter(p => p.slug !== currentSlug);
            const latestPosts = otherPosts.slice(0, 6);

            if (latestPosts.length === 0) {
                latestContainer.innerHTML = '<p class="text-sm text-slate-500">No other articles available.</p>';
                return;
            }

            let htmlString = latestPosts.map(post => {
                const date = new Date(post.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                const imgUrl = post.imageUrl || 'assets/Serenity Agro Vet_store Heros.jfif';

                return `
                    <a href="post.html?slug=${post.slug}" class="group flex gap-4 items-start">
                        <div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                            <img src="../${imgUrl}" alt="${post.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300">
                        </div>
                        <div class="flex-1">
                            <h4 class="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition line-clamp-2">${post.title}</h4>
                            <span class="text-xs text-slate-500 mt-2 block">${date}</span>
                        </div>
                    </a>
                `;
            }).join('');

            if (otherPosts.length > 6) {
                htmlString += `
                    <div class="pt-4">
                        <a href="blog.html" class="w-full block text-center py-3 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium rounded-xl transition">
                            More Articles
                        </a>
                    </div>
                `;
            }

            latestContainer.innerHTML = htmlString;

        } catch (error) {
            console.error('Error fetching latest articles:', error);
            latestContainer.innerHTML = '<p class="text-sm text-red-500">Failed to load articles.</p>';
        }
    }

    fetchPost();
    fetchLatestArticles(slug);
});

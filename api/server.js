const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '../public')));

const prisma = new PrismaClient();
const multer = require('multer');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const { category, admin } = req.query;

    // Base where clause: filter by active unless admin=true is provided
    let whereClause = {};
    if (admin !== 'true') {
      whereClause.isActive = true;
    }

    if (category) {
      whereClause.category = {
        name: {
          equals: category,
          mode: 'insensitive'
        }
      };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        category: true,
        products: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get post by slug
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        category: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create new post
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    const { title, slug, content, categoryId, productIds } = req.body;
    let imageUrl = null;

    if (req.file) {
      imageUrl = `uploads/${req.file.filename}`;
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        categoryId: parseInt(categoryId),
        products: productIds ? {
          create: JSON.parse(productIds).map(id => ({
            productId: parseInt(id)
          }))
        } : undefined
      },
      include: {
        category: true,
        products: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post. Ensure the slug is unique.' });
  }
});

// Update post (Full Edit or Status Toggle)
app.put('/api/posts/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this is a full edit (has title) or just a status toggle
    if (req.body.title !== undefined) {
      const { title, slug, content, categoryId, productIds } = req.body;
      let updateData = {
        title,
        slug,
        content,
        categoryId: parseInt(categoryId),
      };

      if (req.file) {
        updateData.imageUrl = `uploads/${req.file.filename}`;
      }

      // Note: Updating products relation is complex and omitted for this basic edit implementation 
      // unless specifically requested, to avoid dropping existing relations unintentionally.

      const post = await prisma.post.update({
        where: { id: parseInt(id) },
        data: updateData
      });
      return res.json(post);
    }

    // Fallback to simple status toggle
    if (req.body.isActive !== undefined) {
      // If it's sent as JSON (which is how blog-admin.js sends it)
      const isActive = typeof req.body.isActive === 'boolean'
        ? req.body.isActive
        : req.body.isActive === 'true';

      const post = await prisma.post.update({
        where: { id: parseInt(id) },
        data: { isActive }
      });
      return res.json(post);
    }

    res.status(400).json({ error: 'Invalid update payload' });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postId = parseInt(id);

    // Delete related PostProduct entries first
    await prisma.postProduct.deleteMany({
      where: { postId }
    });

    // Delete the post
    await prisma.post.delete({
      where: { id: postId }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

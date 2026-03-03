const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient({});

async function main() {
    console.log('Seeding database...');

    // 1. Create Categories
    const poultryCare = await prisma.category.upsert({
        where: { name: 'Poultry Care' },
        update: {},
        create: { name: 'Poultry Care' },
    });

    const cropProtection = await prisma.category.upsert({
        where: { name: 'Crop Protection' },
        update: {},
        create: { name: 'Crop Protection' },
    });

    console.log('Categories created.');

    // 2. Create Products
    const product1 = await prisma.product.upsert({
        where: { sku: 'AG-POL-001' },
        update: {},
        create: {
            name: 'Premium Chick Starter',
            sku: 'AG-POL-001',
            price: 2100.00,
            description: 'Balanced nutrition for your chicks to ensure a healthy start.',
        },
    });

    const product2 = await prisma.product.upsert({
        where: { sku: 'AG-CRP-001' },
        update: {},
        create: {
            name: 'Organic Foliar Feed',
            sku: 'AG-CRP-001',
            price: 1500.00,
            description: 'Boost your crop yields with our organic liquid fertilizer.',
        },
    });

    console.log('Products created.');

    // 3. Create Posts
    const post1 = await prisma.post.upsert({
        where: { slug: 'maximizing-poultry-productivity' },
        update: {
            imageUrl: 'assets/Serenity Agro Vet_store Heros.jfif',
        },
        create: {
            title: 'Maximizing Poultry Productivity in the First 4 Weeks',
            slug: 'maximizing-poultry-productivity',
            content: 'The first four weeks of a chick\'s life are critical for their long-term health and productivity. Ensuring proper temperature, nutrition, and hygiene can make or break your flock\'s success. Use high-quality starter mash and monitor their water intake closely.',
            imageUrl: 'assets/Serenity Agro Vet_store Heros.jfif', // We can use the existing hero image for now
            categoryId: poultryCare.id,
            products: {
                create: [
                    { productId: product1.id }
                ]
            }
        },
    });

    const post2 = await prisma.post.upsert({
        where: { slug: 'natural-ways-to-protect-crops' },
        update: {
            imageUrl: 'assets/Serenity Agro Vet_store Heros.jfif',
        },
        create: {
            title: 'Natural Ways to Protect Your Crops from Pests',
            slug: 'natural-ways-to-protect-crops',
            content: 'Organic farming is gaining popularity in Juja Farm. Using neem oil and companion planting are effective ways to manage pests without harsh chemicals. Learn how to create a balanced ecosystem on your farm.',
            imageUrl: 'assets/Serenity Agro Vet_store Heros.jfif', // Reusing placeholder for now or can use another if available
            categoryId: cropProtection.id,
            products: {
                create: [
                    { productId: product2.id }
                ]
            }
        },
    });

    console.log('Posts created.');
    console.log('Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

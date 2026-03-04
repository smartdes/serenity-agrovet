const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting category migration...');

    // 1. Create new categories
    const categories = [
        'Livestock & Pet Management',
        'Soil Health & Crop Nutrition',
        'Water & Irrigation Systems',
        'Sustainable & Climate-Smart Farming'
    ];

    const newCats = {};
    for (const name of categories) {
        newCats[name] = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        console.log(`Ensured category: ${name}`);
    }

    // 2. Map existing posts
    // Poultry Care (1) -> Livestock & Pet Management
    // Crop Protection (2) -> Soil Health & Crop Nutrition

    const poultryCare = await prisma.category.findUnique({ where: { name: 'Poultry Care' } });
    const cropProtection = await prisma.category.findUnique({ where: { name: 'Crop Protection' } });

    if (poultryCare) {
        const result = await prisma.post.updateMany({
            where: { categoryId: poultryCare.id },
            data: { categoryId: newCats['Livestock & Pet Management'].id }
        });
        console.log(`Updated ${result.count} posts from Poultry Care to Livestock & Pet Management`);
    }

    if (cropProtection) {
        const result = await prisma.post.updateMany({
            where: { categoryId: cropProtection.id },
            data: { categoryId: newCats['Soil Health & Crop Nutrition'].id }
        });
        console.log(`Updated ${result.count} posts from Crop Protection to Soil Health & Crop Nutrition`);
    }

    // 3. Delete old categories if they exist
    if (poultryCare) {
        await prisma.category.delete({ where: { id: poultryCare.id } });
        console.log('Deleted old category: Poultry Care');
    }
    if (cropProtection) {
        await prisma.category.delete({ where: { id: cropProtection.id } });
        console.log('Deleted old category: Crop Protection');
    }

    console.log('Migration completed successfully.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

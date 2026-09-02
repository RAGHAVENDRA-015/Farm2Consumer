import { PrismaClient, Role, ProductUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FarmLink database seeding...');

  // 1. Seed Categories
  const categoriesData = [
    {
      name: 'Fresh Vegetables',
      slug: 'fresh-vegetables',
      description: 'Locally grown organic and pesticide-free fresh vegetables.',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Farm Fresh Fruits',
      slug: 'farm-fresh-fruits',
      description: 'Naturally ripened sweet and succulent seasonal fruits.',
      imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Leafy Greens',
      slug: 'leafy-greens',
      description: 'Crisp, nutritious leafy greens harvested daily.',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Grains & Cereals',
      slug: 'grains-and-cereals',
      description: 'Unpolished, wholesome traditional grains and whole wheat.',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Pulses & Legumes',
      slug: 'pulses-and-legumes',
      description: 'Protein-rich lentils, beans, and unpolished dal directly from farmers.',
      imageUrl: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Organic Specials',
      slug: 'organic-specials',
      description: 'Certified 100% organic farm produce and honey.',
      imageUrl: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categories.push(created);
  }
  console.log(`✅ Seeded ${categories.length} categories.`);

  // 2. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { firebaseUid: 'admin-seed-uid-001' },
    update: {},
    create: {
      firebaseUid: 'admin-seed-uid-001',
      name: 'FarmLink Admin',
      email: 'admin@farmlink.org',
      phone: '+919876543210',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Seeded Admin User: ${adminUser.email}`);

  // 3. Seed Farmers with Profiles
  const farmersData = [
    {
      firebaseUid: 'farmer-seed-uid-001',
      name: 'Ramesh Patel',
      email: 'ramesh.patel@harvestfarms.in',
      phone: '+919811122334',
      farmName: 'Green Valley Organic Farms',
      bio: 'Cultivating native heirloom vegetables and desi grains for over 20 years using natural Vedic farming techniques without chemicals.',
      address: 'Plot 42, Riverbank Road',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
      rating: 4.8,
      isApproved: true,
      approvedAt: new Date(),
    },
    {
      firebaseUid: 'farmer-seed-uid-002',
      name: 'Gurpreet Singh',
      email: 'gurpreet@punjabagro.in',
      phone: '+919822233445',
      farmName: 'Golden Fields Agri Farm',
      bio: 'Direct producer of premium Sharbati wheat, Basmati rice, and organic winter greens.',
      address: 'Village Khalsa, GT Road',
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '141001',
      rating: 4.9,
      isApproved: true,
      approvedAt: new Date(),
    },
    {
      firebaseUid: 'farmer-seed-uid-003',
      name: 'Suresh Kumar',
      email: 'suresh@mysoregreens.in',
      phone: '+919833344556',
      farmName: 'Mysore Sunlit Orchards',
      bio: 'Fresh tropical fruits, natural mangoes, and tender organic coconuts straight from the orchard.',
      address: 'Near KRS Dam Road',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570001',
      rating: 4.7,
      isApproved: true,
      approvedAt: new Date(),
    },
  ];

  const seededFarmers = [];
  for (const f of farmersData) {
    const { farmName, bio, address, city, state, pincode, rating, isApproved, approvedAt, ...userData } = f;

    const user = await prisma.user.upsert({
      where: { firebaseUid: userData.firebaseUid },
      update: {},
      create: {
        ...userData,
        role: Role.FARMER,
      },
    });

    const farmerProfile = await prisma.farmerProfile.upsert({
      where: { userId: user.id },
      update: {
        farmName,
        bio,
        address,
        city,
        state,
        pincode,
        rating,
        isApproved,
        approvedAt,
      },
      create: {
        userId: user.id,
        farmName,
        bio,
        address,
        city,
        state,
        pincode,
        rating,
        isApproved,
        approvedAt,
      },
    });

    seededFarmers.push({ user, profile: farmerProfile });
  }
  console.log(`✅ Seeded ${seededFarmers.length} verified farmers.`);

  // 4. Seed Customer User
  const customerUser = await prisma.user.upsert({
    where: { firebaseUid: 'customer-seed-uid-001' },
    update: {},
    create: {
      firebaseUid: 'customer-seed-uid-001',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '+919844455667',
      role: Role.CUSTOMER,
      addresses: {
        create: {
          name: 'Ananya Sharma',
          phone: '+919844455667',
          addressLine: 'Flat 402, Sunshine Apartments, 14th Main',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
          isDefault: true,
        },
      },
      cart: {
        create: {},
      },
    },
  });
  console.log(`✅ Seeded sample customer: ${customerUser.name}`);

  // 5. Seed Products
  const vegCategory = categories.find((c) => c.slug === 'fresh-vegetables') || categories[0];
  const fruitCategory = categories.find((c) => c.slug === 'farm-fresh-fruits') || categories[1];
  const leafyCategory = categories.find((c) => c.slug === 'leafy-greens') || categories[2];
  const grainCategory = categories.find((c) => c.slug === 'grains-and-cereals') || categories[3];

  const productsData = [
    {
      farmerId: seededFarmers[0].profile.id,
      categoryId: vegCategory.id,
      name: 'Farm Fresh Organic Tomatoes',
      slug: 'farm-fresh-organic-tomatoes-001',
      description: 'Vine-ripened, juicy red tomatoes grown with organic compost. Perfect for curries, salads, and sauces.',
      price: 38.0,
      unit: ProductUnit.KG,
      stockQuantity: 150.0,
      minimumOrderQuantity: 1.0,
      isOrganic: true,
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1546470427-0d4db154ceb7?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      farmerId: seededFarmers[0].profile.id,
      categoryId: vegCategory.id,
      name: 'Desi Red Carrots',
      slug: 'desi-red-carrots-001',
      description: 'Naturally sweet and crunchy organic red carrots freshly harvested from the farm soil.',
      price: 45.0,
      unit: ProductUnit.KG,
      stockQuantity: 80.0,
      minimumOrderQuantity: 1.0,
      isOrganic: true,
      images: [
        'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      farmerId: seededFarmers[0].profile.id,
      categoryId: leafyCategory.id,
      name: 'Crisp Hydroponic Palak (Spinach)',
      slug: 'crisp-hydroponic-palak-001',
      description: 'Tender and vibrant baby spinach leaves washed and packed immediately after morning harvest.',
      price: 25.0,
      unit: ProductUnit.BUNCH,
      stockQuantity: 60.0,
      minimumOrderQuantity: 1.0,
      isOrganic: true,
      images: [
        'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      farmerId: seededFarmers[1].profile.id,
      categoryId: grainCategory.id,
      name: 'Sharbati Whole Wheat Grain',
      slug: 'sharbati-whole-wheat-grain-001',
      description: 'Gold-standard golden Sharbati wheat grains from the fertile soils of Sehore. High fiber and sweet taste.',
      price: 65.0,
      unit: ProductUnit.KG,
      stockQuantity: 500.0,
      minimumOrderQuantity: 5.0,
      isOrganic: false,
      images: [
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      farmerId: seededFarmers[2].profile.id,
      categoryId: fruitCategory.id,
      name: 'Alphonso Mangoes (Ratnagiri Origin)',
      slug: 'alphonso-mangoes-ratnagiri-001',
      description: 'Naturally tree-ripened Alphonso mangoes with rich aroma, golden pulp, and unmatched sweetness.',
      price: 650.0,
      unit: ProductUnit.DOZEN,
      stockQuantity: 40.0,
      minimumOrderQuantity: 1.0,
      isOrganic: true,
      images: [
        'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ];

  for (const prod of productsData) {
    const { images, ...productInfo } = prod;
    const existing = await prisma.product.findFirst({ where: { slug: productInfo.slug } });

    if (!existing) {
      await prisma.product.create({
        data: {
          ...productInfo,
          images: {
            create: images.map((url, idx) => ({
              imageUrl: url,
              displayOrder: idx,
            })),
          },
        },
      });
    }
  }
  console.log(`✅ Seeded ${productsData.length} farm products.`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

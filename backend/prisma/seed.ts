import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("🍗 Seeding KFC e-commerce database...");

  // ---------------- Users ----------------
  const adminPassword = await hash("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@kfc.com" },
    update: {},
    create: {
      email: "admin@kfc.com",
      password: adminPassword,
      name: "Administrador KFC",
      role: "ADMIN",
      loyaltyPoints: 0,
      loyaltyLevel: "SILVER",
    },
  });

  const clientePassword = await hash("cliente123");
  const cliente = await prisma.user.upsert({
    where: { email: "cliente@kfc.com" },
    update: {},
    create: {
      email: "cliente@kfc.com",
      password: clientePassword,
      name: "Cliente Demo",
      phone: "+51 999 888 777",
      role: "CUSTOMER",
      loyaltyPoints: 300,
      loyaltyLevel: "SILVER",
      preferences: { spicyPreference: "spicy" },
      addresses: [
        { id: "addr-1", label: "Casa", street: "Av. España 1234", city: "Trujillo", reference: "Cerca al óvalo" },
      ],
    },
  });

  const extraCustomersData = [
    { email: "maria@kfc.com", name: "María Torres", spicyPreference: "no_spicy" },
    { email: "carlos@kfc.com", name: "Carlos Ramírez", spicyPreference: "spicy" },
    { email: "ana@kfc.com", name: "Ana Quispe", spicyPreference: "no_spicy" },
    { email: "luis@kfc.com", name: "Luis Fernández", spicyPreference: "spicy" },
  ];
  const extraCustomers: any[] = [];
  for (const c of extraCustomersData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: await hash("demo1234"),
        name: c.name,
        role: "CUSTOMER",
        loyaltyPoints: Math.floor(Math.random() * 400),
        preferences: { spicyPreference: c.spicyPreference },
      },
    });
    extraCustomers.push(user);
  }

  for (const u of [admin, cliente, ...extraCustomers]) {
    await prisma.cart.upsert({ where: { userId: u.id }, update: {}, create: { userId: u.id, items: [] } });
  }

  // ---------------- Products (25) ----------------
  const productsData = [
    // Pollo
    {
      name: "Original Recipe (3 piezas)",
      description: "Las clásicas 3 piezas de pollo KFC con la receta original de 11 especias, crujiente por fuera y jugoso por dentro.",
      price: 18.9,
      category: "Pollo",
      imageUrl: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600",
      stock: 80,
      nutritionalInfo: { calories: 620, protein: 48, fat: 38, carbs: 12 },
      spicyLevel: 0,
      allergens: ["gluten", "huevo"],
      preparationTime: 12,
    },
    {
      name: "Hot & Crispy (3 piezas)",
      description: "Pollo crocante marinado con especias picantes, para quienes aman el sabor con carácter.",
      price: 19.9,
      category: "Pollo",
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600",
      stock: 70,
      nutritionalInfo: { calories: 650, protein: 47, fat: 41, carbs: 14 },
      spicyLevel: 3,
      allergens: ["gluten"],
      preparationTime: 12,
    },
    {
      name: "Tiras de Pollo Crispy (5 uds)",
      description: "Tiras de pechuga empanizadas, ideales para compartir o para los más pequeños.",
      price: 16.5,
      category: "Pollo",
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
      stock: 90,
      nutritionalInfo: { calories: 480, protein: 36, fat: 24, carbs: 18 },
      spicyLevel: 1,
      allergens: ["gluten", "huevo"],
      preparationTime: 10,
    },
    {
      name: "Boneless KFC (6 uds)",
      description: "Trozos de pollo sin hueso, perfectos para combinar con tu salsa favorita.",
      price: 17.9,
      category: "Pollo",
      imageUrl: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600",
      stock: 75,
      nutritionalInfo: { calories: 520, protein: 38, fat: 28, carbs: 16 },
      spicyLevel: 0,
      allergens: ["gluten"],
      preparationTime: 10,
    },
    {
      name: "Filete Picante Extra",
      description: "Filete de pollo con doble marinado picante, nuestra receta más intensa.",
      price: 20.9,
      category: "Pollo",
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600",
      stock: 50,
      nutritionalInfo: { calories: 580, protein: 42, fat: 32, carbs: 13 },
      spicyLevel: 4,
      allergens: ["gluten"],
      preparationTime: 13,
    },
    // Combos
    {
      name: "Combo Desayuno KFC",
      description: "Wrap de pollo, café o jugo y panecillo. La forma perfecta de empezar el día.",
      price: 14.9,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600",
      stock: 60,
      nutritionalInfo: { calories: 480, protein: 22, fat: 20, carbs: 45, dayPart: "morning", groupSize: "individual" },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos"],
      isCombo: true,
      preparationTime: 9,
    },
    {
      name: "Combo Almuerzo Ejecutivo",
      description: "2 piezas de pollo, papas, ensalada y bebida. Ideal para el mediodía.",
      price: 24.9,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1626078436217-7c0a3a4f1f7e?w=600",
      stock: 65,
      nutritionalInfo: { calories: 980, protein: 58, fat: 50, carbs: 80, dayPart: "lunch", groupSize: "individual" },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos"],
      isCombo: true,
      preparationTime: 14,
    },
    {
      name: "Combo Individual Crispy",
      description: "Pechuga crispy, papas medianas y bebida a elección.",
      price: 22.5,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600",
      stock: 60,
      nutritionalInfo: { calories: 900, protein: 50, fat: 46, carbs: 75, dayPart: "lunch", groupSize: "individual" },
      spicyLevel: 1,
      allergens: ["gluten"],
      isCombo: true,
      preparationTime: 13,
    },
    {
      name: "Combo Snack Tarde",
      description: "Tiras crispy con salsa y bebida mediana, perfecto para el break de la tarde.",
      price: 16.9,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=600",
      stock: 55,
      nutritionalInfo: { calories: 650, protein: 30, fat: 32, carbs: 60, dayPart: "afternoon", groupSize: "individual" },
      spicyLevel: 2,
      allergens: ["gluten"],
      isCombo: true,
      preparationTime: 10,
    },
    {
      name: "Combo Pareja Box",
      description: "6 piezas de pollo, 2 papas medianas, 2 bebidas y pan. Para compartir en pareja.",
      price: 49.9,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?w=600",
      stock: 40,
      nutritionalInfo: { calories: 2100, protein: 110, fat: 100, carbs: 160, dayPart: "night", groupSize: "pareja" },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos"],
      isCombo: true,
      preparationTime: 18,
    },
    {
      name: "Bucket Familiar 16 piezas",
      description: "16 piezas de pollo Original Recipe, 2 papas grandes y 2 bebidas familiares.",
      price: 89.9,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1626082921520-ad8b3c1f1eb2?w=600",
      stock: 30,
      nutritionalInfo: { calories: 4200, protein: 280, fat: 220, carbs: 300, dayPart: "night", groupSize: "familia" },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos"],
      isCombo: true,
      preparationTime: 22,
    },
    {
      name: "Mega Bucket Grupo 20 piezas",
      description: "20 piezas variadas, 3 papas grandes, ensalada y 4 bebidas. Para grupos grandes.",
      price: 119.9,
      category: "Combos",
      imageUrl: "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=600",
      stock: 20,
      nutritionalInfo: { calories: 5400, protein: 340, fat: 280, carbs: 380, dayPart: "night", groupSize: "grupo_grande" },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos"],
      isCombo: true,
      preparationTime: 25,
    },
    // Acompañamientos
    {
      name: "Papas Fritas Grande",
      description: "Papas fritas crocantes, porción grande para compartir.",
      price: 9.9,
      category: "Acompañamientos",
      imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600",
      stock: 100,
      nutritionalInfo: { calories: 380, protein: 5, fat: 18, carbs: 50 },
      spicyLevel: 0,
      allergens: [],
      preparationTime: 6,
    },
    {
      name: "Puré de Papa con Salsa",
      description: "Suave puré de papa bañado en salsa gravy de la casa.",
      price: 8.9,
      category: "Acompañamientos",
      imageUrl: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=600",
      stock: 90,
      nutritionalInfo: { calories: 220, protein: 3, fat: 8, carbs: 32 },
      spicyLevel: 0,
      allergens: ["lácteos"],
      preparationTime: 5,
    },
    {
      name: "Ensalada Coleslaw",
      description: "Ensalada fresca de repollo y zanahoria con aderezo cremoso.",
      price: 7.9,
      category: "Acompañamientos",
      imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600",
      stock: 80,
      nutritionalInfo: { calories: 150, protein: 2, fat: 9, carbs: 16 },
      spicyLevel: 0,
      allergens: ["huevo"],
      preparationTime: 4,
    },
    {
      name: "Pan de Ajo KFC",
      description: "Pan suave horneado con mantequilla de ajo.",
      price: 5.9,
      category: "Acompañamientos",
      imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600",
      stock: 100,
      nutritionalInfo: { calories: 190, protein: 4, fat: 7, carbs: 28 },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos"],
      preparationTime: 5,
    },
    {
      name: "Salsa BBQ",
      description: "Salsa barbacoa dulce y ahumada, ideal para acompañar tus piezas.",
      price: 2.5,
      category: "Acompañamientos",
      imageUrl: "https://images.unsplash.com/photo-1612392062798-2dd8e4ae5729?w=600",
      stock: 150,
      nutritionalInfo: { calories: 45, protein: 0, fat: 0, carbs: 11 },
      spicyLevel: 0,
      allergens: [],
      preparationTime: 1,
    },
    {
      name: "Salsa Picante KFC",
      description: "Nuestra salsa más picante, hecha con ají y especias.",
      price: 2.5,
      category: "Acompañamientos",
      imageUrl: "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=600",
      stock: 150,
      nutritionalInfo: { calories: 30, protein: 0, fat: 0, carbs: 6 },
      spicyLevel: 4,
      allergens: [],
      preparationTime: 1,
    },
    // Bebidas
    {
      name: "Pepsi 500ml",
      description: "Gaseosa Pepsi bien fría, botella personal.",
      price: 6.5,
      category: "Bebidas",
      imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600",
      stock: 120,
      nutritionalInfo: { calories: 210, protein: 0, fat: 0, carbs: 55 },
      spicyLevel: 0,
      allergens: [],
      preparationTime: 1,
    },
    {
      name: "Limonada Frozen",
      description: "Limonada frappé bien helada, refrescante y natural.",
      price: 8.5,
      category: "Bebidas",
      imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600",
      stock: 90,
      nutritionalInfo: { calories: 160, protein: 0, fat: 0, carbs: 40 },
      spicyLevel: 0,
      allergens: [],
      preparationTime: 3,
    },
    {
      name: "Té Helado",
      description: "Té negro helado con un toque de limón.",
      price: 6.0,
      category: "Bebidas",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
      stock: 100,
      nutritionalInfo: { calories: 90, protein: 0, fat: 0, carbs: 22 },
      spicyLevel: 0,
      allergens: [],
      preparationTime: 1,
    },
    {
      name: "Agua Mineral",
      description: "Botella de agua mineral sin gas 500ml.",
      price: 4.0,
      category: "Bebidas",
      imageUrl: "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600",
      stock: 150,
      nutritionalInfo: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      spicyLevel: 0,
      allergens: [],
      preparationTime: 1,
    },
    // Postres
    {
      name: "Pie de Manzana",
      description: "Pie horneado con relleno de manzana y canela.",
      price: 7.9,
      category: "Postres",
      imageUrl: "https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=600",
      stock: 70,
      nutritionalInfo: { calories: 320, protein: 3, fat: 14, carbs: 45 },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos", "huevo"],
      preparationTime: 4,
    },
    {
      name: "Brownie KFC",
      description: "Brownie de chocolate intenso con nueces.",
      price: 8.5,
      category: "Postres",
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
      stock: 65,
      nutritionalInfo: { calories: 380, protein: 5, fat: 20, carbs: 48 },
      spicyLevel: 0,
      allergens: ["gluten", "lácteos", "huevo", "frutos secos"],
      preparationTime: 3,
    },
    {
      name: "Helado de Vainilla",
      description: "Copa de helado cremoso de vainilla.",
      price: 6.5,
      category: "Postres",
      imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600",
      stock: 80,
      nutritionalInfo: { calories: 210, protein: 4, fat: 10, carbs: 26 },
      spicyLevel: 0,
      allergens: ["lácteos"],
      preparationTime: 2,
    },
  ];

  const createdProducts: any[] = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { id: `seed-${p.name}` },
      update: {},
      create: { id: `seed-${p.name}`, ...p },
    }).catch(async () => {
      // ids with spaces aren't great for upsert reuse on reseed; fallback to create-if-not-exists by name
      const existing = await prisma.product.findFirst({ where: { name: p.name } });
      if (existing) return existing;
      return prisma.product.create({ data: p as any });
    });
    createdProducts.push(product);
  }

  console.log(`✅ ${createdProducts.length} productos creados`);

  // ---------------- Branches (Trujillo, Perú) ----------------
  const branchesData = [
    { name: "KFC Real Plaza Trujillo", address: "Av. Jesús de Nazareno 1500, Trujillo", lat: -8.1153, lng: -79.0357, openTime: "10:00", closeTime: "22:00", phone: "044-123456" },
    { name: "KFC Mall Aventura Plaza Trujillo", address: "Av. América Sur 2880, Trujillo", lat: -8.1187, lng: -79.0445, openTime: "10:00", closeTime: "22:30", phone: "044-123457" },
    { name: "KFC Centro Histórico Trujillo", address: "Jr. Pizarro 450, Trujillo", lat: -8.111, lng: -79.0287, openTime: "09:00", closeTime: "21:00", phone: "044-123458" },
    { name: "KFC California Trujillo", address: "Av. César Vallejo 1100, Trujillo", lat: -8.0989, lng: -79.0334, openTime: "10:00", closeTime: "22:00", phone: "044-123459" },
  ];
  for (const b of branchesData) {
    const existing = await prisma.branch.findFirst({ where: { name: b.name } });
    if (!existing) await prisma.branch.create({ data: b });
  }
  console.log(`✅ ${branchesData.length} sucursales creadas`);

  // ---------------- Promotions ----------------
  const promosData = [
    { code: "BIENVENIDO10", description: "10% de descuento en tu primera compra", discountType: "PERCENTAGE" as const, discountValue: 10, validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), usageLimit: 500 },
    { code: "ENVIOGRATIS", description: "Envío gratis en pedidos delivery", discountType: "FIXED" as const, discountValue: 5, validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), usageLimit: 300 },
    { code: "COMBO15", description: "15% de descuento en combos seleccionados", discountType: "PERCENTAGE" as const, discountValue: 15, validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), usageLimit: 200 },
  ];
  for (const promo of promosData) {
    await prisma.promotion.upsert({ where: { code: promo.code }, update: {}, create: promo });
  }
  console.log(`✅ ${promosData.length} promociones creadas`);

  // ---------------- Suppliers ----------------
  const suppliersData = [
    { name: "Proveedora de Pollo S.A.", contact: "Juan Pérez", email: "juan@pollo.com", phone: "+51 444 111 222", leadTimeDays: 2 },
    { name: "Papas del Perú SAC", contact: "María López", email: "maria@papas.com", phone: "+51 444 333 444", leadTimeDays: 3 },
    { name: "Bebidas & Refrescos EIRL", contact: "Carlos Ruiz", email: "carlos@bebidas.com", phone: "+51 444 555 666", leadTimeDays: 2 },
    { name: "Empaques KFC Proveedores", contact: "Ana García", email: "ana@empaques.com", phone: "+51 444 777 888", leadTimeDays: 4 },
    { name: "Condimentos y Especias Ltd.", contact: "Pedro Sánchez", email: "pedro@condimentos.com", phone: "+51 444 999 000", leadTimeDays: 3 },
  ];
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!existing) await prisma.supplier.create({ data: s });
  }
  console.log(`✅ ${suppliersData.length} proveedores creados`);

  // ---------------- Stock Movements (historical) ----------------
  const existingStockMovements = await prisma.stockMovement.count();
  if (existingStockMovements === 0 && createdProducts.length > 0) {
    for (const product of createdProducts.slice(0, 10)) {
      // Create some historical stock movements for each product
      const movementTypes = ["RESTOCK", "SALE", "ADJUSTMENT", "WASTE"];
      for (let i = 0; i < 5; i++) {
        const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        const quantity = type === "SALE" || type === "WASTE" ? -Math.floor(Math.random() * 10) - 1 : Math.floor(Math.random() * 20) + 5;
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type,
            quantity,
            reason: type === "SALE" ? "Venta histórica" : type === "RESTOCK" ? "Reabastecimiento" : type === "WASTE" ? "Merma" : "Ajuste de inventario",
            createdAt,
          },
        });
      }
    }
    console.log("✅ Movimientos de stock históricos creados");
  } else {
    console.log("ℹ️  Ya existen movimientos de stock, se omite la creación de movimientos históricos");
  }

  // ---------------- Sample Orders (10) ----------------
  const allCustomers = [cliente, ...extraCustomers];
  const statuses: any[] = ["DELIVERED", "DELIVERED", "DELIVERED", "PENDING", "PREPARING", "ON_THE_WAY", "DELIVERED", "CANCELLED", "DELIVERED", "REFUNDED"];
  const types: any[] = ["DELIVERY", "PICKUP", "DINE_IN", "DRIVE_THRU", "DELIVERY", "DELIVERY", "PICKUP", "DELIVERY", "DRIVE_THRU", "DELIVERY"];

  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    for (let i = 0; i < 10; i++) {
      const customer = allCustomers[i % allCustomers.length];
      const numItems = 1 + Math.floor(Math.random() * 3);
      const chosen = Array.from({ length: numItems }, () => createdProducts[Math.floor(Math.random() * createdProducts.length)]);
      const items = chosen.map((p: any) => ({ productId: p.id, name: p.name, price: p.price, quantity: 1 + Math.floor(Math.random() * 2) }));
      const total = Math.round(items.reduce((s: number, it: any) => s + it.price * it.quantity, 0) * 100) / 100;
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.order.create({
        data: {
          userId: customer.id,
          items,
          total,
          status: statuses[i],
          type: types[i],
          address: types[i] === "DELIVERY" ? { street: "Av. España 1234", city: "Trujillo" } : Prisma.JsonNull,
          pointsEarned: Math.round(total),
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
    console.log("✅ 10 pedidos de ejemplo creados");
  } else {
    console.log("ℹ️  Ya existen pedidos, se omite la creación de pedidos de ejemplo");
  }

  console.log("🎉 Seed completado con éxito");
  console.log("   Admin:    admin@kfc.com / admin123");
  console.log("   Cliente:  cliente@kfc.com / cliente123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

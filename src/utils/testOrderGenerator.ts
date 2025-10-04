import { supabase } from '../lib/supabase';

interface VariantOption {
  id: number;
  name: string;
  additional_price: number;
}

interface IngredientOption {
  id: number;
  name: string;
  extra_price: number;
}

interface Product {
  id: number;
  name: string;
  base_price: number;
  variants: VariantOption[];
  ingredients: IngredientOption[];
}

interface User {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  faculty_id?: number;
}

interface TestOrderData {
  products: Product[];
  users: User[];
}

// Fetch real data from database with proper variant relationships
export async function fetchTestOrderData(): Promise<TestOrderData> {
  try {
    console.log('Fetching test order data...');

    // First, get all active products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, base_price, active')
      .eq('active', true);

    if (productsError) throw productsError;

    console.log('Found products:', productsData?.length);

    // For each product, get its variants and ingredients
    const products: Product[] = [];

    for (const product of productsData || []) {
      // Get product variants through the product_variants junction table
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          variant_option_id,
          additional_price,
          active,
          variant_option:variant_options!inner (
            id,
            name,
            additional_price,
            active
          )
        `)
        .eq('product_id', product.id)
        .eq('active', true)
        .eq('variant_option.active', true);

      if (variantError) {
        console.error(`Error fetching variants for product ${product.id}:`, variantError);
        continue;
      }

      // Get product ingredients through the product_customizable_ingredients junction table
      const { data: ingredientData, error: ingredientError } = await supabase
        .from('product_customizable_ingredients')
        .select(`
          ingredient_option_id,
          active,
          ingredient_option:ingredient_options!inner (
            id,
            name,
            extra_price,
            active
          )
        `)
        .eq('product_id', product.id)
        .eq('active', true)
        .eq('ingredient_option.active', true);

      if (ingredientError) {
        console.error(`Error fetching ingredients for product ${product.id}:`, ingredientError);
      }

      // Only include products that have at least one variant
      if (variantData && variantData.length > 0) {
        const variants: VariantOption[] = variantData.map(v => ({
          id: v.variant_option.id,
          name: v.variant_option.name,
          additional_price: v.variant_option.additional_price
        }));

        const ingredients: IngredientOption[] = (ingredientData || []).map(i => ({
          id: i.ingredient_option.id,
          name: i.ingredient_option.name,
          extra_price: i.ingredient_option.extra_price
        }));

        products.push({
          id: product.id,
          name: product.name,
          base_price: product.base_price,
          variants,
          ingredients
        });

        console.log(`Product ${product.name} has ${variants.length} variants and ${ingredients.length} ingredients`);
      }
    }

    // Fetch users for realistic customer data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('uuid, first_name, last_name, email, faculty_id')
      .limit(20);

    if (usersError) throw usersError;

    console.log(`Fetched ${products.length} products with variants and ${users?.length || 0} users`);

    return {
      products,
      users: users || []
    };
  } catch (error) {
    console.error('Error fetching test order data:', error);
    return { products: [], users: [] };
  }
}

// Generate random realistic order details using actual variants
function generateOrderDetails(products: Product[]): Array<{
  product_id: number;
  variant_option_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  ingredients?: number[];
}> {
  // Use a Map to prevent duplicate product+variant+ingredients combinations
  const detailsMap = new Map<string, {
    product_id: number;
    variant_option_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    ingredients?: number[];
  }>();
  
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order

  for (let i = 0; i < numItems; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    
    if (!product.variants || product.variants.length === 0) {
      console.warn(`Product ${product.name} has no variants, skipping`);
      continue;
    }

    // Select a random variant from the actual variants available for this product
    const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
    const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity

    console.log(`Selected variant "${variant.name}" for product "${product.name}"`);

    // Calculate unit price (base price + variant additional price)
    const unit_price = product.base_price + variant.additional_price;

    // Randomly select some ingredients (25% chance per ingredient)
    const selectedIngredients: number[] = [];
    let ingredientsCost = 0;

    if (product.ingredients && product.ingredients.length > 0) {
      product.ingredients.forEach(ingredient => {
        if (Math.random() < 0.25) { // 25% chance to add each ingredient
          selectedIngredients.push(ingredient.id);
          ingredientsCost += ingredient.extra_price;
          console.log(`Added ingredient "${ingredient.name}" (+$${ingredient.extra_price})`);
        }
      });
    }

    const finalUnitPrice = unit_price + ingredientsCost;
    const subtotal = finalUnitPrice * quantity;

    // Create a unique key for this combination of product + variant + ingredients
    const ingredientsKey = selectedIngredients.sort((a, b) => a - b).join(',');
    const uniqueKey = `${product.id}-${variant.id}-${ingredientsKey}`;
    
    // Check if this combination already exists
    if (detailsMap.has(uniqueKey)) {
      // If it exists, increment quantity and update subtotal
      const existing = detailsMap.get(uniqueKey)!;
      existing.quantity += quantity;
      existing.subtotal = existing.unit_price * existing.quantity;
      console.log(`Updated existing item: ${product.name} (${variant.name}) - New quantity: ${existing.quantity}`);
    } else {
      // If it doesn't exist, add new entry
      detailsMap.set(uniqueKey, {
        product_id: product.id,
        variant_option_id: variant.id,
        quantity,
        unit_price: finalUnitPrice,
        subtotal,
        ingredients: selectedIngredients.length > 0 ? selectedIngredients : undefined
      });
    }
  }

  // Convert Map values back to array
  return Array.from(detailsMap.values());
}

// Create a realistic test order
export async function createTestOrder(data: TestOrderData): Promise<void> {
  if (data.products.length === 0) {
    throw new Error('No hay productos con variantes disponibles para crear pedidos de prueba');
  }
  
  if (data.users.length === 0) {
    throw new Error('No hay usuarios disponibles para crear pedidos de prueba');
  }

  try {
    // Select random user
    const user = data.users[Math.floor(Math.random() * data.users.length)];
    
    // Generate order details with real variants
    const orderDetails = generateOrderDetails(data.products);
    
    if (orderDetails.length === 0) {
      throw new Error('No se pudieron generar detalles del pedido con variantes válidas');
    }

    // Calculate total
    const total = orderDetails.reduce((sum, detail) => sum + detail.subtotal, 0);

    console.log(`Creating order for ${user.first_name} ${user.last_name} with total $${total.toFixed(2)}`);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_uuid: user.uuid,
        status: 'Recibido',
        total
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order details with proper variant_option_id
    const orderDetailsToInsert = orderDetails.map(detail => ({
      order_id: order.id,
      product_id: detail.product_id,
      variant_option_id: detail.variant_option_id, // This is the key field for variants
      quantity: detail.quantity,
      unit_price: detail.unit_price,
      subtotal: detail.subtotal
    }));

    const { data: insertedDetails, error: detailsError } = await supabase
      .from('order_details')
      .insert(orderDetailsToInsert)
      .select();

    if (detailsError) throw detailsError;

    // Add ingredients for each order detail
    for (let i = 0; i < orderDetails.length; i++) {
      const detail = orderDetails[i];
      const insertedDetail = insertedDetails[i];
      
      if (detail.ingredients && detail.ingredients.length > 0) {
        const ingredientsToInsert = detail.ingredients.map(ingredientId => ({
          order_detail_id: insertedDetail.id,
          ingredient_option_id: ingredientId
        }));

        const { error: ingredientsError } = await supabase
          .from('order_detail_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) {
          console.error('Error inserting ingredients:', ingredientsError);
        }
      }
    }

    console.log(`✅ Test order #${order.id} created successfully for ${user.first_name} ${user.last_name}`);
  } catch (error) {
    console.error('Error creating test order:', error);
    throw error;
  }
}

// Generate multiple test orders
export async function generateMultipleTestOrders(count: number = 1): Promise<void> {
  try {
    console.log(`🚀 Starting generation of ${count} test orders...`);
    
    const data = await fetchTestOrderData();
    
    if (data.products.length === 0) {
      throw new Error('No hay productos activos con variantes disponibles. Asegúrate de que los productos tengan variantes configuradas.');
    }
    
    if (data.users.length === 0) {
      throw new Error('No hay usuarios disponibles en la base de datos.');
    }

    console.log(`📊 Using ${data.products.length} products with variants and ${data.users.length} users`);

    // Show which products and variants are available
    data.products.forEach(product => {
      console.log(`📦 ${product.name}: ${product.variants.map(v => v.name).join(', ')}`);
    });

    for (let i = 0; i < count; i++) {
      await createTestOrder(data);
      // Add small delay between orders to avoid conflicts
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Successfully created ${count} realistic test orders!`);
  } catch (error) {
    console.error('❌ Error generating test orders:', error);
    throw error;
  }
}
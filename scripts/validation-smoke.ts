import fetch from "node-fetch";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4000";
const SERVICE_KEY = process.env.SERVICE_KEY || "dev-service-key";

const log = (msg: string, data?: any) => {
  console.log(`[TEST] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
};

async function request(method: string, path: string, body?: any) {
  const url = `${GATEWAY_URL}${path}`;
  if (body) {
    log(`${method} ${url} with payload:`, body);
  } else {
    log(`${method} ${url}`);
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-service-key": SERVICE_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    log(`Result ${res.status}`, data);
    return { status: res.status, data };
  } catch (e: any) {
    log(`Error: ${e.message}`);
    return { status: 500, data: null };
  }
}

async function run() {
  log("Starting Validation Smoke Test...");

  // 0. Create User
  const userName = `SmokeUser_${Date.now()}`;
  const userEmail = `test+${Date.now()}@example.com`;

  const { status: userStatus, data: userData } = await request(
    "POST",
    "/users",
    {
      name: userName,
      email: userEmail,
    },
  );

  if (userStatus !== 200 && userStatus !== 201) {
    console.error("Failed to create user", userStatus);
    process.exit(1);
  }
  if (!userData || !userData.id) {
    console.error("Failed to create user: Missing ID", userData);
    process.exit(1);
  }
  const userId = userData.id;
  log("User Created", { id: userId });

  // 1. Create Category
  const catName = `SmokeCat_${Date.now()}`;
  const { status: catStatus, data: catData } = await request(
    "POST",
    "/categories",
    {
      name: catName,
    },
  );

  if (catStatus !== 200 && catStatus !== 201) {
    console.error("Failed to create category", catStatus);
    process.exit(1);
  }
  if (!catData || !catData.id) {
    console.error("Failed to create category: Missing ID", catData);
    process.exit(1);
  }
  const catId = catData.id;
  log("Category Created", { id: catId });

  // 2. Create Product (Valid)
  const prodName = `SmokeProd_${Date.now()}`;
  const { status: prodStatus, data: prodData } = await request(
    "POST",
    "/products",
    {
      name: prodName,
      price: 1000,
      categoryId: catId,
      description: "Smoke test product",
      stock: 10,
      imageUrl: "http://example.com/image.png",
    },
  );

  if (prodStatus !== 200 && prodStatus !== 201) {
    console.error("Failed to create product", prodStatus);
    process.exit(1);
  }
  if (!prodData || !prodData.id) {
    console.error("Failed to create product: Missing ID", prodData);
    process.exit(1);
  }
  const prodId = prodData.id;
  log("Product Created", { id: prodId });

  // 3. Create Product (Invalid - Missing Name)
  const { status: invalidStatus, data: invalidData } = await request(
    "POST",
    "/products",
    {
      price: 1000,
      categoryId: catId,
    },
  );

  if (
    invalidStatus === 400 &&
    (invalidData.error === "VALIDATION_ERROR" ||
      invalidData.error === "Validation Failed")
  ) {
    log("Validation Correctly Failed", invalidData);
  } else {
    console.error("Validation SHOULD have failed but didn't", {
      status: invalidStatus,
      data: invalidData,
    });
    process.exit(1);
  }

  // 4. Update Product
  const { status: updateStatus } = await request(
    "PATCH",
    `/products/${prodId}`,
    {
      price: 1500,
    },
  );
  if (updateStatus !== 200) {
    console.error("Failed to update product", updateStatus);
    process.exit(1);
  }
  log("Product Updated");

  // 5. Delete Product
  const { status: delProdStatus } = await request(
    "DELETE",
    `/products/${prodId}`,
  );
  if (delProdStatus !== 200) {
    console.error("Failed to delete product", delProdStatus);
    process.exit(1);
  }
  log("Product Deleted");

  // 6. Delete Category
  const { status: delCatStatus } = await request(
    "DELETE",
    `/categories/${catId}`,
  );
  if (delCatStatus !== 200) {
    console.error("Failed to delete category", delCatStatus);
    process.exit(1);
  }
  log("Category Deleted");

  log("Smoke Test Passed!");
}

run();

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const headers = {
  "X-Shopify-Access-Token": ACCESS_TOKEN,
  "Content-Type": "application/json",
};

// ================= PRODUCTS =================
app.get("/products", async (req, res) => {
  const response = await axios.get(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json`,
    { headers }
  );
  res.json(response.data);
});

// ================= COLLECTIONS =================
app.get("/collections", async (req, res) => {
  const response = await axios.get(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/custom_collections.json`,
    { headers }
  );
  res.json(response.data);
});

// ================= COLLECTION PRODUCTS =================
app.get("/collection-products/:id", async (req, res) => {
  const id = req.params.id;

  const collect = await axios.get(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/collects.json?collection_id=${id}`,
    { headers }
  );

  const ids = collect.data.collects.map(c => c.product_id);

  if (ids.length === 0) return res.json({ products: [] });

  const products = await axios.get(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?ids=${ids.join(",")}`,
    { headers }
  );

  res.json(products.data);
});

// ================= AI =================
async function generateAI(product) {

  const prompt = `
You are a HIGH-END luxury jewelry copywriter (Cartier, Tiffany level).

Rewrite product title and description.

IMPORTANT:
- Keep original meaning
- No variants (size, color)
- Make it generic
- Expand content

TITLE: ${product.title}
DESCRIPTION: ${product.body_html}

Rules:
- Title: 6–12 words
- Description: 180–250 words
- Start with luxury hook (Imagine...)
- Premium storytelling tone

Return:

TITLE:
...

DESCRIPTION:
...
`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.1
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = res.data.choices[0].message.content;

  const title = text.split("DESCRIPTION:")[0].replace("TITLE:", "").trim();
  const description = text.split("DESCRIPTION:")[1].trim();

  return { title, description };
}

// ================= GENERATE =================
app.post("/generate", async (req, res) => {
  const result = await generateAI(req.body.product);
  res.json(result);
});

// ================= UPDATE =================
app.post("/update", async (req, res) => {
  const { id, title, description } = req.body;

  await axios.put(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${id}.json`,
    {
      product: { id, title, body_html: description },
    },
    { headers }
  );

  res.json({ success: true });
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
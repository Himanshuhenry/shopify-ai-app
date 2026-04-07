import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {

  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [currentCollection, setCurrentCollection] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/collections")
      .then(res => setCollections(res.data.custom_collections));
  }, []);

  const loadProducts = async (id, name) => {
    const res = await axios.get(`http://localhost:5000/collection-products/${id}`);
    setProducts(res.data.products);

    setSelected([]);
    setGenerated(null);
    setCurrentCollection(name);
  };

  const toggle = (p) => {
    if (selected.find(x => x.id === p.id)) {
      setSelected(selected.filter(x => x.id !== p.id));
    } else {
      setSelected([...selected, p]);
    }
  };

  // 🔥 FIXED SELECT ALL / UNSELECT ALL
  const isAllSelected = products.length > 0 && selected.length === products.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelected([]); // unselect all
    } else {
      setSelected(products); // select all current collection
    }
  };

  const generate = async () => {
    const res = await axios.post("http://localhost:5000/generate", {
      product: selected[0]
    });
    setGenerated(res.data);
  };

  const apply = async () => {
    for (let p of selected) {
      await axios.post("http://localhost:5000/update", {
        id: p.id,
        title: generated.title,
        description: generated.description
      });
    }
    alert("✅ Updated successfully");
  };

  return (
    <div style={{
      fontFamily: "Inter, sans-serif",
      background: "#f4f6f8",
      minHeight: "100vh",
      padding: 30
    }}>

      <h1>✨ Shopify AI Optimizer</h1>

      {/* FILTER BAR */}
      <div style={card}>
        <select onChange={(e)=>{
          const name = e.target.options[e.target.selectedIndex].text;
          loadProducts(e.target.value, name);
        }}>
          <option>Select Collection</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <button onClick={handleSelectAll} style={btn}>
          {isAllSelected
            ? "Unselect All"
            : "Select All (This Collection)"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>

        {/* LEFT */}
        <div style={cardLarge}>
          <h3>Products {currentCollection && `(${currentCollection})`}</h3>

          {products.map(p => {

            const isSelected = selected.find(x => x.id === p.id);

            return (
              <div key={p.id}
                onClick={()=>toggle(p)}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 10,
                  cursor: "pointer",
                  border: isSelected ? "2px solid #008060" : "1px solid #ddd",
                  background: isSelected ? "#e6f4ea" : "#fff",
                  transition: "all 0.2s ease"
                }}
              >
                {p.title}
              </div>
            );
          })}
        </div>

        {/* RIGHT */}
        <div style={cardSmall}>
          <h3>Selected: {selected.length}</h3>

          {selected.length > 0 && (
            <button onClick={generate} style={btn}>
              Generate Preview
            </button>
          )}

          {generated && (
            <>
              <h3 style={{ marginTop: 20 }}>Preview</h3>

              <input
                value={generated.title}
                onChange={(e)=>setGenerated({...generated, title:e.target.value})}
                style={input}
              />

              <textarea
                value={generated.description}
                onChange={(e)=>setGenerated({...generated, description:e.target.value})}
                style={{...input, height: 260}}
              />

              <button onClick={apply} style={btn}>
                Apply to {selected.length} Products
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

// 🎨 STYLES
const card = {
  background: "#fff",
  padding: 15,
  borderRadius: 12,
  marginBottom: 20,
  display: "flex",
  gap: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
};

const cardLarge = {
  flex: 2,
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
};

const cardSmall = {
  flex: 1,
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
};

const btn = {
  padding: "8px 14px",
  background: "#008060",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
};

export default App;
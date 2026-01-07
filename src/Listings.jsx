import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Listings() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Form States
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Buy/Sell');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const categories = ['All', 'Buy/Sell', 'Lost & Found', 'Cab Sharing', 'Train Tickets', 'Movie Tickets'];

  const fetchListings = async () => {
    let query = supabase.from('listings').select('*');
    if (activeCategory !== 'All') {
      query = query.eq('category', activeCategory);
    }
    const { data } = await query;
    setItems(data || []);
  };

  useEffect(() => {
    fetchListings();
  }, [activeCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let publicUrl = '';

    // STEP 1: Upload the file to the 'listing-images' bucket
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`; 
      const { data, error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Image upload failed: " + uploadError.message);
        return;
      }

      // STEP 2: Get the publicly accessible URL
      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);
      
      publicUrl = urlData.publicUrl;
    }

    // STEP 3: Save the data (including the image URL) to your 'listings' table
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('listings').insert([{ 
      title, 
      price: parseInt(price), 
      description: desc, 
      category,
      seller_email: user.email, 
      seller_phone: phone,
      image_url: publicUrl 
    }]);

    if (error) {
      alert(error.message);
    } else {
      alert("Success! Your post is live with an image.");
      setTitle(''); setPrice(''); setDesc(''); setPhone(''); setImageFile(null);
      fetchListings(); 
    }
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      {/* 1. The Post Form */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3>Post to NITC Hub</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} required />
          
          <input 
            placeholder="Your Phone Number / WhatsApp" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            required 
          />

          {/* Image Upload Input moved inside the Form */}
          <label style={{ fontSize: '14px', color: '#666' }}>Upload Product Image:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files[0])} 
            style={{ margin: '5px 0' }}
          />
          
          <label>Select Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px' }}>
            {categories.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <button type="submit" style={{ background: 'green', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Submit Post
          </button>
        </form>
      </div>

      <hr />

      {/* 2. Category Navigation */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '20px 0' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px',
              backgroundColor: activeCategory === cat ? '#007bff' : '#eee',
              color: activeCategory === cat ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Search Bar */}
      <input 
        type="text" 
        placeholder={`Search in ${activeCategory}...`} 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }}
      />

      {/* 4. The Feed */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredItems.length === 0 ? <p>No items found in {activeCategory}.</p> : 
          filteredItems.map(item => (
            <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#007bff' }}>{item.category.toUpperCase()}</span>
              
              {/* Image Display moved inside the Card */}
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt="item" 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px', marginBottom: '10px' }} 
                />
              )}

              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p><strong>Price:</strong> ₹{item.price}</p>
              
              <div style={{ marginTop: '10px', padding: '10px', background: '#f0f7ff', borderRadius: '5px', fontSize: '14px' }}>
                <strong>Contact Seller:</strong><br/>
                📧 {item.seller_email}<br/>
                📞 {item.seller_phone}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
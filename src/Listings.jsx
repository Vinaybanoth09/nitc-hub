import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { formatDistanceToNow } from 'date-fns'; 

export default function Listings() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my_posts'
  const [userEmail, setUserEmail] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Buy/Sell');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const categories = ['All', 'Buy/Sell', 'Lost & Found', 'Cab Sharing', 'Train Tickets', 'Movie Tickets'];

  // Fetch user and listings on load
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };
    getUser();
    fetchListings();
  }, [activeCategory, viewMode]);

  const fetchListings = async () => {
    let query = supabase.from('listings').select('*').order('created_at', { ascending: false });
    
    if (activeCategory !== 'All') query = query.eq('category', activeCategory);
    if (viewMode === 'my_posts') query = query.eq('seller_email', userEmail);

    const { data } = await query;
    setItems(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let publicUrl = '';

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`; 
      const { data, error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, imageFile);

      if (uploadError) return alert("Image upload failed: " + uploadError.message);

      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('listings').insert([{ 
      title, 
      price: parseInt(price), 
      description: desc, 
      category,
      seller_email: user.email, 
      seller_phone: phone,
      image_url: publicUrl,
      is_active: true // Default to active
    }]);

    if (error) {
      alert(error.message);
    } else {
      alert("Success! Your post is live.");
      setTitle(''); setPrice(''); setDesc(''); setPhone(''); setImageFile(null);
      fetchListings(); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (!error) fetchListings();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('listings').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) fetchListings();
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      
      {/* 1. Header & Post Form */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3>Post to NITC Hub</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input placeholder="Price (0 for Lost/Found)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} required />
          <input placeholder="WhatsApp Number (e.g. 9123456789)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <button type="submit" style={{ background: 'green', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Submit Post
          </button>
        </form>
      </div>

      {/* 2. Controls: View Mode & Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => setViewMode('all')} style={{ flex: 1, padding: '10px', background: viewMode === 'all' ? '#007bff' : '#eee', color: viewMode === 'all' ? 'white' : 'black', border: 'none', borderRadius: '5px' }}>Public Feed</button>
        <button onClick={() => setViewMode('my_posts')} style={{ flex: 1, padding: '10px', background: viewMode === 'my_posts' ? '#007bff' : '#eee', color: viewMode === 'my_posts' ? 'white' : 'black', border: 'none', borderRadius: '5px' }}>My Listings</button>
      </div>

      <input 
        type="text" 
        placeholder={`Search in ${activeCategory}...`} 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
      />

      {/* 3. Categories Navigation */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '8px 15px', 
              borderRadius: '20px',
              backgroundColor: activeCategory === cat ? '#333' : '#eee',
              color: activeCategory === cat ? 'white' : 'black',
              border: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. The Feed */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {filteredItems.length === 0 ? <p>Nothing found here.</p> : 
          filteredItems.map(item => (
            <div key={item.id} style={{ 
              border: '1px solid #ddd', 
              padding: '15px', 
              borderRadius: '12px', 
              background: item.is_active ? 'white' : '#f8f8f8',
              position: 'relative'
            }}>
              {!item.is_active && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', padding: '2px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                  DONE / SOLD
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#007bff', fontWeight: 'bold' }}>{item.category.toUpperCase()}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {formatDistanceToNow(new Date(item.created_at))} ago
                </span>
              </div>

              {item.image_url && <img src={item.image_url} alt="item" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px', filter: item.is_active ? 'none' : 'grayscale(100%)' }} />}
              
              <h3 style={{ margin: '5px 0' }}>{item.title}</h3>
              <p style={{ color: '#555', fontSize: '14px' }}>{item.description}</p>
              <p style={{ fontWeight: 'bold', fontSize: '18px' }}>₹{item.price}</p>

              {/* Owner Controls */}
              {item.seller_email === userEmail ? (
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleStatus(item.id, item.is_active)} style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ddd', cursor: 'pointer' }}>
                    {item.is_active ? 'Mark as Done' : 'Re-activate'}
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid red', color: 'red', background: 'white', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              ) : (
                item.is_active && (
                  <a 
                    href={`https://wa.me/91${item.seller_phone}?text=Hi, I'm interested in "${item.title}" on NITC Hub.`}
                    target="_blank"
                    style={{ display: 'block', textAlign: 'center', background: '#25D366', color: 'white', padding: '12px', borderRadius: '8px', textDecoration: 'none', marginTop: '10px', fontWeight: 'bold' }}
                  >
                    Chat on WhatsApp
                  </a>
                )
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
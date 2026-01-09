import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { formatDistanceToNow } from 'date-fns'; 

export default function Listings() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('all'); 
  const [userEmail, setUserEmail] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Buy/Sell');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const categories = ['All', 'Buy/Sell', 'Lost & Found', 'Cab Sharing', 'Train Tickets', 'Movie Tickets'];

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let publicUrl = '';
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`; 
      const { data, error } = await supabase.storage.from('listing-images').upload(fileName, imageFile);
      if (error) return alert("Upload failed: " + error.message);
      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('listings').insert([{ 
      title, price: parseInt(price), description: desc, category,
      seller_email: user.email, seller_phone: phone, image_url: publicUrl, is_active: true 
    }]);
    setTitle(''); setPrice(''); setDesc(''); setPhone(''); setImageFile(null);
    fetchListings();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this post?")) {
      await supabase.from('listings').delete().eq('id', id);
      fetchListings();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('listings').update({ is_active: !currentStatus }).eq('id', id);
    fetchListings();
  };

  const filteredItems = items.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#007bff' }}>NITC Hub</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowProfile(!showProfile)} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ddd', cursor: 'pointer' }}>👤 Profile</button>
          <button onClick={handleSignOut} style={{ padding: '8px 15px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      {showProfile && (
        <div style={{ background: '#eef6ff', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #007bff' }}>
          <h3>Your Profile</h3>
          <p><strong>Email:</strong> {userEmail}</p>
          <button onClick={() => { setViewMode('my_posts'); setShowProfile(false); }} style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>Manage My Listings</button>
        </div>
      )}

      {/* Form */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3>Post to NITC Hub</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{padding: '10px'}}/>
          <input placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required style={{padding: '10px'}}/>
          <textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} required style={{padding: '10px'}}/>
          <input placeholder="WhatsApp (91...)" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{padding: '10px'}}/>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{padding: '10px'}}>
            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" style={{ background: 'green', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Submit</button>
        </form>
      </div>

      {/* Feed Controls (All vs My Posts) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => setViewMode('all')} style={{ flex: 1, padding: '10px', background: viewMode === 'all' ? '#007bff' : '#eee', color: viewMode === 'all' ? 'white' : 'black', border: 'none', borderRadius: '5px' }}>Public Feed</button>
        <button onClick={() => setViewMode('my_posts')} style={{ flex: 1, padding: '10px', background: viewMode === 'my_posts' ? '#007bff' : '#eee', color: viewMode === 'my_posts' ? 'white' : 'black', border: 'none', borderRadius: '5px' }}>My Listings</button>
      </div>

      {/* RESTORED: Category Navigation Buttons */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '10px' }}>
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
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <input 
        type="text" 
        placeholder={`Search in ${activeCategory}...`} 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
      />

      {/* Feed */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {filteredItems.map(item => (
          <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '12px', background: item.is_active ? 'white' : '#f8f8f8', position: 'relative' }}>
            
            {/* SOLD/FOUND Badge */}
            {!item.is_active && (
              <div style={{ background: 'red', color: 'white', padding: '2px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', width: 'fit-content', marginBottom: '10px' }}>
                DONE / SOLD
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
               <span style={{ color: '#007bff', fontWeight: 'bold' }}>{item.category.toUpperCase()}</span>
               <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
            </div>
            {item.image_url && <img src={item.image_url} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', margin: '10px 0', filter: item.is_active ? 'none' : 'grayscale(100%)' }} />}
            <h3>{item.title}</h3>
            <p style={{ color: '#555' }}>{item.description}</p>
            <p style={{ fontWeight: 'bold' }}>₹{item.price}</p>
            
            {item.seller_email === userEmail ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => toggleStatus(item.id, item.is_active)} style={{flex: 1, padding: '8px', cursor: 'pointer'}}>{item.is_active ? 'Mark Done' : 'Re-activate'}</button>
                <button onClick={() => handleDelete(item.id)} style={{flex: 1, padding: '8px', color: 'red', cursor: 'pointer'}}>Delete</button>
              </div>
            ) : (
              item.is_active && (
                <a href={`https://wa.me/91${item.seller_phone}?text=Interested in ${item.title}`} target="_blank" style={{ display: 'block', textAlign: 'center', background: '#25D366', color: 'white', padding: '12px', borderRadius: '8px', textDecoration: 'none', marginTop: '10px', fontWeight: 'bold' }}>Chat on WhatsApp</a>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
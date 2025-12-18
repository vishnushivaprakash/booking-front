import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useParams } from 'react-router-dom';

const API = 'http://localhost:5000/api';

// ============ CONTEXT ============
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [city, setCity] = useState(() => localStorage.getItem('city') || 'Mumbai');

  const login = (data) => {
    localStorage.setItem('user', JSON.stringify(data));
    if (data.selectedCity) {
      localStorage.setItem('city', data.selectedCity);
      setCity(data.selectedCity);
    }
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateCity = async (newCity) => {
    localStorage.setItem('city', newCity);
    setCity(newCity);
    if (user) {
      await fetch(`${API}/user/city`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ city: newCity })
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, city, updateCity }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ NAVBAR ============
function Navbar() {
  const { user, logout, city, updateCity } = useAuth();
  const [cities, setCities] = useState([]);
  const [showCities, setShowCities] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/cities`).then(r => r.json()).then(setCities);
  }, []);

  return (
    <nav className="navbar">
      <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>🎬 BookMyShow</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="city-selector" onClick={() => setShowCities(!showCities)}>
          📍 {city} ▼
          {showCities && (
            <div className="city-dropdown">
              {cities.map(c => (
                <div key={c._id} onClick={() => { updateCity(c.name); setShowCities(false); }}>
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {user && (
          <>
            <span>{user.email}</span>
            {user.role === 'admin' && <button onClick={() => navigate('/admin')}>Admin</button>}
            <button onClick={() => navigate('/bookings')}>My Bookings</button>
            <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ============ AUTH ============
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
      navigate(data.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

// ============ MOVIES ============
function Movies() {
  const [movies, setMovies] = useState([]);
  const [offers, setOffers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/movies`).then(r => r.json()).then(setMovies);
    fetch(`${API}/offers`).then(r => r.json()).then(setOffers);
  }, []);

  return (
    <div className="movies-container">
      {offers.length > 0 && (
        <div className="offers-banner">
          <h3>🎉 Offers</h3>
          <div className="offers-scroll">
            {offers.map(o => (
              <div key={o._id} className="offer-card">
                <span className="offer-code">{o.code}</span>
                <p>{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <h2>Now Showing</h2>
      <div className="movies-grid">
        {movies.map(movie => (
          <div key={movie._id} className="movie-card" onClick={() => navigate(`/movie/${movie._id}`)}>
            <img 
              src={movie.poster} 
              alt={movie.name}
              onError={(e) => {
                // Fallback for broken images
                if (movie.name === 'Inception') {
                  e.target.src = 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg';
                } else {
                  e.target.src = 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(movie.name);
                }
              }}
            />
            <div className="movie-info">
              <h3>{movie.name}</h3>
              {movie.avgRating && (
                <span className="rating">⭐ {movie.avgRating} ({movie.reviewCount})</span>
              )}
              <span className="genre">{movie.genre} • {movie.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ MOVIE DETAIL ============
function MovieDetail() {
  const { id } = useParams();
  const { city, user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetch(`${API}/movies/${id}`).then(r => r.json()).then(setMovie);
  }, [id]);

  useEffect(() => {
    fetch(`${API}/theatres?city=${city}&movieId=${id}&date=${selectedDate}`)
      .then(r => r.json()).then(setTheatres);
  }, [city, id, selectedDate]);

  const submitReview = async () => {
    if (!rating) return;
    await fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ movieId: id, rating, comment })
    });
    fetch(`${API}/movies/${id}`).then(r => r.json()).then(setMovie);
    setRating(0);
    setComment('');
  };

  if (!movie) return <div className="loading">Loading...</div>;

  return (
    <div className="movie-detail">
      <div className="movie-header">
        <img 
          src={movie.poster} 
          alt={movie.name}
          onError={(e) => {
            // Fallback for broken images
            if (movie.name === 'Inception') {
              e.target.src = 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg';
            } else {
              e.target.src = 'https://via.placeholder.com/200x300?text=' + encodeURIComponent(movie.name);
            }
          }}
        />
        <div>
          <h1>{movie.name}</h1>
          <p>{movie.genre} • {movie.duration} • {movie.language}</p>
          {movie.avgRating && <p className="rating-big">⭐ {movie.avgRating}/5 ({movie.reviewCount} reviews)</p>}
        </div>
      </div>

      <div className="date-selector">
        {dates.map(d => (
          <button key={d} className={d === selectedDate ? 'active' : ''} onClick={() => setSelectedDate(d)}>
            {new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
          </button>
        ))}
      </div>

      <h3>Theatres in {city}</h3>
      {theatres.length === 0 ? (
        <p className="no-shows">No shows available for this date</p>
      ) : (
        <div className="theatres-list">
          {theatres.map(theatre => (
            <div key={theatre._id} className="theatre-card">
              <div className="theatre-info">
                <h4>{theatre.name}</h4>
                <p>{theatre.address}</p>
              </div>
              <div className="shows-times">
                {theatre.shows.map(show => (
                  <button key={show._id} className="show-time-btn" onClick={() => navigate(`/seats/${show._id}`)}>
                    {show.time}
                    <span className="price">₹{show.price}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="reviews-section">
        <h3>Reviews</h3>
        {user && (
          <div className="review-form">
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} onClick={() => setRating(s)} style={{ cursor: 'pointer', fontSize: '1.5rem' }}>
                  {s <= rating ? '⭐' : '☆'}
                </span>
              ))}
            </div>
            <textarea placeholder="Write your review..." value={comment} onChange={e => setComment(e.target.value)} />
            <button onClick={submitReview}>Submit Review</button>
          </div>
        )}
        <div className="reviews-list">
          {movie.reviews?.map(r => (
            <div key={r._id} className="review-card">
              <div className="review-header">
                <span>{r.userId?.email}</span>
                <span>{'⭐'.repeat(r.rating)}</span>
              </div>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>← Back to Movies</button>
    </div>
  );
}

// ============ SEAT SELECTION ============
function SeatSelection() {
  const { id } = useParams();
  const { user } = useAuth();
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [offerCode, setOfferCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/shows/${id}`).then(r => r.json()).then(setShow);
  }, [id]);

  const toggleSeat = (index) => {
    if (show.seats[index]) return;
    setSelectedSeats(prev => prev.includes(index) ? prev.filter(s => s !== index) : [...prev, index]);
  };

  const validateOffer = async () => {
    const amount = selectedSeats.length * show.price;
    const res = await fetch(`${API}/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ code: offerCode, amount })
    });
    const data = await res.json();
    if (res.ok) {
      setDiscount(data.discount);
      setError('');
    } else {
      setError(data.error);
      setDiscount(0);
    }
  };

  const proceedToPayment = async () => {
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ showId: id, seats: selectedSeats, offerCode: discount > 0 ? offerCode : null })
    });
    const data = await res.json();
    if (res.ok) {
      navigate('/payment', { state: { bookingId: data.bookingId, ...data, show } });
    } else {
      setError(data.error);
    }
  };

  if (!show) return <div className="loading">Loading...</div>;

  const totalAmount = selectedSeats.length * show.price - discount;

  return (
    <div className="seats-container">
      <h2>{show.movieId.name}</h2>
      <p className="show-info">{show.theatreId.name} | {show.date} | {show.time}</p>
      
      <div className="screen">SCREEN</div>
      
      <div className="seats-grid">
        {show.seats.map((booked, i) => (
          <div
            key={i}
            className={`seat ${booked ? 'booked' : ''} ${selectedSeats.includes(i) ? 'selected' : ''}`}
            onClick={() => toggleSeat(i)}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="seat-legend">
        <div className="legend-item"><div className="legend-box available"></div><span>Available</span></div>
        <div className="legend-item"><div className="legend-box selected"></div><span>Selected</span></div>
        <div className="legend-item"><div className="legend-box booked"></div><span>Booked</span></div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="booking-summary">
          <div className="offer-input">
            <input placeholder="Enter offer code" value={offerCode} onChange={e => setOfferCode(e.target.value)} />
            <button onClick={validateOffer}>Apply</button>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="price-breakdown">
            <p>Seats: {selectedSeats.map(s => s + 1).join(', ')}</p>
            <p>Price: ₹{show.price} × {selectedSeats.length} = ₹{selectedSeats.length * show.price}</p>
            {discount > 0 && <p className="discount">Discount: -₹{discount}</p>}
            <p className="total">Total: ₹{totalAmount}</p>
          </div>
          <button className="confirm-btn" onClick={proceedToPayment}>Proceed to Payment</button>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
    </div>
  );
}

// ============ PAYMENT ============
function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookingData = window.history.state?.usr;
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  if (!bookingData) return <Navigate to="/" />;

  const handlePayment = async () => {
    setProcessing(true);
    const res = await fetch(`${API}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ bookingId: bookingData.bookingId, paymentMethod })
    });
    const data = await res.json();
    setProcessing(false);
    if (data.success) {
      navigate('/confirmation', { state: data.booking });
    }
  };

  return (
    <div className="payment-container">
      <h2>Payment</h2>
      <div className="payment-summary">
        <h3>{bookingData.show.movieId.name}</h3>
        <p>{bookingData.show.theatreId.name}</p>
        <p>{bookingData.show.date} | {bookingData.show.time}</p>
        <p>Seats: {bookingData.show && bookingData.originalAmount / bookingData.show.price} seats</p>
        <hr />
        <p>Subtotal: ₹{bookingData.originalAmount}</p>
        {bookingData.discount > 0 && <p className="discount">Discount: -₹{bookingData.discount}</p>}
        <p className="total-big">Total: ₹{bookingData.totalAmount}</p>
      </div>

      <div className="payment-methods">
        <h3>Select Payment Method</h3>
        {['card', 'upi', 'netbanking', 'wallet'].map(method => (
          <label key={method} className={`payment-option ${paymentMethod === method ? 'selected' : ''}`}>
            <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={e => setPaymentMethod(e.target.value)} />
            {method === 'card' && '💳 Credit/Debit Card'}
            {method === 'upi' && '📱 UPI'}
            {method === 'netbanking' && '🏦 Net Banking'}
            {method === 'wallet' && '👛 Wallet'}
          </label>
        ))}
      </div>

      <button className="pay-btn" onClick={handlePayment} disabled={processing}>
        {processing ? 'Processing...' : `Pay ₹${bookingData.totalAmount}`}
      </button>
    </div>
  );
}

// ============ CONFIRMATION ============
function Confirmation() {
  const navigate = useNavigate();
  const booking = window.history.state?.usr;

  if (!booking) return <Navigate to="/" />;

  return (
    <div className="confirmation-container">
      <div className="checkmark">✓</div>
      <h2>Booking Confirmed!</h2>
      <div className="ticket">
        <div className="ticket-header">
          <h3>{booking.movieName}</h3>
        </div>
        <div className="ticket-body">
          <p><span>Theatre:</span> {booking.theatreName}</p>
          <p><span>Date:</span> {booking.showDate}</p>
          <p><span>Time:</span> {booking.showTime}</p>
          <p><span>Seats:</span> {booking.seats.join(', ')}</p>
          <p><span>Amount Paid:</span> ₹{booking.totalAmount}</p>
          <p><span>Booking ID:</span> {booking.id}</p>
        </div>
      </div>
      <button className="confirm-btn" onClick={() => navigate('/')}>Book More Tickets</button>
    </div>
  );
}

// ============ MY BOOKINGS ============
function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch(`${API}/bookings`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(r => r.json()).then(setBookings);
  }, [user]);

  return (
    <div className="bookings-container">
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        <div className="bookings-list">
          {bookings.map(b => (
            <div key={b._id} className="booking-card">
              <h3>{b.movieName}</h3>
              <p>{b.theatreName}</p>
              <p>{b.showDate} | {b.showTime}</p>
              <p>Seats: {b.seats.join(', ')}</p>
              <p className="amount">₹{b.totalAmount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ ADMIN PANEL ============
function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('dashboard');
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const headers = { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers }).then(r => r.json()).then(setStats);
    fetch(`${API}/movies`).then(r => r.json()).then(setMovies);
    fetch(`${API}/theatres`).then(r => r.json()).then(setTheatres);
    fetch(`${API}/offers`).then(r => r.json()).then(setOffers);
    fetch(`${API}/admin/bookings`, { headers }).then(r => r.json()).then(setBookings);
  }, []);

  const [newMovie, setNewMovie] = useState({ name: '', poster: '', genre: '', duration: '', language: '' });
  const [newTheatre, setNewTheatre] = useState({ name: '', city: '', address: '' });
  const [newOffer, setNewOffer] = useState({ code: '', description: '', discountPercent: 0, maxDiscount: 0, validFrom: '', validTo: '' });

  const addMovie = async () => {
    await fetch(`${API}/admin/movies`, { method: 'POST', headers, body: JSON.stringify(newMovie) });
    fetch(`${API}/movies`).then(r => r.json()).then(setMovies);
    setNewMovie({ name: '', poster: '', genre: '', duration: '', language: '' });
  };

  const addTheatre = async () => {
    await fetch(`${API}/admin/theatres`, { method: 'POST', headers, body: JSON.stringify(newTheatre) });
    fetch(`${API}/theatres`).then(r => r.json()).then(setTheatres);
    setNewTheatre({ name: '', city: '', address: '' });
  };

  const addOffer = async () => {
    await fetch(`${API}/admin/offers`, { method: 'POST', headers, body: JSON.stringify(newOffer) });
    fetch(`${API}/offers`).then(r => r.json()).then(setOffers);
    setNewOffer({ code: '', description: '', discountPercent: 0, maxDiscount: 0, validFrom: '', validTo: '' });
  };

  const deleteMovie = async (id) => {
    await fetch(`${API}/admin/movies/${id}`, { method: 'DELETE', headers });
    setMovies(movies.filter(m => m._id !== id));
  };

  const deleteTheatre = async (id) => {
    await fetch(`${API}/admin/theatres/${id}`, { method: 'DELETE', headers });
    setTheatres(theatres.filter(t => t._id !== id));
  };

  const deleteOffer = async (id) => {
    await fetch(`${API}/admin/offers/${id}`, { method: 'DELETE', headers });
    setOffers(offers.filter(o => o._id !== id));
  };

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>
      <div className="admin-tabs">
        {['dashboard', 'movies', 'theatres', 'offers', 'bookings'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="stats-grid">
          <div className="stat-card"><h3>{stats.totalUsers}</h3><p>Users</p></div>
          <div className="stat-card"><h3>{stats.totalBookings}</h3><p>Bookings</p></div>
          <div className="stat-card"><h3>₹{stats.totalRevenue}</h3><p>Revenue</p></div>
          <div className="stat-card"><h3>{stats.totalMovies}</h3><p>Movies</p></div>
          <div className="stat-card"><h3>{stats.totalTheatres}</h3><p>Theatres</p></div>
        </div>
      )}

      {tab === 'movies' && (
        <div className="admin-section">
          <h3>Add Movie</h3>
          <div className="admin-form">
            <input placeholder="Name" value={newMovie.name} onChange={e => setNewMovie({ ...newMovie, name: e.target.value })} />
            <input placeholder="Poster URL" value={newMovie.poster} onChange={e => setNewMovie({ ...newMovie, poster: e.target.value })} />
            <input placeholder="Genre" value={newMovie.genre} onChange={e => setNewMovie({ ...newMovie, genre: e.target.value })} />
            <input placeholder="Duration" value={newMovie.duration} onChange={e => setNewMovie({ ...newMovie, duration: e.target.value })} />
            <input placeholder="Language" value={newMovie.language} onChange={e => setNewMovie({ ...newMovie, language: e.target.value })} />
            <button onClick={addMovie}>Add Movie</button>
          </div>
          <div className="admin-list">
            {movies.map(m => (
              <div key={m._id} className="admin-item">
                <span>{m.name}</span>
                <button onClick={() => deleteMovie(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'theatres' && (
        <div className="admin-section">
          <h3>Add Theatre</h3>
          <div className="admin-form">
            <input placeholder="Name" value={newTheatre.name} onChange={e => setNewTheatre({ ...newTheatre, name: e.target.value })} />
            <input placeholder="City" value={newTheatre.city} onChange={e => setNewTheatre({ ...newTheatre, city: e.target.value })} />
            <input placeholder="Address" value={newTheatre.address} onChange={e => setNewTheatre({ ...newTheatre, address: e.target.value })} />
            <button onClick={addTheatre}>Add Theatre</button>
          </div>
          <div className="admin-list">
            {theatres.map(t => (
              <div key={t._id} className="admin-item">
                <span>{t.name} - {t.city}</span>
                <button onClick={() => deleteTheatre(t._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'offers' && (
        <div className="admin-section">
          <h3>Add Offer</h3>
          <div className="admin-form">
            <input placeholder="Code" value={newOffer.code} onChange={e => setNewOffer({ ...newOffer, code: e.target.value })} />
            <input placeholder="Description" value={newOffer.description} onChange={e => setNewOffer({ ...newOffer, description: e.target.value })} />
            <input type="number" placeholder="Discount %" value={newOffer.discountPercent} onChange={e => setNewOffer({ ...newOffer, discountPercent: +e.target.value })} />
            <input type="number" placeholder="Max Discount" value={newOffer.maxDiscount} onChange={e => setNewOffer({ ...newOffer, maxDiscount: +e.target.value })} />
            <input type="date" value={newOffer.validFrom} onChange={e => setNewOffer({ ...newOffer, validFrom: e.target.value })} />
            <input type="date" value={newOffer.validTo} onChange={e => setNewOffer({ ...newOffer, validTo: e.target.value })} />
            <button onClick={addOffer}>Add Offer</button>
          </div>
          <div className="admin-list">
            {offers.map(o => (
              <div key={o._id} className="admin-item">
                <span>{o.code} - {o.description}</span>
                <button onClick={() => deleteOffer(o._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="admin-section">
          <h3>Recent Bookings</h3>
          <div className="admin-list">
            {bookings.map(b => (
              <div key={b._id} className="admin-item booking">
                <span>{b.userId?.email} - {b.movieName} - {b.showDate} {b.showTime} - Seats: {b.seats.join(',')} - ₹{b.totalAmount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PROTECTED ROUTES ============
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

// ============ APP ============
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
            <Route path="/movie/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
            <Route path="/seats/:id" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
            <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="/confirmation" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
# UCT Supa Pool - Frontend Setup Guide

## 🎱 Frontend Features Built

I've successfully built a modern, responsive frontend for displaying player statistics with the following features:

### Key Features:
1. **Player Rankings Table** - Displays all players with their statistics
   - Rank position (with podium highlights for top 3)
   - Player name and university
   - Win rate percentage (calculated from matches won/played)
   - Total wins (highlighted badge)
   - Matches played
   - Player rating

2. **Sorting Options**
   - Sort by Win Rate (default, highest first)
   - Sort by Total Wins
   - Sort by Matches Played
   - Sort by Rating
   - Sort by Player Name (A-Z)

3. **Statistics Dashboard**
   - Total number of players
   - Total matches played (calculated from all players' match data)
   - Top player display

4. **User Experience**
   - Responsive design (works on desktop, tablet, mobile)
   - Dark theme with modern UI
   - Real-time data refresh button
   - Error handling with retry functionality
   - Loading states

### Visual Design:
- Modern gradient headers with blue/purple theme
- Hover effects on table rows
- Gold badges for win counts
- Green stat values for win rates
- Mobile-responsive table layout (converts to cards on small screens)

## 📂 Files Created

- `frontend/src/components/PlayersList.jsx` - Main player statistics component
- `frontend/src/services/api.js` - API communication service
- `frontend/src/styles/PlayersList.css` - Complete responsive styling

## 🚀 How to Run

### 1. Start the Backend
```bash
cd c:\Users\hp\poolproject
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend will start at `http://localhost:8000`

### 2. Start the Frontend
In a new terminal:
```bash
cd c:\Users\hp\poolproject\frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

### 3. Access the Application
Open your browser and go to: **http://localhost:5173**

## 🔧 Configuration

### Backend CORS
CORS is now enabled in the backend to allow the frontend to communicate with it. Allowed origins include:
- http://localhost:5173 (default Vite dev port)
- http://localhost:3000
- http://127.0.0.1:5173

### API Endpoint
The frontend communicates with the backend API at:
- Base URL: `http://localhost:8000`
- Endpoint: `/players` - retrieves all players with their statistics

## 📊 Data Structure

Each player object contains:
```json
{
  "id": 1,
  "name": "Player Name",
  "university": "UCT",
  "rating": 1000.0,
  "matches_played": 10,
  "matches_won": 7,
  "created_at": "2026-02-23T..."
}
```

**Win Rate Calculation**: `(matches_won / matches_played) * 100`

## 🎨 Styling Features

- **Dark theme** optimized for readability
- **Gradient headers** for visual appeal
- **Responsive table** that converts to mobile-friendly layout
- **Interactive elements** with hover effects
- **Color-coded statistics** for quick scanning
- **Emoji icons** for visual enhancement

## ⚙️ Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **React Router Dom** - For future routing needs
- **CSS3** - Modern styling with Grid/Flexbox

## 🧪 Troubleshooting

### "Failed to load players" Error
1. Make sure the backend is running on `http://localhost:8000`
2. Check that the backend is responding: `http://localhost:8000/health`
3. Click the "🔄 Refresh" button to retry

### CORS Issues
- The backend has been configured with CORS headers
- Both frontend and backend must be running for proper communication

### No Players Showing
1. Backend needs to have player data. Add some test data via the FastAPI docs:
   - Go to `http://localhost:8000/docs`
   - Use the `/players/` POST endpoint to create a test player
2. Then refresh the frontend

## 📱 Responsive Breakpoints

- **Desktop**: Full table layout with all columns visible
- **Tablet**: Optimized spacing
- **Mobile**: Converts to card-based layout with data labels

Enjoy exploring your pool players' statistics! 🎱

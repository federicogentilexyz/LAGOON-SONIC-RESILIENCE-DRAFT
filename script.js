// GeoJSON Data Structure
const audioLocations = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [12.3397, 45.4343] },
            "properties": {
                "id": "sanmarco",
                "name": "Piazza San Marco",
                "audio": "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
                "video": "videos/barotti3.mp4"
            }
        },
        {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [12.3359, 45.4381] },
            "properties": {
                "id": "rialto",
                "name": "Ponte di Rialto",
                "audio": "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
                "video": "videos/barotti2.mp4"
            }
        },
        {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [12.3290, 45.4260] },
            "properties": {
                "id": "canalgrande",
                "name": "Canale della Giudecca",
                "audio": "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
                "video": "videos/barotti.mp4"
            }
        }
    ]
};

// Initialize MapLibre Engine
const map = new maplibregl.Map({
    container: 'map-wrapper',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 
    center: [12.3350, 45.4300], 
    zoom: 13.5,
    pitch: 35, 
    attributionControl: false
});

// Initialize Wavesurfer Engine
const wavesurfer = WaveSurfer.create({
    container: '#waveform-container',
    waveColor: '#eeeeee',
    progressColor: '#000000',
    cursorColor: '#000000',
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    height: 60,
    cursorWidth: 2
});

// DOM Elements
const soundbar = document.getElementById('soundbar');
const playPauseBtn = document.getElementById('play-pause-btn');
const locationName = document.getElementById('current-location-name');
const timeCurrent = document.getElementById('current-time');
const timeTotal = document.getElementById('total-duration');

const videoOverlay = document.getElementById('video-overlay');
const locationVideo = document.getElementById('location-video');

let activeMarkerEl = null;

// Get the new container for the track list
const trackListContainer = document.getElementById('track-list');

// Generate Pins, Track Cards, and Bind Events
audioLocations.features.forEach(feature => {
    
    // 1. Create the Map Pin
    const el = document.createElement('div');
    el.className = 'pin';
    el.innerHTML = '<span class="pin-dot"></span>';

    new maplibregl.Marker({ element: el })
    .setLngLat(feature.geometry.coordinates)
    .addTo(map);

    // 2. Create the Track List Card
    const trackCard = document.createElement('button');
    trackCard.className = 'track-card';
    trackCard.innerHTML = `
        <span class="track-title">${feature.properties.name}</span>
        <span class="track-play-text">PLAY RECORDING</span>
    `;
    trackListContainer.appendChild(trackCard);

    // 3. Shared Interaction Logic (Runs whether you click the pin OR the list item)
    const activateLocation = async () => {
        // Reset old markers
        if (activeMarkerEl) activeMarkerEl.classList.remove('active');
        el.classList.add('active');
        activeMarkerEl = el;

        // Update UI
        locationName.innerText = feature.properties.name;
        soundbar.classList.add('active');
        playPauseBtn.innerText = "LOADING...";

        // Set Video Source
        if (feature.properties.video) {
            locationVideo.src = feature.properties.video;
        }

        // Trigger Map Animation
        map.flyTo({ 
            center: feature.geometry.coordinates, 
            zoom: 16.5, 
            speed: 1.2 
        });

        // Wait for zoom to finish before showing the video overlay and setting speed
        map.once('moveend', () => {
            if (activeMarkerEl === el) {
                videoOverlay.classList.add('active');
                
                // Safely set the playback rate right before playing
                if (feature.properties.id === 'sanmarco') {
                    locationVideo.playbackRate = 2.0;
                } else {
                    locationVideo.playbackRate = 1.0;
                }
                
                locationVideo.play();
            }
        });

        // If the user clicked from the list at the bottom, scroll them back up to the map smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Robust Promise-based audio loading to prevent getting stuck on "LOADING..."
        try {
            await wavesurfer.load(feature.properties.audio);
            
            // Only play if the user hasn't quickly clicked a different pin while loading
            if (activeMarkerEl === el) {
                playPauseBtn.innerText = "PAUSE";
                timeTotal.innerText = formatTime(wavesurfer.getDuration());
                wavesurfer.play();
            }
        } catch (error) {
            console.error("Audio failed to load:", error);
            playPauseBtn.innerText = "PLAY";
        }
    };

    // Bind the exact same logic to both the map pin and the new track card
    el.addEventListener('click', activateLocation);
    trackCard.addEventListener('click', activateLocation);
});

// Audio State Management (Removed the old 'ready' event to prevent conflicts)

wavesurfer.on('audioprocess', () => {
    timeCurrent.innerText = formatTime(wavesurfer.getCurrentTime());
});

wavesurfer.on('finish', () => {
    playPauseBtn.innerText = "REPLAY";
});

function togglePlay() {
    if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
        locationVideo.pause();
        playPauseBtn.innerText = "PLAY";
    } else {
        wavesurfer.play();
        locationVideo.play();
        playPauseBtn.innerText = "PAUSE";
    }
}

function closeSoundbar() {
    // Reset Audio
    wavesurfer.pause();
    soundbar.classList.remove('active');
    
    // Hide Video Overlay, pause, and reset speed
    videoOverlay.classList.remove('active');
    locationVideo.pause();
    locationVideo.playbackRate = 1.0;
    
    // Reset Markers
    if (activeMarkerEl) {
        activeMarkerEl.classList.remove('active');
        activeMarkerEl = null;
    }
    
    // Fly back to original overview map
    map.flyTo({ center: [12.3350, 45.4300], zoom: 13.5, pitch: 35 });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10? '0' : ''}${sec}`;
}

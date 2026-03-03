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

// Generate Pins and Bind Events
audioLocations.features.forEach(feature => {
    const el = document.createElement('div');
    el.className = 'pin';
    el.innerHTML = '<span class="pin-dot"></span>';

    new maplibregl.Marker({ element: el })
   .setLngLat(feature.geometry.coordinates)
   .addTo(map);

    el.addEventListener('click', () => {
        // Reset old markers
        if (activeMarkerEl) activeMarkerEl.classList.remove('active');
        el.classList.add('active');
        activeMarkerEl = el;

        // Update UI
        locationName.innerText = feature.properties.name;
        soundbar.classList.add('active');
        playPauseBtn.innerText = "LOADING...";

        // Load Audio and Video
        wavesurfer.load(feature.properties.audio);
        if (feature.properties.video) {
            locationVideo.src = feature.properties.video;
        }

        // Trigger Map Animation
        map.flyTo({ 
            center: feature.geometry.coordinates, 
            zoom: 16.5, 
            speed: 1.2 
        });

        // Wait for zoom to finish before showing the video overlay
        map.once('moveend', () => {
            if (activeMarkerEl === el) {
                videoOverlay.classList.add('active');
                locationVideo.play();
            }
        });
    });
});

// Audio State Management
wavesurfer.on('ready', () => {
    playPauseBtn.innerText = "PAUSE";
    timeTotal.innerText = formatTime(wavesurfer.getDuration());
    wavesurfer.play();
});

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
    
    // Hide Video Overlay and return to map
    videoOverlay.classList.remove('active');
    locationVideo.pause();
    
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

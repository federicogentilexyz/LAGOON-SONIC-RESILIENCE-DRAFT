// Hierarchical Data Structure 
const regionsData = [
    {
        id: "venice",
        name: "Venice Lagoon, Italy",
        coordinates: [45.4300, 12.3350], 
        labelPos: "label-top", 
        zoom: 13,
        subLocations: [
            { id: "v1", name: "Piazza San Marco", coords: [45.4343, 12.3397], labelPos: "label-top", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti2.mp4" },
            { id: "v2", name: "Ponte di Rialto", coords: [45.4381, 12.3359], labelPos: "label-left", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti.mp4" },
            { id: "v3", name: "Canale della Giudecca", coords: [45.4260, 12.3290], labelPos: "label-bottom", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti3.mp4" }
        ]
    },
    {
        id: "jamaica",
        name: "Portland Coast, Jamaica",
        coordinates: [18.1700, -76.4000], 
        labelPos: "label-top", 
        zoom: 12,
        subLocations: [
            { id: "j1", name: "Blue Lagoon", coords: [18.1725, -76.3861], labelPos: "label-bottom", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti3.mp4" },
            { id: "j2", name: "Boston Bay", coords: [18.1561, -76.3550], labelPos: "label-right", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti.mp4" },
            { id: "j3", name: "Frenchman's Cove", coords: [18.1764, -76.3980], labelPos: "label-top", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti2.mp4" }
        ]
    },
    {
        id: "trinidad",
        name: "Caroni Swamp, Trinidad & Tobago",
        coordinates: [10.5950, -61.4550],
        labelPos: "label-bottom", 
        zoom: 13,
        subLocations: [
            { id: "t1", name: "Bird Sanctuary", coords: [10.5900, -61.4650], labelPos: "label-top", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti.mp4" },
            { id: "t2", name: "Mangrove Boardwalk", coords: [10.6000, -61.4500], labelPos: "label-bottom", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti3.mp4" },
            { id: "t3", name: "River Mouth", coords: [10.5850, -61.4700], labelPos: "label-right", audio: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg", video: "videos/barotti2.mp4" }
        ]
    }
];

// FIX: Strictly define both Vertical and Horizontal edges of a single Earth instance
const worldBounds = [
    [-60, -180], // [South Limit, Exact West Limit]
    [75, 180]    // [North Limit, Exact East Limit]
];

// 1. Initialize Leaflet Map 
const map = L.map('map-wrapper', {
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: true,        
    touchZoom: false,      
    doubleClickZoom: false,
    boxZoom: false,        
    keyboard: false,
    maxBounds: worldBounds,    // Locks the map inside one single globe
    maxBoundsViscosity: 1.0,   // Solid wall feel
    minZoom: 2                 
}).setView([20.0, -30.0], 2);

// FIX: Added noWrap: true to stop the tiles from endlessly repeating
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    noWrap: true // Prevents infinite horizontal repetition
}).addTo(map);

const markerLayerGroup = L.layerGroup().addTo(map);

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

const soundbar = document.getElementById('soundbar');
const playPauseBtn = document.getElementById('play-pause-btn');
const locationName = document.getElementById('current-location-name');
const timeCurrent = document.getElementById('current-time');
const timeTotal = document.getElementById('total-duration');
const videoOverlay = document.getElementById('video-overlay');
const locationVideo = document.getElementById('location-video');
const trackListContainer = document.getElementById('track-list');
const galleryTitle = document.getElementById('gallery-title');
const backToGlobalBtn = document.getElementById('back-to-global-btn');

const mainHeader = document.getElementById('main-header');

let activeMarkerDiv = null;
let currentActiveRegion = null;

function loadGlobalView() {
    wavesurfer.pause();
    soundbar.classList.remove('active');
    videoOverlay.classList.remove('active');
    locationVideo.pause();
    
    if (activeMarkerDiv) {
        activeMarkerDiv.classList.remove('active');
        activeMarkerDiv = null;
    }

    markerLayerGroup.clearLayers();
    currentActiveRegion = null;
    trackListContainer.innerHTML = '';
    galleryTitle.innerText = 'GLOBAL LOCATIONS';
    backToGlobalBtn.classList.remove('active');
    
    mainHeader.classList.remove('hidden-header');

    map.flyTo([20.0, -30.0], 2, { duration: 1.5 });

    regionsData.forEach(region => {
        const icon = L.divIcon({
            className: 'custom-leaflet-icon',
            html: `
                <div class="pin region-pin">
                    <span class="pin-dot"></span>
                    <span class="smart-label ${region.labelPos}">${region.name}</span>
                </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 30] 
        });

        const marker = L.marker(region.coordinates, { icon: icon }).addTo(markerLayerGroup);

        const card = document.createElement('button');
        card.className = 'track-card';
        card.innerHTML = `
            <span class="track-title">${region.name}</span>
            <span class="track-play-text">EXPLORE REGION</span>
        `;
        trackListContainer.appendChild(card);

        const openRegion = () => loadRegionView(region);
        marker.on('click', openRegion);
        card.addEventListener('click', () => {
            openRegion();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function loadRegionView(region) {
    wavesurfer.pause();
    soundbar.classList.remove('active');
    videoOverlay.classList.remove('active');
    locationVideo.pause();

    markerLayerGroup.clearLayers();
    currentActiveRegion = region;
    trackListContainer.innerHTML = '';
    galleryTitle.innerText = `SOUND ARCHIVE: ${region.name.toUpperCase()}`;
    backToGlobalBtn.classList.add('active');

    mainHeader.classList.add('hidden-header');

    map.flyTo(region.coordinates, region.zoom, { duration: 1.2 });

    region.subLocations.forEach(subLoc => {
        const icon = L.divIcon({
            className: 'custom-leaflet-icon',
            html: `
                <div class="pin sub-pin">
                    <span class="pin-dot"></span>
                    <span class="smart-label ${subLoc.labelPos || 'label-top'}">${subLoc.name}</span>
                </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });

        const marker = L.marker(subLoc.coords, { icon: icon }).addTo(markerLayerGroup);

        const card = document.createElement('button');
        card.className = 'track-card';
        card.innerHTML = `
            <span class="track-title">${subLoc.name}</span>
            <span class="track-play-text">PLAY RECORDING</span>
        `;
        trackListContainer.appendChild(card);

        const playMedia = () => activateSubLocation(subLoc, marker);
        marker.on('click', playMedia);
        card.addEventListener('click', () => {
            playMedia();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

async function activateSubLocation(subLoc, markerInstance) {
    if (activeMarkerDiv) {
        activeMarkerDiv.classList.remove('active');
    }
    activeMarkerDiv = markerInstance._icon.querySelector('.pin');
    activeMarkerDiv.classList.add('active');

    locationName.innerText = subLoc.name;
    soundbar.classList.add('active');
    playPauseBtn.innerText = "LOADING...";

    if (subLoc.video) {
        locationVideo.src = subLoc.video;
    }

    map.flyTo(subLoc.coords, 16, { duration: 1.2 });

    map.once('moveend', () => {
        videoOverlay.classList.add('active');
        locationVideo.play();
    });

    try {
        await wavesurfer.load(subLoc.audio);
        playPauseBtn.innerText = "PAUSE";
        timeTotal.innerText = formatTime(wavesurfer.getDuration());
        wavesurfer.play();
    } catch (error) {
        console.error("Audio failed to load:", error);
        playPauseBtn.innerText = "PLAY";
    }
}

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
    wavesurfer.pause();
    soundbar.classList.remove('active');
    videoOverlay.classList.remove('active');
    locationVideo.pause();
    
    if (activeMarkerDiv) {
        activeMarkerDiv.classList.remove('active');
        activeMarkerDiv = null;
    }
    
    if (currentActiveRegion) {
        map.flyTo(currentActiveRegion.coordinates, currentActiveRegion.zoom, { duration: 1 });
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10? '0' : ''}${sec}`;
}

loadGlobalView();

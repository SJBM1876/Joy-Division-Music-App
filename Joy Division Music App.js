const playlistSongs = document.getElementById('playlist-songs');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const nextButton = document.getElementById("next");
const previousButton = document.getElementById("previous");
const shuffleButton = document.getElementById("shuffle");

const clientId = '806e0fc316a14bf7bdf308645fc70e62';
const clientSecret = '8ab7c78900f94bccb20431fa4a29a417';
const playlistId = '7bR68JZoDtRBothJq4hoKn';

let accessToken;
const audio = new Audio();
let userData = {
    songs: [],
    currentSong: null,
    songCurrentTime: 0,
};

async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function getPlaylistTracks() {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });
    const data = await response.json();
    return data.items.map((item, index) => ({
        id: index,
        title: item.track.name,
        artist: item.track.artists[0].name,
        duration: millisToMinutesAndSeconds(item.track.duration_ms),
        src: item.track.preview_url
    }));
}

function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

async function init() {
    accessToken = await getAccessToken();
    userData.songs = await getPlaylistTracks();
    renderSongs(userData.songs);
    setPlayButtonAccessibleText();
}

function playSong(id) {
    const song = userData?.songs.find(song => song.id === id);
    audio.src = song.src;
    audio.title = song.title;

    if (userData?.currentSong === null || userData?.currentSong.id !== song.id) {
        audio.currentTime = 0;
    } else {
        audio.currentTime = userData.songCurrentTime;
    }

    userData.currentSong = song;
    playButton.classList.add("playing");

    highlightCurrentSong();
    setPlayerDisplay();
    setPlayButtonAccessibleText();
    audio.play();
}

function pauseSong() {
    userData.songCurrentTime = audio.currentTime;
    playButton.classList.remove("playing");
    audio.pause();
}

function playNextSong() {
    if (userData?.currentSong === null) {
        playSong(userData?.songs[0].id);
    } else {
        const currentSongIndex = getCurrentSongIndex();
        const nextSong = userData?.songs[currentSongIndex + 1];

        if (nextSong) {
            playSong(nextSong.id);
        }
    }
}

function playPreviousSong() {
    if (userData?.currentSong === null) return;

    const currentSongIndex = getCurrentSongIndex();
    const previousSong = userData?.songs[currentSongIndex - 1];

    if (previousSong) {
        playSong(previousSong.id);
    }
}

function shuffle() {
    userData?.songs.sort(() => Math.random() - 0.5);
    userData.currentSong = null;
    userData.songCurrentTime = 0;

    renderSongs(userData?.songs);
    pauseSong();
    setPlayerDisplay();
    setPlayButtonAccessibleText();
}

function deleteSong(id) {
    if (userData?.currentSong?.id === id) {
        userData.currentSong = null;
        userData.songCurrentTime = 0;
        pauseSong();
        setPlayerDisplay();
    }

    userData.songs = userData?.songs.filter(song => song.id !== id);
    renderSongs(userData?.songs);
    highlightCurrentSong();
    setPlayButtonAccessibleText();

    if (userData.songs.length === 0) {
        const resetButton = document.createElement("button");
        resetButton.id = "reset";
        resetButton.ariaLabel = "Reset playlist";
        resetButton.textContent = "Reset Playlist";

        playlistSongs.appendChild(resetButton);

        resetButton.addEventListener("click", () => {
            init();
            resetButton.remove();
        });
    }
}

function setPlayerDisplay() {
    const playingSong = document.getElementById("player-song-title");
    const songArtist = document.getElementById("player-song-artist");
    const currentTitle = userData?.currentSong?.title || "";
    const currentArtist = userData?.currentSong?.artist || "";

    playingSong.textContent = currentTitle;
    songArtist.textContent = currentArtist;
}

function highlightCurrentSong() {
    const playlistSongElements = document.querySelectorAll(".playlist-song");
    const songToHighlight = document.getElementById(`song-${userData?.currentSong?.id}`);

    playlistSongElements.forEach(songEl => {
        songEl.removeAttribute("aria-current");
    });

    if (songToHighlight) songToHighlight.setAttribute("aria-current", "true");
}

function renderSongs(array) {
    const songsHTML = array.map(song => `
        <li id="song-${song.id}" class="playlist-song">
            <button class="playlist-song-info" onclick="playSong(${song.id})">
                <span class="playlist-song-title">${song.title}</span>
                <span class="playlist-song-artist">${song.artist}</span>
                <span class="playlist-song-duration">${song.duration}</span>
            </button>
            <button onclick="deleteSong(${song.id})" class="playlist-song-delete" aria-label="Delete ${song.title}">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="8" fill="#4d4d62"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.32587 5.18571C5.7107 4.90301 6.28333 4.94814 6.60485 5.28651L8 6.75478L9.39515 5.28651C9.71667 4.94814 10.2893 4.90301 10.6741 5.18571C11.059 5.4684 11.1103 5.97188 10.7888 6.31026L9.1832 7.99999L10.7888 9.68974C11.1103 10.0281 11.059 10.5316 10.6741 10.8143C10.2893 11.097 9.71667 11.0519 9.39515 10.7135L8 9.24521L6.60485 10.7135C6.28333 11.0519 5.7107 11.097 5.32587 10.8143C4.94102 10.5316 4.88969 10.0281 5.21121 9.68974L6.8168 7.99999L5.21122 6.31026C4.8897 5.97188 4.94102 5.4684 5.32587 5.18571Z" fill="white"/>
                </svg>
            </button>
        </li>
    `).join("");

    playlistSongs.innerHTML = songsHTML;
}

function setPlayButtonAccessibleText() {
    const song = userData?.currentSong || userData?.songs[0];
    playButton.setAttribute(
        "aria-label",
        song?.title ? `Play ${song.title}` : "Play"
    );
}

function getCurrentSongIndex() {
    return userData?.songs.indexOf(userData.currentSong);
}

playButton.addEventListener("click", () => {
    if (userData?.currentSong === null) {
        playSong(userData?.songs[0].id);
    } else {
        playSong(userData?.currentSong.id);
    }
});

pauseButton.addEventListener("click", pauseSong);
nextButton.addEventListener("click", playNextSong);
previousButton.addEventListener("click", playPreviousSong);
shuffleButton.addEventListener("click", shuffle);

audio.addEventListener("ended", () => {
    const currentSongIndex = getCurrentSongIndex();
    const nextSongExists = userData?.songs[currentSongIndex + 1] !== undefined;

    if (nextSongExists) {
        playNextSong();
    } else {
        userData.currentSong = null;
        userData.songCurrentTime = 0;
        pauseSong();
        setPlayerDisplay();
        highlightCurrentSong();
        setPlayButtonAccessibleText();
    }
});

init();

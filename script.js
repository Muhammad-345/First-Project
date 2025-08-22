// main.js (directory listening commented out, static JSON/array songs appended)
// Last updated: directory listening commented + static songsData added
console.log('Lets Write JavaScript');

/* =====================================================
   DIRECTORY LISTING (COMMENTED OUT)
   Many static hosts (Netlify/Vercel) won't allow directory
   listing. Keep this commented for reference if you ever
   run a local server that exposes the folder listing.
===================================================== */
/*
async function getsongs() {
    try {
        const a = await fetch("Songs/");
        const respose = await a.text();
        const div = document.createElement("div");
        div.innerHTML = respose;
        const as = Array.from(div.getElementsByTagName("a"));

        const songs = [];
        as.forEach(link => {
          if (!link.href) return;
          if (link.href.toLowerCase().endsWith('.mp3')) {
            const parts = link.href.split('/Songs/');
            const filename = parts.length > 1 ? parts.pop() : null;
            if (filename && filename.trim() !== '') {
              songs.push(filename);
            }
          }
        });

        return songs;
    } catch (err) {
        console.warn('getsongs() failed (directory listing may not be available):', err);
        return [];
    }
}
*/

/* === STATIC SONGS (JSON/ARRAY) ===
   Put your files here. Each object should include `file`.
   Optional fields: title, artist, image (relative path).
   - file: exact filename inside Songs/ (case-sensitive on many hosts!)
   - metaKey (optional): key to use in songMeta; defaults to filename base
*/
const songsData = [
    { file: "Alan Walker II.mp3", title: "Alan Walker II", artist: "Alan Walker, Ava Max", image: "Songs/Song Images/Alan%20Walker%20II.jpeg" },
    { file: "Vincenzo OST.mp3", title: "Vincenzo OST", artist: "Choi Sung Hoon, John Park", image: "Songs/Song Images/Vincenzo%20OST.jpeg" },
    { file: "Arabic Song.mp3", title: "Arabic Song", artist: "Balti, Ahmed Hamouda" },
    { file: "Asma ul Husna.mp3", title: "Asma ul Husna", artist: "Saadya Batool, Zainab Imran" },
    { file: "Humne Aankhon Se Dekha Nahi Hai Magar.mp3", title: "Humne Aankhon Se Dekha Nahi Hai Magar", artist: "Ahemad Razvi, Tatheer Fatima" },
    { file: "Mustafa Mustafa.mp3", title: "Mustafa Mustafa", artist: "Mohammad Seddiq, Hussain Raza" },
    { file: "Rahman ya Rahman.mp3", title: "Rahman ya Rahman", artist: "Ayisha Abdul Basith, Misary Alafasy" },
    { file: "يا نبي سلام عليك.mp3", title: "يا نبي سلام عليك", artist: "Maher Zain" },
    { file: "Arabic Remix.mp3", title: "Arabic Remix", artist: "Najwa Farouk" }
];
/* === END STATIC SONGS === */

let playlist = [];
const audioPlayer = new Audio();
let currentSongIndex = -1;
let shuffleMode = false;
let repeatMode = false;

/* === INSERT: song metadata map (edit/add songs & artists here)
   Keys MUST match the file base name (filename without .mp3)
   If songsData includes title/artist/image those will be merged into songMeta automatically.
*/
const songMeta = {
    "Alan Walker II": {
      title: "Alan Walker II",
      artist: "Alan Walker, Ava Max",
      image: "Songs/Song Images/Alan%20Walker%20II.jpeg"
    },
    "Vincenzo OST": {
      title: "Vincenzo OST",
      artist: "Choi Sung Hoon, John Park",
      image: "Songs/Song Images/Vincenzo%20OST.jpeg"
    },
    "Arabic Song": {
      title: "Arabic Song",
      artist: "Balti, Ahmed Hamouda"
    },
    "Asma ul Husna": {
      title: "Asma ul Husna",
      artist: "Saadya Batool, Zainab Imran"
    },
    "Humne Aankhon Se Dekha Nahi Hai Magar": {
        title: "Humne Aankhon Se Dekha Nahi Hai Magar",
        artist: "Ahemad Razvi, Tatheer Fatima"
    },
    "Mustafa Mustafa": {
        title: "Mustafa Mustafa",
        artist: "Mohammad Seddiq, Hussain Raza"
    },
    "Rahman ya Rahman": {
        title: "Rahman ya Rahman",
        artist: "Ayisha Abdul Basith, Misary Alafasy"
    },
    "يا نبي سلام عليك": {
        title: "يا نبي سلام عليك",
        artist: "Maher Zain"
    },
    "Arabic Remix": {
        title: "Arabic Remix",
        artist: "Najwa Farouk"
    }
};
/* === END INSERT === */

/* =========================
   Playback & UI functions
   ========================= */

function playSongAtIndex(index) {
    if (!playlist || playlist.length === 0) return;
    if (index < 0 || index >= playlist.length) return;

    currentSongIndex = index;
    const filename = playlist[index];

    /* ----------------- OLD (commented) -----------------
    // This approach (if you used preload="none" + waiting) can cause the browser
    // or server to delay playback until enough is downloaded:
    // audioPlayer.src = `Songs/${filename}`;
    // audioPlayer.play().catch(err => console.error('Playback error:', err));
    --------------------------------------------------- */

    // ---------------- NEW: aggressive/robust start ----------------
    // Reset player state
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    // Set source and let browser fetch metadata (not "none")
    audioPlayer.src = `Songs/${filename}`;
    // metadata tells browser to fetch headers and minimal initial data for quick start
    audioPlayer.preload = "metadata";
    // call load() to ensure the element updates internal state
    try { audioPlayer.load(); } catch (e) { /* ignore if not needed */ }

    // We try to play immediately. If browser blocks or buffering is needed,
    // fallback handlers will attempt again as soon as playback is possible.
    let didStart = false;
    function startedPlayback() {
        didStart = true;
        cleanup();
    }

    // Named handlers so we can remove them cleanly
    function onCanPlay() {
        // canplay = there is enough data to start playback
        if (!didStart) {
            audioPlayer.play().then(startedPlayback).catch((err) => {
                // Not fatal: try again later via other handlers/timeouts
                console.warn('play() rejected on canplay:', err);
            });
        }
    }
    function onCanPlayThrough() {
        // canplaythrough = likely enough data to play through without buffering
        if (!didStart) {
            audioPlayer.play().then(startedPlayback).catch((err) => {
                console.warn('play() rejected on canplaythrough:', err);
            });
        }
    }

    // Add fallback timeout: if nothing started in X ms, try calling play() again.
    const FALLBACK_MS = 2500;
    let fallbackTimeout = setTimeout(() => {
        if (!didStart) {
            audioPlayer.play().then(startedPlayback).catch(err => {
                console.warn('play() rejected by fallback timeout:', err);
            });
        }
    }, FALLBACK_MS);

    // Cleanup helper
    function cleanup() {
        audioPlayer.removeEventListener('canplay', onCanPlay);
        audioPlayer.removeEventListener('canplaythrough', onCanPlayThrough);
        clearTimeout(fallbackTimeout);
    }

    // Attach handlers (once semantics handled by cleanup)
    audioPlayer.addEventListener('canplay', onCanPlay);
    audioPlayer.addEventListener('canplaythrough', onCanPlayThrough);

    // Immediately attempt to play (best effort). Browser may reject due to autoplay policy;
    // if so the promise rejection is caught and fallbacks will retry when ready.
    audioPlayer.play().then(startedPlayback).catch(err => {
        // Not fatal — we'll rely on canplay / canplaythrough / fallback timeout
        console.warn('Immediate play() call rejected (will retry via handlers):', err);
    });

    // ---------------- METADATA + UI (unchanged) ----------------
    const decoded = decodeURIComponent(filename);
    const baseName = decoded.replace(/\.[^/.]+$/, '');

    const defaultImg = 'Songs/Song Images/default.jpeg';
    const meta = (songMeta && songMeta[baseName]) ? songMeta[baseName] : {
        title: baseName,
        artist: 'Unknown Artist',
        image: defaultImg
    };

    const imagePath = meta.image || `Songs/Song Images/${encodeURIComponent(baseName)}.jpeg`;
    meta.image = imagePath;

    // update UI immediately (so user sees NowPlaying even if audio is still buffering)
    updateNowPlaying(meta);

    // mark playing card visually
    document.querySelectorAll('.song').forEach((el, i) => {
        el.classList.toggle('playing', i === index);
    });
}


/* updateNowPlaying - updates right panel and footer */
function updateNowPlaying(song) {
    if (!song) return;
    const nowPlaying = document.querySelector(".NowPlaying");
    const rightSection = document.querySelector(".right");

    if (nowPlaying && rightSection) {
        nowPlaying.classList.add("active");
        rightSection.classList.add("shrink");
    }

    const titleEl = document.querySelector(".NowPlaying .title");
    if (titleEl) titleEl.textContent = song.title || '';

    const songnameEl = document.querySelector(".NowPlaying .songname");
    if (songnameEl) songnameEl.textContent = song.title || '';

    const artistsNamesEl = document.querySelector(".NowPlaying .artists-names");
    if (artistsNamesEl) {
        if (Array.isArray(song.artist)) {
            artistsNamesEl.innerHTML = song.artist.map(a => `<div>${a}</div>`).join('');
        } else {
            if (typeof song.artist === 'string' && song.artist.includes(',')) {
                artistsNamesEl.innerHTML = song.artist.split(',').map(s => `<div>${s.trim()}</div>`).join('');
            } else {
                artistsNamesEl.textContent = song.artist || '';
            }
        }
    }

    const nowImg = document.querySelector(".NowPlaying .image img");
    const defaultImg = 'Songs/Song Images/default.jpeg';
    if (nowImg) {
        const pre = new Image();
        pre.onload = () => { nowImg.src = song.image || defaultImg; };
        pre.onerror = () => { nowImg.src = defaultImg; };
        pre.src = song.image || defaultImg;
    }

    const footerInfo = document.querySelector("footer .songinfo");
    if (footerInfo) {
        footerInfo.innerHTML = `
            <img src="${song.image || defaultImg}" width="48" height="48" style="border-radius:6px; object-fit:cover;">
            <div class="footer-details">
                <div class="footer-title">${song.title || ''}</div>
                <div class="footer-artist">${Array.isArray(song.artist) ? song.artist.join(', ') : (song.artist || '')}</div>
            </div>
        `;
    }

    // make the playing icon green if present
    const playIcon = document.querySelector('.othercontrols .toggle-now-playing, .othercontrols img[src*="playing.svg"]');
    if (playIcon) playIcon.classList.add('active');
}

/* Build song cards from playlist */
function buildSongCards(containerEl) {
    const defaultImg = 'Songs/Song Images/default.jpeg';

    function setImageWithFallback(imgEl, baseName) {
        imgEl.src = `Songs/Song Images/${encodeURIComponent(baseName)}.jpeg`;
        imgEl.dataset.attempt = 'jpeg';

        imgEl.onerror = function () {
            if (imgEl.dataset.attempt === 'jpeg') {
                imgEl.dataset.attempt = 'jpg';
                imgEl.onerror = null;
                imgEl.src = `Songs/Song Images/${encodeURIComponent(baseName)}.jpg`;

                imgEl.onerror = function () {
                    imgEl.onerror = null;
                    imgEl.src = defaultImg;
                };
            } else {
                imgEl.onerror = null;
                imgEl.src = defaultImg;
            }
        };
    }

    playlist.forEach((songFile, index) => {
        if (!songFile) return;

        const decoded = decodeURIComponent(songFile);
        const baseName = decoded.replace(/\.[^/.]+$/, '');

        const songDiv = document.createElement('div');
        songDiv.classList.add('trending-songs', 'song', 'flex');
        songDiv.setAttribute('data-song', songFile);

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('song-image-container');

        const imgEl = document.createElement('img');
        imgEl.classList.add('selfcenter');
        imgEl.alt = baseName;

        const overlay = document.createElement('div');
        overlay.classList.add('play-button-overlay');
        overlay.innerHTML = `<img src="Recources/play.svg" class="play-icon" alt="Play Icon">`;

        imgContainer.appendChild(imgEl);
        imgContainer.appendChild(overlay);

        const titleEl = document.createElement('h2');
        titleEl.classList.add('songname', 'cwhite', 'F16px');

        const artistEl = document.createElement('p');
        artistEl.classList.add('cb3b3b3');

        const meta = (typeof songMeta !== 'undefined' && songMeta[baseName]) ? songMeta[baseName] : null;

        titleEl.textContent = (meta && meta.title) ? meta.title : baseName;
        artistEl.textContent = (meta && meta.artist) ? (Array.isArray(meta.artist) ? meta.artist.join(', ') : meta.artist) : 'Unknown Artist';

        if (meta && meta.image) {
            imgEl.src = meta.image;
            imgEl.onerror = () => {
                imgEl.onerror = null;
                setImageWithFallback(imgEl, baseName);
            };
        } else {
            setImageWithFallback(imgEl, baseName);
        }

        songDiv.appendChild(imgContainer);
        songDiv.appendChild(titleEl);
        songDiv.appendChild(artistEl);

        containerEl.appendChild(songDiv);

        songDiv.addEventListener('click', () => {
            playSongAtIndex(index);
        });
    });
}

/* === Popular Artists builder (unchanged) === */
function buildPopularArtists() {
    const artistList = [
        "Alan Walker",
        "Arijit Singh",
        "Atif Aslam",
        "Karan Aujla",
        "Pritam",
        "Shubh",
        "Anuv Jain"
    ];

    const artistLinks = {
        "Alan Walker": "https://en.wikipedia.org/wiki/Alan_Walker",
        "Arijit Singh": "https://en.wikipedia.org/wiki/Arijit_Singh",
        "Atif Aslam": "https://en.wikipedia.org/wiki/Atif_Aslam",
        "Karan Aujla": "https://en.wikipedia.org/wiki/Karan_Aujla",
        "Pritam": "https://en.wikipedia.org/wiki/Pritam_(composer)",
        "Shubh": "https://en.wikipedia.org/wiki/Shubh",
        "Anuv Jain": "https://en.wikipedia.org/wiki/Anuv_Jain"
    };

    const container = document.querySelector('.popular-artists');
    if (!container) {
        console.warn('buildPopularArtists: .popular-artists container not found');
        return;
    }

    const scrollControls = container.querySelector('.scroll-controls');
    container.innerHTML = '';
    if (scrollControls) container.appendChild(scrollControls);

    const cardsWrapper = document.createElement('div');
    cardsWrapper.className = 'popular-artists-cards flex';
    cardsWrapper.style.display = 'flex';
    cardsWrapper.style.gap = '12px';
    cardsWrapper.style.overflowX = 'auto';
    cardsWrapper.style.padding = '12px 0';
    cardsWrapper.style.alignItems = 'flex-start';
    cardsWrapper.style.scrollBehavior = 'smooth';

    const defaultImg = 'artist-images/default.jpeg';

    function getArtistLink(name) {
        if (artistLinks[name]) return artistLinks[name];
        return 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(name);
    }

    artistList.forEach((artistName) => {
        const encoded = encodeURIComponent(artistName);
        const imgPath = `artist-images/${encoded}.jpeg`;

        const anchor = document.createElement('a');
        anchor.href = getArtistLink(artistName);
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.className = 'artist-link';
        anchor.style.textDecoration = 'none';
        anchor.style.color = 'inherit';
        anchor.setAttribute('aria-label', `Open ${artistName} profile`);

        const about = document.createElement('div');
        about.classList.add('about-artist', 'song', 'flex');
        about.style.flexDirection = 'column';
        about.style.width = '178px';
        about.style.height = '255px';
        about.style.justifyContent = 'center';
        about.style.alignItems = 'center';
        about.style.textAlign = 'center';
        about.style.padding = '16px';
        about.style.borderRadius = '8px';
        about.setAttribute('data-artist', artistName);

        const imgWrap = document.createElement('div');
        imgWrap.className = 'artist-image';
        const img = document.createElement('img');
        img.className = 'bradius50';
        img.width = 150;
        img.alt = artistName;
        img.src = imgPath;

        img.onerror = function() {
            img.onerror = null;
            img.src = defaultImg;
        };

        imgWrap.appendChild(img);

        const nameEl = document.createElement('div');
        nameEl.className = 'artist-name cwhite';
        nameEl.textContent = artistName;
        nameEl.style.margin = '7px';
        nameEl.style.fontSize = '20px';

        const profEl = document.createElement('div');
        profEl.className = 'profession cb3b3b3 fSizelarge';
        profEl.textContent = 'Artist';

        about.appendChild(imgWrap);
        about.appendChild(nameEl);
        about.appendChild(profEl);

        anchor.appendChild(about);
        cardsWrapper.appendChild(anchor);
    });

    container.appendChild(cardsWrapper);

    const leftBtn = container.querySelector('.scroll-btn.left-scroll');
    const rightBtn = container.querySelector('.scroll-btn.right-scroll');

    if (leftBtn && rightBtn) {
        const scrollAmount = 400;
        leftBtn.addEventListener('click', () => {
            cardsWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        rightBtn.addEventListener('click', () => {
            cardsWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        function updateArtistScrollButtons() {
            const visible = Math.ceil(cardsWrapper.clientWidth);
            const total = Math.floor(cardsWrapper.scrollWidth);
            const isScrollable = total > visible + 10;
            const isAtStart = cardsWrapper.scrollLeft <= 1;
            const isAtEnd = cardsWrapper.scrollLeft + visible >= total - 1;

            if (!isScrollable) {
                leftBtn.classList.remove('enabled');
                rightBtn.classList.remove('enabled');
                return;
            }
            if (isAtStart) leftBtn.classList.remove('enabled'); else leftBtn.classList.add('enabled');
            if (isAtEnd) rightBtn.classList.remove('enabled'); else rightBtn.classList.add('enabled');
        }

        cardsWrapper.addEventListener('scroll', updateArtistScrollButtons);
        setTimeout(updateArtistScrollButtons, 50);
    }
}

/* Update NowPlaying UI helper (keeps compatibility) */
function updateNowPlayingUI(baseName) {
    const meta = (songMeta && songMeta[baseName]) ? songMeta[baseName] : null;
    const titleText = (meta && meta.title) ? meta.title : baseName;
    const artists = (meta && meta.artist) ? meta.artist : 'Unknown Artist';
    const imagePath = (meta && meta.image) ? meta.image : `Songs/Song Images/${encodeURIComponent(baseName)}.jpeg`;
    const defaultImg = 'Songs/Song Images/default.jpeg';

    const nowTitle = document.querySelector('.NowPlaying .title');
    if (nowTitle) nowTitle.textContent = titleText;

    const creditsEl = document.querySelector('.NowPlaying .credits');
    if (creditsEl) creditsEl.textContent = artists;

    const nowImgEl = document.querySelector('.NowPlaying .image img');
    if (nowImgEl) {
        const pre = new Image();
        pre.onload = () => { nowImgEl.src = imagePath; };
        pre.onerror = () => { nowImgEl.src = defaultImg; };
        pre.src = imagePath;
    }
}

/* Update footer song info (if used elsewhere) */
function updateSongInfo(songName, artistName, imagePath) {
    const songInfoEl = document.querySelector('.songinfo');
    const defaultImg = 'Songs/Song Images/default.jpeg';
    
    if (!songInfoEl) {
        console.warn('updateSongInfo: No .songinfo element found');
        return;
    }
    
    songInfoEl.innerHTML = '';
    
    const imageEl = document.createElement('div');
    imageEl.className = 'song-image';
    imageEl.style.cssText = `
        width: 48px; 
        height: 48px; 
        background-size: cover; 
        background-position: center; 
        background-repeat: no-repeat;
        border-radius: 4px;
        flex-shrink: 0;
    `;
    
    const textContainer = document.createElement('div');
    textContainer.className = 'song-text-info';
    textContainer.style.cssText = 'margin-left: 10px; display: flex; flex-direction: column;';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'song-title';
    titleEl.textContent = songName || '';
    titleEl.style.cssText = 'font-weight: bold; color: white; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;';
    
    const artistEl = document.createElement('div');
    artistEl.className = 'song-artist';
    artistEl.textContent = artistName || '';
    artistEl.style.cssText = 'color: #b3b3b3; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
    
    textContainer.appendChild(titleEl);
    textContainer.appendChild(artistEl);
    songInfoEl.appendChild(imageEl);
    songInfoEl.appendChild(textContainer);
    
    let safePath;
    try {
        const url = new URL(imagePath, window.location.origin);
        safePath = url.href;
    } catch (err) {
        const parts = imagePath.split('/');
        const last = encodeURIComponent(parts.pop());
        safePath = parts.concat(last).join('/');
    }
    
    const pre = new Image();
    pre.onload = () => {
        imageEl.style.backgroundImage = `url("${safePath}")`;
    };
    pre.onerror = () => {
        console.warn('updateSongInfo: song image failed to load, using default:', safePath);
        imageEl.style.backgroundImage = `url("${defaultImg}")`;
    };
    pre.src = safePath;
}

/* Setup footer controls (seekbar/volume/play controls) */
function setupFooterControls() {
    const playPauseBtn = document.querySelector('.songcontrols img[src*="pause.svg"], .songcontrols img[src*="play.svg"]');
    const nextBtn = document.querySelector('.songcontrols img[src*="forward.svg"]');
    const prevBtn = document.querySelector('.songcontrols img[src*="rewind.svg"]');
    const shuffleBtn = document.querySelector('.songcontrols img[src*="shuffle.svg"]');
    const repeatBtn = document.querySelector('.songcontrols img[src*="repeat.svg"]');

    const seekbar = document.querySelector('.seekbar');
    if (!seekbar) {
        console.warn('No .seekbar element found in the footer.');
        return;
    }

    let seekProgress = seekbar.querySelector('.seek-progress');
    let seekCircle = seekbar.querySelector('.seek-circle');
    let seekTime = seekbar.querySelector('.seek-time');

    if (!seekProgress) {
        seekProgress = document.createElement('div');
        seekProgress.className = 'seek-progress';
        seekbar.appendChild(seekProgress);
    }
    if (!seekCircle) {
        seekCircle = document.createElement('div');
        seekCircle.className = 'seek-circle';
        seekbar.appendChild(seekCircle);
    }
    if (!seekTime) {
        seekTime = document.createElement('div');
        seekTime.className = 'seek-time';
        seekbar.appendChild(seekTime);
    }

    function formatTime(sec) {
        if (!isFinite(sec)) return '0:00';
        const s = Math.floor(sec % 60);
        const m = Math.floor(sec / 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function setPlayIcon(isPlaying) {
        if (!playPauseBtn) return;
        const playPath = 'Recources/play.svg';
        const pausePath = 'Recources/pause.svg';
        playPauseBtn.src = isPlaying ? pausePath : playPath;
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (!audioPlayer.src) {
                if (playlist.length) {
                    const idx = currentSongIndex >= 0 ? currentSongIndex : 0;
                    playSongAtIndex(idx);
                    return;
                } else return;
            }
            if (audioPlayer.paused) {
                audioPlayer.play().catch(err => console.error('Play failed:', err));
            } else {
                audioPlayer.pause();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!playlist.length) return;
            if (shuffleMode) {
                const randomIndex = Math.floor(Math.random() * playlist.length);
                playSongAtIndex(randomIndex);
            } else {
                const nextIndex = (currentSongIndex + 1 + playlist.length) % playlist.length;
                playSongAtIndex(nextIndex);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!playlist.length) return;
            const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
            playSongAtIndex(prevIndex);
        });
    }

    if (shuffleBtn) {
        shuffleBtn.style.opacity = shuffleMode ? 1 : 0.5;
        shuffleBtn.addEventListener('click', () => {
            shuffleMode = !shuffleMode;
            shuffleBtn.style.opacity = shuffleMode ? 1 : 0.5;
        });
    }

    if (repeatBtn) {
        repeatBtn.style.opacity = repeatMode ? 1 : 0.5;
        repeatBtn.addEventListener('click', () => {
            repeatMode = !repeatMode;
            audioPlayer.loop = repeatMode;
            repeatBtn.style.opacity = repeatMode ? 1 : 0.5;
        });
    }

    audioPlayer.addEventListener('timeupdate', () => {
        const d = audioPlayer.duration || 0;
        const c = audioPlayer.currentTime || 0;
        const pct = d ? (c / d) * 100 : 0;

        seekProgress.style.width = pct + '%';
        seekCircle.style.left = `calc(${pct}% - 6px)`;

        seekTime.textContent = `${formatTime(c)} / ${formatTime(d)}`;
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        const d = audioPlayer.duration || 0;
        seekTime.textContent = `0:00 / ${formatTime(d)}`;
    });

    audioPlayer.addEventListener('play', () => setPlayIcon(true));
    audioPlayer.addEventListener('pause', () => setPlayIcon(false));

    seekbar.addEventListener('click', (e) => {
        const rect = seekbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        if (!isFinite(audioPlayer.duration) || audioPlayer.duration === 0) return;
        audioPlayer.currentTime = pct * audioPlayer.duration;
    });

    let dragging = false;
    seekCircle.addEventListener('pointerdown', (e) => {
        dragging = true;
        seekCircle.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const rect = seekbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        if (isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
            audioPlayer.currentTime = pct * audioPlayer.duration;
        }
    });
    window.addEventListener('pointerup', (e) => {
        dragging = false;
    });

    /* Volume control */
    (function setupVolumeControl() {
        const volBar = document.querySelector('.othercontrols .volume-seekbar');
        const volProgress = volBar ? volBar.querySelector('.volume-progress') : null;
        const volThumb = volBar ? volBar.querySelector('.volume-thumb') : null;
        const volumeIcon = document.getElementById("volumeToggle");

        let isMuted = false;

        if (!volBar || !volProgress || !volThumb || !volumeIcon) {
            return;
        }

        function setVolume(pct) {
            pct = Math.max(0, Math.min(1, pct));
            audioPlayer.volume = pct;
            audioPlayer.muted = false;
            volProgress.style.width = (pct * 100) + '%';
            volThumb.style.left = (pct * 100) + '%';
            volumeIcon.src = "Recources/volume.svg";
            isMuted = false;
        }

        setVolume(typeof audioPlayer.volume === 'number' ? audioPlayer.volume : 0.5);

        volumeIcon.addEventListener("click", () => {
            isMuted = !isMuted;
            audioPlayer.muted = isMuted;
            volumeIcon.src = isMuted ? "Recources/mute.svg" : "Recources/volume.svg";
        });

        volBar.addEventListener('click', (e) => {
            const rect = volBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            setVolume(x / rect.width);
        });

        let volDragging = false;
        volThumb.addEventListener('pointerdown', (ev) => {
            volDragging = true;
            volThumb.setPointerCapture(ev.pointerId);
        });
        window.addEventListener('pointermove', (e) => {
            if (!volDragging) return;
            const rect = volBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            setVolume(x / rect.width);
        });
        window.addEventListener('pointerup', () => {
            volDragging = false;
        });
    })();

    setPlayIcon(!audioPlayer.paused);
}

/* Unified scroll control setup */
function setupLocalScrollControls(containerSelector, scrollTargetSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    let scrollTarget = null;
    if (scrollTargetSelector) {
        scrollTarget = container.querySelector(scrollTargetSelector);
    }
    if (!scrollTarget) {
        scrollTarget = container.querySelector('.spotifySongs') ||
                       container.querySelector('.popular-artists-cards') ||
                       container.querySelector('#trendingSongsContainer') ||
                       container.querySelector('.trending-songs');
    }
    if (!scrollTarget) return;

    const leftBtn = container.querySelector('.scroll-btn.left-scroll');
    const rightBtn = container.querySelector('.scroll-btn.right-scroll');
    if (!leftBtn || !rightBtn) return;

    const SCROLL_AMOUNT = 400;

    leftBtn.addEventListener('click', () => {
        scrollTarget.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
        scrollTarget.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    });

    function updateButtons() {
        const visible = Math.ceil(scrollTarget.clientWidth);
        const total = Math.floor(scrollTarget.scrollWidth);
        const isScrollable = total > visible + 10;
        const isAtStart = scrollTarget.scrollLeft <= 1;
        const isAtEnd = scrollTarget.scrollLeft + visible >= total - 1;

        if (!isScrollable) {
            leftBtn.classList.remove('enabled');
            rightBtn.classList.remove('enabled');
            return;
        }
        leftBtn.classList.toggle('enabled', !isAtStart);
        rightBtn.classList.toggle('enabled', !isAtEnd);
    }

    scrollTarget.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);
    setTimeout(updateButtons, 50);
}

/* Main initialization */
async function main() {
    // Use static songsData (JSON) to populate playlist and merge metadata
    if (Array.isArray(songsData) && songsData.length) {
        playlist = songsData.map(s => s.file);

        // Merge any metadata from songsData into songMeta
        songsData.forEach(entry => {
            if (!entry || !entry.file) return;
            const baseName = decodeURIComponent(entry.file).replace(/\.[^/.]+$/, '');
            if (!songMeta[baseName]) songMeta[baseName] = {};
            if (entry.title) songMeta[baseName].title = entry.title;
            if (entry.artist) songMeta[baseName].artist = entry.artist;
            if (entry.image) songMeta[baseName].image = entry.image;
        });
    } else {
        // If you ever re-enable directory listing uncomment getsongs() at top and use:
        // const songsFromDir = await getsongs();
        // playlist = songsFromDir.slice();
        console.warn('songsData is empty - playlist remains empty unless you enable directory reading or populate songsData.');
    }

    const container = document.getElementById('trendingSongsContainer') || document.querySelector('.spotifySongs');
    if (!container) {
        console.error('Could not find songs container (#trendingSongsContainer or .spotifySongs)');
        return;
    }

    buildSongCards(container);
    setupFooterControls();

    // build popular artists
    buildPopularArtists();

    // setup scroll controls for both sections
    setupLocalScrollControls('.trending-songs-container', '#trendingSongsContainer');
    setupLocalScrollControls('.popular-artists', '.popular-artists-cards');
}

main();

/* Now Playing toggle (footer playing icon) */
(function setupNowPlayingToggle() {
    const playIcon = document.querySelector('.othercontrols .toggle-now-playing, .othercontrols img[src*="playing.svg"]');
    const nowPanel = document.querySelector('.NowPlaying');
    const rightSection = document.querySelector('.right');

    if (!playIcon || !nowPanel || !rightSection) return;

    function showNowPlaying() {
        nowPanel.classList.add('active');
        rightSection.classList.add('shrink');
        playIcon.classList.add('active');
    }
    function hideNowPlaying() {
        nowPanel.classList.remove('active');
        rightSection.classList.remove('shrink');
        playIcon.classList.remove('active');
    }

    playIcon.addEventListener('click', () => {
        if (nowPanel.classList.contains('active')) {
            hideNowPlaying();
        } else {
            showNowPlaying();
        }
    });
})();

/* Legacy/backup scroll button hooking (keeps backward compatibility) */
document.addEventListener('DOMContentLoaded', function() {
    const trendingContainer = document.getElementById('trendingSongsContainer');
    const leftScrollBtn = document.getElementById('leftScrollTrending');
    const rightScrollBtn = document.getElementById('rightScrollTrending');

    if (trendingContainer && leftScrollBtn && rightScrollBtn) {
        const scrollAmount = 400;

        leftScrollBtn.addEventListener('click', function() {
            trendingContainer.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        rightScrollBtn.addEventListener('click', function() {
            trendingContainer.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        function updateScrollButtons() {
            const visible = Math.ceil(trendingContainer.clientWidth);
            const total = Math.floor(trendingContainer.scrollWidth);
            const isScrollable = total > visible + 10;
            const isAtStart = trendingContainer.scrollLeft <= 1;
            const isAtEnd = trendingContainer.scrollLeft + visible >= total - 1;

            if (!isScrollable) {
                leftScrollBtn.classList.remove('enabled');
                rightScrollBtn.classList.remove('enabled');
                return;
            }

            if (isAtStart) leftScrollBtn.classList.remove('enabled'); else leftScrollBtn.classList.add('enabled');
            if (isAtEnd) rightScrollBtn.classList.remove('enabled'); else rightScrollBtn.classList.add('enabled');
        }

        trendingContainer.addEventListener('scroll', updateScrollButtons);
        updateScrollButtons();
    }
});

/* Keyboard navigation support */
document.addEventListener('keydown', function(e) {
    const trendingContainer = document.getElementById('trendingSongsContainer');

    if (trendingContainer && document.activeElement === trendingContainer) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            trendingContainer.scrollBy({
                left: -400,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            trendingContainer.scrollBy({
                left: 400,
                behavior: 'smooth'
            });
        }
    }
});

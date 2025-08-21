console.log('Lets Write JavaScript');

// Get songs from server directory
async function getsongs() {
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
}

let playlist = [];
const audioPlayer = new Audio();
let currentSongIndex = -1;
let shuffleMode = false;
let repeatMode = false;

/* === INSERT: song metadata map (edit/add songs & artists here) ===
   - Keys MUST match the file base name (filename without .mp3) after decodeURIComponent
   - Add new songs here to supply title/artist/image info.
   - Image paths may be absolute or relative; if not provided, script will try
     Songs/Song Images/<encoded baseName>.jpeg then .jpg then default.
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

/**
 * Play a song by playlist index.
 * Updates footer songinfo & Now Playing panel (and un-mutes audio when a new track starts).
 */
function playSongAtIndex(index) {
    if (!playlist || playlist.length === 0) return;
    if (index < 0 || index >= playlist.length) return;

    currentSongIndex = index;
    const filename = playlist[index];
    
    // audio source path relative to project
    audioPlayer.src = `Songs/${filename}`;
    audioPlayer.play().catch(err => console.error('Playback error:', err));
    
    // Decode file name
    const decoded = decodeURIComponent(filename);
    const baseName = decoded.replace(/\.[^/.]+$/, '');
    
    // Metadata lookup
    const defaultImg = 'Songs/Song Images/default.jpeg';
    const meta = (songMeta && songMeta[baseName]) ? songMeta[baseName] : {
        title: baseName,
        artist: 'Unknown Artist',
        image: defaultImg
    };
    
    // fallback if no image in metadata
    const imagePath = meta.image || `Songs/Song Images/${encodeURIComponent(baseName)}.jpeg`;
    meta.image = imagePath;
    
    // === Update Now Playing section + Footer ===
    updateNowPlaying(meta);

    // Mark the playing card visually
    document.querySelectorAll('.song').forEach((el, i) => {
        el.classList.toggle('playing', i === index);
    });
}

/* === INSERT: updateNowPlaying(meta) - updates right-side panel & footer songinfo ===
   Receives a metadata object {title, artist, image}.
*/
function updateNowPlaying(song) {
    if (!song) return;
    const nowPlaying = document.querySelector(".NowPlaying");
    const rightSection = document.querySelector(".right");

    // Show NowPlaying panel and shrink right section
    if (nowPlaying && rightSection) {
        nowPlaying.classList.add("active");
        rightSection.classList.add("shrink");
    }

    // Title in h2.title
    const titleEl = document.querySelector(".NowPlaying .title");
    if (titleEl) titleEl.textContent = song.title || '';

    // Title duplicate in div.songname
    const songnameEl = document.querySelector(".NowPlaying .songname");
    if (songnameEl) songnameEl.textContent = song.title || '';

    // Artists list (credits)
    const artistsNamesEl = document.querySelector(".NowPlaying .artists-names");
    if (artistsNamesEl) {
        // allow comma-separated string or array
        if (Array.isArray(song.artist)) {
            artistsNamesEl.innerHTML = song.artist.map(a => `<div>${a}</div>`).join('');
        } else {
            artistsNamesEl.textContent = song.artist || '';
        }
    }

    // Album/cover image - preload and fallback
    const nowImg = document.querySelector(".NowPlaying .image img");
    const defaultImg = 'Songs/Song Images/default.jpeg';
    if (nowImg) {
        const pre = new Image();
        pre.onload = () => { nowImg.src = song.image || defaultImg; };
        pre.onerror = () => { nowImg.src = defaultImg; };
        pre.src = song.image || defaultImg;
    }

    // Also ensure footer songinfo updated (keeps consistent)
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
}
/* === END INSERT === */

/* Build song cards from playlist */
function buildSongCards(containerEl) {
    const defaultImg = 'Songs/Song Images/default.jpeg';

    // Helper: set image src with fallback
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

    // Container should be empty or will append to existing
    playlist.forEach((songFile, index) => {
        if (!songFile) return;

        const decoded = decodeURIComponent(songFile);
        const baseName = decoded.replace(/\.[^/.]+$/, '');

        // Create card wrapper
        const songDiv = document.createElement('div');
        songDiv.classList.add('trending-songs', 'song', 'flex');
        songDiv.setAttribute('data-song', songFile);

        // Image container
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('song-image-container');

        const imgEl = document.createElement('img');
        imgEl.classList.add('selfcenter');
        imgEl.alt = baseName;

        // Play overlay
        const overlay = document.createElement('div');
        overlay.classList.add('play-button-overlay');
        overlay.innerHTML = `<img src="Recources/play.svg" class="play-icon" alt="Play Icon">`;

        imgContainer.appendChild(imgEl);
        imgContainer.appendChild(overlay);

        // Title and artist elements
        const titleEl = document.createElement('h2');
        titleEl.classList.add('songname', 'cwhite', 'F16px');

        const artistEl = document.createElement('p');
        artistEl.classList.add('cb3b3b3');

        const meta = (typeof songMeta !== 'undefined' && songMeta[baseName]) ? songMeta[baseName] : null;

        titleEl.textContent = (meta && meta.title) ? meta.title : baseName;
        artistEl.textContent = (meta && meta.artist) ? meta.artist : 'Unknown Artist';

        // Set image with metadata or fallback
        if (meta && meta.image) {
            imgEl.src = meta.image;
            imgEl.onerror = () => {
                imgEl.onerror = null;
                setImageWithFallback(imgEl, baseName);
            };
        } else {
            setImageWithFallback(imgEl, baseName);
        }

        // Assemble card
        songDiv.appendChild(imgContainer);
        songDiv.appendChild(titleEl);
        songDiv.appendChild(artistEl);

        containerEl.appendChild(songDiv);

        // Click handler: play this song
        songDiv.addEventListener('click', () => {
            playSongAtIndex(index);
        });
    });
}

/* === INSERT: Popular Artists - dynamic generation (clickable, with links) ===
   Add/modify artists in `artistList`. Images expected at artist-images/<encoded name>.jpeg
*/
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

    // known good links (prefer these)
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

    // Preserve scroll-controls block if present
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

        // Put the card inside the anchor so the whole card is clickable
        anchor.appendChild(about);
        cardsWrapper.appendChild(anchor);
    });

    container.appendChild(cardsWrapper);

    // local scroll buttons behavior (if present inside this container)
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
/* === END INSERT === */

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


/* Update footer song info */
function updateSongInfo(songName, artistName, imagePath) {
    const songInfoEl = document.querySelector('.songinfo');
    const defaultImg = 'Songs/Song Images/default.jpeg';
    
    if (!songInfoEl) {
        console.warn('updateSongInfo: No .songinfo element found');
        return;
    }
    
    songInfoEl.innerHTML = '';
    
    // Create image element
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
    
    // Create text container
    const textContainer = document.createElement('div');
    textContainer.className = 'song-text-info';
    textContainer.style.cssText = 'margin-left: 10px; display: flex; flex-direction: column;';
    
    // Create title element
    const titleEl = document.createElement('div');
    titleEl.className = 'song-title';
    titleEl.textContent = songName || '';
    titleEl.style.cssText = 'font-weight: bold; color: white; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;';
    
    // Create artist element
    const artistEl = document.createElement('div');
    artistEl.className = 'song-artist';
    artistEl.textContent = artistName || '';
    artistEl.style.cssText = 'color: #b3b3b3; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
    
    textContainer.appendChild(titleEl);
    textContainer.appendChild(artistEl);
    songInfoEl.appendChild(imageEl);
    songInfoEl.appendChild(textContainer);
    
    // Set image with fallback
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

/* Setup footer controls */
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

    // Create seek progress bar and time display
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

    // Helper: format seconds to MM:SS
    function formatTime(sec) {
        if (!isFinite(sec)) return '0:00';
        const s = Math.floor(sec % 60);
        const m = Math.floor(sec / 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // Update play/pause icon
    function setPlayIcon(isPlaying) {
        if (!playPauseBtn) return;
        const playPath = 'Recources/play.svg';
        const pausePath = 'Recources/pause.svg';
        playPauseBtn.src = isPlaying ? pausePath : playPath;
    }

    // Play/Pause toggle
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

    // Next button
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

    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!playlist.length) return;
            const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
            playSongAtIndex(prevIndex);
        });
    }

    // Shuffle toggle
    if (shuffleBtn) {
        shuffleBtn.style.opacity = shuffleMode ? 1 : 0.5;
        shuffleBtn.addEventListener('click', () => {
            shuffleMode = !shuffleMode;
            shuffleBtn.style.opacity = shuffleMode ? 1 : 0.5;
        });
    }

    // Repeat toggle
    if (repeatBtn) {
        repeatBtn.style.opacity = repeatMode ? 1 : 0.5;
        repeatBtn.addEventListener('click', () => {
            repeatMode = !repeatMode;
            audioPlayer.loop = repeatMode;
            repeatBtn.style.opacity = repeatMode ? 1 : 0.5;
        });
    }

    // Update seekbar as audio plays
    audioPlayer.addEventListener('timeupdate', () => {
        const d = audioPlayer.duration || 0;
        const c = audioPlayer.currentTime || 0;
        const pct = d ? (c / d) * 100 : 0;

        seekProgress.style.width = pct + '%';
        seekCircle.style.left = `calc(${pct}% - 6px)`;

        seekTime.textContent = `${formatTime(c)} / ${formatTime(d)}`;
    });

    // When metadata loaded
    audioPlayer.addEventListener('loadedmetadata', () => {
        const d = audioPlayer.duration || 0;
        seekTime.textContent = `0:00 / ${formatTime(d)}`;
    });

    // Sync play/pause icon with audio state
    audioPlayer.addEventListener('play', () => setPlayIcon(true));
    audioPlayer.addEventListener('pause', () => setPlayIcon(false));

    // Clicking on seekbar moves playback position
    seekbar.addEventListener('click', (e) => {
        const rect = seekbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        if (!isFinite(audioPlayer.duration) || audioPlayer.duration === 0) return;
        audioPlayer.currentTime = pct * audioPlayer.duration;
    });

    // Make the circle draggable to seek
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

    /* === INSERT: Volume control + mute/unmute toggle (uses #volumeToggle id) === */
    (function setupVolumeControl() {
        const volBar = document.querySelector('.othercontrols .volume-seekbar');
        const volProgress = volBar ? volBar.querySelector('.volume-progress') : null;
        const volThumb = volBar ? volBar.querySelector('.volume-thumb') : null;
        const volumeIcon = document.getElementById("volumeToggle"); // expect id on <img>

        let isMuted = false;

        if (!volBar || !volProgress || !volThumb || !volumeIcon) {
            // If missing elements, skip volume wiring silently
            return;
        }

        function setVolume(pct) {
            pct = Math.max(0, Math.min(1, pct));
            audioPlayer.volume = pct;
            audioPlayer.muted = false;
            volProgress.style.width = (pct * 100) + '%';
            volThumb.style.left = (pct * 100) + '%';
            // switch to volume icon
            volumeIcon.src = "Recources/volume.svg";
            isMuted = false;
        }

        // initialize
        setVolume(typeof audioPlayer.volume === 'number' ? audioPlayer.volume : 0.5);

        // Click icon to mute/unmute
        volumeIcon.addEventListener("click", () => {
            isMuted = !isMuted;
            audioPlayer.muted = isMuted;
            volumeIcon.src = isMuted ? "Recources/mute.svg" : "Recources/volume.svg";
        });

        // Click to set volume
        volBar.addEventListener('click', (e) => {
            const rect = volBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            setVolume(x / rect.width);
        });

        // Drag support
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
    /* === END INSERT === */

    setPlayIcon(!audioPlayer.paused);
}

/* === INSERT: unified scroll control setup for trending & popular (fixes arrows) ===
   This creates scroll behavior and toggles 'enabled' class for local left/right buttons inside each container.
*/
function setupLocalScrollControls(containerSelector, scrollTargetSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // find target to scroll (either a child wrapper or container's specific child)
    let scrollTarget = null;
    if (scrollTargetSelector) {
        scrollTarget = container.querySelector(scrollTargetSelector);
    }
    // fallback: a common convention
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
/* === END INSERT === */

/* Main function to initialize the app */
async function main() {
    const songs = await getsongs();
    playlist = songs.slice();

    const container = document.getElementById('trendingSongsContainer') || document.querySelector('.spotifySongs');
    if (!container) {
        console.error('Could not find songs container (#trendingSongsContainer or .spotifySongs)');
        return;
    }

    // Build UI
    buildSongCards(container);
    setupFooterControls();

    /* === INSERT: build popular artists on load === */
    buildPopularArtists();
    /* === END INSERT === */

    /* === INSERT: setup scroll controls for both sections === */
    // trending area - container is .trending-songs-container, target is #trendingSongsContainer
    setupLocalScrollControls('.trending-songs-container', '#trendingSongsContainer');
    // popular artists - container is .popular-artists, target is .popular-artists-cards (created dynamically)
    setupLocalScrollControls('.popular-artists', '.popular-artists-cards');
    /* === END INSERT === */
}

main();

/* === INSERT: Now Playing toggle (footer playing icon) ===
   - toggles .NowPlaying display and .right.shrink
   - toggles 'active' class on the icon so CSS can color it green (you already have .playing-icon.active)
*/
(function setupNowPlayingToggle() {
    const playIcon = document.querySelector('.othercontrols .toggle-now-playing, .othercontrols img[src*="playing.svg"]');
    const nowPanel = document.querySelector('.NowPlaying');
    const rightSection = document.querySelector('.right');

    if (!playIcon || !nowPanel || !rightSection) return;

    function showNowPlaying() {
        nowPanel.classList.add('active');
        rightSection.classList.add('shrink');
        playIcon.classList.add('active'); // CSS rule .playing-icon.active gives green tint
    }
    function hideNowPlaying() {
        nowPanel.classList.remove('active');
        rightSection.classList.remove('shrink');
        playIcon.classList.remove('active');
    }

    playIcon.addEventListener('click', () => {
        if (nowPanel.classList.contains('active')) {
            showNowPlaying();
        } else {
            hideNowPlaying();
        }
    });

    // If NowPlaying is opened by playing a song, ensure icon toggles too
    // (we already add .active in updateNowPlaying)
})();
 /* === END INSERT === */

/* Scroll buttons functionality for trending (legacy fallback)
   - Kept for compatibility if your HTML uses the original IDs
*/
document.addEventListener('DOMContentLoaded', function() {
    // If your HTML uses old single global IDs, this won't break because we check existence first
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

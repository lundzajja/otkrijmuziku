const API_KEY = '5ed3def25e94c94fdb1ce5bae594ae3e';
const MUSICBOARD_USERNAME = 'lukamercedez';

// Rucni overrides za artefakte koji nisu dostupni javno
const ARTWORK_OVERRIDES = {
    'have mercy': 'https://lastfm.freetls.fastly.net/i/u/300x300/d880ae1499f5f7dcd9d525660add7779.jpg',
    'oil of every pearl\'s un-insides': 'https://lastfm.freetls.fastly.net/i/u/300x300/b482e95ee228abbaaccd0d5a31b81ad2.jpg' // Sophie Lastfm cover
};

async function getLastfmAlbumCover(artist, album) {
    const key = album.toLowerCase().trim();
    if (ARTWORK_OVERRIDES[key]) return ARTWORK_OVERRIDES[key];

    const endpoint = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${API_KEY}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`;
    try {
        const resp = await fetch(endpoint);
        if (!resp.ok) return null;

        const data = await resp.json();
        if (!data || !data.album || !data.album.image) return null;

        const imageObj = data.album.image.find(img => img.size === 'extralarge') || data.album.image[data.album.image.length - 1];
        if (imageObj && imageObj['#text']) {
            return imageObj['#text'];
        }
        return null;
    } catch (error) {
        console.warn('Last.fm fetch artwork failed for', artist, album, error);
        return null;
    }
}

async function getLastfmTrackCover(artist, track) {
    const key = track.toLowerCase().trim();
    if (ARTWORK_OVERRIDES[key]) return ARTWORK_OVERRIDES[key];

    const endpoint = `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
    try {
        const resp = await fetch(endpoint);
        if (!resp.ok) return null;

        const data = await resp.json();
        if (!data || !data.track || !data.track.album || !data.track.album.image) return null;

        const imageObj = data.track.album.image.find(img => img.size === 'extralarge') || data.track.album.image[data.track.album.image.length - 1];
        if (imageObj && imageObj['#text']) {
            return imageObj['#text'];
        }
        return null;
    } catch (error) {
        console.warn('Last.fm fetch track artwork failed for', artist, track, error);
        return null;
    }
}

// Initialize Application
async function initMainContent() {
    const hero = document.querySelector('.hero');
    if (hero) hero.classList.add('hero-loaded');

    const reviewsContainer = document.getElementById('reviewsContainer');
    const reviewsPromise = reviewsContainer ? loadMusicboardReviews(reviewsContainer) : Promise.resolve();

    const genresContainer = document.getElementById('genresContainer');
    const genresPromise = genresContainer ? loadGenres(genresContainer) : Promise.resolve();

    const genreContentContainer = document.getElementById('genreContentContainer');
    const genreDetailsPromise = genreContentContainer ? loadGenreDetails(genreContentContainer) : Promise.resolve();

    const lastfmContainer = document.getElementById('lastfmContainer');
    const lastfmTopAlbumsContainer = document.getElementById('lastfmTopAlbums');
    const lastfmTopTracksContainer = document.getElementById('lastfmTopTracks');
    const userBtn = document.getElementById('updateUserBtn');
    const userInput = document.getElementById('lastfmUser');

    let lastfmPromise = Promise.resolve();
    if (lastfmContainer || lastfmTopAlbumsContainer || lastfmTopTracksContainer) {
        const defaultUser = userInput ? userInput.value.trim() : 'predragkon';
        lastfmPromise = fetchAllLastfmData(defaultUser, lastfmContainer, lastfmTopAlbumsContainer, lastfmTopTracksContainer);

        if (userBtn && userInput) {
            const updateFn = () => {
                const newUser = userInput.value.trim();
                if (newUser) fetchAllLastfmData(newUser, lastfmContainer, lastfmTopAlbumsContainer, lastfmTopTracksContainer);
            };

            userBtn.addEventListener('click', updateFn);
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') updateFn();
            });
        }
    }

    // Čekamo da se kritični delovi za visinu stranice učitaju
    await Promise.all([reviewsPromise, genresPromise, genreDetailsPromise, lastfmPromise]);

}

function scheduleDeferredLoad() {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(initMainContent, { timeout: 500 });
    } else {
        setTimeout(initMainContent, 200);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    scheduleDeferredLoad();
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
});

async function loadMusicboardReviews(container) {
    container.innerHTML = `<div class="loading-state">Povlačenje Musicboard recenzija i Last.fm omota albuma za korisnika @${MUSICBOARD_USERNAME}...</div>`;
    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const response = await fetch('./data/reviews.json?v=' + Math.random());
        if (!response.ok) throw new Error('Neuspelo povlačenje Musicboard podataka');
        const reviews = await response.json();
        
        container.innerHTML = '';
        
        for (const review of reviews) {
            const coverUrl = review.coverUrl;

            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <img src="${coverUrl}" alt="${review.album} Omot" class="card-img" loading="lazy" decoding="async" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='"/>
                <div class="card-content">
                    <h3 class="card-title">${review.album}</h3>
                    <div class="card-subtitle">${review.artist}</div>
                    <p class="card-desc">"${review.review}"</p>
                    <div class="card-rating" style="display: flex; justify-content: space-between; margin-top: auto;">
                        <span style="color: #ffaa00; font-weight: bold; font-size: 1.2rem;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - Math.floor(review.rating))}</span>
                        <span style="color: var(--text-secondary); font-size: 0.8rem;">${review.source}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Musicboard Fetch Error:', error);
        container.innerHTML = `<div class="error-state">Greška pri povlačenju recenzija sa Musicboarda. Pokrenite aplikaciju na lokalnom serveru.</div>`;
    }
}

async function loadGenres(container) {
    try {
        const response = await fetch('./data/genres.json?v=' + new Date().getTime());
        if (!response.ok) throw new Error('Neuspelo učitavanje žanrova');
        const genres = await response.json();
        
        container.innerHTML = '';
        genres.forEach(genre => {
            const card = document.createElement('a'); // Pretvaramo celu karticu u link
            card.href = `genre.html?id=${genre.slug}`;
            card.className = 'card genre-card';
            card.style.display = 'block';
            card.style.textDecoration = 'none';
            card.innerHTML = `
                <h3 class="genre-title">${genre.name}</h3>
                <p class="genre-desc">${genre.description}</p>
                <div class="genre-decoration" style="background-color: ${genre.color};"></div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading genres:', error);
        container.innerHTML = `<div class="error-state">Greška pri učitavanju žanrova.</div>`;
    }
}

async function loadGenreDetails(container) {
    const urlParams = new URLSearchParams(window.location.search);
    const genreId = urlParams.get('id');

    if (!genreId) {
        container.innerHTML = `<div class="error-state" style="margin-top:200px;">Nije izabran ni jedan žanr. <a href="index.html#zanrovi">Vrati se nazad</a></div>`;
        return;
    }

    try {
        const response = await fetch('./data/genres.json?v=' + new Date().getTime());
        const genres = await response.json();
        const genre = genres.find(g => g.slug === genreId);

        if (!genre) throw new Error('Žanr nije pronađen');

        // Dynamically fetching Last.fm omot za kultni album
        let coverUrl = genre.iconicAlbum.coverUrl;
        if (ARTWORK_OVERRIDES[genre.iconicAlbum.title.toLowerCase()]) {
            coverUrl = ARTWORK_OVERRIDES[genre.iconicAlbum.title.toLowerCase()];
        } else {
            try {
                const lfUrl = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${API_KEY}&artist=${encodeURIComponent(genre.iconicAlbum.artist)}&album=${encodeURIComponent(genre.iconicAlbum.title)}&format=json`;
                const lfRes = await fetch(lfUrl);
                const lfData = await lfRes.json();
                if (lfData && lfData.album && lfData.album.image) {
                    const imgObj = lfData.album.image.find(img => img.size === 'extralarge') || lfData.album.image[lfData.album.image.length - 1];
                    if (imgObj && imgObj['#text']) coverUrl = imgObj['#text'];
                }
            } catch (ignored) {}
        }

        let html = `
            <div class="genre-focus-shape" style="background-color: ${genre.color};"></div>
            <section class="genre-detail-hero">
                <div class="container">
                    <h1 style="color: ${genre.color}">${genre.name}</h1>
                    <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 800px; margin: 0 auto;">${genre.description}</p>
                </div>
            </section>
            
            <div class="container pb-6" style="padding-bottom: 6rem;">
                <a href="index.html#zanrovi" style="color: var(--text-secondary); margin-bottom: 2rem; display: inline-block;">&larr; Nazad na sve žanrove</a>
                
                <div class="genre-info-grid">
                    <div class="info-main">
                        <div class="info-block">
                            <h3 style="color: ${genre.color}">Istorija i nastanak</h3>
                            <p>${genre.history}</p>
                        </div>
                        <div class="info-block">
                            <h3 style="color: ${genre.color}">Kreatori i pioniri</h3>
                            <p>${genre.creators}</p>
                        </div>
                    </div>
                    
                    <div class="info-side">
                        <h3 style="margin-bottom: 1.5rem; color: var(--text-primary);">Kultni Album</h3>
                        <article class="card">
                            <img src="${coverUrl}" alt="Kultni Album" class="card-img" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='"/>
                            <div class="card-content">
                                <h3 class="card-title">${genre.iconicAlbum.title}</h3>
                                <div class="card-subtitle">${genre.iconicAlbum.artist}</div>
                                <div class="card-rating">Klasično delo ovog žanra</div>
                            </div>
                        </article>
                    </div>
                </div>
        `;

        if (genre.tribute && genre.tribute.active) {
            html += `
                <div class="tribute-box">
                    <h2>🤍 Tribute</h2>
                    <p>${genre.tribute.text}</p>
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="error-state" style="margin-top:200px;">Greška pri učitavanju žanra.</div>`;
    }
}

async function fetchAllLastfmData(user, containerRecent, containerAlbums, containerTracks) {
    const promises = [];
    if (containerRecent) promises.push(fetchLastfmRecentTracks(user, containerRecent));
    if (containerAlbums) promises.push(fetchLastfmTopAlbums(user, containerAlbums));
    if (containerTracks) promises.push(fetchLastfmTopTracks(user, containerTracks));
    await Promise.all(promises);
}

async function fetchLastfmRecentTracks(user, container) {
    container.innerHTML = `<div class="loading-state">Traženje podataka za korisnika ${user}...</div>`;
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${API_KEY}&format=json&limit=8`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) throw new Error(data.message || 'Korisnik na Last.fm nije pronađen ili API greška.');

        const tracks = data.recenttracks.track;
        if (!tracks || tracks.length === 0) {
            container.innerHTML = `<div class="loading-state">Nema nedavnih pesama za korisnika "${user}".</div>`;
            return;
        }

        container.innerHTML = '';
        for (let i=0; i < tracks.length; i++) {
            const track = tracks[i];
            const trackName = track.name;
            const artistName = track.artist['#text'];
            let imageUrl = '';
            
            if (ARTWORK_OVERRIDES[trackName.toLowerCase()]) {
                imageUrl = ARTWORK_OVERRIDES[trackName.toLowerCase()];
            } else if (track.image && track.image.length > 0) {
                const imageObj = track.image.find(img => img.size === 'extralarge') || track.image[track.image.length - 1];
                imageUrl = imageObj['#text'];
            }
            
            const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
            const timeDisplay = isNowPlaying ? '<span style="color:var(--primary);font-weight:bold;">Sluša Sada 🎶</span>' : 
                (track.date ? track.date['#text'] : 'Nepoznat Datum');

            const trackEl = document.createElement('div');
            trackEl.className = 'track-item';
            trackEl.innerHTML = `
                ${imageUrl ? `<img src="${imageUrl}" alt="Album Art" class="track-img" loading="lazy" decoding="async" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='"/>` : `<div class="track-img"></div>`}
                <div class="track-info">
                    <div class="track-name">${trackName}</div>
                    <div class="track-artist">${artistName}</div>
                    <div class="track-time">${timeDisplay}</div>
                </div>
                <a href="${track.url}" target="_blank" style="color:var(--text-secondary);"><small>Vidi ↗</small></a>
            `;
            container.appendChild(trackEl);
        }
    } catch (error) {
        console.error('Last.fm API Error:', error);
        container.innerHTML = `<div class="error-state">${error.message}</div>`;
    }
}

async function fetchLastfmTopAlbums(user, container) {
    container.innerHTML = `<div class="loading-state">Traženje top albuma...</div>`;
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${encodeURIComponent(user)}&api_key=${API_KEY}&format=json&limit=5`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) throw new Error(data.message || 'Greška pri učitavanju top albuma.');

        const albums = data.topalbums.album;
        if (!albums || albums.length === 0) {
            container.innerHTML = `<div class="loading-state">Nema dovoljno podataka.</div>`;
            return;
        }

        container.innerHTML = '';
        albums.forEach((album, index) => {
            const albumName = album.name;
            const artistName = album.artist.name;
            const playcount = album.playcount;
            let imageUrl = '';
            
            if (ARTWORK_OVERRIDES[albumName.toLowerCase()]) {
                imageUrl = ARTWORK_OVERRIDES[albumName.toLowerCase()];
            } else if (album.image && album.image.length > 0) {
                const imageObj = album.image.find(img => img.size === 'extralarge') || album.image[album.image.length - 1];
                imageUrl = imageObj['#text'];
            }
            
            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <img src="${imageUrl}" alt="Album Art" class="card-img" loading="lazy" decoding="async" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='"/>
                <div class="card-content">
                    <h3 class="card-title">${albumName}</h3>
                    <div class="card-subtitle">${artistName}</div>
                    <p class="card-desc" style="color: var(--secondary); font-weight: bold; margin-bottom: 0.5rem;">#${index+1} Najslušanije</p>
                    <div class="card-rating" style="display: flex; justify-content: space-between; margin-top: auto;">
                        <span style="color: var(--text-primary); font-weight: bold;">Slušanja: ${playcount}</span>
                        <a href="${album.url}" target="_blank" style="color:var(--text-secondary); text-decoration: underline;"><small>Last.fm</small></a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Last.fm Top Albums Error:', error);
        container.innerHTML = `<div class="error-state">${error.message}</div>`;
    }
}

async function fetchLastfmTopTracks(user, container) {
    container.innerHTML = `<div class="loading-state">Traženje top pesama...</div>`;
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURIComponent(user)}&api_key=${API_KEY}&format=json&limit=5`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) throw new Error(data.message || 'Greška pri učitavanju top pesama.');

        const tracks = data.toptracks.track;
        if (!tracks || tracks.length === 0) {
            container.innerHTML = `<div class="loading-state">Nema dovoljno podataka.</div>`;
            return;
        }

        container.innerHTML = '';
        
        // Paralelno učitavanje svih cover slika
        const trackPromises = tracks.map(async (track, index) => {
            const trackName = track.name;
            const artistName = track.artist.name;
            const playcount = track.playcount;
            
            let imageUrl = '';
            
            if (ARTWORK_OVERRIDES[trackName.toLowerCase()]) {
                imageUrl = ARTWORK_OVERRIDES[trackName.toLowerCase()];
            } else {
                const fetchedCover = await getLastfmTrackCover(artistName, trackName);
                if (fetchedCover) {
                    imageUrl = fetchedCover;
                } else if (track.image && track.image.length > 0) {
                    const imageObj = track.image.find(img => img.size === 'extralarge') || track.image[track.image.length - 1];
                    imageUrl = imageObj['#text'] || '';
                }
            }
            
            // Fallback ako nema slike
            if (!imageUrl) {
                imageUrl = `https://placehold.co/300x300/1e1e26/ffffff?text=${encodeURIComponent(artistName.charAt(0))}`;
            }

            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${trackName}" class="card-img" loading="lazy" decoding="async" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='"/>
                <div class="card-content">
                    <h3 class="card-title">${trackName}</h3>
                    <div class="card-subtitle">${artistName}</div>
                    <p class="card-desc" style="color: var(--primary); font-weight: bold; margin-bottom: 0.5rem;">#${index+1} Najslušanije</p>
                    <div class="card-rating" style="display: flex; justify-content: space-between; margin-top: auto;">
                        <span style="color: var(--text-primary); font-weight: bold;">Slušanja: ${playcount}</span>
                        <a href="${track.url}" target="_blank" style="color:var(--text-secondary); text-decoration: underline;"><small>Last.fm</small></a>
                    </div>
                </div>
            `;
            return card;
        });

        // Čekamo sve Promise-e i dodajemo kartice u DOM
        const cards = await Promise.all(trackPromises);
        cards.forEach(card => container.appendChild(card));

    } catch (error) {
        console.error('Last.fm Top Tracks Error:', error);
        container.innerHTML = `<div class="error-state">${error.message}</div>`;
    }
}

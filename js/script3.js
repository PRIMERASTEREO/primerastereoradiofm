const RADIO_NAME = 'PRIMERA STEREO Radio Online';
const URL_STREAMING = 'https://usa7.fastcast4u.com/proxy/primerastereo';
const NOWPLAYING_TXT_URL = 'https://stream.zeno.fm/nowplaying.txt';
const ZENO_API_URL = 'https://twj.es/radio_info/?radio_url=http://usa7.fastcast4u.com:5388/stream';
const API_KEY = "18fe07917957c289983464588aabddfb";
const DEFAULT_COVER_ART = 'images/Nuevo Logo.png'; 

let showHistory = true;
var audio = new Audio(URL_STREAMING);
var currentSongMetadata = { song: '', artist: '', source: '' };

document.addEventListener('DOMContentLoaded', function () {
    var page = new Page();
    page.changeTitlePage();
    page.setVolume();
    updateHistoryUI();

    // Conectarse al stream de Zeno para los metadatos de respaldo
    connectToEventSource(ZENO_API_URL);

    // Intentar obtener los metadatos de nowplaying.txt cada 5 segundos (máxima prioridad)
    updateFromNowPlaying(200737);
    setInterval(updateFromNowPlaying, 5000);

    const volumeSlider = document.getElementById('volume');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            if (audio) {
                audio.volume = intToDecimal(this.value);
            }
            var page = new Page();
            page.changeVolumeIndicator(this.value);
        });
    }

    const muteButton = document.querySelector('.fa-volume-up');
    if (muteButton) {
        muteButton.parentElement.addEventListener('click', mute);
    }
});

class Page {
    constructor() {
        this.changeTitlePage = function (title = RADIO_NAME) {
            document.title = title;
        };

        this.refreshCurrentSong = function (song, artist) {
            var currentSong = document.getElementById('currentSong');
            var currentArtist = document.getElementById('currentArtist');
            if (currentSong && currentArtist && song !== currentSong.innerHTML) {
                currentSong.className = 'animated flipInY text-uppercase';
                currentSong.innerHTML = song;
                currentArtist.className = 'animated flipInY text-capitalize';
                currentArtist.innerHTML = artist;

                var lyricsSongEl = document.getElementById('lyricsSong');
                if (lyricsSongEl) {
                    lyricsSongEl.innerHTML = song + ' - ' + artist;
                }

                setTimeout(function () {
                    if (currentSong) currentSong.className = 'text-uppercase';
                    if (currentArtist) currentArtist.className = 'text-capitalize';
                }, 2000);
            }
        };

        this.refreshCover = function (artworkUrl = DEFAULT_COVER_ART) {
            var coverArtEl = document.getElementById('currentCoverArt');
            var coverBackgroundEl = document.getElementById('bgCover');
            if (coverArtEl) {
                coverArtEl.style.backgroundImage = 'url(' + artworkUrl + ')';
                coverArtEl.className = 'animated bounceInLeft';
                setTimeout(function () {
                    if (coverArtEl) coverArtEl.className = '';
                }, 2000);
            }
            if (coverBackgroundEl) {
                coverBackgroundEl.style.backgroundImage = 'url(' + artworkUrl + ')';
            }
        };
        
        this.refreshLyric = function (currentSong, currentArtist) {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                var openLyric = document.querySelector('.lyrics'); 
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        var data = JSON.parse(this.responseText);
                        if (data.type === 'exact' || data.type === 'aprox') {
                            var lyric = data.mus[0].text;
                            var lyricEl = document.getElementById('lyric');
                            if (lyricEl) {
                                lyricEl.innerHTML = lyric.replace(/\n/g, '<br />'); 
                            }
                            if (openLyric) {
                                openLyric.style.opacity = "1";
                                openLyric.setAttribute('data-toggle', 'modal');
                            }
                        } else {
                            if (openLyric) {
                                openLyric.style.opacity = "0.3";
                                openLyric.removeAttribute('data-toggle');
                            }
                            var modalLyric = document.getElementById('modalLyrics');
                            if (modalLyric) {
                                $('#modalLyrics').modal('hide'); 
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing lyric JSON:", e, "Response:", this.responseText);
                        if (openLyric) {
                            openLyric.style.opacity = "0.3";
                            openLyric.removeAttribute('data-toggle');
                        }
                    }
                } else if (this.readyState === 4) {
                    console.warn(`Lyric API responded with status ${this.status}`);
                    if (openLyric) {
                        openLyric.style.opacity = "0.3";
                        openLyric.removeAttribute('data-toggle');
                    }
                }
            };
            
        };

        this.changeVolumeIndicator = function (volume) {
            var volIndicatorEl = document.getElementById('volIndicator');
            if (volIndicatorEl) {
                volIndicatorEl.innerHTML = volume;
            }
            if (typeof (Storage) !== 'undefined') {
                localStorage.setItem('volume', volume);
            }
        };

        this.setVolume = function () {
            if (typeof (Storage) !== 'undefined') {
                var volumeLocalStorage = (!localStorage.getItem('volume')) ? 80 : localStorage.getItem('volume');
                var volumeEl = document.getElementById('volume');
                var volIndicatorEl = document.getElementById('volIndicator');
                if (volumeEl) {
                    volumeEl.value = volumeLocalStorage;
                }
                if (volIndicatorEl) {
                    volIndicatorEl.innerHTML = volumeLocalStorage;
                }
            }
        };
    }
}

class Player {
    constructor() {
        this.play = function () {
            audio.play().catch(e => {
                console.warn("Reproducción de audio bloqueada (autoplay):", e);
            });
            var defaultVolume = document.getElementById('volume') ? document.getElementById('volume').value : 80;
            if (typeof (Storage) !== 'undefined') {
                if (localStorage.getItem('volume') !== null) {
                    audio.volume = intToDecimal(localStorage.getItem('volume'));
                } else {
                    audio.volume = intToDecimal(defaultVolume);
                }
            } else {
                audio.volume = intToDecimal(defaultVolume);
            }
            var volIndicatorEl = document.getElementById('volIndicator');
            if (volIndicatorEl) {
                volIndicatorEl.innerHTML = defaultVolume;
            }
        };
        this.pause = function () {
            audio.pause();
        };
    }
}

audio.onplay = function () {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    if (botao && botao.className === 'fa fa-play') {
        botao.className = 'fa fa-pause';
        if (bplay) bplay.firstChild.data = 'PAUSAR';
    }
}

audio.onpause = function () {
    var botao = document.getElementById('playerButton');
    var bplay = document.getElementById('buttonPlay');
    if (botao && botao.className === 'fa fa-pause') {
        botao.className = 'fa fa-play';
        if (bplay) bplay.firstChild.data = 'REPRODUCIR'; 
    }
}

audio.onvolumechange = function () {
    if (audio.volume > 0) {
        audio.muted = false;
    }
}

audio.onerror = function () {
    console.error("Error en el stream de audio Zeno. Intentando recargar...");
    var confirmacao = confirm('Stream Down / Network Error. \nClick OK to try again.');
    if (confirmacao) {
        window.location.reload();
    }
}

function togglePlay() {
    if (!audio.src || audio.src === '' || audio.src !== URL_STREAMING) {
        audio.src = URL_STREAMING;
        var defaultVolume = document.getElementById('volume') ? document.getElementById('volume').value : 80;
        audio.volume = intToDecimal(localStorage.getItem('volume') || defaultVolume);
    }
    if (!audio.paused) {
        audio.pause();
    } else {
        audio.play().then(() => {
            console.log("Reproducción iniciada con éxito.");
        }).catch(e => {
            console.warn("Reproducción manual del reproductor Zeno bloqueada (posible Autoplay Policy):", e);
        });
    }
}

function volumeUp() {
    var vol = audio.volume;
    if (audio) {
        if (audio.volume >= 0 && audio.volume < 1) {
            audio.volume = parseFloat((vol + .01).toFixed(2));
        }
    }
}

function volumeDown() {
    var vol = audio.volume;
    if (audio) {
        if (audio.volume >= 0.01 && audio.volume <= 1) {
            audio.volume = parseFloat((vol - .01).toFixed(2));
        }
    }
}

function mute() {
    if (!audio.muted) {
        var volIndicatorEl = document.getElementById('volIndicator');
        var volumeEl = document.getElementById('volume');
        if (volIndicatorEl) volIndicatorEl.innerHTML = 0;
        if (volumeEl) volumeEl.value = 0;
        if (audio) audio.volume = 0;
        if (audio) audio.muted = true;
    } else {
        var localVolume = localStorage.getItem('volume');
        var volIndicatorEl = document.getElementById('volIndicator');
        var volumeEl = document.getElementById('volume');
        if (localVolume !== null) {
            if (volIndicatorEl) volIndicatorEl.innerHTML = localVolume;
            if (volumeEl) volumeEl.value = localVolume;
            if (audio) audio.volume = intToDecimal(localVolume);
        } else {
            if (volIndicatorEl) volIndicatorEl.innerHTML = 80;
            if (volumeEl) volumeEl.value = 80;
            if (audio) audio.volume = intToDecimal(80);
        }
        if (audio) audio.muted = false;
    }
}

// Función principal que decide qué metadatos usar
function updateFromNowPlaying() {
    fetch(NOWPLAYING_TXT_URL + '?' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                return "ERROR_FETCH"; 
            }
            return response.text();
        })
        .then(data => {
            const trimmedData = data.trim();

            if (trimmedData && trimmedData !== 'ERROR_FETCH' && trimmedData.toLowerCase() !== 'undefined') {
                // Hay datos en nowplaying.txt, usar estos (prioridad 1)
                let artist = RADIO_NAME; 
                let song = "Cargando..."; 

                const separatorIndex = trimmedData.indexOf(' - ');
                if (separatorIndex !== -1) {
                    artist = trimmedData.substring(0, separatorIndex).trim();
                    song = trimmedData.substring(separatorIndex + 3).trim();
                } else {
                    song = trimmedData;
                }
                updatePlayerMetadata(song, artist, 'nowplaying');
            }
        })
        .catch(error => {
            console.error('Error al obtener la canción de nowplaying.txt:', error);
            // El catch también se activará si el archivo no existe
        });
}

// Escucha activa de los metadatos de Zeno (se usa solo si nowplaying.txt no tiene datos)
function connectToEventSource(url) {
    const eventSource = new EventSource(url);
    eventSource.addEventListener('message', function(event) {
        const data = event.data;
        if (!data || data.trim() === '' || data.trim().toLowerCase() === 'undefined') {
            return;
        }

        try {
            const parsedData = JSON.parse(data);
            if (parsedData.streamTitle && typeof parsedData.streamTitle === 'string' && parsedData.streamTitle.trim().toLowerCase() !== 'undefined') {
                let artist = '';
                let song = '';
                const streamTitle = parsedData.streamTitle.trim();
                
                if (streamTitle.includes(' - ')) {
                    const parts = streamTitle.split(' - ');
                    artist = parts[0] ? parts[0].trim() : '';
                    song = parts[1] ? parts[1].trim() : '';
                } else {
                    song = streamTitle;
                    artist = RADIO_NAME;
                }

                // Esta es la lógica clave: solo actualizamos con Zeno si no estamos usando la información de Spotify.
                if (currentSongMetadata.source !== 'nowplaying') {
                    updatePlayerMetadata(song, artist, 'zeno');
                }
            }
        } catch (e) {
            console.error("Error al parsear datos de EventSource:", e, "Datos recibidos:", data);
        }
    });

    eventSource.addEventListener('error', function(event) {
        console.error('Error en la conexión de eventos do EventSource. Intentando reconectar...');
        eventSource.close();
        setTimeout(function() {
            connectToEventSource(url);
        }, 3000);
    });
}

function updatePlayerMetadata(song, artist, source) {
    if (currentSongMetadata.song === song && currentSongMetadata.artist === artist && currentSongMetadata.source === source) {
        return;
    }

    currentSongMetadata = { song: song, artist: artist, source: source };

    var page = new Page();
    page.refreshCurrentSong(song, artist);
    page.refreshLyric(song, artist);
    page.changeTitlePage(song + ' - ' + artist + ' | ' + RADIO_NAME);
    
    if (source === 'nowplaying') {
        updateCoverArt(song, artist);
    } else {
        page.refreshCover(DEFAULT_COVER_ART);
    }
    
    if (showHistory) {
        updateMusicHistory(artist, song);
    }
}

function updateCoverArt(song, artist) {
    const script = document.createElement('script');
    script.src = `https://status.rcast.net/72463{encodeURIComponent(artist)} ${encodeURIComponent(song)}&output=jsonp&callback=handleDeezerResponse`;
    document.body.appendChild(script);
}

function handleDeezerResponse(data) {
    var page = new Page();
    let artworkUrl = DEFAULT_COVER_ART; 
    let artistName = currentSongMetadata.artist;
    let songTitle = currentSongMetadata.song;

    if (data.data && data.data.length > 0) {
        artworkUrl = data.data[0].album.cover_big;
        artistName = data.data[0].artist.name;
        songTitle = data.data[0].title;
    }
    
    page.refreshCover(artworkUrl);

    if ('mediaSession' in navigator && songTitle && artistName) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: songTitle,
            artist: artistName,
            artwork: [
                { src: artworkUrl, sizes: '96x96', type: 'image/png' },
                { src: artworkUrl, sizes: '128x128', type: 'image/png' },
                { src: artworkUrl, sizes: '192x192', type: 'image/png' },
                { src: artworkUrl, sizes: '256x256', type: 'image/png' },
                { src: artworkUrl, sizes: '384x384', type: 'image/png' },
                { src: artworkUrl, sizes: '512x512', type: 'image/png' }
            ]
        });
    }
}

function updateHistoryUI() {
    let historicElement = document.querySelector('.historic');
    if (historicElement) {
        if (showHistory) {
            historicElement.classList.remove('hidden');
            historicElement.style.display = 'block'; 
        } else {
            historicElement.classList.add('hidden');
            historicElement.style.display = 'none'; 
        }
    }
}

var musicHistory = [];

function updateMusicHistory(artist, song) {
    if (musicHistory.length === 0 || (musicHistory[0].song !== song || musicHistory[0].artist !== artist)) {
        musicHistory.unshift({ artist: artist, song: song });
        if (musicHistory.length > 4) {
            musicHistory.pop();
        }
        displayHistory();
    }
}

function displayHistory() {
    var $historicDiv = document.querySelectorAll('#historicSong article');
    var $songName = document.querySelectorAll('#historicSong article .music-info .song');
    var $artistName = document.querySelectorAll('#historicSong article .music-info .artist');

    for (var i = 1; i < musicHistory.length && i < 3; i++) { 
        if ($songName[i - 1] && $artistName[i - 1]) {
            $songName[i - 1].innerHTML = musicHistory[i].song;
            $artistName[i - 1].innerHTML = musicHistory[i].artist;
            
            updateCoverForHistory(musicHistory[i].song, musicHistory[i].artist, i - 1);

            if ($historicDiv[i - 1]) {
                $historicDiv[i - 1].classList.add('animated');
                $historicDiv[i - 1].classList.add('slideInRight');
            }
        }
    }

    setTimeout(function () {
        for (var j = 0; j < 2; j++) { 
            if ($historicDiv[j]) {
                $historicDiv[j].classList.remove('animated');
                $historicDiv[j].classList.remove('slideInRight');
            }
        }
    }, 2000);
}

function updateCoverForHistory(song, artist, index) {
    const script = document.createElement('script');
    script.src = `https://api.deezer.com/search?q=${encodeURIComponent(artist)} ${encodeURIComponent(song)}&output=jsonp&callback=handleDeezerResponseForHistory_${index}`;
    document.body.appendChild(script);

    window[`handleDeezerResponseForHistory_${index}`] = function (data) {
        if (data.data && data.data.length > 0) {
            var artworkUrl = data.data[0].album.cover_big;
            var $coverArt = document.querySelectorAll('#historicSong article .cover-historic')[index];
            if ($coverArt) {
                $coverArt.style.backgroundImage = 'url(' + artworkUrl + ')';
            }
        }
        script.remove();
        delete window[`handleDeezerResponseForHistory_${index}`];
    };
}


document.addEventListener('keydown', function (event) {
    var key = event.key;
    var slideVolume = document.getElementById('volume');
    var page = new Page();
    switch (key) {
        case 'ArrowUp':
            volumeUp();
            if (slideVolume && audio) slideVolume.value = decimalToInt(audio.volume);
            if (audio) page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        case 'ArrowDown':
            volumeDown();
            if (slideVolume && audio) slideVolume.value = decimalToInt(audio.volume);
            if (audio) page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        case ' ':
        case 'Spacebar':
            event.preventDefault();
            togglePlay();
            break;
        case 'p':
        case 'P':
            togglePlay();
            break;
        case 'm':
        case 'M':
            mute();
            break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            var volumeValue = parseInt(key);
            if (audio) audio.volume = volumeValue / 10;
            if (slideVolume) slideVolume.value = volumeValue * 10;
            page.changeVolumeIndicator(volumeValue * 10);
            break;
    }
});


function intToDecimal(vol) {
    return vol / 100;
}

function decimalToInt(vol) {
    return vol * 100;
}

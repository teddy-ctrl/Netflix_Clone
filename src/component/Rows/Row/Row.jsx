import React, { useEffect, useState, useRef } from 'react';
import axios from '../../../utils/axios';
import YouTube from 'react-youtube';
import movieTrailer from 'movie-trailer';
import './Row.css';

const Row = ({ title, fetchUrl, isLargeRow }) => {
  const [movies, setMovies] = useState([]);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const base_url = 'https://image.tmdb.org/t/p/original';

  const PLAYER_ASPECT_RATIO = 761 / 1200;
  const PLAYER_MAX_WIDTH = 1200;

  const [playerOpts, setPlayerOpts] = useState({
    height: '390',
    width: '100%',
    playerVars: {
      autoplay: 1,
    },
  });

  const playerContainerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const request = await axios.get(fetchUrl);
        setMovies(request.data.results);
      } catch (error) {
        console.error(`Error fetching movies for ${title}:`, error);
      }
    }
    fetchData();
  }, [fetchUrl, title]);

  useEffect(() => {
    const updatePlayerSize = () => {
      if (playerContainerRef.current) {
        const containerWidth = playerContainerRef.current.offsetWidth;
        const newWidth = Math.min(containerWidth, PLAYER_MAX_WIDTH);
        const newHeight = Math.round(newWidth * PLAYER_ASPECT_RATIO);

        setPlayerOpts((prevOpts) => ({
          ...prevOpts,
          height: String(newHeight),
        }));
      }
    };

    if (trailerUrl) {
      updatePlayerSize();
      window.addEventListener('resize', updatePlayerSize);
    }

    return () => {
      window.removeEventListener('resize', updatePlayerSize);
    };
  }, [trailerUrl, PLAYER_ASPECT_RATIO, PLAYER_MAX_WIDTH]);

  const searchYouTubeTrailer = async (movieTitle) => {
    // Uncomment and replace with your YouTube API key
    const apiKey = 'YOUR_YOUTUBE_API_KEY';
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          `${movieTitle} official trailer`
        )}&type=video&key=${apiKey}`
      );
      const trailer = response.data.items[0];
      return trailer ? trailer.id.videoId : null;
    } catch (error) {
      console.error('YouTube API error:', error);
      return null;
    }
    return null; // Placeholder until API key is added
  };

  const handleClick = async (movie) => {
    if (trailerUrl) {
      setTrailerUrl('');
      setErrorMessage('');
    } else {
      try {
        const movieTitle = movie?.title || movie?.name || movie?.original_name || '';
        if (!movieTitle) {
          console.log('No title available to search for trailer.');
          setErrorMessage('No title available to search for trailer.');
          return;
        }

        let url = await movieTrailer(movieTitle);
        if (url) {
          const urlParams = new URLSearchParams(new URL(url).search);
          setTrailerUrl(urlParams.get('v'));
          setErrorMessage('');
        } else {
          console.log(`No trailer found with movieTrailer for "${movieTitle}".`);
          const youtubeId = await searchYouTubeTrailer(movieTitle);
          if (youtubeId) {
            setTrailerUrl(youtubeId);
            setErrorMessage('');
          } else {
            setTrailerUrl('');
            setErrorMessage(`No trailer available for "${movieTitle}". Try searching manually on YouTube.`);
          }
        }
      } catch (error) {
        console.error('Error fetching trailer:', error);
        setTrailerUrl('');
        setErrorMessage(`Failed to fetch trailer for "${movieTitle}". Please try again later.`);
      }
    }
  };

  const closePlayer = () => {
    setTrailerUrl('');
    setErrorMessage('');
  };

  return (
    <div className="row-component-container">
      <div className={`content-area ${trailerUrl ? 'content--blurred' : ''}`}>
        <div className="row">
          <h1 className="title">{title}</h1>
          <div className="row_posters">
            {movies?.map((movie) => (
              (movie && (isLargeRow ? movie.poster_path : movie.backdrop_path)) && (
                <img
                  onClick={() => handleClick(movie)}
                  key={movie.id}
                  src={`${base_url}${isLargeRow ? movie.poster_path : movie.backdrop_path}`}
                  alt={movie.title || movie.name || movie.original_name}
                  className={`row_poster ${isLargeRow ? 'row_posterLarge' : ''}`}
                />
              )
            ))}
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      </div>

      {trailerUrl && (
        <div className="trailer-modal" onClick={closePlayer}>
          <div
            ref={playerContainerRef}
            className="trailer-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-trailer-button" onClick={closePlayer} aria-label="Close trailer">
              ×
            </button>
            <YouTube videoId={trailerUrl} opts={playerOpts} containerClassName="youtube-player-iframe-wrapper" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Row;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const VideoCard = styled.div`
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  text-align: center;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: auto;
  }
`;

const VideoList = ({ type }) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`/videos/${type}`);
      console.log("Fetched videos:", res.data);
      setVideos(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [type]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Container>
      {videos.map(video => (
        <VideoCard key={video._id} onClick={() => window.open(video.videoUrl, '_blank')}>
          <img src={video.imgUrl} alt={video.title} />
          <h3 style={{ color: 'white' }}>{video.title}</h3>
          </VideoCard>
      ))}
    </Container>
  );
};

export default VideoList;

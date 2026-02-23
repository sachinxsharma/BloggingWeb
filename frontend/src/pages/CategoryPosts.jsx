import React, { useState, useEffect } from 'react';
import PostItem from '../Components/PostItem';
import Loader from '../Components/Loader';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CategoryPosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { category } = useParams(); // Get the id from URL params

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/posts/categories/${category}`);
        setPosts(response?.data);
      } catch (err) {
        console.log(err);
      }
      setIsLoading(false);
    }
    fetchPosts();
  }, [category]); // Include id in the dependency array to re-fetch posts when id changes

  if (isLoading) {
    return <Loader />;
  }

  return (
    <section className="posts">
    {posts.length > 0 ? <div className="container posts__container">
      {
         posts.map(({_id: id, thumbnail, category, title, description, creator, createdAt}) => 
         <PostItem key={id} postID={id} thumbnail={thumbnail} category={category}
         title={title} description={description} authorID={creator}
         createdAt={createdAt} />) 
      }
    </div>: <h2 className='center'>No posts founds</h2>}
    </section>
  );
}

export default CategoryPosts; // Move this line to the end of the file

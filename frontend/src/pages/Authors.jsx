import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../Components/Loader';
import DefaultAvatar from '../images/avatar1.jpg';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Changed initial value to true

  const getAuthors = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users`);
      setAuthors(response.data);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getAuthors();
  }, []);

  // Moved the condition for Loader outside of the return statement
  if (isLoading) {
    return <Loader />;
  }

  return (
    <section className="authors">
      {authors && authors.length > 0 ? (
        <div className="container authors__container">
          {authors.map(({ _id: id, avatar, name, posts }) => (
            <Link key={id} to={`/posts/users/${id}`} className="author">
              <div className="author__avatar">
                <img src={avatar ? `${process.env.REACT_APP_ASSETS_URL}${avatar}` : DefaultAvatar} alt={`img of ${name}`} />
              </div>
              <div className="author__info">
                <h4>{name}</h4>
                <p>{posts}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <h2 className="center">No authors found</h2>
      )}
    </section>
  );
};

export default Authors;

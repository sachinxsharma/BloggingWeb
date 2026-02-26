import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactTimeAgo from 'react-time-ago';
import en from 'javascript-time-ago/locale/en';
import ru from 'javascript-time-ago/locale/ru';
import TimeAgo from 'javascript-time-ago';
import DefaultAvatar from '../images/avatar1.jpg';

import 'javascript-time-ago/locale/en';
import 'javascript-time-ago/locale/ru';

TimeAgo.addDefaultLocale(en);
TimeAgo.addLocale(ru);

const PostAuthor = ({ authorID, createdAt }) => {
  const [author, setAuthor] = useState({});


  useEffect(() => {
    const getAuthor = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/users/${authorID}`
        );
        setAuthor(response?.data);
      } catch (error) {
        console.log(error);
      }
    };
    getAuthor();
  }, [authorID]);


  return (
    <Link to={`/posts/users/${authorID}`} className="post__author">
      <div className="post__author-avatar">
        <img src={author?.avatar ? `${process.env.REACT_APP_ASSETS_URL}${author.avatar}` : DefaultAvatar} alt="" />
      </div>
      <div className="post__author-details">
        <h3>By: {author?.name}</h3>
        <small><ReactTimeAgo date={new Date(createdAt)} locale="en-US" /></small>
      </div>
    </Link>
  );
};

export default PostAuthor;

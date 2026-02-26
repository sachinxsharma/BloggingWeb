import React, { useState, useContext, useEffect } from 'react';
import { AiOutlineLike, AiFillLike, AiOutlineDislike, AiFillDislike } from 'react-icons/ai';
import axios from 'axios';
import { UserContext } from '../context/userContext';

const LikeDislike = ({ postId, initialLikes = [], initialDislikes = [] }) => {
    const { currentUser } = useContext(UserContext);
    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);

    const isLiked = likes.includes(currentUser?.id);
    const isDisliked = dislikes.includes(currentUser?.id);

    const handleLike = async () => {
        if (!currentUser) return;
        try {
            const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            setLikes(response.data.likes);
            setDislikes(response.data.dislikes);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDislike = async () => {
        if (!currentUser) return;
        try {
            const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/posts/${postId}/dislike`, {}, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            setLikes(response.data.likes);
            setDislikes(response.data.dislikes);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="post-detail__interactions">
            <button className={`interaction-btn ${isLiked ? 'active' : ''}`} onClick={handleLike} disabled={!currentUser}>
                {isLiked ? <AiFillLike /> : <AiOutlineLike />}
                <span>{likes.length}</span>
            </button>
            <button className={`interaction-btn ${isDisliked ? 'active' : ''}`} onClick={handleDislike} disabled={!currentUser}>
                {isDisliked ? <AiFillDislike /> : <AiOutlineDislike />}
                <span>{dislikes.length}</span>
            </button>
        </div>
    );
};

export default LikeDislike;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/userContext';
import ReactTimeAgo from 'react-time-ago';

const CommentSection = ({ postId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const { currentUser } = useContext(UserContext);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/posts/${postId}/comments`);
                setComments(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchComments();
    }, [postId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/posts/${postId}/comments`,
                { text: newComment },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            );
            setComments([response.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="comment-section">
            <h3>Comments ({comments.length})</h3>

            {currentUser ? (
                <form className="comment-form" onSubmit={handleSubmit}>
                    <textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows="3"
                    ></textarea>
                    <button type="submit" className="btn primary">Post Comment</button>
                </form>
            ) : (
                <p>Please log in to comment.</p>
            )}

            <div className="comments-list">
                {comments.map(comment => (
                    <div key={comment._id} className="comment-item">
                        <div className="comment-author">
                            <img src={`${process.env.REACT_APP_ASSETS_URL}${comment.author.avatar}`} alt="" className="comment-avatar" />
                            <div>
                                <h5>{comment.author.name}</h5>
                                <small><ReactTimeAgo date={new Date(comment.createdAt)} locale="en-US" /></small>
                            </div>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommentSection;

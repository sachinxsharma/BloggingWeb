import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaCheck } from 'react-icons/fa';
import { UserContext } from '../context/userContext';
import axios from 'axios';
import DefaultAvatar from '../images/avatar1.jpg';



const UserProfile = () => {
  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isAvatarTouched, setIsAvatarTouched] = useState(false);
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null);

  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const token = currentUser?.token;

  // Redirect to login page for any user who isn't logged in 
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);


  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/users/${currentUser.id}`,
          { withCredentials: true, headers: { Authorization: `Bearer ${token}` } })
        const { name, email, avatar } = response.data;
        setName(name);
        setEmail(email);
        setAvatar(avatar);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to fetch user profile.");
      }
    }
    getUser();
  }, [currentUser.id, token])

  // Process avatar preview when a file is selected
  useEffect(() => {
    if (avatar instanceof File) {
      const objectUrl = URL.createObjectURL(avatar);
      setAvatarPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setAvatarPreview(null);
    }
  }, [avatar]);

  const changeAvatarHandler = async () => {
    setIsAvatarTouched(false);
    setError('');
    try {
      const postData = new FormData();
      postData.set('avatar', avatar);
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/users/change-avatar`, postData,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } });
      setAvatar(response?.data.avatar);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to upload avatar.");
    }
  }



  const updateUserDetail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userData = new FormData();
      userData.set('name', name);
      userData.set('email', email);
      userData.set('currentPassword', currentPassword);
      userData.set('newPassword', newPassword);
      userData.set('confirmNewPassword', confirmNewPassword);

      const response = await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/users/edit-user`,
        userData,
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update profile.");
    }
  }





  return (
    <section className="profile">
      <div className="container profile__container">
        <Link to={`/myposts/${currentUser.id}`} className="btn">My Posts</Link>

        <div className="profile__details">
          <div className="avatar__wrapper">
            <div className="profile__avatar">
              <img src={avatarPreview ? avatarPreview : (avatar ? `${process.env.REACT_APP_ASSETS_URL}${avatar}` : DefaultAvatar)} alt="" />
            </div>
            <form className="avatar__form">
              <input type="file" name="avatar" id="avatar" onChange={e => {
                setAvatar(e.target.files[0]);
                setIsAvatarTouched(true);
              }}
                accept="png, jpg, jpeg" />
              <label htmlFor="avatar"><FaEdit /></label>
            </form>
            {/* {isAvatarTouched && <button className="profile__avatar-btn" onClick={changeAvatarHandler}><FaCheck /></button>} */}
            {isAvatarTouched &&
              <button
                type="button"
                className="profile__avatar-btn"
                onClick={changeAvatarHandler}
              >
                <FaCheck />
              </button>
            }
          </div>

          <h1>{name}</h1>
          <form className="form profile__form" onSubmit={updateUserDetail}>
            {error && <p className="form__error-message">{error}</p>}
            <input type="text" placeholder="Full Name" value={name}
              onChange={e => setName(e.target.value)} />
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Current Password (Required)" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)} />
            <input type="password" placeholder="New Password (Optional)" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} />
            <input type="password" placeholder="Confirm New Password" value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)} />
            <button type="submit" className="btn primary">Update details</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default UserProfile;

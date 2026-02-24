import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const changeInputHandler = (e) => {
    setUserData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const registerUser = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/users/register`, userData)
      const newUser = response.data;
      console.log(newUser);
      if (!newUser) {
        setError("Couldn't register user. Please try again. ")
      } else {
        navigate('/login')
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Something went wrong. Please try again later.")
    }
  }



  return (
    <section className="register">
      <div className="container">
        <h2>Sign Up</h2>
        <form className="form register__form" onSubmit={registerUser}>
          {error && <p className="form__error-message">{error}</p>}
          <input className='border' type="text" placeholder="Full Name" name='name' value={userData.name} onChange={changeInputHandler} autoFocus />
          <input className='border' type="text" placeholder="Email" name='email' value={userData.email} onChange={changeInputHandler} />
          <input className='border' type="password" placeholder="Password" name='password' value={userData.password} onChange={changeInputHandler} />
          <input className='border' type="password" placeholder="Confirm password" name='password2' value={userData.password2} onChange={changeInputHandler} />
          <button type='submit' className="btn primary">Register</button>
        </form>
        <small>Already have an account? <Link to="/login">Sign in</Link></small>
      </div>
    </section>
  );
};

export default Register;

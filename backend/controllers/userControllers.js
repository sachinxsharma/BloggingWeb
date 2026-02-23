const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require("uuid");

const User = require('../models/userModel');
const HttpError = require('../models/errorModel');
const { randomUUID } = require('crypto');

// REGISTER A NEW USER
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, password2 } = req.body;

        if (!name || !email || !password || !password2) {
            return next(new HttpError('Fill in all fields.', 422));
        }

        const newEmail = email.toLowerCase();
        const emailExists = await User.findOne({ email: newEmail });

        if (emailExists) {
            return next(new HttpError('Email already exists.', 422));
        }

        if (password.trim().length < 6) {
            return next(new HttpError('Password should be at least 6 characters', 422));
        }

        if (password !== password2) {
            return next(new HttpError('Passwords do not match.', 422));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);
        const newUser = await User.create({ name, email: newEmail, password: hashedPass });

        res.status(201).json(newUser);
    } catch (error) {
        return next(new HttpError('User registration failed.', 422));
    }
};

// LOGIN AS REGISTERED USERS
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new HttpError("Fill in all fields", 422));
        }

        const newEmail = email.toLowerCase();
        const user = await User.findOne({ email: newEmail });

        if (!user) {
            return next(new HttpError("Invalid credentials", 422));
        }

        const comparePass = await bcrypt.compare(password, user.password);

        if (!comparePass) {
            return next(new HttpError("Invalid credentials", 422));
        }

        const { _id: id, name } = user;
        const token = jwt.sign({ id, name }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(200).json({ token, id, name });
    } catch (error) {
        return next(new HttpError("Login failed. Please check your credentials", 422));
    }
};

// GET USER PROFILE
const getUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');

        if (!user) {
            return next(new HttpError("User not found", 404));
        }

        res.status(200).json(user);
    } catch (error) {
        return next(new HttpError(error.message || "Failed to fetch user.", 500));
    }
};

// CHANGE USER'S AVATAR PROFILE PICTURE
const changeAvatar = async (req, res, next) => {
    try {
        if (!req.files.avatar) {
            return next(new HttpError("Please choose an image", 422))
        }
        // find user from database
        const user = await User.findById(req.user.id)
        //delete the old avatar if exits.
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '..', 'uploads', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlink(oldAvatarPath, (err) => {
                    if (err) {
                        return next(new HttpError(err));
                    }
                });
            }
        }
        const { avatar } = req.files;
        //upload new avatar
        if (avatar.size > 500000) {
            return next(new HttpError("Profile picture is too big. Should be less than 500kb", 422));
        }
        let fileName;
        fileName = avatar.name;
        let splitFileName = fileName.split('.')
        let newFileName = splitFileName[0] + uuid() + '.' + splitFileName[splitFileName.length - 1];
        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
            if (err) {
                return next(new HttpError(err))
            }
            const updatedAvatar = await User.findByIdAndUpdate(req.user.id, { avatar: newFileName }, { new: true })
            if (!updatedAvatar) {
                return next(new HttpError("Avatar couldn't be changed.", 422))
            }
            res.status(200).json(updatedAvatar)
        })


    } catch (error) {
        return next(new HttpError(error))
    }







    // try {
    //     if (!req.files || !req.files.avatar) {
    //         return next(new HttpError("Please choose an image.", 422));
    //     }

    //     const user = await User.findById(req.user.id);
    //     if (!user) {
    //         return next(new HttpError("User not found.", 404));
    //     }

    //     // Delete old avatar if it exists and is NOT a default image (if you ever use one)
    //     if (user.avatar) {
    //         const avatarPath = path.join(__dirname, '..', 'uploads', user.avatar);
    //         if (fs.existsSync(avatarPath)) {
    //             fs.unlinkSync(avatarPath);
    //         }
    //     }

    //     const { avatar } = req.files;

    //     // Check file size (increased to 2MB)
    //     if (avatar.size > 2000000) {
    //         return next(new HttpError("Profile picture too big. Should be less than 2MB", 422));
    //     }

    //     const fileName = avatar.name;
    //     const newFilename = `${uuid()}.${fileName.split('.').pop()}`;

    //     avatar.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
    //         if (err) {
    //             return next(new HttpError(err.message || "Failed to upload avatar.", 500));
    //         }

    //         const updatedAvatar = await User.findByIdAndUpdate(req.user.id, { avatar: newFilename }, { new: true });
    //         if (!updatedAvatar) {
    //             return next(new HttpError("Avatar couldn't be changed.", 422));
    //         }

    //         res.status(200).json(updatedAvatar);
    //     });
    // } catch (error) {
    //     console.error("Change avatar error:", error);
    //     return next(new HttpError(error.message || "Failed to change avatar.", 500));
    // }
};

// EDIT USER DETAILS
const editUser = async (req, res, next) => {
    try {
        const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!name || !email || !currentPassword) {
            return next(new HttpError("Fill in required fields (Name, Email, Current Password).", 422));
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return next(new HttpError("User not found.", 403));
        }

        const emailExist = await User.findOne({ email });
        if (emailExist && emailExist._id.toString() !== req.user.id) {
            return next(new HttpError("Email already exists.", 422));
        }

        const validateUserPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validateUserPassword) {
            return next(new HttpError("Invalid current password.", 422));
        }

        let updateData = { name, email };

        // If user wants to update password
        if (newPassword) {
            if (newPassword !== confirmNewPassword) {
                return next(new HttpError("New passwords do not match.", 422));
            }
            if (newPassword.trim().length < 6) {
                return next(new HttpError("New password should be at least 6 characters.", 422));
            }
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        const newInfo = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
        res.status(200).json(newInfo);
    } catch (error) {
        console.error("Edit user error:", error);
        return next(new HttpError(error.message || "Failed to edit user.", 500));
    }
};


// GET ALL AUTHORS
const getAuthors = async (req, res) => {
    try {
        const authors = await User.find().select('-password');
        res.json(authors);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch authors." });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUser,
    changeAvatar,
    editUser,
    getAuthors,
};

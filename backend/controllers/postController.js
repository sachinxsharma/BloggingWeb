const Post = require('../models/postModel');
const User = require("../models/userModel");
const path = require("path");
const fs = require('fs');
const { v4: uuid } = require('uuid');
const HttpError = require('../models/errorModel');




// ----------- Create a post
// POST : api/posts
//PROTECTED
const CreatePost = async (req, res, next) => {
    try {
        let { title, category, description } = req.body;
        if (!title || !category || !description || !req.files) {
            return next(new HttpError("fill in all fields and choose thumbnail", 422))
        }
        const { thumbnail } = req.files;
        //check file size
        if (thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail too big. File should be less than 2mb", 422))
        }
        let fileName = thumbnail.name;
        let splittedFileName = fileName.split('.')
        let newFilename = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if (err) {
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({
                    title, category, description, thumbnail: newFilename,
                    creator: req.user.id
                })
                if (!newPost) {
                    return next(new HttpError("post couldn't be created", 422))
                }
                //find user and increse post count by +1
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, { posts: userPostCount })

                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}



// ------------Get all post
//GET : api/posts:id
//UNPROTECTED
const getPosts = async (req, res, next) => {
    try {
        const posts = await Post.find().sort({ updatedAt: -1 })
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//------------get single post
//GET: api/posts/:id
//UNPROTECTED
const getSinglePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return next(new HttpError("POST NOT FOUND :(", 404))
        }
        console.log(post)
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError("user not found , Sorry!"))
    }
}

// ----------- GET POSTS BY CATEGORY
// GET : api/posts/categories/:category
//PROTECTED
const getCatPosts = async (req, res, next) => {
    try {
        const { category } = req.params;
        const catPosts = await Post.find({ category }).sort({ createdAt: -1 })
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

// ----------- get author post
// GET : api/posts/users/:id
//UNPROTECTED
const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const posts = await Post.find({ creator: id }).sort({ createdAt: -1 })
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}


// ----------- edit post
// PATCH : api/posts/:id
//PROTECTED
const editPost = async (req, res, next) => {
    try {
        let fileName;
        let newFilename;
        let updatedPost;
        const postId = req.params.id;
        let { title, category, description } = req.body;

        // React Quill has a paragraph opening and closing tag with a break tag in between so there are 
        // 11 characters in there already.
        if (!title || !category || !description || description.length < 12) {
            return next(new HttpError("Fill in all fields and ensure description is long enough", 422));
        }

        // Get old post from database 
        const oldPost = await Post.findById(postId);
        if (req.user.id == oldPost.creator) {
            if (!req.files) {
                updatedPost = await Post.findByIdAndUpdate(postId, {
                    title, category, description
                }, { new: true });
            } else {
                // DELETE OLD THUMBNAIL FROM UPLOAD 
                fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
                    if (err) {
                        return next(new HttpError(err));
                    }
                });
                // Upload new thumbnail
                const { thumbnail } = req.files;
                // Check file size 
                if (thumbnail.size > 2000000) {
                    return next(new HttpError("Thumbnail too big, should be less than 2MB", 422));
                }
                fileName = thumbnail.name;
                let splittedFileName = fileName.split('.');
                newFilename = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1];
                thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
                    if (err) {
                        return next(new HttpError(err));
                    }
                });
                updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description, thumbnail: newFilename }, { new: true });
            }

            if (!updatedPost) {
                return next(new HttpError("Couldn't update post", 400));
            }

            res.status(200).json(updatedPost);
        } else {
            return next(new HttpError("You are not authorized to edit this post.", 403));
        }
    } catch (error) {
        return next(new HttpError(error));
    }
};








// ----------- delete post
// DELETE : api/posts:id
//PROTECTED
const deletePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return next(new HttpError("Post Unavilable.", 400));
        }

        const post = await Post.findById(postId);
        if (!post) {
            return next(new HttpError("Post not found.", 404));
        }

        const fileName = post.thumbnail;

        // delete thumbnail from uploads folder
        const thumbnailPath = path.join(__dirname, '..', 'uploads', fileName);
        if (fs.existsSync(thumbnailPath)) {
            fs.unlink(thumbnailPath, async (err) => {
                if (err) {
                    return next(new HttpError(err));
                }
                await finalizeDelete();
            });
        } else {
            await finalizeDelete();
        }

        async function finalizeDelete() {
            await Post.findByIdAndDelete(postId);

            // Find user and reduce post count by 1
            const currentUser = await User.findById(req.user.id);
            if (currentUser) {
                const userPostCount = Math.max(0, (currentUser.posts || 0) - 1);
                await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
            }
            res.status(200).json(`Post ${postId} deleted successfully.`);
        }
    } catch (err) {
        return next(new HttpError(err));
    }
};






module.exports = {
    CreatePost,
    getCatPosts,
    getPosts,
    getSinglePost,
    getUserPosts,
    editPost,
    deletePost


}
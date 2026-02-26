const Post = require('../models/postModel');
const User = require("../models/userModel");
const Comment = require('../models/commentModel');
const path = require("path");
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
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
        // Check file size
        if (thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail too big. File should be less than 2mb", 422));
        }

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
            folder: 'bloggingWeb/posts'
        });

        if (!uploadResponse) {
            return next(new HttpError("Failed to upload thumbnail to Cloudinary.", 500));
        }

        const newPost = await Post.create({
            title, category, description, thumbnail: uploadResponse.secure_url,
            creator: req.user.id
        });

        if (!newPost) {
            return next(new HttpError("post couldn't be created", 422));
        }

        // find user and increase post count by +1
        const currentUser = await User.findById(req.user.id);
        const userPostCount = currentUser.posts + 1;
        await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

        res.status(201).json(newPost);
    } catch (error) {
        return next(new HttpError(error));
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
                // Upload new thumbnail to Cloudinary
                const { thumbnail } = req.files;
                // Check file size 
                if (thumbnail.size > 2000000) {
                    return next(new HttpError("Thumbnail too big, should be less than 2MB", 422));
                }

                const uploadResponse = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
                    folder: 'bloggingWeb/posts'
                });

                if (!uploadResponse) {
                    return next(new HttpError("Failed to upload thumbnail to Cloudinary.", 500));
                }

                updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description, thumbnail: uploadResponse.secure_url }, { new: true });
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

// ----------- Like a post
// PATCH : api/posts/:id/like
//PROTECTED
const likePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const post = await Post.findById(postId);
        if (!post) {
            return next(new HttpError("Post not found.", 404));
        }

        if (post.likes.includes(userId)) {
            // Unlike
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            // Like and remove from dislikes if present
            post.likes.push(userId);
            post.dislikes = post.dislikes.filter(id => id.toString() !== userId);
        }
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        return next(new HttpError(error));
    }
}

// ----------- Dislike a post
// PATCH : api/posts/:id/dislike
//PROTECTED
const dislikePost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const post = await Post.findById(postId);
        if (!post) {
            return next(new HttpError("Post not found.", 404));
        }

        if (post.dislikes.includes(userId)) {
            // Undislike
            post.dislikes = post.dislikes.filter(id => id.toString() !== userId);
        } else {
            // Dislike and remove from likes if present
            post.dislikes.push(userId);
            post.likes = post.likes.filter(id => id.toString() !== userId);
        }
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        return next(new HttpError(error));
    }
}

// ----------- Add a comment
// POST : api/posts/:id/comments
//PROTECTED
const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user.id;

        if (!text) {
            return next(new HttpError("Comment text is required.", 422));
        }

        const newComment = await Comment.create({
            text,
            author: userId,
            post: postId
        });

        const commentWithAuthor = await Comment.findById(newComment._id).populate('author', 'name avatar');
        res.status(201).json(commentWithAuthor);
    } catch (error) {
        return next(new HttpError(error));
    }
}

// ----------- Get post comments
// GET : api/posts/:id/comments
//UNPROTECTED
const getPostComments = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const comments = await Comment.find({ post: postId }).populate('author', 'name avatar').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (error) {
        return next(new HttpError(error));
    }
}






module.exports = {
    CreatePost,
    getCatPosts,
    getPosts,
    getSinglePost,
    getUserPosts,
    editPost,
    deletePost,
    likePost,
    dislikePost,
    addComment,
    getPostComments


}
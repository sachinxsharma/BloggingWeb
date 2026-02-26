const { Router } = require('express')
const {
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

} = require("../controllers/postController")
const authMiddleware = require('../middleware/authMiddleware');


const router = Router()

router.post('/', authMiddleware, CreatePost);
router.get('/', getPosts);
router.get('/:id', getSinglePost);
router.get('/categories/:category', getCatPosts);
router.get('/users/:id', getUserPosts);
router.patch('/:id', authMiddleware, editPost);
router.delete('/:id', authMiddleware, deletePost);
router.patch('/:id/like', authMiddleware, likePost);
router.patch('/:id/dislike', authMiddleware, dislikePost);
router.post('/:id/comments', authMiddleware, addComment);
router.get('/:id/comments', getPostComments);

module.exports = router